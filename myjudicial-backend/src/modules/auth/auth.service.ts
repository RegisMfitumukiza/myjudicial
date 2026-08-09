import { getErrorMessage } from "../../shared/utils/i18n-messages.js";
import crypto from "crypto";
import { supabaseAdmin } from "../../infrastructure/supabase/supabase.client.js";
import { supabaseAnon } from "../../infrastructure/supabase/supabase.anon.client.js";
import { createClient } from "@supabase/supabase-js";
import { SupabaseSyncService } from "../../infrastructure/supabase/sync.service.js";
import { CustomOtpService } from "./custom-otp.service.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { redisSet, redisGet, redisDel } from "../../infrastructure/redis/redis.client.js";
import { revokeTokenAndClearCache, clearUserCache } from "../../shared/utils/cache-cleanup.js";
import { AuthRepository } from "./auth.repository.js";
import { writeAuditLog } from "../../shared/utils/audit.js";
import { sendWelcomeEmail } from "../../infrastructure/email/email.service.js";
import {
  uploadObject,
  getSignedDownloadUrl,
  getDefaultBucketName,
} from "../../infrastructure/storage/oci-object-storage.service.js";
import { logger } from "../../shared/utils/logger.js";
import { AdminSettingService } from "../settings/admin-setting.service.js";
import {
  ConflictError,
  AuthenticationError,
  ServiceUnavailableError,
} from "../../shared/errors/index.js";
import type {

  RegisterDto,
  SendOtpDto,
  VerifyOtpDto,
  MagicLinkDto,
  LoginDto,
  ChangePasswordDto,
  NotificationPreferencesDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./auth.schemas.js";

// Token revocation TTL — matches Supabase refresh token expiry (7 days default)
const REVOCATION_TTL = 7 * 24 * 60 * 60;
const REVOCATION_PREFIX = "revoked:";

function generateStrongPassword(): string {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specials = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~";
  const getRandom = (chars: string) => chars[crypto.randomInt(chars.length)];
  return `${getRandom(lower)}${getRandom(upper)}${getRandom(digits)}${getRandom(specials)}${crypto.randomUUID().replace(/-/g, "")}`;
}

/**
 * AuthService — contains all authentication business logic.
 * Coordinates Supabase Auth, PostgreSQL (via AuthRepository), and Redis.
 */
export const AuthService = {
  /**
   * Register a new user.
   * 1. Check for conflicts in both systems (Supabase Auth and PostgreSQL)
   * 2. Create or reuse Supabase Auth identity (passwordless — magic link / OTP based)
   * 3. Create matching PostgreSQL user record with the same UUID via sync service
   * 4. Write audit log
   */
  register: async (dto: RegisterDto, ipAddress?: string) => {
    if (!dto.role) {
      dto.role = await AdminSettingService.get("defaultRole");
    }
    // Check for existing user in PostgreSQL first
    const existingPgUser = await AuthRepository.findByEmail(dto.email);
    
    // Check if Supabase Auth already has this email
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = listData?.users?.find((u) => u.email === dto.email);

    // Handle different conflict scenarios
    if (existingPgUser && existingAuthUser) {
      // Both systems have the user - this is a normal conflict
      throw new ConflictError(getErrorMessage('VALIDATION_ERROR'));
    }

    if (existingPgUser && !existingAuthUser) {
      // PostgreSQL has user but Supabase doesn't - data inconsistency
      logger.warn("User exists in PostgreSQL but not in Supabase Auth - cleaning up", {
        email: dto.email,
        userId: existingPgUser.id
      });
      
      // Clean up orphaned PostgreSQL record
      await AuthRepository.deleteUser(existingPgUser.id);
    }

    if (!existingPgUser && existingAuthUser) {
      // Supabase has user but PostgreSQL doesn't - sync them
      logger.info("User exists in Supabase Auth but not PostgreSQL - syncing", {
        email: dto.email,
        userId: existingAuthUser.id
      });
      
      // Use sync service to create PostgreSQL record
      await SupabaseSyncService.syncFromSupabaseAuth(
        existingAuthUser.id,
        existingAuthUser.email || dto.email,
        {
          full_name: dto.fullName,
          role: dto.role,
          phone: dto.phone,
        }
      );
      
      // Return the synced user
      const user = await AuthRepository.findById(existingAuthUser.id);
      if (!user) {
        throw new ServiceUnavailableError(getErrorMessage('SERVER_ERROR'));
      }

      await writeAuditLog({
        actorId: user.id,
        action: "CREATE",
        resource: "USER",
        resourceId: user.id,
        description: `${dto.role} account synced from Supabase Auth`,
        ipAddress,
      });

      return user;
    }

    // No conflicts - create new user in both systems
    const [firstName, ...rest] = dto.fullName.trim().split(" ");
    const lastName = rest.join(" ") || firstName;

    // Create new Supabase Auth user
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: dto.email,
      email_confirm: true,
      user_metadata: {
        full_name: dto.fullName,
        role: dto.role,
        first_name: firstName,
        last_name: lastName,
        phone: dto.phone,
      },
    });

    if (error || !data.user) {
      logger.error("Supabase Admin createUser failed", { error });
      throw new ServiceUnavailableError(`Authentication service: ${error?.message || "unknown error"}`);
    }

    // Create PostgreSQL record via sync service
    const user = await SupabaseSyncService.syncFromSupabaseAuth(
      data.user.id,
      data.user.email || dto.email,
      {
        full_name: dto.fullName,
        role: dto.role,
        first_name: firstName,
        last_name: lastName,
        phone: dto.phone,
      }
    );

    await writeAuditLog({
      actorId: user.id,
      action: "CREATE",
      resource: "USER",
      resourceId: user.id,
      description: `New ${dto.role} account registered`,
      ipAddress,
    });

    // Note: Welcome email will be sent after email verification
    // This prevents double emails and confusion

    return user;
  },

  /**
   * Send an email OTP via custom OTP system.
   * Uses Redis for storage and Brevo for email delivery.
   * Provides full control over OTP expiry (900 seconds = 15 minutes).
   * Does not reveal whether the email is registered (enumeration prevention).
   */
  sendOtp: async (dto: SendOtpDto) => {
    const sendTime = new Date();
    
    // Check if user exists in our database (but don't reveal it in the response)
    const user = await AuthRepository.findByEmail(dto.email);
    
    if (user) {
      // User exists - send actual OTP
      const otp = await CustomOtpService.generate(dto.email);
      const userLanguage = user.preferredLanguage || 'en';
      await CustomOtpService.sendOtpEmail(dto.email, otp, user.firstName, userLanguage as 'en' | 'fr' | 'rw');
      
      logger.info("Custom OTP generated and sent", {
        email: dto.email,
        language: userLanguage,
        sentAt: sendTime.toISOString(),
        expiresAt: new Date(sendTime.getTime() + 900000).toISOString(), // 15 minutes
      });
    } else {
      // User doesn't exist - don't send OTP (but don't reveal this)
      logger.info("OTP requested for non-existent email", {
        email: dto.email,
      });
    }

    // Always return success - never reveal if email is registered
    return { message: "If this email is registered, a login code has been sent" };
  },

  /**
   * Send a magic login link.
   * Uses the anon client so Supabase actually delivers the email through Brevo.
   */
  sendMagicLink: async (dto: MagicLinkDto) => {
    const { error } = await supabaseAnon.auth.signInWithOtp({
      email: dto.email,
      options: {
        shouldCreateUser: false,
        // Redirect to the frontend app after the magic link is clicked
        emailRedirectTo: process.env.FRONTEND_URL ?? "http://localhost:3000",
      },
    });

    if (error) {
      if (error.status === 422 || error.code === "otp_disabled") {
        logger.info("Magic link sign-in attempted for unregistered email", { email: dto.email });
      } else {
        logger.error("Failed to send magic link via Supabase", { error, email: dto.email });
        throw new ServiceUnavailableError("Authentication service failed to send magic link");
      }
    }

    return { message: "If this email is registered, a magic link has been sent" };
  },

  /**
   * Verify OTP token submitted by the user.
   * Uses custom OTP verification, then creates a Supabase session.
   * Returns the Supabase session (access_token + refresh_token).
   */
  verifyOtp: async (dto: VerifyOtpDto, ipAddress?: string) => {
    const verifyTime = new Date();
    
    logger.info("OTP verification attempt (custom)", {
      email: dto.email,
      attemptAt: verifyTime.toISOString(),
    });
    
    // Early validation: check OTP value without consuming it
    const otpExists = await CustomOtpService.exists(dto.email);
    if (!otpExists) {
      logger.warn("Custom OTP not found or expired", { email: dto.email });
      throw new AuthenticationError(getErrorMessage('OTP_INVALID'));
    }
    
    // Check remaining attempts before validating value
    const remainingAttempts = await CustomOtpService.getRemainingAttempts(dto.email);
    if (remainingAttempts <= 0) {
      logger.warn("Max OTP verification attempts exceeded", { email: dto.email });
      throw new AuthenticationError(getErrorMessage('OTP_ATTEMPTS_EXCEEDED'));
    }
    
    const otpValid = await CustomOtpService.checkOtp(dto.email, dto.token);
    if (!otpValid) {
      await CustomOtpService.recordAttempt(dto.email);
      const updatedRemaining = await CustomOtpService.getRemainingAttempts(dto.email);
      
      logger.warn("Custom OTP verification failed", {
        email: dto.email,
        attemptAt: verifyTime.toISOString(),
        remainingAttempts: updatedRemaining,
      });
      
      throw new AuthenticationError(getErrorMessage('OTP_INVALID'));
    }
    
    // Get user from database
    const dbUser = await AuthRepository.findByEmail(dto.email);
    if (!dbUser) {
      throw new AuthenticationError("Account not found. Please register first.");
    }
    
    // Generate a one-time password and use it to create a Supabase session
    // This is more reliable than generateLink + verifyOtp for custom OTP flows
    const otp = generateStrongPassword();
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(dbUser.id, {
      password: otp,
    });
    
    if (updateError) {
      logger.error("Failed to set temporary password", {
        email: dto.email,
        error: updateError.message,
      });
      throw new ServiceUnavailableError(getErrorMessage('SERVER_ERROR'));
    }
    
    // Sign in with the one-time password
    const { data: sessionData, error: sessionError } = await supabaseAnon.auth.signInWithPassword({
      email: dto.email,
      password: otp,
    });
    
    if (sessionError || !sessionData?.session) {
      logger.error("Failed to create session with temporary password", {
        email: dto.email,
        error: sessionError?.message,
      });
      throw new ServiceUnavailableError(getErrorMessage('SERVER_ERROR'));
    }
    
    // Session created successfully — now consume the OTP (one-time use)
    await CustomOtpService.verify(dto.email, dto.token);
    
    logger.info("Custom OTP verification successful", {
      email: dto.email,
      verifiedAt: verifyTime.toISOString(),
    });
    
    const session = sessionData.session;

    // Run slow side effects in the background so they don't block the login response
    Promise.resolve().then(async () => {
      try {
        // Check if this is the user's first login (welcome email)
        const fullUser = await prisma.user.findUnique({
          where: { id: dbUser.id },
          select: { lastLoginAt: true }
        });
        const isFirstLogin = !fullUser?.lastLoginAt;

        await AuthRepository.recordLogin(dbUser.id);

        await writeAuditLog({
          actorId: dbUser.id,
          action: "LOGIN",
          resource: "USER",
          resourceId: dbUser.id,
          description: "OTP login (custom)",
          ipAddress,
        });

        // Send welcome email on first successful login (after email verification)
        if (isFirstLogin) {
          const userLanguage = (dbUser.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
          await sendWelcomeEmail(dbUser.email, dbUser.firstName, dbUser.role, userLanguage);
        }
      } catch (err) {
        logger.error("Error during post-login background tasks", { error: err });
      }
    });

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        phone: dbUser.phone,
        role: dbUser.role,
      },
    };
  },

  /**
   * Refresh the access token using Supabase refresh token.
   */
  refreshTokens: async (refreshToken: string) => {
    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      throw new AuthenticationError(getErrorMessage('TOKEN_EXPIRED'));
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    };
  },

  /**
   * Logout — revoke the access token in Redis and sign out from Supabase.
   * Also clears all cached user data to prevent stale data on account switching.
   */
  logout: async (accessToken: string, userId?: string, ipAddress?: string) => {
    // Revoke access token and clear its specific cache entry
    if (userId) {
      await revokeTokenAndClearCache(userId, accessToken, REVOCATION_TTL);
      
      // Also clear any other cached entries for this user to ensure clean state
      await clearUserCache(userId);
      
      // Invalidate all Supabase sessions for this user
      await supabaseAdmin.auth.admin.signOut(userId);

      await writeAuditLog({
        actorId: userId,
        action: "LOGOUT",
        resource: "USER",
        resourceId: userId,
        description: "User logged out - all cache cleared",
        ipAddress,
      });
      
      logger.info("User logged out successfully", {
        userId,
        ipAddress,
        tokenPrefix: accessToken.substring(0, 10) + "..."
      });
    } else {
      // Fallback if userId is not available
      await redisSet(
        `${REVOCATION_PREFIX}${accessToken}`,
        "1",
        REVOCATION_TTL
      );
      
      logger.warn("User logged out without userId", {
        tokenPrefix: accessToken.substring(0, 10) + "..."
      });
    }

    return { message: "Logged out successfully" };
  },

  /**
   * Admin email + password login.
   * Only accessible to users with ADMIN role.
   * Admins are created via seed — they set their password in Supabase dashboard.
   */
  adminLogin: async (dto: LoginDto, ipAddress?: string) => {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session || !data.user) {
      throw new AuthenticationError(getErrorMessage('INVALID_CREDENTIALS'));
    }

    // Verify the user is actually an admin in our database
    const dbUser = await AuthRepository.findById(data.user.id);
    if (!dbUser) {
      throw new AuthenticationError(getErrorMessage('INVALID_CREDENTIALS'));
    }
    if (dbUser.role !== "ADMIN") {
      throw new AuthenticationError(getErrorMessage('INVALID_CREDENTIALS'));
    }

    await AuthRepository.recordLogin(data.user.id);

    await writeAuditLog({
      actorId: data.user.id,
      action: "LOGIN",
      resource: "USER",
      resourceId: data.user.id,
      description: "Admin login",
      ipAddress,
    });

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        phone: dbUser.phone,
        role: dbUser.role,
      },
    };
  },

  /**
   * Update user profile information.
   * Syncs changes to both PostgreSQL and Supabase Auth.
   */
  updateUser: async (userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    preferredLanguage?: string;
  }, ipAddress?: string) => {
    // Update PostgreSQL record
    const updatedUser = await AuthRepository.updateUser(userId, data);

    // Sync changes to Supabase Auth
    await SupabaseSyncService.syncToSupabaseAuth(updatedUser);

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "USER", 
      resourceId: userId,
      description: "User profile updated",
      ipAddress,
    });

    return updatedUser;
  },

  /**
   * Enrich the authenticated request user with a fresh signed avatar URL,
   * if they have one uploaded. Called on GET /auth/me only — not on every
   * authenticated request — to avoid an OCI signing call per API call.
   */
  getMe: async (user: { avatarObjectKey: string | null; phone: string | null } & Record<string, unknown>) => {
    if (!user.avatarObjectKey) {
      return { ...user, avatarUrl: null };
    }
    const { url: avatarUrl } = await getSignedDownloadUrl(user.avatarObjectKey);
    return { ...user, avatarUrl };
  },

  /**
   * Upload/replace the authenticated user's profile photo.
   * Stores the image in OCI object storage (same infra as verification
   * documents) and returns a fresh time-limited signed URL for display.
   */
  updateAvatar: async (
    userId: string,
    file: { buffer: Buffer; mimetype: string },
    ipAddress?: string
  ) => {
    const extension = file.mimetype.split("/")[1] ?? "jpg";
    const objectKey = `users/${userId}/avatar/${crypto.randomUUID()}.${extension}`;

    await uploadObject({
      key: objectKey,
      body: file.buffer,
      contentType: file.mimetype,
      bucket: getDefaultBucketName(),
    });

    await AuthRepository.updateAvatarObjectKey(userId, objectKey);

    const { url: avatarUrl } = await getSignedDownloadUrl(objectKey);

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "USER",
      resourceId: userId,
      description: "Profile photo updated",
      ipAddress,
    });

    return { avatarObjectKey: objectKey, avatarUrl };
  },

  /**
   * List all active Supabase sessions for the current user.
   * Calls GoTrue Admin API directly since supabase-js doesn't expose listSessions.
   */
  listSessions: async (userId: string, accessToken?: string) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const url = `${supabaseUrl}/auth/v1/admin/sessions?user_id=${userId}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        logger.warn("Supabase sessions endpoint unavailable", { status: res.status });
        return [];
      }

      const sessions: any[] = await res.json();

      return sessions.map((s: any) => ({
        id: s.id,
        device: s.user_agent || "Unknown device",
        browser: s.user_agent?.split("/")[0] || "",
        ip: s.ip || "",
        lastActive: s.updated_at || s.created_at,
        isCurrent: s.access_token === accessToken,
        createdAt: s.created_at,
      }));
    } catch (error) {
      logger.warn("Failed to fetch sessions from Supabase", { error });
      return [];
    }
  },

  /**
   * Revoke (delete) a specific Supabase session.
   */
  revokeSession: async (sessionId: string) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const url = `${supabaseUrl}/auth/v1/admin/sessions/${sessionId}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(url, {
        signal: controller.signal,
        method: "DELETE",
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        logger.warn("Supabase revoke session failed", { sessionId, status: res.status });
      }
    } catch (error) {
      logger.warn("Failed to revoke session from Supabase", { sessionId, error });
    }
  },

  /**
   * Get notification preferences for the current user.
   * Creates default preferences if none exist.
   */
  getNotificationPreferences: async (userId: string) => {
    return AuthRepository.getNotificationPreferences(userId);
  },

  /**
   * Update notification preferences for the current user.
   */
  updateNotificationPreferences: async (userId: string, dto: NotificationPreferencesDto) => {
    return AuthRepository.updateNotificationPreferences(userId, dto);
  },

  /**
   * POST /auth/admin/change-password
   * Verifies current password via sign-in, then updates password using the
   * request's own access token. This approach does NOT invalidate the
   * current session (unlike admin.updateUserById which kills all sessions).
   */
  changePassword: async (userId: string, dto: ChangePasswordDto, accessToken: string, ipAddress?: string) => {
    const dbUser = await AuthRepository.findById(userId);
    if (!dbUser) {
      throw new AuthenticationError(getErrorMessage('INVALID_CREDENTIALS'));
    }

    // Verify current password
    const { error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: dbUser.email,
      password: dto.currentPassword,
    });
    if (signInError) {
      throw new AuthenticationError(getErrorMessage('INVALID_CREDENTIALS'));
    }

    // Use the request's own access token to update the password.
    // This preserves the current session — the JWT is not invalidated.
    const userClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      }
    );

    const { error: updateError } = await userClient.auth.updateUser({ password: dto.newPassword });
    if (updateError) {
      logger.error("Failed to update password", { userId, error: updateError.message });
      throw new ServiceUnavailableError("Failed to update password");
    }

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "USER",
      resourceId: userId,
      description: "Password changed",
      ipAddress,
    });

    return { message: "Password changed successfully" };
  },

  /**
   * POST /auth/forgot-password
   * Generates a password reset token, stores it in Redis (15-minute TTL),
   * and sends a reset email. In development, returns the token directly.
   */
  forgotPassword: async (dto: ForgotPasswordDto) => {
    const user = await AuthRepository.findByEmail(dto.email);
    if (!user) {
      // Silently succeed to prevent email enumeration
      return { message: "If an account exists with that email, a reset link has been sent." };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const RESET_TOKEN_TTL = 15 * 60; // 15 minutes
    await redisSet(`password-reset:${resetToken}`, user.id, RESET_TOKEN_TTL);

    // In development, return the token for easy testing
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      return {
        message: "Password reset token generated (development mode)",
        devPasswordResetToken: resetToken,
      };
    }

    // TODO: Send reset email via email service
    // await sendPasswordResetEmail(user.email, resetToken);

    return { message: "If an account exists with that email, a reset link has been sent." };
  },

  /**
   * POST /auth/reset-password
   * Verifies the reset token from Redis and updates the user's password
   * via Supabase Admin API.
   */
  resetPassword: async (dto: ResetPasswordDto) => {
    const userId = await redisGet(`password-reset:${dto.token}`);
    if (!userId) {
      throw new AuthenticationError("Invalid or expired reset token");
    }

    // Delete the token so it cannot be reused
    await redisDel(`password-reset:${dto.token}`);

    // Update password via Supabase Admin API
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: dto.password,
    });
    if (error) {
      logger.error("Failed to reset password", { userId, error: error.message });
      throw new ServiceUnavailableError("Failed to reset password");
    }

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "USER",
      resourceId: userId,
      description: "Password reset via forgot-password flow",
    });

    return { message: "Password reset successfully" };
  },
};
