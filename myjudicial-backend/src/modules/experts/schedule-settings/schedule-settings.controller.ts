import type { Request, Response, NextFunction } from "express";
import { ScheduleSettingsService } from "./schedule-settings.service.js";
import { sendSuccess } from "../../../shared/utils/response.js";

export const ScheduleSettingsController = {
  get: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await ScheduleSettingsService.getSettings(req.user!.id);
      sendSuccess(res, settings, "Schedule settings retrieved");
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await ScheduleSettingsService.updateSettings(req.user!.id, req.body);
      sendSuccess(res, settings, "Schedule settings updated");
    } catch (error) {
      next(error);
    }
  },
};
