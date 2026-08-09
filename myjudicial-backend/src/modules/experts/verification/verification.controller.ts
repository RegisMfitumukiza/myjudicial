import type { Request, Response, NextFunction } from "express";
import { VerificationService } from "./verification.service.js";
import { sendCreated } from "../../../shared/utils/response.js";
import type { SubmitVerificationDto } from "./verification.schemas.js";

export const VerificationController = {
  /** POST /experts/verification/submit */
  submit: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as SubmitVerificationDto;
      const files = (req.files as Express.Multer.File[]) || [];
      
      const verification = await VerificationService.submitVerification(
        req.user!.id,
        dto,
        files,
        req.ip ?? undefined
      );
      
      sendCreated(res, verification, "Verification submitted successfully. Your profile is now under review.");
    } catch (error) { next(error); }
  },
};
