/**
 * File Storage Domain — DTOs
 *
 * Data Transfer Objects used at the service/controller boundary.
 * These are distinct from Zod schemas (validation layer) and Prisma models
 * (persistence layer).
 */

import type {
  FileSensitivity,
  FileOwnerType,
  FileCategory,
  EncryptionMetadata,
  StoredFileMetadata,
} from "../types/index.js";

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Passed from controller → service when uploading an encrypted file.
 *
 * The binary content is carried separately as a Buffer (from memory-storage
 * multer) — it never touches disk on the backend.
 */
export type UploadFileDto = {
  /** Original file name (before encryption) — stored for display purposes only */
  fileName:    string;
  /** MIME type of the ORIGINAL (plaintext) file */
  mimeType:    string;
  /** Byte-size of the encrypted payload */
  fileSize:    number;
  /** Category used for object-key path generation and size-limit enforcement */
  category:    FileCategory;
  /** Sensitivity tier */
  sensitivity: FileSensitivity;
  /** Polymorphic owner reference */
  ownerId:     string;
  ownerType:   FileOwnerType;
};

// ─── Signed URL Request ────────────────────────────────────────────────────────

export type RequestSignedUrlDto = {
  /**
   * Requested TTL in seconds.
   * The service enforces a maximum of OCI_SIGNED_URL_EXPIRY_SECONDS.
   */
  expiresInSeconds?: number;
};

// ─── Share ────────────────────────────────────────────────────────────────────

export type ShareFileDto = {
  sharedWithId: string;
  expiresAt?:   Date;
};

// ─── List Query ───────────────────────────────────────────────────────────────

export type ListFilesDto = {
  page:         number;
  limit:        number;
  ownerType?:   FileOwnerType;
  sensitivity?: FileSensitivity;
};

// ─── Paginated Result ──────────────────────────────────────────────────────────

export type PaginatedFiles = {
  files:      StoredFileMetadata[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
};
