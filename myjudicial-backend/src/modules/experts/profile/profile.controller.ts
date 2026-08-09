import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import type { Request, Response, NextFunction } from "express";
import { ProfileService } from "./profile.service.js";
import { sendSuccess, sendCreated } from "../../../shared/utils/response.js";
import type { CreateProfileDto, UpdateProfileDto } from "./profile.schemas.js";


export const ProfileController = {
  /** POST /experts/profile */
  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as CreateProfileDto;
      const profile = await ProfileService.createProfile(req.user!.id, dto, req.ip ?? undefined);
      sendCreated(res, profile, "Expert profile created. It is now under review.");
    } catch (error) { next(error); }
  },

  /** GET /experts/profile/me */
  getMe: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await ProfileService.getMyProfile(req.user!.id);
      
      if (!profile) {
        // Return 200 OK with null data for users who haven't created a profile yet.
        // This avoids a 404 error on the frontend and terminal logs.
        res.status(200).json({ success: true, message: getErrorMessage('EXPERT_NOT_FOUND'), data: null });
        return;
      }
      
      const statusMessage = ProfileService.getStatusMessage(profile.status);
      sendSuccess(res, { ...profile, statusMessage }, "Expert profile retrieved");
    } catch (error) { next(error); }
  },

  /** GET /experts/:id/profile */
  getPublic: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await ProfileService.getPublicProfile(String(req.params.id));
      sendSuccess(res, profile, "Expert profile retrieved");
    } catch (error) { next(error); }
  },

  /** PATCH /experts/profile/me */
  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as UpdateProfileDto;
      const profile = await ProfileService.updateProfile(req.user!.id, dto, req.ip ?? undefined);
      sendSuccess(res, profile, "Expert profile updated");
    } catch (error) { next(error); }
  },
};
