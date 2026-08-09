import crypto from "crypto";
import { redisSet, redisGet, redisDel } from "../../infrastructure/redis/redis.client.js";
import { sendOtpEmail } from "../../infrastructure/email/email.service.js";
import { logger } from "../../shared/utils/logger.js";

/**
 * Custom OTP Service
 * 
 * Implements our own OTP generation and verification system.
 * Used as a fallback when Supabase OTP expiry configuration doesn't work.
 * 
 * Benefits:
 * - Full control over expiry time (we set it to 900 seconds)
 * - More reliable than waiting for Supabase config to propagate
 * - Can customize OTP length, format, delivery
 */

const OTP_EXPIRY_SECONDS = 900; // 15 minutes
const OTP_LENGTH = 6;
const REDIS_KEY_PREFIX = "custom-otp:";
const MAX_ATTEMPTS_KEY_PREFIX = "otp-attempts:";
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_SECONDS = 900; // 15 minutes

export const CustomOtpService = {
  /**
   * Generate a 6-digit OTP and store it in Redis with 15-minute expiry
   */
  generate: async (email: string): Promise<string> => {
    // Generate random 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Store in Redis with expiry
    const key = `${REDIS_KEY_PREFIX}${email}`;
    await redisSet(key, otp, OTP_EXPIRY_SECONDS);
    
    // Reset attempt counter
    const attemptsKey = `${MAX_ATTEMPTS_KEY_PREFIX}${email}`;
    await redisSet(attemptsKey, "0", ATTEMPT_WINDOW_SECONDS);
    
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
    
    logger.info("Custom OTP generated", {
      email,
      expiresAt: expiresAt.toISOString(),
      expirySeconds: OTP_EXPIRY_SECONDS,
    });
    
    // Development: Log OTP to console for easy testing
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========================================');
      console.log('🔐 OTP CODE FOR TESTING');
      console.log('========================================');
      console.log(`Email: ${email}`);
      console.log(`Code:  ${otp}`);
      console.log(`Expires: ${expiresAt.toLocaleString()}`);
      console.log('========================================\n');
    }
    
    return otp;
  },

  /**
   * Verify OTP against stored value
   */
  verify: async (email: string, token: string): Promise<boolean> => {
    const key = `${REDIS_KEY_PREFIX}${email}`;
    const attemptsKey = `${MAX_ATTEMPTS_KEY_PREFIX}${email}`;
    
    // Check attempt count
    const attemptsStr = await redisGet(attemptsKey);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    
    if (attempts >= MAX_ATTEMPTS) {
      logger.warn("Max OTP verification attempts exceeded", {
        email,
        attempts,
        maxAttempts: MAX_ATTEMPTS,
      });
      return false;
    }
    
    // Get stored OTP
    const storedOtp = await redisGet(key);
    
    if (!storedOtp) {
      logger.warn("Custom OTP not found or expired", { email });
      return false;
    }
    
    // Increment attempt counter
    await redisSet(attemptsKey, (attempts + 1).toString(), ATTEMPT_WINDOW_SECONDS);
    
    // Verify OTP
    if (storedOtp !== token) {
      logger.warn("Custom OTP verification failed - incorrect code", {
        email,
        attempts: attempts + 1,
      });
      return false;
    }
    
    // OTP is valid - delete it (one-time use)
    await redisDel(key);
    await redisDel(attemptsKey);
    
    logger.info("Custom OTP verified successfully", { email });
    return true;
  },

  /**
   * Send OTP via email using the centralized email service.
   * Delegates to email.service.ts for consistent branding and WhatsApp support.
   * 
   * @param email - Recipient email address
   * @param otp - OTP code to send
   * @param firstName - User's first name (optional)
   * @param language - User's preferred language (en, fr, or rw)
   */
  sendOtpEmail: async (email: string, otp: string, firstName?: string, language: 'en' | 'fr' | 'rw' = 'en'): Promise<void> => {
    logger.info("Sending OTP email via centralized service", { email, language });

    await sendOtpEmail(email, otp, undefined, undefined, language);
  },

  /**
   * Validate OTP value without consuming it.
   * Does NOT increment attempts or delete the OTP — use for early validation.
   */
  checkOtp: async (email: string, token: string): Promise<boolean> => {
    const storedOtp = await redisGet(`${REDIS_KEY_PREFIX}${email}`);
    if (!storedOtp) return false;
    return storedOtp === token;
  },

  /**
   * Check if OTP exists and is still valid
   */
  exists: async (email: string): Promise<boolean> => {
    const key = `${REDIS_KEY_PREFIX}${email}`;
    const otp = await redisGet(key);
    return !!otp;
  },

  /**
   * Record a failed attempt without consuming the OTP.
   * Used when OTP value is invalid — increments the attempt counter.
   */
  recordAttempt: async (email: string): Promise<void> => {
    const attemptsKey = `${MAX_ATTEMPTS_KEY_PREFIX}${email}`;
    const attemptsStr = await redisGet(attemptsKey);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    await redisSet(attemptsKey, (attempts + 1).toString(), ATTEMPT_WINDOW_SECONDS);
  },

  /**
   * Get remaining attempts for an email
   */
  getRemainingAttempts: async (email: string): Promise<number> => {
    const attemptsKey = `${MAX_ATTEMPTS_KEY_PREFIX}${email}`;
    const attemptsStr = await redisGet(attemptsKey);
    const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
    return Math.max(0, MAX_ATTEMPTS - attempts);
  },
};
