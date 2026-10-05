import { getErrorMessage } from "../../shared/utils/i18n-messages.js";
import crypto from "crypto";
import { supabaseAdmin } from "../../infrastructure/supabase/supabase.client.js";
import { supabaseAnon } from "../../infrastructure/supabase/supabase.anon.client.js";
import { createClient } from "@supabase/supabase-js";
import { SupabaseSyncService } from "../../infrastructure/supabase/sync.service.js";
import { CustomOtpService } from "./custom-otp.service.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { redisSet, redisGet, redisDel } from "../../infrastructure/redis/redis.client.js";
import { revokeTokenAndClearCache, clearUserCache } from "../../shared/utils/cache-cleanup.js";
import { AuthRepository } from "./auth.repository.js";
import { writeAuditLog } from "../../shared/utils/audit.js";
import {
  sendWelcomeEmail,
  sendNewExpertRegistrationEmail,
  sendPasswordResetEmail,
} from "../../infrastructure/email/email.service.js";
import { NotificationRepository } from "../notifications/notification.repository.js";
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
  OnboardingDto,
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
 * Retry a transient-failure-prone async call. Supabase-js does NOT throw on
 * network errors — it returns them via `{ error }` — so the classifier
 * inspects the result and returns true when the attempt failed transiently
 * and should be retried.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isTransientMessage = (msg: string): boolean =>
  /fetch failed|timeout|ECONNRESET|ECONNREFUSED|UND_ERR|socket|network|502|503|504/i.test(msg);

async function retrySupabase<T>(
  fn: () => Promise<T>,
  label: string,
  attempts = 3
): Promise<T> {
  let last!: T;
  for (let i = 1; i <= attempts; i++) {
    last = await fn();
    const errObj = (last as unknown as { error?: { message?: string; status?: number } | null })?.error;
    if (!errObj) return last;
    const msg = `${errObj.message ?? ""} ${errObj.status ?? ""}`;
    if (!isTransientMessage(msg)) return last;
    logger.warn(`Transient supabase failure on ${label} (attempt ${i}/${attempts}) — retrying`, {
      error: errObj.message,
      status: errObj.status,
    });
    if (i < attempts) await sleep(800 * i);
  }
  return last;
}

/**
 * Retry a throwing function for transient network errors.
 */
async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 3): Promise<T> {
  let lastErr!: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!isTransientMessage(msg)) throw err;
      logger.warn(`Transient failure on ${label} (attempt ${i}/${attempts}) — retrying`, { error: msg });
      if (i < attempts) await sleep(800 * i);
    }
  }
  throw lastErr;
}

/**
 * Locate a Supabase Auth user by email with bounded pagination.
 * Only used on the rare "auth identity exists without PG record" path.
 */
async function findAuthUserByEmail(
  email: string,
  maxPages = 10,
  perPage = 200
): Promise<{ id: string; email?: string } | null> {
  for (let page = 1; page <= maxPages; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) {
      logger.error("listUsers failed during email lookup", { error: error.message, page });
      return null;
    }
    const users = data?.users ?? [];
    const match = users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (match) return { id: match.id, email: match.email ?? undefined };
    if (users.length < perPage) break; // last page
  }
  return null;
}

type MinimalAuthUser = NonNullable<Awaited<ReturnType<typeof findAuthUserByEmail>>>;

/**
 * AuthService — contains all authentication business logic.
 * Coordinates Supabase Auth, PostgreSQL (via AuthRepository), and Redis.
 */
export const AuthService = {
  /**
   * Register a new user.
   *
   * Idempotent and enumeration-safe:
   * - New email → account is created in Supabase Auth + PostgreSQL.
   * - Existing email → nothing is created; the caller gets the exact same
   *   response either way. The subsequent /otp/send delivers a login code to
   *   the existing account, so the user proceeds through verification into
   *   their account without ever learning whether the email pre-existed.
   * - Phone already in use → explicit, mapped 409 (this is NOT an
   *   enumeration vector: phone ownership implies prior registration).
   *
   * The frontend always continues to OTP verification after this call.
   */
  register: async (dto: RegisterDto, ipAddress?: string) => {
    if (!dto.role) {
      dto.role = await AdminSettingService.get("defaultRole");
    }

    // Phone uniqueness — fail fast with a friendly, mapped error.
    if (dto.phone) {
      const phoneOwner = await prisma.user.findUnique({
        where: { phone: dto.phone },
        select: { id: true },
      });
      if (phoneOwner) {
        throw new ConflictError(getErrorMessage("PHONE_IN_USE"));
      }
    }

    // Check for existing user in PostgreSQL first
    const existingPgUser = await AuthRepository.findByEmail(dto.email);

    if (existingPgUser && existingPgUser.status === "ACTIVE") {
      // Fully registered already — respond identically, change nothing.
      await writeAuditLog({
        actorId: existingPgUser.id,
        action: "CREATE",
        resource: "USER",
        resourceId: existingPgUser.id,
        description: "Duplicate registration attempt for existing account",
        ipAddress,
      });
      return { message: "Check your email for a verification code." };
    }

    if (existingPgUser) {
      // PENDING account whose Supabase identity is gone (or never completed):
      // stale half-finished signup — remove so a fresh one can be created.
      logger.warn("Removing stale PENDING registration", {
        email: dto.email,
        userId: existingPgUser.id,
      });
      await AuthRepository.deleteUser(existingPgUser.id);
    }

    // No usable account - create new user in both systems
    const [firstName, ...rest] = dto.fullName.trim().split(" ");
    const lastName = rest.join(" ") || firstName;

    // Create new Supabase Auth user (retried — transient network failures
    // between the container and Supabase are observed in production)
    const { data, error } = await retrySupabase(
      () => supabaseAdmin.auth.admin.createUser({
        email: dto.email,
        email_confirm: true,
        user_metadata: {
          full_name: dto.fullName,
          role: dto.role,
          first_name: firstName,
          last_name: lastName,
          phone: dto.phone,
        },
      }),
      "supabase createUser"
    );

    let supabaseUser: { id: string; email?: string } | null = data?.user ?? null;

    if (!supabaseUser) {
      const err = error as unknown as { code?: number | string; status?: number; message?: string } | null;
      const alreadyRegistered =
        !!err &&
        (String(err.code) === "422" || err.status === 422 || /already|exists/i.test(err.message ?? ""));

      if (!alreadyRegistered) {
        logger.error("Supabase Admin createUser failed", { error });
        throw new ServiceUnavailableError(`Authentication service: ${error?.message || "unknown error"}`);
      }

      // Auth identity exists without a usable PG record — locate it (paginated,
      // bounded) and mirror it into PostgreSQL below.
      logger.info("Supabase Auth identity already exists — locating for sync", { email: dto.email });
      supabaseUser = await findAuthUserByEmail(dto.email);
      if (!supabaseUser) {
        throw new ServiceUnavailableError(getErrorMessage("SERVER_ERROR"));
      }
    }

    try {
      // Create PostgreSQL record via sync service
      await withRetry(
        () =>
          SupabaseSyncService.syncFromSupabaseAuth(
            supabaseUser.id,
            supabaseUser.email || dto.email,
            {
              full_name: dto.fullName,
              role: dto.role,
              first_name: firstName,
              last_name: lastName,
              phone: dto.phone,
            }
          ),
        "syncFromSupabaseAuth"
      );
    } catch (syncError) {
      // Do not leave a half-created auth identity behind: roll the Supabase
      // user back so a retry starts from a clean slate instead of hitting the
      // "exists in Auth but not in PG" sync path forever. Only roll back when
      // WE created the identity just now (never when it pre-existed).
      logger.error("PostgreSQL sync failed after Supabase createUser — rolling back auth identity", {
        email: dto.email,
        userId: supabaseUser.id,
        error: syncError instanceof Error ? syncError.message : syncError,
      });
      if (!data?.user) {
        // pre-existing identity — never delete it; surface as service issue
        throw new ServiceUnavailableError(getErrorMessage("SERVER_ERROR"));
      }
      await supabaseAdmin.auth.admin.deleteUser(supabaseUser.id);
      throw new ServiceUnavailableError(getErrorMessage("SERVER_ERROR"));
    }

    await writeAuditLog({
      actorId: supabaseUser.id,
      action: "CREATE",
      resource: "USER",
      resourceId: supabaseUser.id,
      description: `New ${dto.role} account registered`,
      ipAddress,
    });

    // Notify all admins when a new expert registers
    if (dto.role === "EXPERT") {
      try {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true, email: true, firstName: true, lastName: true, preferredLanguage: true },
        });
        for (const admin of admins) {
          const adminName = `${admin.firstName} ${admin.lastName}`;
          const adminLanguage = (admin.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
          await sendNewExpertRegistrationEmail(admin.email, adminName, dto.fullName, dto.email, adminLanguage).catch((error) => {
            logger.error("Failed to send new expert registration email to admin", { adminId: admin.id, error });
          });
          await NotificationRepository.create({
            userId: admin.id,
            event: "WELCOME" as any,
            recipient: admin.email,
            subject: "New expert registered",
            body: `Expert ${dto.fullName} (${dto.email}) has registered on MyJudicial.`,
          }).catch((error) => {
            logger.error("Failed to write new expert registration notification to admin", { adminId: admin.id, error });
          });
        }
      } catch (error) {
        logger.error("Failed to notify admins about new expert registration", { email: dto.email, error });
      }
    }

    // Note: Welcome email will be sent after email verification
    // This prevents double emails and confusion

    return { message: "Check your email for a verification code." };
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
    
    // Admin accounts sign in exclusively through the password-based admin login
    // page; never grant them OTP-based access.
    if (user && user.role !== "ADMIN") {
      // User exists - send actual OTP
      const otp = await CustomOtpService.generate(dto.email);
      const userLanguage = (dto.language || user.preferredLanguage || 'en') as 'en' | 'fr' | 'rw';
      const sent = await retrySupabase(
        async () => {
          try {
            await CustomOtpService.sendOtpEmail(dto.email, otp, user.firstName, userLanguage);
            return { error: null };
          } catch (err) {
            return { error: { message: err instanceof Error ? err.message : String(err) } };
          }
        },
        "sendOtpEmail"
      );
      if (sent.error) throw new ServiceUnavailableError(`Email delivery failed: ${sent.error.message}`);
      
      logger.info("Custom OTP generated and sent", {
        email: dto.email,
        language: userLanguage,
        sentAt: sendTime.toISOString(),
        expiresAt: new Date(sendTime.getTime() + 600000).toISOString(), // 10 minutes
      });
    } else {
      // User is unregistered or an admin - don't send OTP (but don't reveal this)
      logger.info("OTP requested for unavailable email", {
        email: dto.email,
        isAdmin: user?.role === "ADMIN",
      });
    }

    // Always return success - never reveal if email is registered.
    // expiresAt reflects the custom OTP TTL so the UI can show a real
    // countdown (10 minutes). Returned unconditionally to avoid enumeration.
    return {
      message: "If this email is registered, a login code has been sent",
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    };
  },

  /**
   * Save post-verification intake details (citizen legal-needs profile or
   * expert practice snapshot) collected during the sign-up wizard.
   * Called once, right after the account's email is verified.
   */
  saveOnboarding: async (
    userId: string,
    dto: OnboardingDto,
    ipAddress?: string
  ) => {
    const user = await AuthRepository.findById(userId);
    if (!user) {
      throw new AuthenticationError(getErrorMessage("UNAUTHORIZED"));
    }

    await prisma.user.update({
      where: { id: userId },
      data: { onboarding: dto as unknown as Prisma.InputJsonValue },
    });

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "USER",
      resourceId: userId,
      description: `Onboarding details saved (${dto.role})`,
      ipAddress,
    });

    logger.info("Onboarding details saved", { userId, role: dto.role });
    return { saved: true };
  },

  /**
   * Send a magic login link.
   * Uses the anon client so Supabase actually delivers the email through Brevo.
   */
  sendMagicLink: async (dto: MagicLinkDto) => {
    // Admin accounts sign in exclusively through the password-based admin login
    // page; never send magic links to them.
    const user = await AuthRepository.findByEmail(dto.email);
    if (user && user.role === "ADMIN") {
      logger.info("Magic link requested for admin account", { email: dto.email });
      return { message: "If this email is registered, a magic link has been sent" };
    }
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
    
    const { error: updateError } = await retrySupabase(
      () => supabaseAdmin.auth.admin.updateUserById(dbUser.id, {
        password: otp,
      }),
      "updateUserById (otp login)"
    );

    if (updateError) {
      logger.error("Failed to set temporary password", {
        email: dto.email,
        error: updateError.message,
      });
      throw new ServiceUnavailableError(getErrorMessage('SERVER_ERROR'));
    }

    // Sign in with the one-time password
    const { data: sessionData, error: sessionError } = await retrySupabase(
      () => supabaseAnon.auth.signInWithPassword({
        email: dto.email,
        password: otp,
      }),
      "signInWithPassword (otp login)"
    );
    
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
        expertProfile: dbUser.expertProfile ? { id: dbUser.expertProfile.id, status: dbUser.expertProfile.status } : null,
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
        expertProfile: null,
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
  getMe: async (user: { avatarObjectKey: string | null; phone: string | null; expertProfileId?: string | null; expertStatus?: string | null; expertProfile?: { id: string; status: string } | null } & Record<string, unknown>) => {
    const expertProfile = user.expertProfile ?? (user.expertProfileId ? { id: user.expertProfileId, status: user.expertStatus } : null);
    if (!user.avatarObjectKey) {
      return { ...user, expertProfile, avatarUrl: null };
    }
    const { url: avatarUrl } = await getSignedDownloadUrl(user.avatarObjectKey);
    return { ...user, expertProfile, avatarUrl };
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

    const userLanguage = (user.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
    await sendPasswordResetEmail(user.email, user.firstName, resetToken, userLanguage).catch((err) => {
      logger.error("Failed to send password reset email", { email: user.email, error: err });
    });

    // In development, return the token for easy testing
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      return {
        message: "Password reset token generated (development mode)",
        devPasswordResetToken: resetToken,
      };
    }

    return { message: "If an account exists with that email, a reset link has been sent." };
  },

  /**
   * POST /auth/reset-password
   * Verifies the reset token from Redis and updates the user's password
   * via Supabase Admin API. Invalidate sessions and cache for security.
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

    // Invalidate existing sessions and clear user cache for security
    await clearUserCache(userId);
    await supabaseAdmin.auth.admin.signOut(userId).catch((err) => {
      logger.warn("Supabase signOut failed on password reset", { userId, error: err });
    });

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
