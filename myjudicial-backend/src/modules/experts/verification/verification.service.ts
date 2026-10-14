import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { VerificationRepository as AdminVerificationRepo } from "../../admin-verification/verification.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import { NotFoundError, ConflictError, ValidationError } from "../../../shared/errors/index.js";
import { writeAuditLog } from "../../../shared/utils/audit.js";
import { encryptBuffer } from "../../../shared/utils/crypto.js";
import { wrapKey, getMasterKeyId } from "../../../infrastructure/kms/oci-kms.service.js";
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
import type { SubmitVerificationDto, RenewCredentialsDto } from "./verification.schemas.js";
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

    // Guard: all certificate metadata fields are strictly required
    if (!dto.certificateName?.trim()) missingFields.push("certificate name");
    if (!dto.issuer?.trim()) missingFields.push("issuing authority");
    if (!dto.issueDate?.trim()) missingFields.push("issue date");
    if (!dto.expiryDate?.trim()) missingFields.push("expiry date");

    if (missingFields.length > 0) {
      throw new ValidationError(
        `All verification fields are required. Please provide: ${missingFields.join(", ")}.`
      );
    }

    if (dto.issueDate && dto.expiryDate) {
      const issueD = new Date(dto.issueDate);
      const expiryD = new Date(dto.expiryDate);
      if (isNaN(issueD.getTime()) || isNaN(expiryD.getTime())) {
        throw new ValidationError("Invalid issue date or expiry date format.");
      }
      if (expiryD <= issueD) {
        throw new ValidationError("Certificate expiry date must be strictly after the issue date.");
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryD < today) {
        throw new ValidationError("Certificate expiry date cannot be in the past.");
      }
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

    // Validate documentTypes strictly upfront — require explicit type per uploaded file
    const docTypes = dto.documentTypes ?? [];
    if (!docTypes.length || docTypes.length !== files.length) {
      throw new ValidationError(
        "Each uploaded file must have an explicit documentType specified ('identity_document', 'bar_certificate', or 'additional')."
      );
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docType = docTypes[i];

      if (!ALLOWED_TYPES.includes(file.mimetype)) {
        throw new ValidationError(
          `Unsupported file type: ${file.mimetype}. Only images, PDFs and Word documents are accepted.`
        );
      }

      // Map document type to file category
      let category = "compliance-document";
      if (docType === "identity_document") {
        category = "expert-national-id";
      } else if (docType === "bar_certificate") {
        category = "expert-certificate";
      }

      // ── Server-side AES-256-GCM encryption with KMS key wrapping ──────────
      const { ciphertext, keyBase64, ivBase64, algorithm } = encryptBuffer(file.buffer);

      let finalAesKey = keyBase64;
      let kmsKeyId: string | undefined;

      if (finalAesKey) {
        finalAesKey = await wrapKey(finalAesKey);
        kmsKeyId = getMasterKeyId() || undefined;
      }

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

      // Register the document in the Document table with envelope encryption parameters
      await FileStorageRepository.create({
        ownerId:             userId,
        ownerType:           "EXPERT",
        bucketName,
        objectKey,
        fileName:            file.originalname,
        mimeType:            file.mimetype,     // original, pre-encryption
        fileSize:            file.size,
        category,
        sensitivity:         "CONFIDENTIAL",
        encryptedAesKey:     finalAesKey,
        iv:                  ivBase64,
        encryptionAlgorithm: algorithm,
        keyVersion:          "v1",
        kmsKeyId,
        encryptedAt:         new Date(),
        isVault:             false,              // not a citizen vault doc
        uploadedById:        userId,
      });

      uploadedKeys.push(objectKey);

      if (docType === "identity_document") {
        identityDocumentKey = objectKey;
      } else if (docType === "bar_certificate") {
        barCertificateKey = objectKey;
      } else if (docType === "additional") {
        additionalKeys.push(objectKey);
      }
    }

    const finalIdentityKey = identityDocumentKey || existingPending?.identityDocumentObjectKey;
    const finalBarCertKey = barCertificateKey || existingPending?.barCertificateObjectKey;

    if (!finalIdentityKey) {
      throw new ValidationError("National ID or Passport document is required.");
    }
    if (!finalBarCertKey) {
      throw new ValidationError("Bar Association Certificate is required.");
    }

    const parsedExpiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;

    // Update expert profile with bar number, credentialsExpiry, and set status to PENDING_VERIFICATION
    await prisma.expertProfile.update({
      where: { id: profile.id },
      data: {
        ...(effectiveBarNumber && { barNumber: effectiveBarNumber }),
        ...(parsedExpiryDate && { credentialsExpiry: parsedExpiryDate }),
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
          expiryDate:        parsedExpiryDate,
          documentObjectKey: barCertificateKey,
        },
      });
    }

    // Determine effective keys carrying forward previous files if not replaced in this submission
    const effectiveIdentityKey = identityDocumentKey || existingPending?.identityDocumentObjectKey || undefined;
    const effectiveBarKey = barCertificateKey || existingPending?.barCertificateObjectKey || undefined;
    const effectiveAdditionalKeys = [
      ...(existingPending?.additionalDocumentKeys ?? []),
      ...additionalKeys,
    ];

    // Soft-delete superseded document rows in Document table so old replaced files don't clutter admin listings
    if (identityDocumentKey && existingPending?.identityDocumentObjectKey && existingPending.identityDocumentObjectKey !== identityDocumentKey) {
      await FileStorageRepository.softDeleteByObjectKey(existingPending.identityDocumentObjectKey);
    }
    if (barCertificateKey && existingPending?.barCertificateObjectKey && existingPending.barCertificateObjectKey !== barCertificateKey) {
      await FileStorageRepository.softDeleteByObjectKey(existingPending.barCertificateObjectKey);
    }

    // Create or update verification request in the admin queue
    let verification;
    if (existingPending?.status === "PENDING") {
      verification = await prisma.expertVerification.update({
        where: { id: existingPending.id },
        data: {
          identityDocumentObjectKey: effectiveIdentityKey,
          barCertificateObjectKey: effectiveBarKey,
          additionalDocumentKeys: effectiveAdditionalKeys,
          updatedAt: new Date(),
        },
      });
    } else {
      verification = await AdminVerificationRepo.create(
        profile.id,
        effectiveIdentityKey,
        effectiveBarKey,
        effectiveAdditionalKeys
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

  /**
   * Renew or backfill credential dates for a VERIFIED expert.
   * Creates a new ExpertCertification record and updates credentialsExpiry on ExpertProfile.
   */
  renewCredentials: async (userId: string, dto: RenewCredentialsDto) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage("EXPERT_NOT_FOUND"));

    if (profile.status !== "VERIFIED") {
      throw new ValidationError(
        "Only verified experts can renew credentials. Please submit a verification request."
      );
    }

    const issueD = new Date(dto.issueDate);
    const expiryD = new Date(dto.expiryDate);

    if (isNaN(issueD.getTime()) || isNaN(expiryD.getTime())) {
      throw new ValidationError("Invalid issue date or expiry date format.");
    }
    if (expiryD <= issueD) {
      throw new ValidationError("Expiry date must be strictly after the issue date.");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiryD < today) {
      throw new ValidationError("Expiry date cannot be in the past.");
    }

    const { certificateName, issuer, issueDate, expiryDate } = dto;

    const [, cert] = await prisma.$transaction([
      prisma.expertProfile.update({
        where: { id: profile.id },
        data: { credentialsExpiry: new Date(expiryDate) },
      }),
      prisma.expertCertification.create({
        data: {
          expertId: profile.id,
          certificateName,
          issuer,
          issueDate: new Date(issueDate),
          expiryDate: new Date(expiryDate),
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: userId,
          action: "UPDATE",
          resource: "EXPERT",
          resourceId: userId,
          metadata: {
            action: "expert_credential_renewal",
            certificateName,
            issuer,
            issueDate,
            expiryDate,
          } as any,
        },
      }),
    ]);

    return {
      credentialsExpiry: new Date(expiryDate),
      certificationId: cert.id,
    };
  },
};

