import type { Request, Response, NextFunction } from "express";
import { EducationService } from "./education.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../../shared/utils/response.js";

export const EducationController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const records = await EducationService.getAll(req.user!.id);
      sendSuccess(res, records, "Education records retrieved");
    } catch (error) { next(error); }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await EducationService.create(req.user!.id, req.body);
      sendCreated(res, record, "Education record added");
    } catch (error) { next(error); }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await EducationService.update(req.user!.id, String(req.params.id), req.body);
      sendSuccess(res, record, "Education record updated");
    } catch (error) { next(error); }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await EducationService.delete(req.user!.id, String(req.params.id));
      sendNoContent(res);
    } catch (error) { next(error); }
  },
};
