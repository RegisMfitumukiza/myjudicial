/**
 * File Storage Domain — Zod Validation Schemas
 *
 * All API input validation for the file-storage domain lives here.
 * Schemas are used both by validate() middleware and for deriving TypeScript
 * types via z.infer<>.
 */

import { z } from "zod";
import { ALLOWED_MIME_TYPES, BLOCKED_EXTENSIONS } from "../types/index.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fileSensitivityValues = ["PUBLIC", "PRIVATE", "CONFIDENTIAL"] as const;
const fileOwnerTypeValues    = ["USER", "EXPERT", "CASE", "COMPLIANCE"] as const;
const fileCategoryValues     = [
  "expert-certificate",
  "expert-national-id",
  "expert-profile",
  "client-document",
  "case-evidence",
  "case-attachment",
  "compliance-document",
] as const;

// ─── Upload File Schema ───────────────────────────────────────────────────────

/**
 * Validated by the upload endpoint.
 *
 * The binary payload arrives as multipart form-data (field: "file").
 * All other fields below arrive as JSON parts of the same multipart body
 * or as request body when using a JSON metadata + separate binary upload.
 */
export const uploadFileSchema = z.object({
  /** Display name of the original plaintext file (before encryption) */
  fileName: z
    .string()
    .min(1, "fileName is required")
    .max(255, "fileName must be 255 characters or fewer")
    .refine(
      (name) => {
        const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
        return !BLOCKED_EXTENSIONS.has(ext);
      },
      { message: "File type not allowed" }
    ),

  /** Declared MIME type of the original file */
  mimeType: z
    .string()
    .refine((m) => ALLOWED_MIME_TYPES.has(m), {
      message: `Unsupported file type. Allowed: ${[...ALLOWED_MIME_TYPES].join(", ")}`,
    }),

  /** File size in bytes */
  fileSize: z.coerce
    .number()
    .int()
    .positive("fileSize must be a positive integer"),

  /** Upload category — drives object-key path and size-limit validation */
  category: z.enum(fileCategoryValues),

  /** Sensitivity classification */
  sensitivity: z.enum(fileSensitivityValues).default("PRIVATE"),

  /**
   * Polymorphic owner reference.
   * ownerId + ownerType together identify who owns this file.
   * The service validates that the requester has the right to upload
   * on behalf of this owner.
   */
  ownerId:   z.string().uuid("ownerId must be a valid UUID"),
  ownerType: z.enum(fileOwnerTypeValues).default("USER"),
});

export type UploadFileSchema = z.infer<typeof uploadFileSchema>;

// ─── Request Signed URL Schema ─────────────────────────────────────────────────

export const requestSignedUrlSchema = z.object({
  /**
   * Requested TTL in seconds. Capped server-side at OCI_SIGNED_URL_EXPIRY_SECONDS
   * regardless of what the client requests.
   */
  expiresInSeconds: z.coerce.number().int().min(60).max(3600).optional(),
});

export type RequestSignedUrlSchema = z.infer<typeof requestSignedUrlSchema>;

// ─── Share File Schema ────────────────────────────────────────────────────────

export const shareFileSchema = z.object({
  /** UUID of the user to share with */
  sharedWithId: z.string().uuid("sharedWithId must be a valid UUID"),
  /**
   * Optional ISO-8601 expiry for the share grant.
   * If omitted the share does not expire.
   */
  expiresAt: z.string().datetime().optional(),
});

export type ShareFileSchema = z.infer<typeof shareFileSchema>;

// ─── List Files Query Schema ──────────────────────────────────────────────────

export const listFilesQuerySchema = z.object({
  page:        z.coerce.number().int().min(1).default(1),
  limit:       z.coerce.number().int().min(1).max(100).default(20),
  ownerType:   z.enum(fileOwnerTypeValues).optional(),
  sensitivity: z.enum(fileSensitivityValues).optional(),
  category:    z.enum(fileCategoryValues).optional(),
});

export type ListFilesQuerySchema = z.infer<typeof listFilesQuerySchema>;

// ─── URL Param Schema ─────────────────────────────────────────────────────────

export const fileIdParamSchema = z.object({
  fileId: z.string().uuid("fileId must be a valid UUID"),
});

export type FileIdParamSchema = z.infer<typeof fileIdParamSchema>;
