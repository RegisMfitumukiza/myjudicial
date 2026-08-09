import type { Request, Response, NextFunction } from "express";
import { ComplianceService } from "./compliance.service.js";
import { sendSuccess } from "../../../shared/utils/response.js";
import { z } from "zod";
import { ValidationError } from "../../../shared/errors/index.js";

const updateExpirySchema = z.object({
  credentialsExpiry: z.string().date("Must be a valid date (YYYY-MM-DD)"),
});

export const ComplianceController = {
  /** GET /experts/compliance */
  getStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await ComplianceService.getStatus(req.user!.id);
      sendSuccess(res, data, "Compliance status retrieved");
    } catch (error) { next(error); }
  },

  /** PATCH /experts/compliance/credentials-expiry */
  updateExpiry: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = updateExpirySchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError("Validation failed", result.error.issues.map(i => i.message));
      }
      const data = await ComplianceService.updateExpiry(
        req.user!.id,
        result.data.credentialsExpiry
      );
      sendSuccess(res, data, "Credentials expiry updated");
    } catch (error) { next(error); }
  },
};
