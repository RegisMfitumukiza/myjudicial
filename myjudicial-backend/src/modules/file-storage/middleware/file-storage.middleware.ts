/**
 * File Storage Domain — Middleware
 *
 * validateFileUpload  — memory-storage multer for encrypted binary payloads.
 *                       Size limits are enforced per file category.
 * requireFileAccess   — convenience guard applied to file-ID routes.
 *
 * NOTE: Encrypted payloads are stored in-memory (multer.memoryStorage).
 *       Files never touch the filesystem on this backend.
 */

import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "../../../shared/errors/index.js";
import { FILE_SIZE_LIMITS, BLOCKED_EXTENSIONS, type FileCategory } from "../types/index.js";

// ─── Memory Storage ────────────────────────────────────────────────────────────

/**
 * All encrypted file uploads use in-memory storage.
 * The buffer is handed directly to the OCI upload — no disk writes.
 */
const memoryStorage = multer.memoryStorage();

/**
 * Validates that the incoming file field name is "file" and that the
 * filename extension is not in the blocklist.
 *
 * We allow any MIME type at the multer level because encrypted content
 * is transmitted as application/octet-stream. MIME validation against the
 * *original* file's MIME type happens in the service layer.
 */
const createEncryptedFileFilter =
  (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) {
      cb(new ValidationError(`File type '${ext}' is not allowed`));
      return;
    }
    cb(null, true);
  };

// ─── Per-Category Upload Middleware ───────────────────────────────────────────

/**
 * Returns a multer middleware configured for the given file category.
 *
 * Usage in routes:
 *   router.post("/upload", validateFileUpload("client-document"), ...)
 *
 * The binary content will be available as:
 *   req.file.buffer  — Buffer
 *   req.file.size    — number (bytes)
 */
export const validateFileUpload = (category: FileCategory) =>
  multer({
    storage:    memoryStorage,
    fileFilter: createEncryptedFileFilter,
    limits: {
      fileSize: FILE_SIZE_LIMITS[category],
      files:    1,
    },
  }).single("file");

/**
 * Generic encrypted upload middleware for cases where the category is
 * determined at runtime from the request body (parsed after multer runs).
 *
 * Uses the most permissive limit (50 MB — case evidence) and relies on
 * the service layer to enforce per-category limits against the actual size.
 */
export const validateGenericFileUpload = multer({
  storage:    memoryStorage,
  fileFilter: createEncryptedFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB absolute cap
    files:    1,
  },
}).single("file");

// ─── File Access Guard ─────────────────────────────────────────────────────────

/**
 * Lightweight middleware that verifies :fileId is a valid UUID before
 * the request hits the controller. Does NOT check DB ownership — that is
 * the service layer's responsibility.
 *
 * Must be applied after the `authenticate` middleware so req.user exists.
 */
export const requireFileAccess = (
  req:  Request,
  _res: Response,
  next: NextFunction
): void => {
  const { fileId } = req.params;

  if (!fileId || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(fileId))) {
    return next(new ValidationError("Invalid fileId — must be a valid UUID"));
  }

  next();
};
