/**
 * File Storage Domain — Admin Document Routes
 *
 * GET /admin/documents   Global documents listing (paginated, sortable,
 *                        filterable by uploader role / ownerType /
 *                        sensitivity / free-text search). ADMIN only.
 *
 * Security:
 *   - requireAdmin middleware rejects any non-ADMIN session before the handler.
 *   - Admin preview/download reuses GET /files/:fileId/stream (ADMIN may access
 *     every file via canAccess).
 */

import { Router } from "express";
import { authenticate, requireAdmin } from "../../../shared/middleware/authenticate.js";
import { validateQuery } from "../../../shared/middleware/validate.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { FileStorageController } from "../controllers/file-storage.controller.js";
import { adminListDocumentsQuerySchema } from "../schemas/file-storage.schemas.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get(
  "/",
  validateQuery(adminListDocumentsQuerySchema),
  asyncHandler(FileStorageController.adminListDocuments)
);

export default router;