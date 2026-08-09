/**
 * Analytics Cache Utilities
 * 
 * Redis caching layer for expensive analytics queries
 */

import { redisGet, redisSet } from "../../../infrastructure/redis/redis.client.js";
import { logger } from "../../../shared/utils/logger.js";
import type { TimePeriod } from "../types/analytics.types.js";

/**
 * Cache TTL in seconds
 */
export const CACHE_TTL = {
  SUMMARY: 300,        // 5 minutes
  BOOKINGS: 300,       // 5 minutes
  REVENUE: 300,        // 5 minutes
  USERS: 600,          // 10 minutes
  EXPERTS: 600,        // 10 minutes
  REVIEWS: 600,        // 10 minutes
  COMMUNICATIONS: 300, // 5 minutes
  COMPLIANCE: 900,     // 15 minutes
  SYSTEM: 120,         // 2 minutes
} as const;

/**
 * Generate cache key for analytics
 */
export const generateCacheKey = (
  endpoint: string,
  period: TimePeriod,
  startDate?: Date,
  endDate?: Date
): string => {
  if (period === "custom" && startDate && endDate) {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    return `analytics:${endpoint}:${period}:${start}:${end}`;
  }
  return `analytics:${endpoint}:${period}`;
};

/**
 * Get analytics data from cache
 */
export const getFromCache = async <T>(key: string): Promise<T | null> => {
  try {
    const cached = await redisGet(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    logger.debug("Cache hit", { key });
    return data as T;
  } catch (error) {
    logger.warn("Cache read failed", { key, error });
    return null;
  }
};

/**
 * Set analytics data in cache
 */
export const setCache = async <T>(
  key: string,
  data: T,
  ttlSeconds: number
): Promise<void> => {
  try {
    const serialized = JSON.stringify(data);
    await redisSet(key, serialized, ttlSeconds);
    logger.debug("Cache set", { key, ttl: ttlSeconds });
  } catch (error) {
    logger.warn("Cache write failed", { key, error });
    // Don't throw - cache failures should not break the app
  }
};

/**
 * Get or compute analytics with caching
 * Returns a tuple: [data, wasCacheHit]
 */
export const getCachedOrCompute = async <T>(
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>
): Promise<[T, boolean]> => {
  // Try cache first
  const cached = await getFromCache<T>(key);
  if (cached !== null) {
    return [cached, true]; // Cache hit
  }

  // Cache miss - compute
  logger.debug("Cache miss, computing", { key });
  const data = await computeFn();

  // Store in cache
  await setCache(key, data, ttlSeconds);

  return [data, false]; // Cache miss
};

/**
 * Analytics Cache Object - convenient wrapper for common operations
 */
export const AnalyticsCache = {
  get: getFromCache,
  set: setCache,
  getCachedOrCompute,
  generateKey: (
    endpoint: string,
    dateRange?: { startDate: Date; endDate: Date }
  ): string => {
    if (dateRange) {
      const start = dateRange.startDate.toISOString().split("T")[0];
      const end = dateRange.endDate.toISOString().split("T")[0];
      return `analytics:${endpoint}:custom:${start}:${end}`;
    }
    return `analytics:${endpoint}`;
  },
};
