/**
 * File Storage Domain — Controller
 *
 * Thin controllers: parse + validate request input, delegate to the service,
 * and format the response. No business logic, no OCI calls.
 */

import type { Request, Response, NextFunction } from "express";
import { FileStorageService } from "../services/file-storage.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../../shared/utils/response.js";
import { sendPaginated } from "../../../shared/utils/response.js";
import { ValidationError, AuthenticationError } from "../../../shared/errors/index.js";
import type { AuthenticatedUser } from "../../../types/express.js";
import type { UploadFileDto } from "../dto/upload-file.dto.ts";
import { resolveEnforcedSensitivity, type FileCategory, type FileOwnerType, type FileSensitivity } from "../types/index.js";

// ─── Helper: extract requester context ───────────────────────────────────────

const getRequester = (user: AuthenticatedUser) => ({
  userId:          user.id,
  role:            user.role as "CITIZEN" | "EXPERT" | "ADMIN",
  expertProfileId: user.expertProfileId,
});

// ─── Controllers ──────────────────────────────────────────────────────────────

export const FileStorageController = {

  /**
   * POST /api/v1/files/upload
   *
   * Accepts a multipart/form-data request:
   *   - field "file"        → encrypted binary buffer (from memory-storage multer)
   *   - field "metadata"    → JSON string with UploadFileDto fields
   *
   * The client MUST have encrypted the file client-side before sending.
   * The backend stores the encrypted bytes directly to OCI.
   */
  uploadFile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next(new AuthenticationError());
      if (!req.file) return next(new ValidationError("No file received. Send the encrypted file as field 'file'."));

      // Metadata arrives either as req.body fields (when sent as multipart text parts)
      // or as a JSON "metadata" field — support both patterns.
      let body = req.body as Record<string, unknown>;
      if (typeof body.metadata === "string") {
        try {
          body = JSON.parse(body.metadata) as Record<string, unknown>;
        } catch {
          return next(new ValidationError("'metadata' field must be valid JSON"));
        }
      }

      const category = (body.category ?? "client-document") as FileCategory;
      const requestedSensitivity = body.sensitivity as FileSensitivity | undefined;

      const dto: UploadFileDto = {
        fileName:    String(body.fileName   ?? ""),
        mimeType:    String(body.mimeType   ?? ""),
        fileSize:    req.file.size,
        category,
        sensitivity: resolveEnforcedSensitivity(category, requestedSensitivity),
        ownerId:     String(body.ownerId    ?? req.user.id),
        ownerType:   (body.ownerType  ?? "USER")            as FileOwnerType,
        bookingId:   body.bookingId ? String(body.bookingId) : undefined,
      };

      const stored = await FileStorageService.uploadFile(
        dto,
        req.file.buffer,
        req.user.id,
        req.ip,
        req.get("user-agent"),
        getRequester(req.user)
      );

      sendCreated(res, stored, "File uploaded successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/files/:fileId/stream
   *
   * Decrypts and streams the file directly to the authorized user.
   */
  streamFile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next(new AuthenticationError());

      const { fileId } = req.params;

      const { plaintext, mimeType, fileName } = await FileStorageService.streamDocument(
        String(fileId),
        getRequester(req.user),
        req.ip,
        req.get("user-agent")
      );

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      res.send(plaintext);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/files
   *
   * List files owned by the authenticated user.
   */
  listFiles: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next(new AuthenticationError());

      const query = req.validatedQuery as {
        page:         number;
        limit:        number;
        ownerType?:   FileOwnerType;
        sensitivity?: FileSensitivity;
      };

      const ownerId   = req.user.expertProfileId ?? req.user.id;
      const ownerType = query.ownerType ?? (req.user.expertProfileId ? "EXPERT" : "USER");

      const result = await FileStorageService.listOwnedFiles(
        ownerId,
        ownerType,
        query.page,
        query.limit,
        { sensitivity: query.sensitivity }
      );

      sendPaginated(
        res,
        result.files,
        {
          page:       result.page,
          limit:      result.limit,
          total:      result.total,
          totalPages: result.totalPages,
          hasNext:    result.hasNext,
          hasPrev:    result.hasPrev,
        },
        "Files retrieved"
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/files/by-booking/:bookingId
   *
   * List documents attached to a booking/case (participants + ADMIN only).
   */
  listBookingDocuments: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next(new AuthenticationError());

      const { bookingId } = req.params;
      if (!bookingId || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(bookingId))) {
        return next(new ValidationError("Invalid bookingId — must be a valid UUID"));
      }

      const query = req.validatedQuery as { page: number; limit: number };

      const result = await FileStorageService.listBookingDocuments(
        String(bookingId),
        getRequester(req.user),
        query.page,
        query.limit
      );

      sendPaginated(
        res,
        result.files,
        {
          page:       result.page,
          limit:      result.limit,
          total:      result.total,
          totalPages: result.totalPages,
          hasNext:    result.hasNext,
          hasPrev:    result.hasPrev,
        },
        "Booking documents retrieved"
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/documents
   *
   * Admin-only, paginated documents listing with role / ownerType / sensitivity
   * / search filters and sorting. RBAC enforced by requireAdmin middleware.
   */
  adminListDocuments: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next(new AuthenticationError());

      const query = req.validatedQuery as {
        page:         number;
        limit:        number;
        role?:        "CLIENT" | "EXPERT";
        ownerType?:   FileOwnerType;
        sensitivity?: FileSensitivity;
        search?:      string;
        sortBy:       "createdAt" | "fileName" | "fileSize";
        order:        "asc" | "desc";
      };

      const result = await FileStorageService.adminListDocuments(query);

      sendPaginated(
        res,
        result.documents,
        {
          page:       result.page,
          limit:      result.limit,
          total:      result.total,
          totalPages: result.totalPages,
          hasNext:    result.hasNext,
          hasPrev:    result.hasPrev,
        },
        "Documents retrieved"
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/documents/stats
   *
   * Platform-wide document metrics (totals, storage, confidentiality, uploader breakdown).
   */
  getAdminDocumentStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next(new AuthenticationError());
      const stats = await FileStorageService.getAdminDocumentStats();
      sendSuccess(res, stats, "Document statistics retrieved");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/documents/dossiers
   *
   * Paginated dossiers grouped by uploader.
   */
  findAdminDossiers: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next(new AuthenticationError());

      const query = req.validatedQuery as {
        page:         number;
        limit:        number;
        role?:        "CLIENT" | "EXPERT";
        sensitivity?: FileSensitivity;
        search?:      string;
      };

      const result = await FileStorageService.findAdminDossiers(query);

      sendPaginated(
        res,
        result.dossiers,
        {
          page:       result.page,
          limit:      result.limit,
          total:      result.total,
          totalPages: result.totalPages,
          hasNext:    result.hasNext,
          hasPrev:    result.hasPrev,
        },
        "Dossiers retrieved"
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/files/:fileId
   *
   * Get metadata for a single file (no binary content).
   */
  getFileMetadata: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next(new AuthenticationError());

      const metadata = await FileStorageService.getFileMetadata(
        String(req.params.fileId),
        getRequester(req.user)
      );

      sendSuccess(res, metadata, "File metadata retrieved");
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/files/:fileId
   *
   * Permanently deletes from OCI and soft-deletes the metadata record.
   * Only the file owner or ADMIN may delete.
   */
  deleteFile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next(new AuthenticationError());

      await FileStorageService.deleteFile(
        String(req.params.fileId),
        getRequester(req.user),
        req.ip,
        req.get("user-agent")
      );

      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/files/:fileId/share
   *
   * Grant read access on a document to another user.
   * Only the document owner or ADMIN may share.
   */
  shareFile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) return next(new AuthenticationError());

      const { sharedWithId, expiresAt } = req.body as {
        sharedWithId: string;
        expiresAt?:   string;
      };

      await FileStorageService.shareFile(
        String(req.params.fileId),
        getRequester(req.user),
        {
          sharedWithId,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
        req.ip,
        req.get("user-agent")
      );

      sendSuccess(res, null, "File shared successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/files/local-download
   *
   * Serves files from the local filesystem during development when OCI is not configured.
   */
  localDownload: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = String(req.query.key ?? "");
      const bucket = String(req.query.bucket ?? "local-dev-bucket");
      if (!key) {
        throw new ValidationError("Missing key query parameter");
      }

      const fs = await import("fs");
      const path = await import("path");

      const filePath = path.join(process.cwd(), "storage", bucket, key);
      if (!fs.existsSync(filePath)) {
        res.status(404).send("File not found in local storage");
        return;
      }

      let mimeType = "application/octet-stream";
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".png") mimeType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      else if (ext === ".webp") mimeType = "image/webp";
      else if (ext === ".gif") mimeType = "image/gif";
      else if (ext === ".svg") mimeType = "image/svg+xml";
      else {
        try {
          const { FileStorageRepository } = await import("../repositories/file-storage.repository.js");
          const doc = await FileStorageRepository.findByObjectKey(key);
          if (doc?.mimeType) mimeType = doc.mimeType;
        } catch {
          // ignore error
        }
      }

      const data = fs.readFileSync(filePath);
      res.setHeader("Content-Type", mimeType);
      res.send(data);
    } catch (error) {
      next(error);
    }
  },
};
