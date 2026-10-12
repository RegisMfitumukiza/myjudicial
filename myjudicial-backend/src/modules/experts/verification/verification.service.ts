import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { VerificationRepository as AdminVerificationRepo } from "../../admin-verification/verification.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import { NotFoundError, ConflictError, ValidationError } from "../../../shared/errors/index.js";
import { writeAuditLog } from "../../../shared/utils/audit.js";
import { encryptBuffer } from "../../../shared/utils/crypto.js";
import {
  uploadObject,
  getDefaultBucketName,
} from "../../../infrastructure/storage/oci-object-storage.service.js";
import { FileStorageRepository } from "../../file-storage/repositories/file-storage.repository.js";
import { v4 as uuid } from "uuid";
import { sendNewVerificationRequestEmail } from "../../../infrastructure/email/email.service.js";
import { logger } from "../../../shared/utils/logger.js";
import { NotificationEvent } from "../../../generated/prisma/client.js";
import { NotificationRepository } from "../../notifications/notification.repository.js";
import type { SubmitVerificationDto } from "./verification.schemas.js";
import path from "path";


export const VerificationService = {
  submitVerification: async (
    userId: string,
    dto: SubmitVerificationDto,
    files: Express.Multer.File[],
    ipAddress?: string
  ) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));

    // Guard: already verified or a pending request exists
    if (profile.status === "VERIFIED") {
      throw new ConflictError("Profile is already verified.");
    }
    const existingPending = await AdminVerificationRepo.findByExpertId(profile.id);
    if (
      existingPending?.status === "PENDING" &&
      existingPending.identityDocumentObjectKey &&
      existingPending.barCertificateObjectKey
    ) {
      throw new ConflictError("A verification request is already pending review.");
    }

    // Guard: profile must be complete enough for meaningful verification
    const missingFields: string[] = [];
    if (!profile.displayName?.trim()) missingFields.push("display name");
    const effectiveBarNumber = dto.barNumber?.trim() || profile.barNumber?.trim();
    if (!effectiveBarNumber) missingFields.push("bar number");
    if (!profile.primarySpecialty) missingFields.push("primary specialty");
    if (!profile.languages?.length) missingFields.push("languages");
    if (!profile.bio?.trim()) missingFields.push("bio");
    if (!profile.officeAddress?.trim() && !profile.city?.trim()) missingFields.push("office location");

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Please complete your profile before submitting verification. Missing: ${missingFields.join(", ")}.`
      );
    }

    const bucketName = getDefaultBucketName();
    let identityDocumentKey: string | undefined;
    let barCertificateKey: string | undefined;
    const additionalKeys: string[] = [];
    const uploadedKeys: string[] = [];

    // Allowed MIME types for verification documents
    const ALLOWED_TYPES = [
      "image/jpeg", "image/jpg", "image/png", "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        throw new ValidationError(
          `Unsupported file type: ${file.mimetype}. Only images, PDFs and Word documents are accepted.`
        );
      }

      // ── Server-side AES-256-GCM encryption ──────────────────────────────────
      const { ciphertext, keyBase64, ivBase64, algorithm } = encryptBuffer(file.buffer);

      // Keep original extension so the stored objectKey is still descriptive
      const ext = path.extname(file.originalname) || ".bin";
      const objectKey = `experts/${profile.id}/documents/${uuid()}${ext}`;

      await uploadObject({
        key:         objectKey,
        body:        ciphertext,               // encrypted bytes
        contentType: "application/octet-stream", // always opaque on storage
        metadata: {
          originalFileName: file.originalname,
          originalMimeType: file.mimetype,
          uploadedBy:       userId,
        },
        bucket: bucketName,
      });

      // Register the document in the Document table so we can retrieve the
      // AES key, IV, and original mimeType later (for admin decryption)
      await FileStorageRepository.create({
        ownerId:             userId,
        ownerType:           "EXPERT",
        bucketName,
        objectKey,
        fileName:            file.originalname,
        mimeType:            file.mimetype,     // original, pre-encryption
        fileSize:            file.size,
        sensitivity:         "CONFIDENTIAL",
        encryptedAesKey:     keyBase64,
        iv:                  ivBase64,
        encryptionAlgorithm: algorithm,
        keyVersion:          "v1",
        encryptedAt:         new Date(),
        isVault:             false,              // not a citizen vault doc
        uploadedById:        userId,
      });

      uploadedKeys.push(objectKey);
    }

    // Map files to their document types
    const docTypes  = dto.documentTypes ?? [];
    const docLabels = dto.documentLabels ?? [];

    for (let i = 0; i < uploadedKeys.length; i++) {
      const explicitType = docTypes[i];
      const file = files[i];

      if (explicitType === "identity_document") {
        identityDocumentKey = uploadedKeys[i];
      } else if (explicitType === "bar_certificate") {
        barCertificateKey = uploadedKeys[i];
      } else if (explicitType === "additional") {
        additionalKeys.push(uploadedKeys[i]);
      } else {
        // Fallback heuristic: PDFs → bar certificate, images → identity document
        if (file.mimetype === "application/pdf") {
          barCertificateKey = uploadedKeys[i];
        } else {
          identityDocumentKey = uploadedKeys[i];
        }
      }
    }

    // Safety guard: if multiple files were uploaded and barCertificateKey is missing,
    // ensure the remaining uploaded file is assigned to barCertificateKey rather than leaving it null
    if (!barCertificateKey && uploadedKeys.length >= 2) {
      for (let i = 0; i < uploadedKeys.length; i++) {
        if (uploadedKeys[i] !== identityDocumentKey && !additionalKeys.includes(uploadedKeys[i])) {
          barCertificateKey = uploadedKeys[i];
          break;
        }
      }
    }

    // Update expert profile with bar number and set status to PENDING_VERIFICATION
    await prisma.expertProfile.update({
      where: { id: profile.id },
      data: {
        ...(effectiveBarNumber && { barNumber: effectiveBarNumber }),
        status: "PENDING_VERIFICATION",
      },
    });

    // Create certification record if metadata was provided
    if (dto.certificateName && dto.issuer && dto.issueDate) {
      await prisma.expertCertification.create({
        data: {
          expertId:          profile.id,
          certificateName:   dto.certificateName,
          issuer:            dto.issuer,
          issueDate:         new Date(dto.issueDate),
          documentObjectKey: barCertificateKey,
        },
      });
    }

    // Create or update verification request in the admin queue
    let verification;
    if (existingPending?.status === "PENDING") {
      verification = await prisma.expertVerification.update({
        where: { id: existingPending.id },
        data: {
          identityDocumentObjectKey: identityDocumentKey || existingPending.identityDocumentObjectKey,
          barCertificateObjectKey: barCertificateKey || existingPending.barCertificateObjectKey,
          additionalDocumentKeys: [
            ...(existingPending.additionalDocumentKeys ?? []),
            ...additionalKeys,
          ],
          updatedAt: new Date(),
        },
      });
    } else {
      verification = await AdminVerificationRepo.create(
        profile.id,
        identityDocumentKey,
        barCertificateKey,
        additionalKeys
      );
    }

    // Notify all admins about the new verification request
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, email: true, firstName: true, lastName: true, preferredLanguage: true },
      });
      if (admins.length > 0) {
        for (const admin of admins) {
          const adminName = `${admin.firstName} ${admin.lastName}`;
          const adminLanguage = (admin.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
          await sendNewVerificationRequestEmail(admin.email, adminName, profile.displayName, adminLanguage).catch((error) => {
            logger.error("Failed to send verification notification email to admin", { adminId: admin.id, error });
          });
        }

        for (const admin of admins) {
          await NotificationRepository.create({
            userId: admin.id,
            event: "WELCOME" as NotificationEvent,
            recipient: admin.email,
            subject: "New expert verification request",
            body: `Expert ${profile.displayName} submitted verification documents for review.`,
          }).catch((error) => {
            logger.error("Failed to write verification notification to admin", { adminId: admin.id, error });
          });
        }
      }
    } catch (error) {
      logger.error("Failed to notify admins about new verification", { expertId: profile.id, error });
    }

    await writeAuditLog({
      actorId:     userId,
      action:      "CREATE",
      resource:    "VERIFICATION",
      resourceId:  verification.id,
      description: "Submitted expert verification documents",
      ipAddress,
    });

    return verification;
  },
};
