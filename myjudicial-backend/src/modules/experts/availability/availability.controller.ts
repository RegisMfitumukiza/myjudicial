import type { Request, Response, NextFunction } from "express";
import { AvailabilityService } from "./availability.service.js";
import { sendSuccess } from "../../../shared/utils/response.js";

export const AvailabilityController = {
  get: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await AvailabilityService.getAvailability(req.user!.id);
      sendSuccess(res, data, "Availability retrieved");
    } catch (error) { next(error); }
  },

  upsert: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await AvailabilityService.upsertAvailability(req.user!.id, req.body);
      sendSuccess(res, data, "Availability updated");
    } catch (error) { next(error); }
  },

  /**
   * Phase 4: Upsert with time blocks support
   */
  upsertWithBlocks: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await AvailabilityService.upsertAvailabilityWithBlocks(req.user!.id, req.body);
      sendSuccess(res, data, "Availability updated with time blocks");
    } catch (error) { next(error); }
  },

  updatePresence: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await AvailabilityService.updatePresence(req.user!.id, req.body);
      sendSuccess(res, data, "Presence status updated");
    } catch (error) { next(error); }
  },
};
