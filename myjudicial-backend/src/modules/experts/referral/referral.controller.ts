import type { Request, Response, NextFunction } from "express";
import { ReferralService } from "./referral.service.js";
import { sendSuccess } from "../../../shared/utils/response.js";

export const ReferralController = {
  async getReferral(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReferralService.getOrCreate(req.user!.id);
      sendSuccess(res, data, "Referral link retrieved");
    } catch (error) {
      next(error);
    }
  },

  async regenerateReferral(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReferralService.regenerate(req.user!.id);
      sendSuccess(res, data, "Referral code regenerated");
    } catch (error) {
      next(error);
    }
  },
};
