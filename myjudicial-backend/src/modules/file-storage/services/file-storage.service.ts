/**
 * File Storage Domain — Service
 *
 * Orchestrates the upload/download/delete lifecycle. This is the only layer
 * that calls both the OCI infrastructure service AND the repository.
 *
 * Controllers must not call OCI directly. The service is the authorization
 * decision point for all file operations.
 *
 * Authorization Matrix:
 *   Expert documents      → owner expert + ADMIN
 *   Client documents      → owner client + ADMIN
 *   Case evidence/attach  → booking client + assigned expert + ADMIN
 *   Compliance docs       → expert owner + ADMIN
 *   PUBLIC sensitivity    → any authenticated user
 */

import { v4 as uuid } from "uuid";
import {
  uploadObject,
  deleteObject,
  getSignedDownloadUrl,
  scanForMalware,
  getDefaultBucketName,
} from "../../../infrastructure/storage/oci-object-storage.service.js";
import { FileStorageRepository } from "../repositories/file-storage.repository.js";
import { BookingRepository } from "../../bookings/booking.repository.js";
import { writeAuditLog } from "../../../shared/utils/audit.js";
import { wrapKey, unwrapKey, getMasterKeyId } from "../../../infrastructure/kms/oci-kms.service.js";
import { encryptBuffer, decryptBuffer } from "../../../shared/utils/crypto.js";
import { logger } from "../../../shared/utils/logger.js";
import {
  FileNotFoundError,
  FileAccessDeniedError,
  FileUploadError,
  StorageProviderError,
} from "../../../shared/errors/index.js";
import {
  FILE_SIZE_LIMITS,
  BLOCKED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from "../types/index.js";
import type {
  FileCategory,
  FileOwnerType,
  FileSensitivity,
  StoredFileMetadata,
  FileSignedUrlResult,
} from "../types/index.js";
import type {
  UploadFileDto,
  ShareFileDto,
  PaginatedFiles,
  AdminListDocumentsDto,
  PaginatedAdminDocuments,
} from "../dto/upload-file.dto.ts";

// ─── Object Key Builder ────────────────────────────────────────────────────────

/**
 * Builds a deterministic OCI object key.
 * All keys end with `.enc` to signal encrypted payloads.
 *
 * Examples:
 *   experts/abc/certificates/xyz.enc
 *   clients/abc/documents/xyz.enc
 *   cases/abc/evidence/xyz.enc
 *   compliance/abc/xyz.enc
 */
const buildObjectKey = (category: FileCategory, ownerId: string): string => {
  const id = uuid();
  switch (category) {
    case "expert-certificate": return `experts/${ownerId}/certificates/${id}.enc`;
    case "expert-national-id": return `experts/${ownerId}/national-id/${id}.enc`;
    case "expert-profile":     return `experts/${ownerId}/profile/${id}.enc`;
    case "client-document":    return `clients/${ownerId}/documents/${id}.enc`;
    case "case-evidence":      return `cases/${ownerId}/evidence/${id}.enc`;
    case "case-attachment":    return `cases/${ownerId}/attachments/${id}.enc`;
    case "compliance-document": return `compliance/${ownerId}/${id}.enc`;
    case "chat-attachment":    return `chat/${ownerId}/attachments/${id}.enc`;
    default:
      throw new FileUploadError("Unknown file category");
  }
};

// ─── Authorization Checks ──────────────────────────────────────────────────────

type RequesterContext = {
  userId:          string;
  role:            "CITIZEN" | "EXPERT" | "ADMIN";
  expertProfileId: string | null;
};

/**
 * Resolves whether a requester may access a given document.
 * Returns true if access is granted, false otherwise.
 *
 * Rules:
 * 1. ADMIN can access everything.
 * 2. PUBLIC files are accessible by any authenticated user.
 * 3. Owner matches ownerId (for USER owner type).
 * 4. Expert matches expertProfileId (for EXPERT owner type).
 * 5. Check DocumentShare for shared access.
 */
const canAccess = async (
  doc:       StoredFileMetadata,
  requester: RequesterContext
): Promise<boolean> => {
  if (requester.role === "ADMIN") return true;
  if (doc.sensitivity === "PUBLIC") return true;

  // Case documents: the booking's citizen and its assigned expert may access
  // every document attached to that booking (both sides' uploads).
  if (doc.bookingId) {
    const booking = await BookingRepository.findById(doc.bookingId);
    if (
      booking &&
      (booking.citizenId === requester.userId ||
        booking.expertId === requester.expertProfileId)
    ) {
      return true;
    }
  }

  // Direct ownership
  if (doc.ownerType === "USER"   && doc.ownerId === requester.userId)             return true;
  if (doc.ownerType === "EXPERT" && doc.ownerId === requester.expertProfileId)     return true;
  if (doc.ownerType === "COMPLIANCE" && doc.ownerId === requester.expertProfileId) return true;

  // Share grant
  const hasShare = await FileStorageRepository.findActiveShare(doc.id, requester.userId);
  return hasShare;
};

/**
 * Resolves whether a requester may delete a given document.
 * Stricter than canAccess — only owner or ADMIN.
 */
const canDelete = (doc: StoredFileMetadata, requester: RequesterContext): boolean => {
  if (requester.role === "ADMIN") return true;
  if (doc.ownerType === "USER"   && doc.ownerId === requester.userId)             return true;
  if (doc.ownerType === "EXPERT" && doc.ownerId === requester.expertProfileId)    return true;
  if (doc.ownerType === "COMPLIANCE" && doc.ownerId === requester.expertProfileId) return true;
  return false;
};

// ─── Validation ────────────────────────────────────────────────────────────────

const validateUpload = (dto: UploadFileDto, buffer: Buffer): void => {
  // Extension blocklist
  const ext = dto.fileName.slice(dto.fileName.lastIndexOf(".")).toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new FileUploadError(`File type '${ext}' is not allowed`);
  }

  // MIME allowlist (accept octet-stream as encrypted content is always binary)
  if (!ALLOWED_MIME_TYPES.has(dto.mimeType)) {
    throw new FileUploadError(`MIME type '${dto.mimeType}' is not allowed`);
  }

  // Size limit
  const maxBytes = FILE_SIZE_LIMITS[dto.category];
  if (buffer.length > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
    throw new FileUploadError(
      `File exceeds the ${maxMb} MB size limit for '${dto.category}' uploads`
    );
  }
};

// ─── Service ───────────────────────────────────────────────────────────────────

export const FileStorageService = {

  // ── Upload ────────────────────────────────────────────────────────────────

  /**
   * Upload a pre-encrypted file to OCI and persist its metadata.
   *
   * Flow:
   *   1. Validate metadata + buffer
   *   2. Architecture hook: malware scan (no-op until scanner configured)
   *   3. Build OCI object key
   *   4. Upload to OCI (encrypted bytes only)
   *   5. Persist metadata in PostgreSQL
   *   6. Audit log
   */
  uploadFile: async (
    dto:         UploadFileDto,
    buffer:      Buffer,
    uploadedBy:  string,
    ipAddress?:  string,
    userAgent?:  string,
    requester?:  RequesterContext
  ): Promise<StoredFileMetadata> => {
    validateUpload(dto, buffer);

    // Case documents must target an existing booking and may only be uploaded
    // by one of its participants (citizen or assigned expert).
    if (dto.bookingId) {
      if (!["case-attachment", "case-evidence"].includes(dto.category)) {
        throw new FileUploadError(
          "bookingId may only be set for 'case-attachment' or 'case-evidence' uploads"
        );
      }
      const booking = await BookingRepository.findById(dto.bookingId);
      if (!booking) {
        throw new FileUploadError("Booking not found for this case document upload");
      }
      const isParticipant =
        requester?.role === "ADMIN" ||
        booking.citizenId === requester?.userId ||
        booking.expertId === requester?.expertProfileId;
      if (!isParticipant) {
        throw new FileAccessDeniedError("You must be a participant of the booking to upload case documents");
      }
    }

    const objectKey  = buildObjectKey(dto.category, dto.ownerId);
    const bucketName = getDefaultBucketName();

    // Architecture hook — malware scan (no-op for now)
    await scanForMalware(objectKey, bucketName);

    // Encrypt the file buffer with AES-256-GCM
    const { ciphertext, keyBase64, ivBase64, algorithm } = encryptBuffer(buffer);

    // Upload encrypted bytes to OCI
    await uploadObject({
      key:         objectKey,
      body:        ciphertext,
      contentType: "application/octet-stream", // always octet-stream; encrypted
      metadata: {
        originalFileName:    dto.fileName,
        originalMimeType:    dto.mimeType,
        encryptionAlgorithm: algorithm,
        keyVersion:          "v1",
        uploadedBy,
      },
      bucket: bucketName,
    });

    let finalAesKey = keyBase64;
    let kmsKeyId: string | undefined;

    if (finalAesKey) {
      finalAesKey = await wrapKey(finalAesKey);
      kmsKeyId    = getMasterKeyId() || undefined;
    }

    // Persist metadata
    let stored: StoredFileMetadata;
    try {
      stored = await FileStorageRepository.create({
        ownerId:             dto.ownerId,
        ownerType:           dto.ownerType,
        bookingId:           dto.bookingId,
        bucketName,
        objectKey,
        fileName:            dto.fileName,
        mimeType:            dto.mimeType,
        fileSize:            buffer.length, // original file size
        sensitivity:         dto.sensitivity,
        encryptedAesKey:     finalAesKey,
        iv:                  ivBase64,
        encryptionAlgorithm: algorithm,
        keyVersion:          "v1",
        kmsKeyId,
        encryptedAt:         new Date(),
        uploadedById: uploadedBy,
        isVault:      true,
      });
    } catch (error) {
      // Rollback: delete the object we just uploaded to avoid orphaned blobs
      try {
        await deleteObject(objectKey, bucketName);
      } catch (rollbackErr) {
        logger.error("FileStorageService: rollback delete failed", { objectKey, rollbackErr });
      }
      throw error;
    }

    await writeAuditLog({
      actorId:    uploadedBy,
      action:     "UPLOAD",
      resource:   "DOCUMENT",
      resourceId: stored.id,
      description: `Uploaded encrypted file: ${dto.fileName}`,
      metadata:  {
        category:    dto.category,
        sensitivity: dto.sensitivity,
        ownerType:   dto.ownerType,
        ownerId:     dto.ownerId,
      },
      ipAddress,
      userAgent,
    });

    logger.info("FileStorageService: file uploaded", {
      id:        stored.id,
      category:  dto.category,
      objectKey,
    });

    return stored;
  },

  // ── Decryption Stream (Download) ──────────────────────────────────────────

  /**
   * Fetch a document from storage, decrypt it server-side, and return its
   * plaintext Buffer along with its original mimeType.
   *
   * Flow:
   *   1. Load document metadata (throws FileNotFoundError if absent)
   *   2. Authorization check (throws FileAccessDeniedError if not permitted)
   *   3. Fetch ciphertext from OCI
   *   4. Decrypt in-memory
   *   5. Return plaintext Buffer + metadata
   */
  streamDocument: async (
    fileId:           string,
    requester:        RequesterContext,
    ipAddress?:        string,
    userAgent?:        string
  ): Promise<{ plaintext: Buffer; mimeType: string; fileName: string }> => {
    const doc = await FileStorageRepository.findByIdWithKeys(fileId);
    if (!doc) throw new FileNotFoundError();

    const access = await canAccess(doc as StoredFileMetadata, requester);
    if (!access) throw new FileAccessDeniedError();

    // Fetch raw bytes (encrypted ciphertext) from storage
    const { downloadObject } = await import(
      "../../../infrastructure/storage/oci-object-storage.service.js"
    );
    const ciphertext = await downloadObject(doc.objectKey, doc.bucketName || getDefaultBucketName());

    let plaintext: Buffer;
    let mimeType: string = doc.mimeType || "application/octet-stream";

    if (doc.encryptedAesKey && doc.iv) {
      // Unwrap the AES key if it was double-wrapped by KMS
      let unwrappedAesKey = doc.encryptedAesKey;
      if (doc.kmsKeyId) {
        unwrappedAesKey = await unwrapKey(unwrappedAesKey);
      }
      
      // Decrypt with AES-256-GCM
      plaintext = decryptBuffer(ciphertext, unwrappedAesKey, doc.iv);
    } else {
      // Fallback: file was not encrypted (legacy or public profile photo)
      plaintext = ciphertext;
    }

    await writeAuditLog({
      actorId:     requester.userId,
      action:      "DOWNLOAD",
      resource:    "DOCUMENT",
      resourceId:  fileId,
      description: `Streamed decrypted document: ${doc.fileName}`,
      ipAddress,
      userAgent,
    });

    return { 
      plaintext, 
      mimeType, 
      fileName: doc.fileName || doc.objectKey.split("/").pop() || "document" 
    };
  },

  // ── Get Metadata ──────────────────────────────────────────────────────────

  getFileMetadata: async (
    fileId:    string,
    requester: RequesterContext,
  ): Promise<StoredFileMetadata> => {
    const doc = await FileStorageRepository.findById(fileId);
    if (!doc) throw new FileNotFoundError();

    const access = await canAccess(doc, requester);
    if (!access) throw new FileAccessDeniedError();

    return doc;
  },

  // ── List Files ─────────────────────────────────────────────────────────────

  /**
   * List files owned by the requester.
   * ADMINs can filter by any ownerId by passing it in the query.
   */
  listOwnedFiles: async (
    ownerId:   string,
    ownerType: FileOwnerType,
    page:      number,
    limit:     number,
    filters?:  { sensitivity?: FileSensitivity }
  ): Promise<PaginatedFiles> => {
    const { records, total } = await FileStorageRepository.findByOwner(
      ownerId, ownerType, page, limit, filters
    );

    const totalPages = Math.ceil(total / limit);
    return {
      files:      records,
      total,
      page,
      limit,
      totalPages,
      hasNext:    page < totalPages,
      hasPrev:    page > 1,
    };
  },

  // ── Booking Documents ─────────────────────────────────────────────────────

  /**
   * List all documents attached to a booking/case.
   * Only the booking's citizen, its assigned expert, or an ADMIN may list.
   * This is the "case documents" view — lets each participant see the other
   * side's case-attachment / case-evidence uploads for that booking.
   */
  listBookingDocuments: async (
    bookingId: string,
    requester: RequesterContext,
    page:      number,
    limit:     number
  ): Promise<PaginatedFiles> => {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) throw new FileNotFoundError();

    const canView =
      requester.role === "ADMIN" ||
      booking.citizenId === requester.userId ||
      booking.expertId === requester.expertProfileId;
    if (!canView) throw new FileAccessDeniedError();

    const { records, total } = await FileStorageRepository.findByBooking(bookingId, page, limit);

    const totalPages = Math.ceil(total / limit);
    return {
      files:      records,
      total,
      page,
      limit,
      totalPages,
      hasNext:    page < totalPages,
      hasPrev:    page > 1,
    };
  },

  // ── Admin List ────────────────────────────────────────────────────────────

  /**
   * Global, paginated documents listing for the Admin Dashboard.
   * RBAC is enforced by the requireAdmin middleware; this method applies
   * the role/ownerType/sensitivity/search filters and sorting.
   */
  adminListDocuments: async (dto: AdminListDocumentsDto): Promise<PaginatedAdminDocuments> => {
    const { records, total } = await FileStorageRepository.findAdminDocuments(dto);

    const totalPages = Math.ceil(total / dto.limit);
    return {
      documents:  records,
      total,
      page:       dto.page,
      limit:      dto.limit,
      totalPages,
      hasNext:    dto.page < totalPages,
      hasPrev:    dto.page > 1,
    };
  },

  // ── Delete ────────────────────────────────────────────────────────────────

  /**
   * Delete a file from OCI and soft-delete its metadata record.
   *
   * Flow:
   *   1. Load document
   *   2. Authorization (owner or ADMIN only)
   *   3. Delete from OCI
   *   4. Soft-delete DB record
   *   5. Audit log
   */
  deleteFile: async (
    fileId:    string,
    requester: RequesterContext,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> => {
    const doc = await FileStorageRepository.findById(fileId);
    if (!doc) throw new FileNotFoundError();

    if (!canDelete(doc, requester)) throw new FileAccessDeniedError();

    await deleteObject(doc.objectKey, doc.bucketName || undefined);
    await FileStorageRepository.softDelete(fileId);

    await writeAuditLog({
      actorId:     requester.userId,
      action:      "DELETE",
      resource:    "DOCUMENT",
      resourceId:  fileId,
      description: `Deleted file: ${doc.fileName}`,
      ipAddress,
      userAgent,
    });

    logger.info("FileStorageService: file deleted", { fileId, objectKey: doc.objectKey });
  },

  // ── Share ─────────────────────────────────────────────────────────────────

  /**
   * Share a document with another user.
   * Only the document owner or an ADMIN may grant a share.
   */
  shareFile: async (
    fileId:    string,
    requester: RequesterContext,
    dto:       ShareFileDto,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> => {
    const doc = await FileStorageRepository.findById(fileId);
    if (!doc) throw new FileNotFoundError();

    // Only owner or admin may share
    if (!canDelete(doc, requester)) {
      throw new FileAccessDeniedError("Only the document owner can share files");
    }

    await FileStorageRepository.createShare(
      fileId,
      dto.sharedWithId,
      dto.expiresAt
    );

    await writeAuditLog({
      actorId:     requester.userId,
      action:      "SHARE",
      resource:    "DOCUMENT",
      resourceId:  fileId,
      description: `Shared file '${doc.fileName}' with user ${dto.sharedWithId}`,
      metadata:    { sharedWithId: dto.sharedWithId, expiresAt: dto.expiresAt },
      ipAddress,
      userAgent,
    });
  },
};
