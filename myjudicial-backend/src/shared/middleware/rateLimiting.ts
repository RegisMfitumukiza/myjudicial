import {
  rateLimit,
  ipKeyGenerator,
  type Options,
  type Store,
  type IncrementResponse,
} from "express-rate-limit";
import type { Request } from "express";
import type { AuthenticatedUser } from "../../types/express.js";
import { redis } from "../../infrastructure/redis/redis.client.js";
import { logger } from "../../shared/utils/logger.js";

const isProd = process.env.NODE_ENV === "production";

/**
 * Read an optional rate-limit override from the environment.
 * Falls back to the supplied default when unset or invalid.
 */
const envMax = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
};

const safeIpKey = (req: Request): string =>
  ipKeyGenerator(req.ip ?? "unknown");

/**
 * Key an email-based limiter by the lowercased request body email.
 * Falls back to the IP so unkeyable requests still get limited.
 */
const emailKey = (req: Request): string => {
  const email = String((req.body as { email?: unknown } | undefined)?.email ?? "")
    .trim()
    .toLowerCase();
  return email ? `email:${email}` : safeIpKey(req);
};

/**
 * Redis-backed fixed-window store implementing the express-rate-limit
 * `Store` interface. Counters are shared across instances so limits hold
 * in multi-instance deployments, and survive restarts.
 *
 * Availability posture: if Redis is unreachable the limiter fails OPEN
 * (returns zero hits) rather than taking the API down, and logs the error.
 */
const createRedisStore = (prefix: string): Store => {
  class RedisFixedWindowStore implements Store {
    readonly prefix: string;
    private windowMs = 15 * 60 * 1000;

    constructor(prefix: string) {
      this.prefix = prefix;
    }

    init(options: Options): void {
      this.windowMs = options.windowMs ?? this.windowMs;
    }

    async increment(key: string): Promise<IncrementResponse> {
      try {
        const fullKey = `${this.prefix}${key}`;
        const totalHits = await redis.incr(fullKey);
        if (totalHits === 1) {
          await redis.pExpire(fullKey, this.windowMs);
        }
        const ttl = await redis.pTTL(fullKey);
        return {
          totalHits,
          resetTime: ttl > 0 ? new Date(Date.now() + ttl) : undefined,
        };
      } catch (err) {
        logger.error("Rate-limit Redis store increment failed; failing open", {
          err,
          prefix: this.prefix,
        });
        return { totalHits: 0, resetTime: undefined };
      }
    }

    async decrement(key: string): Promise<void> {
      try {
        const fullKey = `${this.prefix}${key}`;
        const remaining = await redis.decr(fullKey);
        if (remaining <= 0) {
          await redis.del(fullKey);
        }
      } catch (err) {
        logger.error("Rate-limit Redis store decrement failed", {
          err,
          prefix: this.prefix,
        });
      }
    }

    async resetKey(key: string): Promise<void> {
      try {
        await redis.del(`${this.prefix}${key}`);
      } catch (err) {
        logger.error("Rate-limit Redis store resetKey failed", {
          err,
          prefix: this.prefix,
        });
      }
    }
  }

  return new RedisFixedWindowStore(prefix);
};

/** Global IP-based limiter applied to all /api/v1 routes (coarse DoS backstop) */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envMax("API_RATE_LIMIT_MAX", isProd ? 100 : 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

/**
 * OTP / magic-link send limiter — keyed by EMAIL.
 * Protects a single address from being flooded with codes. Because sends
 * always return the same envelope, all requests count (not just failures).
 */
export const otpSendEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: envMax("AUTH_OTP_SEND_EMAIL_MAX", isProd ? 5 : 60),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: emailKey,
  store: createRedisStore("rl:send-email:"),
  message: {
    success: false,
    message: "Too many login code requests for this email. Please try again later.",
  },
});

/**
 * OTP / magic-link send limiter — keyed by IP.
 * Guard against mass sends to many addresses from one source. All requests
 * count so the counter cannot be dodged by rotating target emails.
 */
export const otpSendIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envMax("AUTH_OTP_SEND_IP_MAX", isProd ? 10 : 100),
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore("rl:send-ip:"),
  message: {
    success: false,
    message: "Too many authentication requests from this device. Please try again later.",
  },
});

/**
 * OTP verification limiter — keyed by IP, counts FAILURES only.
 * Successful verifications never consume the budget, so legitimate logins
 * are never blocked by their own success.
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envMax("AUTH_OTP_VERIFY_MAX", isProd ? 5 : 50),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: createRedisStore("rl:verify:"),
  message: {
    success: false,
    message: "Too many verification attempts. Please request a new code and try again later.",
  },
});

/** Admin email+password login limiter — keyed by IP, counts FAILURES only. */
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envMax("AUTH_LOGIN_MAX", isProd ? 5 : 50),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: createRedisStore("rl:login:"),
  message: {
    success: false,
    message: "Too many login attempts. Please try again in a few minutes.",
  },
});

/**
 * Catch-all limiter for other public auth actions (register, password reset).
 * Keyed by IP, counts FAILURES only so legitimate actions are never blocked.
 */
export const authPublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envMax("AUTH_PUBLIC_MAX", isProd ? 10 : 100),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: createRedisStore("rl:public:"),
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

/**
 * Strict limiter for AI endpoints — LLM inference, Whisper transcription,
 * and embedding search are expensive. 20 requests per 15 min in production.
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envMax("AI_RATE_LIMIT_MAX", isProd ? 20 : 200),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const user = req.user as AuthenticatedUser | undefined;
    return user?.id ?? safeIpKey(req);
  },
  message: { success: false, message: "AI service rate limit exceeded. Please wait before trying again." },
});

/** Per-authenticated-user limiter — falls back to IP for unauthenticated requests */
export const perUserLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: envMax("PER_USER_RATE_LIMIT_MAX", isProd ? 60 : 600),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const user = req.user as AuthenticatedUser | undefined;
    return user?.id ?? safeIpKey(req);
  },
  skip: (req: Request): boolean => {
    const user = req.user as AuthenticatedUser | undefined;
    return !user?.id;
  },
  message: { success: false, message: "You are sending too many requests. Please slow down." },
});
