import type { Request, Response, NextFunction } from "express";
import { OnboardingService } from "./onboarding.service.js";
import { sendSuccess } from "../../../shared/utils/response.js";

export const OnboardingController = {
  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OnboardingService.getProgress(req.user!.id);
      sendSuccess(res, data, "Onboarding progress retrieved");
    } catch (error) {
      next(error);
    }
  },

  async completeStep(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OnboardingService.completeStep(req.user!.id, req.body);
      sendSuccess(res, data, "Onboarding step completed");
    } catch (error) {
      next(error);
    }
  },

  async skipStep(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OnboardingService.skipStep(req.user!.id, req.body);
      sendSuccess(res, data, "Onboarding step skipped");
    } catch (error) {
      next(error);
    }
  },

  async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OnboardingService.updateProgress(req.user!.id, req.body);
      sendSuccess(res, data, "Onboarding progress updated");
    } catch (error) {
      next(error);
    }
  },

  async resetOnboarding(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await OnboardingService.getProgress(req.user!.id);
      sendSuccess(res, data, "Onboarding reset successful");
    } catch (error) {
      next(error);
    }
  }
};
