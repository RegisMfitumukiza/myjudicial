/**
 * Cache Cleanup Utilities
 * 
 * Functions to clear user-specific cache entries
 */

import { redis } from "../../infrastructure/redis/redis.client.js";
import { logger } from "./logger.js";

const USER_CACHE_PREFIX = "user:";
const REVOCATION_PREFIX = "revoked:";

/**
 * Clear all cached user data for a specific user ID
 * Useful when user role changes or account is updated
 */
export async function clearUserCache(userId: string): Promise<void> {
  try {
    // Find all cache keys for this user (including token-specific variants)
    const pattern = `${USER_CACHE_PREFIX}${userId}:*`;
    const keys = await redis.keys(pattern);
    
    // Also clear the base key without token hash (legacy)
    keys.push(`${USER_CACHE_PREFIX}${userId}`);
    
    if (keys.length > 0) {
      await redis.del(keys);
      logger.info("Cleared user cache", {
        userId,
        keysCleared: keys.length
      });
    }
  } catch (error) {
    logger.error("Failed to clear user cache", {
      userId,
      error: error instanceof Error ? error.message : error
    });
  }
}

/**
 * Revoke a specific token and clear its cache
 * Used during logout or when forcing session termination
 */
export async function revokeTokenAndClearCache(
  userId: string, 
  token: string,
  ttlSeconds: number = 3600
): Promise<void> {
  try {
    // Add token to revocation list
    await redis.setEx(`${REVOCATION_PREFIX}${token}`, ttlSeconds, "revoked");
    
    // Clear cache entries for this specific token
    const tokenHash = token.substring(token.length - 16);
    const cacheKey = `${USER_CACHE_PREFIX}${userId}:${tokenHash}`;
    await redis.del(cacheKey);
    
    logger.info("Token revoked and cache cleared", {
      userId,
      tokenPrefix: token.substring(0, 10) + "...",
      tokenSuffix: tokenHash
    });
  } catch (error) {
    logger.error("Failed to revoke token", {
      userId,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

/**
 * Clear all authentication caches (use with caution!)
 * Useful for emergency cache flush or during maintenance
 */
export async function clearAllAuthCaches(): Promise<number> {
  try {
    // Find all user cache keys
    const userKeys = await redis.keys(`${USER_CACHE_PREFIX}*`);
    
    if (userKeys.length > 0) {
      await redis.del(userKeys);
      logger.warn("Cleared all user authentication caches", {
        keysCleared: userKeys.length
      });
      return userKeys.length;
    }
    
    return 0;
  } catch (error) {
    logger.error("Failed to clear all auth caches", {
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

/**
 * Clean up expired revoked tokens from Redis
 * Can be called periodically via cron job
 */
export async function cleanupExpiredRevocations(): Promise<number> {
  try {
    const pattern = `${REVOCATION_PREFIX}*`;
    const keys = await redis.keys(pattern);
    
    let cleaned = 0;
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1) {
        // Key exists but has no expiry (shouldn't happen, but clean it up)
        await redis.del(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.info("Cleaned up expired revocations", { cleaned });
    }
    
    return cleaned;
  } catch (error) {
    logger.error("Failed to cleanup revocations", {
      error: error instanceof Error ? error.message : error
    });
    return 0;
  }
}