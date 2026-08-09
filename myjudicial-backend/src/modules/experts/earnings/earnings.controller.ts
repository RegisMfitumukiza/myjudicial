import type { Request, Response, NextFunction } from "express";
import { EarningsService } from "./earnings.service.js";
import { sendSuccess } from "../../../shared/utils/response.js";

export const EarningsController = {
  getEarnings: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await EarningsService.getEarnings(req.user!.id);
      sendSuccess(res, data, "Earnings retrieved");
    } catch (error) { next(error); }
  },
};
