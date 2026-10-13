import type { Request, Response, NextFunction } from "express";
import { VerificationService } from "./verification.service.js";
import { sendSuccess, sendPaginated } from "../../shared/utils/response.js";
import { z } from "zod";
import { ValidationError } from "../../shared/errors/index.js";

const rejectSchema = z.object({
  reason: z.string().min(10, "Rejection reason must be at least 10 characters").max(500),
});

const correctionsSchema = z.object({
  notes: z.string().min(10, "Correction notes must be at least 10 characters").max(1000),
});

export const VerificationController = {
  /** GET /admin-verification/queue */
  listPending: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { records, meta } = await VerificationService.listPending(
        req.query.page,
        req.query.limit,
        req.query.status
      );
      sendPaginated(res, records, meta, "Verification requests retrieved");
    } catch (error) { next(error); }
  },

  /** GET /admin-verification/:id */
  getOne: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await VerificationService.getById(String(req.params.id));
      sendSuccess(res, record, "Verification request retrieved");
    } catch (error) { next(error); }
  },

  /** PATCH /admin-verification/:id/approve */
  approve: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentialsExpiry = req.body?.credentialsExpiry;
      const result = await VerificationService.approve(
        String(req.params.id),
        req.user!.id,
        credentialsExpiry,
        req.ip ?? undefined
      );
      sendSuccess(res, result, "Expert profile approved successfully");
    } catch (error) { next(error); }
  },

  /** PATCH /admin-verification/:id/reject */
  reject: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = rejectSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Validation failed", parsed.error.issues.map(i => i.message));
      }
      const result = await VerificationService.reject(
        String(req.params.id),
        req.user!.id,
        parsed.data.reason,
        req.ip ?? undefined
      );
      sendSuccess(res, result, "Expert profile rejected");
    } catch (error) { next(error); }
  },
  /** POST /admin-verification/:id/remind */
  sendReminder: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await VerificationService.sendReminder(
        String(req.params.id),
        req.user!.id,
        req.ip ?? undefined
      );
      sendSuccess(res, result, "Reminder sent to expert");
    } catch (error) { next(error); }
  },

  /** GET /admin-verification/:id/document-stream?key=<objectKey> */
  streamDocument: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = String(req.query.key ?? "");
      if (!key) throw new ValidationError("Query param 'key' is required");
      const { plaintext, mimeType, fileName } = await VerificationService.streamDocument(
        String(req.params.id),
        key,
        req.user!.id
      );
      
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      res.send(plaintext);
    } catch (error) { next(error); }
  },

  /** POST /admin-verification/:id/request-corrections */
  requestCorrections: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = correctionsSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError("Validation failed", parsed.error.issues.map(i => i.message));
      }
      const result = await VerificationService.requestCorrections(
        String(req.params.id),
        req.user!.id,
        parsed.data.notes,
        req.ip ?? undefined
      );
      sendSuccess(res, result, "Corrections requested from expert");
    } catch (error) { next(error); }
  },
};
