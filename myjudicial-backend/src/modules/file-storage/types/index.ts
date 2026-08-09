/**
 * File Storage Domain — TypeScript Types
 *
 * These types are the canonical definitions for the file-storage module.
 * Import from here rather than from Prisma enums directly so the domain
 * stays decoupled from the ORM layer.
 */

// ─── Sensitivity ──────────────────────────────────────────────────────────────

/**
 * Controls who can access a stored file and how aggressively it is protected.
 *
 * PUBLIC       — profile photos, public lawyer images (no sign-in required)
 * PRIVATE      — uploaded documents (sign-in + ownership required)
 * CONFIDENTIAL — legal evidence, national IDs, bar certificates, court filings
 *                (sign-in + strict ownership/role check required)
 */
export type FileSensitivity = "PUBLIC" | "PRIVATE" | "CONFIDENTIAL";

// ─── Owner Type ───────────────────────────────────────────────────────────────

/**
 * Discriminator for the polymorphic ownerId field.
 *
 * USER        — document owned by a platform user (client)
 * EXPERT      — document owned by an expert profile
 * CASE        — document attached to a booking/case
 * COMPLIANCE  — compliance document owned by an expert profile
 */
export type FileOwnerType = "USER" | "EXPERT" | "CASE" | "COMPLIANCE";

// ─── File Categories ──────────────────────────────────────────────────────────

/**
 * Named upload categories drive object-key construction and size limits.
 */
export type FileCategory =
  | "expert-certificate"
  | "expert-national-id"
  | "expert-profile"
  | "client-document"
  | "case-evidence"
  | "case-attachment"
  | "compliance-document"
  | "chat-attachment";

// ─── Size Limits (bytes) ──────────────────────────────────────────────────────

export const FILE_SIZE_LIMITS: Record<FileCategory, number> = {
  "expert-profile":       5  * 1024 * 1024,  // 5 MB  — profile photos
  "client-document":      20 * 1024 * 1024,  // 20 MB — documents
  "expert-certificate":   20 * 1024 * 1024,  // 20 MB
  "expert-national-id":   20 * 1024 * 1024,  // 20 MB
  "compliance-document":  20 * 1024 * 1024,  // 20 MB
  "case-evidence":        50 * 1024 * 1024,  // 50 MB — legal evidence
  "case-attachment":      20 * 1024 * 1024,  // 20 MB
  "chat-attachment":      15 * 1024 * 1024,  // 15 MB — chat files (images, PDFs, docs)
};

// ─── Allowed MIME Types ───────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  // Encrypted payload — browser sends encrypted bytes as octet-stream
  "application/octet-stream",
]);

/**
 * Blocked file extensions. Validated against fileName (not MIME alone) to
 * prevent MIME-spoofing attacks.
 */
export const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".bat", ".sh", ".js", ".msi", ".dll", ".cmd", ".vbs",
  ".ps1", ".py", ".rb", ".php", ".jar", ".app", ".deb", ".rpm",
]);

// ─── Encryption Metadata ──────────────────────────────────────────────────────

/**
 * Metadata the browser sends alongside the encrypted payload.
 * Supports future KMS integration without schema redesign.
 */
export type EncryptionMetadata = {
  /** Encryption algorithm used client-side. Default: "AES-256-GCM" */
  encryptionAlgorithm: string;
  /**
   * Key version identifier.
   * - "v1" for browser-generated keys (MVP)
   * - "kms-oci-vault-key-N" for future OCI Vault-managed keys
   * - "kms-hashicorp-N" for future HashiCorp Vault keys
   */
  keyVersion: string;
  /** ISO-8601 timestamp of when the browser performed encryption */
  encryptedAt: string;
  /** Base64-encoded encrypted AES key (browser-encrypted with user's key) */
  encryptedAesKey?: string;
  /** Base64-encoded IV used during AES-256-GCM encryption */
  iv?: string;
};

// ─── Stored File Metadata (returned to callers) ───────────────────────────────

export type StoredFileMetadata = {
  id:                  string;
  ownerId:             string;
  ownerType:           FileOwnerType;
  bucketName:          string;
  objectKey:           string;
  fileName:            string;
  mimeType:            string;
  fileSize:            number;
  sensitivity:         FileSensitivity;
  encryptionAlgorithm: string | null;
  keyVersion:          string | null;
  kmsKeyId:            string | null;
  encryptedAesKey?:    string;
  iv?:                 string;
  encryptedAt:         Date | null;
  isVault:             boolean;
  uploadedById:        string | null;
  createdAt:           Date;
  updatedAt:           Date;
};

// ─── Signed URL Result ────────────────────────────────────────────────────────

export type FileSignedUrlResult = {
  /** Pre-signed OCI URL — valid until expiresAt */
  url:       string;
  /** Absolute UTC expiry timestamp */
  expiresAt: Date;
  /** Document metadata the browser needs to decrypt the download */
  file:      StoredFileMetadata;
};
