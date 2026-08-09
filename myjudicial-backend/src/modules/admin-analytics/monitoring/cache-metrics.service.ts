/**
 * Cache Metrics Service
 * 
 * Monitors and tracks cache performance metrics
 */

import { logger } from "../../../shared/utils/logger.js";
import { redisGet, redisSet } from "../../../infrastructure/redis/redis.client.js";

/**
 * Cache metrics structure
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  avgResponseTime: number;
  lastReset: Date;
}

/**
 * Endpoint-specific metrics
 */
export interface EndpointMetrics {
  endpoint: string;
  hits: number;
  misses: number;
  hitRate: number;
  avgCachedResponseTime: number;
  avgUncachedResponseTime: number;
  requests: number;
}

const METRICS_KEY = "analytics:cache:metrics";
const ENDPOINT_METRICS_PREFIX = "analytics:cache:endpoint:";

/**
 * Cache Metrics Service
 */
export const CacheMetricsService = {
  /**
   * Record a cache hit
   */
  async recordHit(endpoint: string, responseTimeMs: number): Promise<void> {
    try {
      await this.incrementMetric("hits");
      await this.incrementMetric("totalRequests");
      await this.recordEndpointMetric(endpoint, true, responseTimeMs);
      
      logger.debug("Cache hit recorded", { endpoint, responseTimeMs });
    } catch (error) {
      logger.warn("Failed to record cache hit", { error });
    }
  },

  /**
   * Record a cache miss
   */
  async recordMiss(endpoint: string, responseTimeMs: number): Promise<void> {
    try {
      await this.incrementMetric("misses");
      await this.incrementMetric("totalRequests");
      await this.recordEndpointMetric(endpoint, false, responseTimeMs);
      
      logger.debug("Cache miss recorded", { endpoint, responseTimeMs });
    } catch (error) {
      logger.warn("Failed to record cache miss", { error });
    }
  },

  /**
   * Get overall cache metrics
   */
  async getMetrics(): Promise<CacheMetrics> {
    try {
      const metricsJson = await redisGet(METRICS_KEY);
      
      if (!metricsJson) {
        return this.getDefaultMetrics();
      }

      const metrics = JSON.parse(metricsJson);
      const hitRate = metrics.totalRequests > 0 
        ? (metrics.hits / metrics.totalRequests) * 100 
        : 0;

      return {
        ...metrics,
        hitRate: Number(hitRate.toFixed(2)),
        lastReset: new Date(metrics.lastReset),
      };
    } catch (error) {
      logger.error("Failed to get cache metrics", { error });
      return this.getDefaultMetrics();
    }
  },

  /**
   * Get metrics for a specific endpoint
   */
  async getEndpointMetrics(endpoint: string): Promise<EndpointMetrics | null> {
    try {
      const key = `${ENDPOINT_METRICS_PREFIX}${endpoint}`;
      const metricsJson = await redisGet(key);
      
      if (!metricsJson) {
        return null;
      }

      const metrics = JSON.parse(metricsJson);
      const hitRate = metrics.requests > 0 
        ? (metrics.hits / metrics.requests) * 100 
        : 0;

      return {
        ...metrics,
        hitRate: Number(hitRate.toFixed(2)),
      };
    } catch (error) {
      logger.error("Failed to get endpoint metrics", { endpoint, error });
      return null;
    }
  },

  /**
   * Get metrics for all endpoints
   */
  async getAllEndpointMetrics(): Promise<EndpointMetrics[]> {
    const endpoints = [
      "summary",
      "bookings",
      "revenue",
      "users",
      "experts",
      "clients",
      "reviews",
      "communications",
      "compliance",
      "system",
    ];

    const metrics = await Promise.all(
      endpoints.map(async (endpoint) => {
        const endpointMetrics = await this.getEndpointMetrics(endpoint);
        return endpointMetrics || {
          endpoint,
          hits: 0,
          misses: 0,
          hitRate: 0,
          avgCachedResponseTime: 0,
          avgUncachedResponseTime: 0,
          requests: 0,
        };
      })
    );

    return metrics;
  },

  /**
   * Reset all metrics
   */
  async resetMetrics(): Promise<void> {
    try {
      const defaultMetrics = this.getDefaultMetrics();
      await redisSet(METRICS_KEY, JSON.stringify(defaultMetrics), 86400 * 30); // 30 days
      
      // Reset endpoint metrics
      const endpoints = [
        "summary", "bookings", "revenue", "users", "experts", 
        "clients", "reviews", "communications", "compliance", "system",
      ];

      await Promise.all(
        endpoints.map(async (endpoint) => {
          const key = `${ENDPOINT_METRICS_PREFIX}${endpoint}`;
          await redisSet(key, JSON.stringify({
            endpoint,
            hits: 0,
            misses: 0,
            requests: 0,
            totalCachedResponseTime: 0,
            totalUncachedResponseTime: 0,
          }), 86400 * 30);
        })
      );

      logger.info("Cache metrics reset");
    } catch (error) {
      logger.error("Failed to reset cache metrics", { error });
      throw error;
    }
  },

  /**
   * Increment a metric counter
   */
  async incrementMetric(metric: "hits" | "misses" | "totalRequests"): Promise<void> {
    const metricsJson = await redisGet(METRICS_KEY);
    const metrics = metricsJson 
      ? JSON.parse(metricsJson) 
      : this.getDefaultMetrics();

    metrics[metric]++;
    await redisSet(METRICS_KEY, JSON.stringify(metrics), 86400 * 30); // 30 days
  },

  /**
   * Record endpoint-specific metric
   */
  async recordEndpointMetric(
    endpoint: string, 
    isHit: boolean, 
    responseTimeMs: number
  ): Promise<void> {
    const key = `${ENDPOINT_METRICS_PREFIX}${endpoint}`;
    const metricsJson = await redisGet(key);
    const metrics = metricsJson ? JSON.parse(metricsJson) : {
      endpoint,
      hits: 0,
      misses: 0,
      requests: 0,
      totalCachedResponseTime: 0,
      totalUncachedResponseTime: 0,
    };

    if (isHit) {
      metrics.hits++;
      metrics.totalCachedResponseTime += responseTimeMs;
    } else {
      metrics.misses++;
      metrics.totalUncachedResponseTime += responseTimeMs;
    }
    metrics.requests++;

    // Calculate averages
    metrics.avgCachedResponseTime = metrics.hits > 0 
      ? Number((metrics.totalCachedResponseTime / metrics.hits).toFixed(2))
      : 0;
    metrics.avgUncachedResponseTime = metrics.misses > 0 
      ? Number((metrics.totalUncachedResponseTime / metrics.misses).toFixed(2))
      : 0;

    await redisSet(key, JSON.stringify(metrics), 86400 * 30); // 30 days
  },

  /**
   * Get default metrics structure
   */
  getDefaultMetrics(): CacheMetrics {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      lastReset: new Date(),
    };
  },

  /**
   * Log metrics to console (for monitoring)
   */
  async logMetrics(): Promise<void> {
    const overallMetrics = await this.getMetrics();
    const endpointMetrics = await this.getAllEndpointMetrics();

    logger.info("📊 Analytics Cache Performance Report", {
      overall: overallMetrics,
      endpoints: endpointMetrics,
    });

    console.log("\n=== Analytics Cache Performance ===");
    console.log(`Total Requests: ${overallMetrics.totalRequests}`);
    console.log(`Cache Hits: ${overallMetrics.hits}`);
    console.log(`Cache Misses: ${overallMetrics.misses}`);
    console.log(`Hit Rate: ${overallMetrics.hitRate}%`);
    console.log(`\nEndpoint Breakdown:`);
    
    endpointMetrics.forEach((metric) => {
      console.log(`\n  ${metric.endpoint}:`);
      console.log(`    Requests: ${metric.requests}`);
      console.log(`    Hit Rate: ${metric.hitRate}%`);
      console.log(`    Avg Cached Response: ${metric.avgCachedResponseTime}ms`);
      console.log(`    Avg Uncached Response: ${metric.avgUncachedResponseTime}ms`);
    });
    console.log("\n===================================\n");
  },
};
