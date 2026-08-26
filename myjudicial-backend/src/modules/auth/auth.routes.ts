import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { SupabaseWebhookController } from "./webhook.controller.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { requireAdmin } from "../../shared/middleware/requireAdmin.js";
import { validate } from "../../shared/middleware/validate.js";
import {
  authLoginLimiter,
  authPublicLimiter,
  otpSendEmailLimiter,
  otpSendIpLimiter,
  otpVerifyLimiter,
} from "../../shared/middleware/rateLimiting.js";
import { avatarUpload } from "../../shared/middleware/upload.js";
import {
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
  onboardingSchema,
  magicLinkSchema,
  refreshSchema,
  loginSchema,
  updateMeSchema,
  changePasswordSchema,
  notificationPreferencesSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schemas.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";

const router = Router();

// POST /auth/register
router.post(
  "/register",
  authPublicLimiter,
  validate(registerSchema),
  asyncHandler(AuthController.register)
);

// POST /auth/otp/send
router.post(
  "/otp/send",
  otpSendEmailLimiter,
  otpSendIpLimiter,
  validate(sendOtpSchema),
  asyncHandler(AuthController.sendOtp)
);

// POST /auth/otp/verify
router.post(
  "/otp/verify",
  otpVerifyLimiter,
  validate(verifyOtpSchema),
  asyncHandler(AuthController.verifyOtp)
);

// POST /auth/onboarding — save intake details after verification [protected]
router.post(
  "/onboarding",
  authenticate,
  validate(onboardingSchema),
  asyncHandler(AuthController.saveOnboarding)
);

// POST /auth/magic-link
router.post(
  "/magic-link",
  otpSendEmailLimiter,
  otpSendIpLimiter,
  validate(magicLinkSchema),
  asyncHandler(AuthController.sendMagicLink)
);

// POST /auth/refresh
router.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(AuthController.refresh)
);

// POST /auth/logout  [protected]
router.post(
  "/logout",
  authenticate,
  asyncHandler(AuthController.logout)
);

// GET /auth/me  [protected]
router.get(
  "/me",
  authenticate,
  asyncHandler(AuthController.me)
);

// PATCH /auth/me  [protected]
router.patch(
  "/me",
  authenticate,
  validate(updateMeSchema),
  asyncHandler(AuthController.updateMe)
);

// PUT /auth/profile/photo  [protected]
router.put(
  "/profile/photo",
  authenticate,
  avatarUpload,
  asyncHandler(AuthController.updatePhoto)
);

// POST /auth/admin/login — email + password, admin only
router.post(
  "/admin/login",
  authLoginLimiter,
  validate(loginSchema),
  asyncHandler(AuthController.adminLogin)
);

// POST /auth/admin/change-password — authenticated user changes own password
router.post(
  "/admin/change-password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(AuthController.changePassword)
);

// Webhook endpoints
// POST /auth/webhook/supabase - Handle Supabase Auth events
router.post(
  "/webhook/supabase",
  asyncHandler(SupabaseWebhookController.handleWebhook)
);

// POST /auth/webhook/sync/full - Manual full sync (admin only)
router.post(
  "/webhook/sync/full",
  authenticate,
  requireAdmin,
  asyncHandler(SupabaseWebhookController.triggerFullSync)
);

// GET /auth/sessions  [protected]
router.get(
  "/sessions",
  authenticate,
  asyncHandler(AuthController.listSessions)
);

// DELETE /auth/sessions/:id  [protected]
router.delete(
  "/sessions/:id",
  authenticate,
  asyncHandler(AuthController.revokeSession)
);

// GET /auth/me/notification-preferences  [protected]
router.get(
  "/me/notification-preferences",
  authenticate,
  asyncHandler(AuthController.getNotificationPreferences)
);

// PUT /auth/me/notification-preferences  [protected]
router.put(
  "/me/notification-preferences",
  authenticate,
  validate(notificationPreferencesSchema),
  asyncHandler(AuthController.updateNotificationPreferences)
);

// POST /auth/forgot-password — sends reset email (or returns token in dev)
router.post(
  "/forgot-password",
  otpSendEmailLimiter,
  otpSendIpLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(AuthController.forgotPassword)
);

// POST /auth/reset-password — resets password using token
router.post(
  "/reset-password",
  authPublicLimiter,
  validate(resetPasswordSchema),
  asyncHandler(AuthController.resetPassword)
);

export default router;
