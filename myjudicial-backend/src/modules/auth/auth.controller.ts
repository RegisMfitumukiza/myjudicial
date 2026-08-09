import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { sendSuccess, sendCreated, sendNoContent } from "../../shared/utils/response.js";
import type {
  RegisterDto,
  SendOtpDto,
  VerifyOtpDto,
  MagicLinkDto,
  RefreshDto,
  LoginDto,
  UpdateMeDto,
  ChangePasswordDto,
  NotificationPreferencesDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./auth.schemas.js";

/**
 * AuthController — thin layer that receives HTTP requests,
 * delegates to AuthService, and sends responses.
 * No business logic lives here.
 */
export const AuthController = {
  /**
   * POST /auth/register
   */
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as RegisterDto;
      const user = await AuthService.register(dto, req.ip ?? undefined);
      sendCreated(res, user, "Account created successfully. Check your email to verify.");
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/otp/send
   */
  sendOtp: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as SendOtpDto;
      const result = await AuthService.sendOtp(dto);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/otp/verify
   */
  verifyOtp: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as VerifyOtpDto;
      const session = await AuthService.verifyOtp(dto, req.ip ?? undefined);
      sendSuccess(res, session, "Login successful");
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/magic-link
   */
  sendMagicLink: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as MagicLinkDto;
      const result = await AuthService.sendMagicLink(dto);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/refresh
   */
  refresh: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as RefreshDto;
      const tokens = await AuthService.refreshTokens(refreshToken);
      sendSuccess(res, tokens, "Tokens refreshed");
    } catch (error) {
      next(error);
    }
  },

  /** POST /auth/logout */
  logout: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(" ")[1] ?? "";
      const result = await AuthService.logout(token, req.user?.id, req.ip ?? undefined);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /auth/me
   */
  me: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await AuthService.getMe(req.user!);
      sendSuccess(res, user, "Authenticated user");
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /auth/me
   */
  updateMe: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as UpdateMeDto;
      const user = await AuthService.updateUser(req.user!.id, dto, req.ip ?? undefined);
      sendSuccess(res, user, "Account updated");
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /auth/profile/photo
   */
  updatePhoto: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: "No photo file provided" });
        return;
      }
      const result = await AuthService.updateAvatar(
        req.user!.id,
        req.file,
        req.ip ?? undefined
      );
      sendSuccess(res, result, "Profile photo updated");
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /auth/admin/login — email + password for admin only
   */
  adminLogin: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as LoginDto;
      const session = await AuthService.adminLogin(dto, req.ip ?? undefined);
      sendSuccess(res, session, "Admin login successful");
    } catch (error) {
      next(error);
    }
  },

  /** GET /auth/sessions */
  listSessions: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(" ")[1] ?? "";
      const sessions = await AuthService.listSessions(req.user!.id, token);
      sendSuccess(res, sessions, "Sessions retrieved");
    } catch (error) {
      next(error);
    }
  },

  /** DELETE /auth/sessions/:id */
  revokeSession: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await AuthService.revokeSession(req.params.id as string);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },

  /** GET /auth/me/notification-preferences */
  getNotificationPreferences: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prefs = await AuthService.getNotificationPreferences(req.user!.id);
      sendSuccess(res, prefs, "Notification preferences retrieved");
    } catch (error) {
      next(error);
    }
  },

  /** PUT /auth/me/notification-preferences */
  updateNotificationPreferences: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as NotificationPreferencesDto;
      const prefs = await AuthService.updateNotificationPreferences(req.user!.id, dto);
      sendSuccess(res, prefs, "Notification preferences updated");
    } catch (error) {
      next(error);
    }
  },

  /** POST /auth/admin/change-password */
  changePassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as ChangePasswordDto;
      const token = req.headers.authorization?.split(" ")[1] ?? "";
      const result = await AuthService.changePassword(req.user!.id, dto, token, req.ip ?? undefined);
      sendSuccess(res, result, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  },

  /** POST /auth/forgot-password */
  forgotPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as ForgotPasswordDto;
      const result = await AuthService.forgotPassword(dto);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  },

  /** POST /auth/reset-password */
  resetPassword: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as ResetPasswordDto;
      const result = await AuthService.resetPassword(dto);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  },
};
