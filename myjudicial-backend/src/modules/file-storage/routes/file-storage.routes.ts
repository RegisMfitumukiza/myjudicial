/**
 * File Storage Domain — Routes
 *
 * POST   /files/upload           Upload encrypted file + metadata
 * POST   /files/:fileId/url      Request time-limited signed download URL
 * GET    /files                  List owned / accessible files
 * GET    /files/:fileId          Get single file metadata
 * DELETE /files/:fileId          Delete file (owner or ADMIN only)
 * POST   /files/:fileId/share    Share file with another user
 *
 * Security:
 *   - All routes require authentication (authenticate middleware).
 *   - Business-level authorization (ownership, RBAC) is enforced by the service.
 *   - The validateGenericFileUpload middleware stores uploads in-memory only.
 *   - Multer runs before body-parser on upload routes (multipart handling).
 */

import { Router } from "express";
import { authenticate } from "../../../shared/middleware/authenticate.js";
import { validate, validateQuery } from "../../../shared/middleware/validate.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { FileStorageController } from "../controllers/file-storage.controller.js";
import {
  validateGenericFileUpload,
  requireFileAccess,
} from "../middleware/file-storage.middleware.js";
import {
  shareFileSchema,
  listFilesQuerySchema,
} from "../schemas/file-storage.schemas.js";

const router = Router();

/* ── Health ── */
router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, module: "file-storage" });
});

/* ═══════════════════════════════════════════════════════════════════════════
   UPLOAD
   Multipart/form-data: field "file" (encrypted binary) + text metadata fields.
   Authentication required — no role restriction (any authenticated user may upload;
   ownership/category validation happens in the service).
═══════════════════════════════════════════════════════════════════════════ */

router.post(
  "/upload",
  authenticate,
  validateGenericFileUpload,     // memory-storage multer; sets req.file.buffer
  asyncHandler(FileStorageController.uploadFile)
);

/* ═══════════════════════════════════════════════════════════════════════════
   LIST
═══════════════════════════════════════════════════════════════════════════ */

router.get(
  "/",
  authenticate,
  validateQuery(listFilesQuerySchema),
  asyncHandler(FileStorageController.listFiles)
);

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED DOCUMENTS
   Lists documents directly shared with the authenticated user via DocumentShare.
═══════════════════════════════════════════════════════════════════════════ */

router.get(
  "/shared-with-me",
  authenticate,
  validateQuery(listFilesQuerySchema),
  asyncHandler(FileStorageController.listSharedFiles)
);

/* ═══════════════════════════════════════════════════════════════════════════
   CONSULTATION / CASE DOCUMENTS
   Lists documents attached to all consultations/matters the user participates in.
═══════════════════════════════════════════════════════════════════════════ */

router.get(
  "/consultation-files",
  authenticate,
  validateQuery(listFilesQuerySchema),
  asyncHandler(FileStorageController.listConsultationFiles)
);

/* ═══════════════════════════════════════════════════════════════════════════
   BOOKING (CASE) DOCUMENTS
   Lists every document attached to a booking/case.
   Participants (citizen + assigned expert) and ADMINs only.
   Service layer enforces the authorization.
═══════════════════════════════════════════════════════════════════════════ */

router.get(
  "/by-booking/:bookingId",
  authenticate,
  validateQuery(listFilesQuerySchema),
  asyncHandler(FileStorageController.listBookingDocuments)
);

/* ═══════════════════════════════════════════════════════════════════════════
   LOCAL DEV DOWNLOAD
   Serves files from the local filesystem when OCI is not configured.
   DEVELOPMENT ONLY — not for production use.
═══════════════════════════════════════════════════════════════════════════ */

router.get(
  "/local-download",
  asyncHandler(FileStorageController.localDownload)
);

/* ═══════════════════════════════════════════════════════════════════════════
   SINGLE FILE METADATA
═══════════════════════════════════════════════════════════════════════════ */

router.get(
  "/:fileId",
  authenticate,
  requireFileAccess,
  asyncHandler(FileStorageController.getFileMetadata)
);

/* ═══════════════════════════════════════════════════════════════════════════
   STREAM (DOWNLOAD)
   Decrypts the document server-side and streams it to authorized users.
═══════════════════════════════════════════════════════════════════════════ */

router.get(
  "/:fileId/stream",
  authenticate,
  requireFileAccess,
  asyncHandler(FileStorageController.streamFile)
);

/* ═══════════════════════════════════════════════════════════════════════════
   SHARE
═══════════════════════════════════════════════════════════════════════════ */

router.post(
  "/:fileId/share",
  authenticate,
  requireFileAccess,
  validate(shareFileSchema),
  asyncHandler(FileStorageController.shareFile)
);

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE
═══════════════════════════════════════════════════════════════════════════ */

router.delete(
  "/:fileId",
  authenticate,
  requireFileAccess,
  asyncHandler(FileStorageController.deleteFile)
);

export default router;
