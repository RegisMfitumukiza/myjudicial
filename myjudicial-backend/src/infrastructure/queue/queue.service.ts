import crypto from "crypto";
import { redis } from "../redis/redis.client.js";
import { logger } from "../../shared/utils/logger.js";

/**
 * Distributed Lock & Background Job Queue Service
 *
 * Provides:
 * 1. Redis-backed distributed mutex locks (`withDistributedLock`) using atomic SET NX EX
 *    and Lua compare-and-delete so multi-instance horizontal deployments never run
 *    duplicate cron jobs (e.g., AzamPay payouts, escrow releases, reminder emails).
 * 2. Resilient background job queuing (`enqueue`, `registerHandler`) with exponential
 *    backoff retries and Dead-Letter Queue (DLQ) persistence.
 * 3. Automatic in-memory fallback when Redis is disconnected (e.g., offline unit tests).
 */

export interface QueueJob<T = unknown> {
  id: string;
  queue: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  lastError?: string;
}

export interface EnqueueOptions {
  maxAttempts?: number;
}

type JobHandler<T = any> = (payload: T, job: QueueJob<T>) => Promise<void>;

const LOCK_PREFIX = "myjudicial:lock:";
const QUEUE_PREFIX = "myjudicial:queue:";

// In-memory fallback structures for test / single-node offline environments
const localLocks = new Map<string, { token: string; expiresAt: number }>();
const localQueues = new Map<string, QueueJob<any>[]>();
const localDlq = new Map<string, QueueJob<any>[]>();
const handlers = new Map<string, JobHandler<any>>();

let workerTimer: ReturnType<typeof setInterval> | null = null;
let isProcessing = false;

const RELEASE_LOCK_LUA = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

export const QueueService = {
  /**
   * Acquires a distributed lock across all application instances.
   * Returns an owner token if acquired, or null if another instance holds the lock.
   */
  acquireLock: async (lockName: string, ttlSeconds = 300): Promise<string | null> => {
    const key = `${LOCK_PREFIX}${lockName}`;
    const token = crypto.randomUUID();

    if (redis.isOpen && process.env.NODE_ENV !== "test") {
      try {
        const result = await redis.set(key, token, {
          NX: true,
          EX: ttlSeconds,
        });
        return result === "OK" ? token : null;
      } catch (err) {
        logger.warn("Redis lock acquisition failed, falling back to local lock", {
          lockName,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Local fallback
    const now = Date.now();
    const existing = localLocks.get(key);
    if (existing && existing.expiresAt > now) {
      return null;
    }
    localLocks.set(key, { token, expiresAt: now + ttlSeconds * 1000 });
    return token;
  },

  /**
   * Releases a previously acquired distributed lock only if the caller still owns it.
   */
  releaseLock: async (lockName: string, token: string): Promise<boolean> => {
    const key = `${LOCK_PREFIX}${lockName}`;

    if (redis.isOpen && process.env.NODE_ENV !== "test") {
      try {
        const result = await redis.eval(RELEASE_LOCK_LUA, {
          keys: [key],
          arguments: [token],
        });
        return Number(result) === 1;
      } catch (err) {
        logger.warn("Redis lock release failed, checking local lock", {
          lockName,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const existing = localLocks.get(key);
    if (existing && existing.token === token) {
      localLocks.delete(key);
      return true;
    }
    return false;
  },

  /**
   * Executes an async task inside a distributed mutex lock.
   * If another node is already executing the task, skips execution cleanly.
   */
  withDistributedLock: async <T>(
    lockName: string,
    ttlSeconds: number,
    fn: () => Promise<T>
  ): Promise<{ executed: boolean; result?: T }> => {
    const token = await QueueService.acquireLock(lockName, ttlSeconds);
    if (!token) {
      logger.debug(`Distributed lock busy, skipping task: ${lockName}`);
      return { executed: false };
    }

    try {
      const result = await fn();
      return { executed: true, result };
    } finally {
      await QueueService.releaseLock(lockName, token);
    }
  },

  /**
   * Registers a worker handler for a named queue.
   */
  registerHandler: <T = unknown>(queueName: string, handler: JobHandler<T>): void => {
    handlers.set(queueName, handler);
  },

  /**
   * Enqueues a background job into Redis (or local fallback queue) and triggers processing.
   */
  enqueue: async <T = unknown>(
    queueName: string,
    payload: T,
    options?: EnqueueOptions
  ): Promise<QueueJob<T>> => {
    const job: QueueJob<T> = {
      id: crypto.randomUUID(),
      queue: queueName,
      payload,
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      createdAt: new Date().toISOString(),
    };

    const serialized = JSON.stringify(job);
    const pendingKey = `${QUEUE_PREFIX}${queueName}:pending`;

    if (redis.isOpen && process.env.NODE_ENV !== "test") {
      try {
        await redis.rPush(pendingKey, serialized);
        setImmediate(() => {
          QueueService.processQueue(queueName).catch(() => {});
        });
        return job;
      } catch (err) {
        logger.warn("Redis enqueue failed, using local memory queue", {
          queueName,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const list = localQueues.get(queueName) ?? [];
    list.push(job);
    localQueues.set(queueName, list);

    setImmediate(() => {
      QueueService.processQueue(queueName).catch(() => {});
    });

    return job;
  },

  /**
   * Drains pending jobs for a specific queue with retry & dead-letter support.
   */
  processQueue: async (queueName: string): Promise<number> => {
    const handler = handlers.get(queueName);
    if (!handler) return 0;

    let processedCount = 0;
    const pendingKey = `${QUEUE_PREFIX}${queueName}:pending`;
    const dlqKey = `${QUEUE_PREFIX}${queueName}:dlq`;

    while (true) {
      let job: QueueJob<any> | null = null;

      if (redis.isOpen && process.env.NODE_ENV !== "test") {
        try {
          const raw = await redis.lPop(pendingKey);
          if (raw) {
            job = JSON.parse(raw) as QueueJob<any>;
          }
        } catch (err) {
          logger.error("Failed to pop job from Redis queue", {
            queueName,
            error: err instanceof Error ? err.message : String(err),
          });
          break;
        }
      } else {
        const list = localQueues.get(queueName);
        if (list && list.length > 0) {
          job = list.shift() ?? null;
        }
      }

      if (!job) break;

      job.attempts += 1;
      try {
        await handler(job.payload, job);
        processedCount += 1;
      } catch (err) {
        job.lastError = err instanceof Error ? err.message : String(err);
        logger.warn(`Queue job failed (${job.queue}#${job.id}, attempt ${job.attempts}/${job.maxAttempts})`, {
          error: job.lastError,
        });

        if (job.attempts < job.maxAttempts) {
          // Re-queue with backoff
          const backoffMs = Math.min(30000, 500 * Math.pow(2, job.attempts - 1));
          const retryJob = { ...job };
          setTimeout(async () => {
            if (redis.isOpen && process.env.NODE_ENV !== "test") {
              await redis.rPush(pendingKey, JSON.stringify(retryJob)).catch(() => {});
            } else {
              const list = localQueues.get(queueName) ?? [];
              list.push(retryJob);
              localQueues.set(queueName, list);
            }
            QueueService.processQueue(queueName).catch(() => {});
          }, backoffMs);
        } else {
          // Move to Dead-Letter Queue (DLQ)
          logger.error(`Job exhausted retries; moving to DLQ (${job.queue}#${job.id})`, {
            error: job.lastError,
          });
          if (redis.isOpen && process.env.NODE_ENV !== "test") {
            await redis.rPush(dlqKey, JSON.stringify(job)).catch(() => {});
          } else {
            const dlq = localDlq.get(queueName) ?? [];
            dlq.push(job);
            localDlq.set(queueName, dlq);
          }
        }
      }
    }

    return processedCount;
  },

  /**
   * Starts a background polling loop to drain all registered queues.
   */
  startWorkerLoop: (intervalMs = 5000): void => {
    if (workerTimer) return;
    workerTimer = setInterval(async () => {
      if (isProcessing) return;
      isProcessing = true;
      try {
        for (const queueName of handlers.keys()) {
          await QueueService.processQueue(queueName);
        }
      } finally {
        isProcessing = false;
      }
    }, intervalMs);
    if (workerTimer.unref) workerTimer.unref();
  },

  /**
   * Stops the background queue worker loop.
   */
  stopWorkerLoop: (): void => {
    if (workerTimer) {
      clearInterval(workerTimer);
      workerTimer = null;
    }
  },

  /**
   * Inspects Dead-Letter Queue items for diagnostics/testing.
   */
  getDeadLetterJobs: async (queueName: string): Promise<QueueJob<any>[]> => {
    const dlqKey = `${QUEUE_PREFIX}${queueName}:dlq`;
    if (redis.isOpen && process.env.NODE_ENV !== "test") {
      const items = await redis.lRange(dlqKey, 0, -1);
      return items.map((raw) => JSON.parse(raw));
    }
    return localDlq.get(queueName) ?? [];
  },
};
