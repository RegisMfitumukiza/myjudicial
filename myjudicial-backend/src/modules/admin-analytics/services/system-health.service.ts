/**
 * System Health Service
 * 
 * System performance and health metrics
 */

import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import { redis } from "../../../infrastructure/redis/redis.client.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import type { DateRange, SystemHealthAnalytics } from "../types/analytics.types.js";

export const SystemHealthService = {
  async getSystemHealth(dateRange?: DateRange): Promise<SystemHealthAnalytics> {
    const [systemStats, redisStatus, dbStatus] = await Promise.all([
      AnalyticsRepository.getSystemStats(dateRange),
      this.checkRedisHealth(),
      this.checkDatabaseHealth(),
    ]);

    return {
      storage: {
        totalDocuments: systemStats.totalDocuments,
        totalStorageBytes: systemStats.totalStorageBytes,
        totalStorageMB: Number((systemStats.totalStorageBytes / (1024 * 1024)).toFixed(2)),
      },
      activity: {
        auditLogCount: systemStats.auditLogCount,
        notificationsSent: systemStats.notificationCount,
      },
      services: {
        redis: redisStatus,
        database: dbStatus,
      },
    };
  },

  /**
   * Check Redis connection health
   */
  async checkRedisHealth(): Promise<{ status: "healthy" | "unhealthy"; latencyMs?: number }> {
    try {
      const start = Date.now();
      await redis.ping();
      const latencyMs = Date.now() - start;
      
      return {
        status: "healthy",
        latencyMs,
      };
    } catch (error) {
      return {
        status: "unhealthy",
      };
    }
  },

  /**
   * Check database connection health
   */
  async checkDatabaseHealth(): Promise<{ status: "healthy" | "unhealthy"; latencyMs?: number }> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - start;
      
      return {
        status: "healthy",
        latencyMs,
      };
    } catch (error) {
      return {
        status: "unhealthy",
      };
    }
  },
};
