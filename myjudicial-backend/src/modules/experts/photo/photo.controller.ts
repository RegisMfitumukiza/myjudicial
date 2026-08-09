import { type Request, type Response, type NextFunction } from "express";
import { PhotoService } from "./photo.service.js";
import { sendSuccess } from "../../../shared/utils/response.js";

export const PhotoController = {
  /**
   * Upload expert profile photo
   * POST /experts/photo/profile
   */
  async uploadProfilePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const file = req.file;
      
      if (!file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
        return;
      }

      const result = await PhotoService.uploadProfilePhoto(userId, file);
      
      sendSuccess(res, result, "Profile photo uploaded successfully", 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove expert profile photo
   * DELETE /experts/photo/profile
   */
  async removeProfilePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      
      await PhotoService.removeProfilePhoto(userId);
      
      sendSuccess(res, null, "Profile photo removed successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get profile photo download URL
   * GET /experts/photo/profile/url
   */
  async getProfilePhotoUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const result = await PhotoService.getProfilePhotoUrl(userId);
      
      sendSuccess(res, result, "Profile photo URL generated");
    } catch (error) {
      next(error);
    }
  }
};