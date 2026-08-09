/**
 * Comparison Controller
 * 
 * Handles period-over-period comparison requests
 */

import { Request, Response } from "express";
import { ComparisonService } from "../services/comparison.service.js";
import { validateAnalyticsQuery } from "../schemas/analytics.schemas.js";
import { logger } from "../../../shared/utils/logger.js";
import type { DateRangeQuery } from "../types/analytics.types.js";

export const ComparisonController = {
  /**
   * GET /api/v1/admin/analytics/compare/bookings
   * Compare booking analytics across periods
   */
  async compareBookings(req: Request, res: Response): Promise<void> {
    try {
      const query = validateAnalyticsQuery(req.query as DateRangeQuery);
      const result = await ComparisonService.compareBookings(query);

      res.json({
        success: true,
        data: result,
      });

      logger.info("Booking comparison generated", { 
        adminId: req.user?.id,
        query 
      });
    } catch (error) {
      logger.error("Error comparing bookings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to compare booking analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/compare/revenue
   * Compare revenue analytics across periods
   */
  async compareRevenue(req: Request, res: Response): Promise<void> {
    try {
      const query = validateAnalyticsQuery(req.query as DateRangeQuery);
      const result = await ComparisonService.compareRevenue(query);

      res.json({
        success: true,
        data: result,
      });

      logger.info("Revenue comparison generated", { 
        adminId: req.user?.id,
        query 
      });
    } catch (error) {
      logger.error("Error comparing revenue:", error);
      res.status(500).json({
        success: false,
        error: "Failed to compare revenue analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/compare/users
   * Compare user analytics across periods
   */
  async compareUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = validateAnalyticsQuery(req.query as DateRangeQuery);
      const result = await ComparisonService.compareUsers(query);

      res.json({
        success: true,
        data: result,
      });

      logger.info("User comparison generated", { 
        adminId: req.user?.id,
        query 
      });
    } catch (error) {
      logger.error("Error comparing users:", error);
      res.status(500).json({
        success: false,
        error: "Failed to compare user analytics",
      });
    }
  },
};
