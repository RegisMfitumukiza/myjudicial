import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { prisma } from "../../infrastructure/database/prisma.js";
import { redisGet, redisSet } from "../../infrastructure/redis/redis.client.js";
import { logger } from "../../shared/utils/logger.js";
import {
  AuthenticationError,
  AuthorizationError,
} from "../errors/index.js";
import type { Role, ExpertStatus } from "../../generated/prisma/client.js";
import type { AuthenticatedUser } from "../../types/express.js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

/**
 * Per-request Supabase client used solely for JWT verification.
 * We pass the incoming Bearer token so Supabase validates it against
 * its own signing secret — no DB hit for token verification.
 */
const makeSupabaseClient = (token: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
    // Node.js 20 requires explicit ws transport — native WebSocket added in Node 22
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    realtime: { transport: ws as any },
  });

const REVOCATION_PREFIX = "revoked:";
const USER_CACHE_PREFIX = "user:";
const USER_CACHE_TTL = 60; // seconds — short TTL so role changes propagate quickly

/**
 * Extracts and returns the Bearer token from the Authorization header.
 * Throws AuthenticationError if missing or malformed.
 */
const extractToken = (authHeader?: string): string => {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthenticationError("No authentication token provided");
  }
  const token = authHeader.split(" ")[1];
  if (!token) throw new AuthenticationError("Invalid authorization header format");
  return token;
};

/**
 * Main authentication middleware.
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Check Redis revocation list (logout / token rotation)
 * 3. Verify JWT signature via Supabase — no database round-trip for this step
 * 4. Load user profile from PostgreSQL (cached in Redis with token-specific key)
 * 5. Attach AuthenticatedUser to req.user
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req.headers.authorization);

    // Check token revocation list in Redis
    const isRevoked = await redisGet(`${REVOCATION_PREFIX}${token}`);
    if (isRevoked) {
      return next(new AuthenticationError("Token has been revoked"));
    }

    // Verify JWT via Supabase — validates signature and expiry
    const supabase = makeSupabaseClient(token);
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

    if (error || !supabaseUser) {
      logger.error("Supabase token verification failed", {
        error: error?.message,
        status: error?.status,
        tokenPrefix: token.substring(0, 10) + "...",
      });
      return next(new AuthenticationError("Invalid or expired token"));
    }

    // CRITICAL FIX: Cache key must include token hash to prevent cross-user contamination
    // When switching accounts, each token gets its own cache entry
    const tokenHash = token.substring(token.length - 16); // Last 16 chars as simple hash
    const cacheKey = `${USER_CACHE_PREFIX}${supabaseUser.id}:${tokenHash}`;
    const cached = await redisGet(cacheKey);

    if (cached) {
      try {
        const cachedUser = JSON.parse(cached) as AuthenticatedUser;
        if (cachedUser && cachedUser.id) {
          logger.debug("Using cached user data", {
            userId: cachedUser.id,
            email: cachedUser.email,
            role: cachedUser.role,
            tokenHash
          });
          req.user = cachedUser;
          return next();
        }
      } catch (parseErr) {
        logger.warn("Corrupted or empty user cache in Redis, bypassing cache", { cacheKey, err: parseErr });
      }
    }

    // Load user from PostgreSQL
    const dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        preferredLanguage: true,
        avatarObjectKey: true,
        phone: true,
        createdAt: true,
        lastLoginAt: true,
        expertProfile: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!dbUser) {
      return next(new AuthenticationError("User account not found"));
    }

    if (dbUser.status !== "ACTIVE") {
      return next(new AuthenticationError("Account is not active"));
    }

    const authUser: AuthenticatedUser = {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role as Role,
      status: dbUser.status,
      expertProfileId: dbUser.expertProfile?.id ?? null,
      expertStatus: (dbUser.expertProfile?.status as ExpertStatus) ?? null,
      expertProfile: dbUser.expertProfile ? { id: dbUser.expertProfile.id, status: dbUser.expertProfile.status as ExpertStatus } : null,
      preferredLanguage: dbUser.preferredLanguage,
      avatarObjectKey: dbUser.avatarObjectKey,
      phone: dbUser.phone,
      createdAt: dbUser.createdAt,
      lastLoginAt: dbUser.lastLoginAt,
    };

    logger.info("User authenticated from database", {
      userId: authUser.id,
      email: authUser.email,
      role: authUser.role,
      expertProfileId: authUser.expertProfileId,
      expertStatus: authUser.expertStatus,
      tokenHash
    });

    // Cache with token-specific key — prevents cross-user issues when switching accounts
    await redisSet(cacheKey, JSON.stringify(authUser), USER_CACHE_TTL);

    req.user = authUser;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware.
 * If a valid Bearer token is provided, attaches req.user.
 * If missing or invalid, proceeds without error (req.user remains undefined).
 */
export const authenticateOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.headers.authorization?.startsWith("Bearer ")) {
    return next();
  }
  return authenticate(req, res, (err) => {
    if (err) {
      req.user = undefined;
    }
    next();
  });
};

/**
 * Middleware factory — requires the authenticated user to have one of the given roles.
 * Must be used after `authenticate`.
 *
 * @example
 * router.delete("/users/:id", authenticate, requireRole("ADMIN"), deleteUser);
 */
export const requireRole = (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn("requireRole: No user found in request", { roles });
      return next(new AuthenticationError());
    }
    
    logger.info("requireRole check", {
      userRole: req.user.role,
      requiredRoles: roles,
      userEmail: req.user.email,
      userId: req.user.id,
      authorized: roles.includes(req.user.role)
    });
    
    if (!roles.includes(req.user.role)) {
      logger.error("Authorization failed - role mismatch", {
        userRole: req.user.role,
        requiredRoles: roles,
        userEmail: req.user.email,
        userId: req.user.id
      });
      return next(new AuthorizationError());
    }
    next();
  };

/**
 * Middleware — requires the authenticated user to be a VERIFIED expert.
 * Blocks: receiving bookings, joining consultations, appearing on the map.
 *
 * @example
 * router.post("/bookings/:id/join", authenticate, requireVerifiedExpert, joinRoom);
 */
export const requireVerifiedExpert = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AuthenticationError());
  }
  if (req.user.role !== "EXPERT") {
    return next(new AuthorizationError("Only experts can access this resource"));
  }
  if (req.user.expertStatus !== "VERIFIED") {
    return next(
      new AuthorizationError(
        "Your expert profile must be verified before accessing this resource"
      )
    );
  }
  next();
};

/**
 * Convenience role guards.
 */
export const requireAdmin = requireRole("ADMIN");
export const requireExpert = requireRole("EXPERT");
export const requireCitizen = requireRole("CITIZEN");
export const requireClient = requireCitizen;
