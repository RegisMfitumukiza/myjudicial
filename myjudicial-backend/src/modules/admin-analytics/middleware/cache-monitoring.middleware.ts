/**
 * Cache Monitoring Middleware
 * 
 * Tracks cache performance for analytics endpoints
 */

import { Request, Response, NextFunction } from "express";
import { CacheMetricsService } from "../monitoring/cache-metrics.service.js";

/**
 * Middleware to track cache performance
 */
export function cacheMonitoringMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const endpoint = extractEndpointName(req.path);
  
  // Track if response came from cache (set by service layer)
  let cacheHit = false;

  // Intercept the json method to detect cache hits
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const responseTime = Date.now() - startTime;
    
    // Check if response has cache indicator
    cacheHit = res.getHeader("X-Cache-Hit") === "true";

    // Record metrics asynchronously (don't block response)
    setImmediate(async () => {
      try {
        if (cacheHit) {
          await CacheMetricsService.recordHit(endpoint, responseTime);
        } else {
          await CacheMetricsService.recordMiss(endpoint, responseTime);
        }
      } catch (error) {
        // Silent fail - don't break the request
      }
    });

    return originalJson(body);
  };

  next();
}

/**
 * Extract endpoint name from path
 * /api/v1/admin/analytics/bookings -> bookings
 */
function extractEndpointName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || "unknown";
}
