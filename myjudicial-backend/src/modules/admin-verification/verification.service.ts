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
    return { records, meta: buildPaginationMeta(total, pagination) };
  },

  /**
   * Get a single verification request by ID.
   */
  getById: async (id: string) => {
    const record = await VerificationRepository.findById(id);
    if (!record) throw new NotFoundError("Verification request");
    return record;
  },

  /**
   * Approve an expert's verification.
   * Sets expert status to VERIFIED and sends approval email.
   */
  approve: async (verificationId: string, adminId: string, ipAddress?: string) => {
    const existing = await VerificationRepository.findById(verificationId);
    if (!existing) throw new NotFoundError("Verification request");
    if (existing.status !== "PENDING") {
      throw new ValidationError(`Cannot approve a verification with status: ${existing.status}`);
    }

    const updated = await VerificationRepository.approve(verificationId, adminId);

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
  streamDocument: async (verificationId: string, objectKey: string, adminId: string) => {
    const existing = await VerificationRepository.findById(verificationId);
    if (!existing) throw new NotFoundError("Verification request");

    // Authorise: key must belong to this verification record
    const allowedKeys = [
      existing.identityDocumentObjectKey,
      existing.barCertificateObjectKey,
      existing.expert.profileImageObjectKey,
      ...(existing.additionalDocumentKeys ?? []),
    ].filter(Boolean) as string[];

    if (!allowedKeys.includes(objectKey)) {
      throw new ValidationError("Document key does not belong to this verification record");
    }

    // ── Fetch the encrypted bytes from storage ──────────────────────────────
    const { getDefaultBucketName } = await import(
      "../../infrastructure/storage/oci-object-storage.service.js"
    );
    const bucket = getDefaultBucketName();

    // Fetch raw bytes (encrypted ciphertext) from local or OCI storage
    const { downloadObject } = await import(
      "../../infrastructure/storage/oci-object-storage.service.js"
    );
    const ciphertext = await downloadObject(objectKey, bucket);

    // ── Fetch decryption keys from Document metadata table ─────────────────
    const { FileStorageRepository } = await import(
      "../../modules/file-storage/repositories/file-storage.repository.js"
    );
    const docMeta = await FileStorageRepository.findByObjectKeyWithKeys(objectKey);

    let plaintext: Buffer;
    let mimeType: string;

    if (docMeta?.encryptedAesKey && docMeta?.iv) {
      // Decrypt with AES-256-GCM using the stored key + IV
      const { decryptBuffer } = await import("../../shared/utils/crypto.js");
      plaintext = decryptBuffer(ciphertext, docMeta.encryptedAesKey, docMeta.iv);
      mimeType  = docMeta.mimeType ?? "application/octet-stream";
    } else {
      // Fallback: file was not encrypted (legacy or profile photo path) — stream as-is
      plaintext = ciphertext;
      mimeType  = docMeta?.mimeType ?? "application/octet-stream";
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
