import { createClient } from "redis";
import { logger } from "../../shared/utils/logger.js";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is missing from environment variables");
}

export const redis = createClient({ url: redisUrl });

redis.on("error", (err) => logger.error("Redis client error", { err }));
redis.on("connect", () => logger.info("Redis connected"));
redis.on("reconnecting", () => logger.warn("Redis reconnecting..."));

// Connect on module load — server.ts awaits this before accepting requests
export const connectRedis = async (): Promise<void> => {
  if (!redis.isOpen) {
    await redis.connect();
  }
};

/**
 * Store a value with an optional TTL in seconds.
 */
export const redisSet = async (
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> => {
  if (ttlSeconds) {
    await redis.setEx(key, ttlSeconds, value);
  } else {
    await redis.set(key, value);
  }
};

/**
 * Retrieve a value or null if it doesn't exist / has expired.
 */
export const redisGet = async (key: string): Promise<string | null> => {
  return redis.get(key);
};

/**
 * Delete one or more keys.
 */
export const redisDel = async (...keys: string[]): Promise<void> => {
  if (keys.length) await redis.del(keys);
};

/**
 * Check if a key exists (used for token revocation lookups).
 */
export const redisExists = async (key: string): Promise<boolean> => {
  const count = await redis.exists(key);
  return count > 0;
};

/**
 * Scan Redis keys matching a pattern.
 * Returns all matching keys (use with caution on large datasets).
 */
export const redisScan = async (pattern: string): Promise<string[]> => {
  const keys: string[] = [];
  let cursor = 0;

  do {
    const result = await redis.scan(cursor, {
      MATCH: pattern,
      COUNT: 100,
    });

    cursor = result.cursor;
    keys.push(...result.keys);
  } while (cursor !== 0);

  return keys;
};
