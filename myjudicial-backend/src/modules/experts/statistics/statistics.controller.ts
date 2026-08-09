import type { Request, Response, NextFunction } from "express";
import { StatisticsService } from "./statistics.service.js";
import { sendSuccess } from "../../../shared/utils/response.js";

export const StatisticsController = {
  getMyStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await StatisticsService.getStatistics(req.user!.id);
      sendSuccess(res, data, "Statistics retrieved");
    } catch (error) { next(error); }
  },

  getPublicStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await StatisticsService.getPublicStatistics(String(req.params.expertId));
      sendSuccess(res, data, "Expert statistics retrieved");
    } catch (error) { next(error); }
  },
};
