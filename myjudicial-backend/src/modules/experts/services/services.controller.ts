import type { Request, Response, NextFunction } from "express";
import { ServicesService } from "./services.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../../shared/utils/response.js";

export const ServicesController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const records = await ServicesService.getAll(req.user!.id);
      sendSuccess(res, records, "Services retrieved");
    } catch (error) { next(error); }
  },

  getPublic: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const records = await ServicesService.getPublicServices(String(req.params.expertId));
      sendSuccess(res, records, "Expert services retrieved");
    } catch (error) { next(error); }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await ServicesService.create(req.user!.id, req.body);
      sendCreated(res, record, "Service created");
    } catch (error) { next(error); }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await ServicesService.update(req.user!.id, String(req.params.id), req.body);
      sendSuccess(res, record, "Service updated");
    } catch (error) { next(error); }
  },

  reorder: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceIds } = req.body as { serviceIds: string[] };
      await ServicesService.reorder(req.user!.id, serviceIds);
      sendSuccess(res, null, "Services reordered");
    } catch (error) { next(error); }
  },

  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await ServicesService.delete(req.user!.id, String(req.params.id));
      sendNoContent(res);
    } catch (error) { next(error); }
  },
};
