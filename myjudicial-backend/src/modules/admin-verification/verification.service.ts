import { VerificationRepository } from "./verification.repository.js";
import { writeAuditLog } from "../../shared/utils/audit.js";
import {
  sendApprovalEmail,
  sendRejectionEmail,
  sendVerificationReminderEmail,
  sendCorrectionsEmail,
} from "../../infrastructure/email/email.service.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { parsePagination, buildPaginationMeta } from "../../shared/utils/pagination.js";
import { logger } from "../../shared/utils/logger.js";
import { triggerEmbeddingSync } from "../ai/embedding-sync.service.js";
import { NotificationRepository } from "../notifications/notification.repository.js";
import type { NotificationEvent } from "../../generated/prisma/client.js";
import { resolveStorageUrl } from "../../infrastructure/storage/oci-object-storage.service.js";
import { prisma } from "../../infrastructure/database/prisma.js";

export const VerificationService = {
  /**
   * List verification requests by status — paginated.
   * Defaults to PENDING if no valid status provided.
   */
  listPending: async (pageQuery: unknown, limitQuery: unknown, statusQuery?: unknown) => {
    const pagination = parsePagination(pageQuery, limitQuery);
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "EXPIRED"];
    const status = typeof statusQuery === "string" && validStatuses.includes(statusQuery)
      ? statusQuery
      : "PENDING";
    const [records, total] = await Promise.all([
      VerificationRepository.findByStatus(status, pagination.skip, pagination.limit),
      VerificationRepository.countByStatus(status),
    ]);
    const transformedRecords = await Promise.all(
      records.map(async (record) => {
        const photoKey = record.expert?.profileImageObjectKey || record.expert?.user?.avatarObjectKey;
        const profileImageUrl = await resolveStorageUrl(photoKey);
        return {
          ...record,
          expert: {
            ...record.expert,
            profileImageUrl,
          },
        };
      })
    );
    return { records: transformedRecords, meta: buildPaginationMeta(total, pagination) };
  },

  /**
   * Get a single verification request by ID.
   */
  getById: async (id: string) => {
    const record = await VerificationRepository.findById(id);
    if (!record) throw new NotFoundError("Verification request");
    const photoKey = record.expert?.profileImageObjectKey || record.expert?.user?.avatarObjectKey;
    const profileImageUrl = await resolveStorageUrl(photoKey);
    return {
      ...record,
      expert: {
        ...record.expert,
        profileImageUrl,
      },
    };
  },

  /**
   * Approve an expert's verification.
   * Sets expert status to VERIFIED and sends approval email.
   */
  approve: async (
    verificationId: string,
    adminId: string,
    customExpiryDate?: Date | string,
    ipAddress?: string
  ) => {
    const existing = await VerificationRepository.findById(verificationId);
    if (!existing) throw new NotFoundError("Verification request");
    if (existing.status !== "PENDING") {
      throw new ValidationError(`Cannot approve a verification with status: ${existing.status}`);
    }

    const updated = await VerificationRepository.approve(verificationId, adminId, customExpiryDate);

    await writeAuditLog({
      actorId: adminId,
      action: "VERIFY",
      resource: "VERIFICATION",
      resourceId: verificationId,
      description: `Expert ${existing.expert.displayName} approved`,
      ipAddress,
    });

    // Send approval email
    const email = existing.expert.user.email;
    const name = existing.expert.displayName;
    const expertLanguage = (existing.expert.user.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
    await sendApprovalEmail(email, name, expertLanguage);

    // In-app notification for the expert
    if (existing.expert.user.id) {
      await NotificationRepository.create({
        userId: existing.expert.user.id,
        event: "WELCOME" as NotificationEvent,
        recipient: email,
        subject: "Verification Approved",
        body: "Congratulations! Your legal credentials have been verified. Your profile and services are now publicly visible.",
      }).catch((err) => logger.error("Failed to write in-app approval notification", { error: err }));
    }

    // Tier 3 — sync AI embedding now that the expert is verified (fire-and-forget)
    // This makes the newly approved lawyer immediately searchable via AI Triage.
    triggerEmbeddingSync(existing.expert.id, "expert_verified");

    return updated;
  },

  /**
   * Reject an expert's verification.
   * Sets expert status to REJECTED and sends rejection email with reason.
   */
  reject: async (
    verificationId: string,
    adminId: string,
    reason: string,
    ipAddress?: string
  ) => {
    const existing = await VerificationRepository.findById(verificationId);
    if (!existing) throw new NotFoundError("Verification request");
    if (existing.status !== "PENDING") {
      throw new ValidationError(`Cannot reject a verification with status: ${existing.status}`);
    }

    const updated = await VerificationRepository.reject(verificationId, adminId, reason);

    await writeAuditLog({
      actorId: adminId,
      action: "REJECT",
      resource: "VERIFICATION",
      resourceId: verificationId,
      description: `Expert ${existing.expert.displayName} rejected. Reason: ${reason}`,
      ipAddress,
    });

    const email = existing.expert.user.email;
    const name = existing.expert.displayName;
    const expertLanguage = (existing.expert.user.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
    await sendRejectionEmail(email, name, reason, expertLanguage);

    // In-app notification for the expert
    if (existing.expert.user.id) {
      await NotificationRepository.create({
        userId: existing.expert.user.id,
        event: "WELCOME" as NotificationEvent,
        recipient: email,
        subject: "Verification Update: Action Required",
        body: `Your verification submission was not approved. Feedback: "${reason}". Please review and resubmit your documents.`,
      }).catch((err) => logger.error("Failed to write in-app rejection notification", { error: err }));
    }

    return updated;
  },

  /**
   * Send a reminder to the expert to upload missing documents.
   * Only valid when verification is PENDING.
   */
  sendReminder: async (verificationId: string, adminId: string, ipAddress?: string) => {
    const existing = await VerificationRepository.findById(verificationId);
    if (!existing) throw new NotFoundError("Verification request");
    if (existing.status !== "PENDING") {
      throw new ValidationError(`Cannot send reminder for a verification with status: ${existing.status}`);
    }

    const email = existing.expert.user.email;
    const name  = existing.expert.displayName;
    const expertLanguage = (existing.expert.user.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
    await sendVerificationReminderEmail(email, name, expertLanguage);

    await writeAuditLog({
      actorId:     adminId,
      action:      "UPDATE",
      resource:    "VERIFICATION",
      resourceId:  verificationId,
      description: `Reminder sent to expert ${name}`,
      ipAddress,
    });

    return { sent: true, recipient: email };
  },

  /**
   * Fetch a document from storage, decrypt it, and return its plaintext Buffer
   * along with its original mimeType.
   */
  /**
   * Fetch a document from storage, decrypt it, and return its plaintext Buffer
   * along with its original mimeType.
   */
  streamDocument: async (verificationId: string, objectKey: string, adminId: string) => {
    // 1. Resolve verification record (by verificationId, expertProfileId, or expert userId)
    let existing = await VerificationRepository.findById(verificationId);
    if (!existing) {
      existing = await prisma.expertVerification.findFirst({
        where: {
          OR: [
            { id: verificationId },
            { expertId: verificationId },
            { expert: { userId: verificationId } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: {
          expert: {
            select: {
              id: true,
              displayName: true,
              barNumber: true,
              primarySpecialty: true,
              city: true,
              status: true,
              profileImageObjectKey: true,
              user: { select: { id: true, email: true, firstName: true, lastName: true, preferredLanguage: true, avatarObjectKey: true } },
            },
          },
        },
      });
    }

    if (!existing) {
      // If still no verification found, check if this is an expert ID directly
      const expertProfile = await prisma.expertProfile.findFirst({
        where: {
          OR: [{ id: verificationId }, { userId: verificationId }],
        },
        include: {
          user: { select: { id: true } },
        },
      });

      if (!expertProfile) {
        throw new NotFoundError("Verification request or Expert");
      }

      // Check if document belongs to this expert
      const belongsToExpert =
        expertProfile.profileImageObjectKey === objectKey ||
        (await prisma.expertCertification.findFirst({
          where: { expertId: expertProfile.id, documentObjectKey: objectKey },
        })) ||
        (await prisma.expertVerification.findFirst({
          where: {
            expertId: expertProfile.id,
            OR: [
              { identityDocumentObjectKey: objectKey },
              { barCertificateObjectKey: objectKey },
              { additionalDocumentKeys: { has: objectKey } },
            ],
          },
        })) ||
        (await prisma.document.findFirst({
          where: {
            objectKey,
            OR: [
              { ownerId: expertProfile.userId },
              { ownerId: expertProfile.id },
            ],
          },
        }));

      if (!belongsToExpert) {
        throw new ValidationError("Document key does not belong to this expert");
      }
    } else {
      // Authorise: key must belong to this verification record or any records of this expert
      const expertProfileId = existing.expertId;
      const expertUserId = existing.expert?.user?.id;

      const directKeys = [
        existing.identityDocumentObjectKey,
        existing.barCertificateObjectKey,
        existing.expert.profileImageObjectKey,
        ...(existing.additionalDocumentKeys ?? []),
      ].filter(Boolean) as string[];

      let isAuthorized = directKeys.includes(objectKey);

      if (!isAuthorized && expertProfileId) {
        // Check all verification submissions for this expert
        const otherVerifs = await prisma.expertVerification.findMany({
          where: { expertId: expertProfileId },
          select: {
            identityDocumentObjectKey: true,
            barCertificateObjectKey: true,
            additionalDocumentKeys: true,
          },
        });
        for (const v of otherVerifs) {
          if (
            v.identityDocumentObjectKey === objectKey ||
            v.barCertificateObjectKey === objectKey ||
            v.additionalDocumentKeys?.includes(objectKey)
          ) {
            isAuthorized = true;
            break;
          }
        }
      }

      if (!isAuthorized && expertProfileId) {
        // Check expert certifications
        const cert = await prisma.expertCertification.findFirst({
          where: { expertId: expertProfileId, documentObjectKey: objectKey },
        });
        if (cert) isAuthorized = true;
      }

      if (!isAuthorized && (expertProfileId || expertUserId)) {
        // Check document storage table
        const doc = await prisma.document.findFirst({
          where: {
            objectKey,
            OR: [
              ...(expertUserId ? [{ ownerId: expertUserId }] : []),
              ...(expertProfileId ? [{ ownerId: expertProfileId }] : []),
            ],
          },
        });
        if (doc) isAuthorized = true;
      }

      if (!isAuthorized) {
        throw new ValidationError("Document key does not belong to this verification record or expert");
      }
    }

    // ── Fetch the encrypted bytes from storage ──────────────────────────────
    const { getDefaultBucketName, downloadObject } = await import(
      "../../infrastructure/storage/oci-object-storage.service.js"
    );
    const bucket = getDefaultBucketName();

    // Fetch raw bytes (encrypted ciphertext) from local or OCI storage
    const ciphertext = await downloadObject(objectKey, bucket);

    // ── Fetch decryption keys from Document metadata table ─────────────────
    let docMeta: {
      encryptedAesKey: string | null;
      iv: string | null;
      mimeType: string;
      fileName: string;
      kmsKeyId: string | null;
    } | null = null;

    try {
      docMeta = await prisma.document.findFirst({
        where: { objectKey, isDeleted: false },
        select: {
          encryptedAesKey: true,
          iv: true,
          mimeType: true,
          fileName: true,
          kmsKeyId: true,
        },
      });
    } catch (dbErr) {
      logger.warn("Direct document metadata lookup failed, attempting FileStorageRepository fallback", {
        objectKey,
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      });
      try {
        const { FileStorageRepository } = await import(
          "../../modules/file-storage/repositories/file-storage.repository.js"
        );
        docMeta = await FileStorageRepository.findByObjectKeyWithKeys(objectKey);
      } catch {
        docMeta = null;
      }
    }

    let plaintext: Buffer;
    let mimeType: string = docMeta?.mimeType ?? "application/octet-stream";

    if (docMeta?.encryptedAesKey && docMeta?.iv) {
      try {
        let rawAesKey = docMeta.encryptedAesKey;
        // Only attempt KMS unwrap if a KMS Master Key ID was recorded on this document
        if (docMeta.kmsKeyId) {
          try {
            const { unwrapKey } = await import("../../infrastructure/kms/oci-kms.service.js");
            rawAesKey = await unwrapKey(docMeta.encryptedAesKey);
          } catch (kmsErr) {
            logger.warn("OCI KMS unwrap failed, attempting direct AES key fallback", {
              objectKey,
              error: kmsErr instanceof Error ? kmsErr.message : String(kmsErr),
            });
          }
        }
        const { decryptBuffer } = await import("../../shared/utils/crypto.js");
        plaintext = decryptBuffer(ciphertext, rawAesKey, docMeta.iv);
      } catch (decryptErr) {
        logger.warn("Server-side decryption failed, streaming raw ciphertext as fallback", {
          objectKey,
          error: decryptErr instanceof Error ? decryptErr.message : String(decryptErr),
        });
        plaintext = ciphertext;
      }
    } else {
      // Fallback: file was not encrypted (legacy or profile photo path) — stream as-is
      plaintext = ciphertext;
    }

    // Infer sensible MIME type if unknown
    if (mimeType === "application/octet-stream" || !mimeType) {
      const ext = objectKey.split(".").pop()?.toLowerCase();
      if (ext === "pdf") mimeType = "application/pdf";
      else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
      else if (ext === "png") mimeType = "image/png";
      else if (ext === "webp") mimeType = "image/webp";
    }

    await writeAuditLog({
      actorId:     adminId,
      action:      "DOWNLOAD",
      resource:    "VERIFICATION",
      resourceId:  verificationId,
      description: `Admin previewed document: ${objectKey}`,
    });

    return { plaintext, mimeType, fileName: docMeta?.fileName ?? objectKey.split("/").pop() ?? "document" };
  },

  /**
   * Request corrections from the expert.
   * Keeps verification PENDING but notifies the expert with specific notes.
   */
  requestCorrections: async (
    verificationId: string,
    adminId: string,
    notes: string,
    ipAddress?: string
  ) => {
    const existing = await VerificationRepository.findById(verificationId);
    if (!existing) throw new NotFoundError("Verification request");
    if (existing.status !== "PENDING") {
      throw new ValidationError(`Cannot request corrections for a verification with status: ${existing.status}`);
    }

    const formattedReason = `[CORRECTIONS_REQUIRED] ${notes}`;
    await VerificationRepository.reject(verificationId, adminId, formattedReason);

    const email = existing.expert.user.email;
    const name  = existing.expert.displayName;
    const expertLanguage = (existing.expert.user.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
    await sendCorrectionsEmail(email, name, notes, expertLanguage);

    // In-app notification for the expert
    if (existing.expert.user.id) {
      await NotificationRepository.create({
        userId: existing.expert.user.id,
        event: "WELCOME" as NotificationEvent,
        recipient: email,
        subject: "Verification Corrections Required",
        body: `Our review team requested corrections: "${notes}". Please update and resubmit your documents.`,
      }).catch((err) => logger.error("Failed to write in-app corrections notification", { error: err }));
    }

    await writeAuditLog({
      actorId:     adminId,
      action:      "UPDATE",
      resource:    "VERIFICATION",
      resourceId:  verificationId,
      description: `Corrections requested from expert ${name}`,
      metadata:    { notes },
      ipAddress,
    });

    return { sent: true, recipient: email, notes };
  },
};
