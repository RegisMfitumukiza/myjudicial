import type { Request, Response, NextFunction } from "express";
import { CertificationsService } from "./certifications.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../../shared/utils/response.js";

export const CertificationsController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const records = await CertificationsService.getAll(req.user!.id);
      sendSuccess(res, records, "Certifications retrieved");
    } catch (error) { next(error); }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await CertificationsService.create(req.user!.id, req.body);
      sendCreated(res, record, "Certification added");
    } catch (error) { next(error); }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await CertificationsService.update(req.user!.id, String(req.params.id), req.body);
      sendSuccess(res, record, "Certification updated");
    } catch (error) { next(error); }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await CertificationsService.delete(req.user!.id, String(req.params.id));
      sendNoContent(res);
    } catch (error) { next(error); }
  },
};
