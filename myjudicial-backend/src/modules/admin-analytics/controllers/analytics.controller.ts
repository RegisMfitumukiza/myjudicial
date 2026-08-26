/**
 * Analytics Controller
 * 
 * Handles all admin analytics endpoints
 */

import { Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service.js";
import { validateAnalyticsQuery } from "../schemas/analytics.schemas.js";
import { logger } from "../../../shared/utils/logger.js";
import { CacheMetricsService } from "../monitoring/cache-metrics.service.js";
import type { DateRangeQuery } from "../types/analytics.types.js";

export const AnalyticsController = {
  /**
   * GET /api/v1/admin/analytics/summary
   * Platform overview - high-level summary
   */
  async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const result = await AnalyticsService.getPlatformSummary();
      res.json(result);
    } catch (error) {
      logger.error("Error fetching platform summary:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch platform summary",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/bookings
   * Booking analytics
   */
  async getBookings(req: Request, res: Response): Promise<void> {
    try {
      const query = validateAnalyticsQuery(req.query as DateRangeQuery);
      const result = await AnalyticsService.getBookingAnalytics(query);
      res.json(result);
    } catch (error) {
      logger.error("Error fetching booking analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch booking analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/revenue
   * Revenue analytics
   */
  async getRevenue(req: Request, res: Response): Promise<void> {
    try {
      const query = validateAnalyticsQuery(req.query as DateRangeQuery);
      const result = await AnalyticsService.getRevenueAnalytics(query);
      res.json(result);
    } catch (error) {
      logger.error("Error fetching revenue analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch revenue analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/users
   * User analytics
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = validateAnalyticsQuery(req.query as DateRangeQuery);
      const result = await AnalyticsService.getUserAnalytics(query);
      res.json(result);
    } catch (error) {
      logger.error("Error fetching user analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/experts
   * Expert analytics
   */
  async getExperts(req: Request, res: Response): Promise<void> {
    try {
      const result = await AnalyticsService.getExpertAnalytics();
      res.json(result);
    } catch (error) {
      logger.error("Error fetching expert analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch expert analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/clients
   * Client analytics
   */
  async getClients(req: Request, res: Response): Promise<void> {
    try {
      const query = validateAnalyticsQuery(req.query as DateRangeQuery);
      const result = await AnalyticsService.getClientAnalytics(query);
      res.json(result);
    } catch (error) {
      logger.error("Error fetching client analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch client analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/reviews
   * Review analytics
   */
  async getReviews(req: Request, res: Response): Promise<void> {
    try {
      const query = validateAnalyticsQuery(req.query as DateRangeQuery);
      const result = await AnalyticsService.getReviewAnalytics(query);
      res.json(result);
    } catch (error) {
      logger.error("Error fetching review analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch review analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/communications
   * Communication analytics (chat, email)
   */
  async getCommunications(req: Request, res: Response): Promise<void> {
    try {
      const query = validateAnalyticsQuery(req.query as DateRangeQuery);
      const result = await AnalyticsService.getCommunicationAnalytics(query);
      res.json(result);
    } catch (error) {
      logger.error("Error fetching communication analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch communication analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/compliance
   * Compliance analytics
   */
  async getCompliance(req: Request, res: Response): Promise<void> {
    try {
      const result = await AnalyticsService.getComplianceAnalytics();
      res.json(result);
    } catch (error) {
      logger.error("Error fetching compliance analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch compliance analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/realtime
   * Real-time operational dashboard
   */
  async getRealtime(req: Request, res: Response): Promise<void> {
    try {
      const filter = {
        timeRange: req.query.timeRange as any,
        severity: req.query.severity ? (req.query.severity as string).split(',') as any[] : undefined,
        components: req.query.components ? (req.query.components as string).split(',') : undefined,
        includeResolved: req.query.includeResolved === 'true',
      };

      const result = await AnalyticsService.getRealtimeDashboard(filter);
      res.json(result);
    } catch (error) {
      logger.error("Error fetching real-time dashboard:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch real-time dashboard",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/predictive
   * Advanced predictive analytics and forecasting
   */
  async getPredictive(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        horizonDays: req.query.horizonDays ? parseInt(req.query.horizonDays as string) : undefined,
        confidenceLevel: req.query.confidenceLevel ? parseFloat(req.query.confidenceLevel as string) : undefined,
        includeSeasonality: req.query.includeSeasonality === 'true',
        includeHolidays: req.query.includeHolidays === 'true',
      };

      const result = await AnalyticsService.getPredictiveAnalytics(params);
      res.json(result);
    } catch (error) {
      logger.error("Error fetching predictive analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch predictive analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/escrow
   * Escrow fund analytics
   */
  async getEscrow(req: Request, res: Response): Promise<void> {
    try {
      const result = await AnalyticsService.getEscrowAnalytics();
      res.json(result);
    } catch (error) {
      logger.error("Error fetching escrow analytics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch escrow analytics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/system
   * System health metrics
   */
  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const result = await AnalyticsService.getSystemHealth();
      res.json(result);
    } catch (error) {
      logger.error("Error fetching system health:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch system health",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/cache-metrics
   * Cache performance metrics
   */
  async getCacheMetrics(req: Request, res: Response): Promise<void> {
    try {
      const [overallMetrics, endpointMetrics] = await Promise.all([
        CacheMetricsService.getMetrics(),
        CacheMetricsService.getAllEndpointMetrics(),
      ]);

      res.json({
        success: true,
        data: {
          overall: overallMetrics,
          endpoints: endpointMetrics,
        },
      });
    } catch (error) {
      logger.error("Error fetching cache metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch cache metrics",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/geographic
   * Expert distribution by city/country
   */
  async getGeographic(req: Request, res: Response): Promise<void> {
    try {
      const result = await AnalyticsService.getGeographicDistribution();
      res.json({ success: true, data: result });
    } catch (error) {
      logger.error("Error fetching geographic distribution:", error);
      res.status(500).json({ success: false, error: "Failed to fetch geographic distribution" });
    }
  },

  /**
   * POST /api/v1/admin/analytics/cache-metrics/reset
   * Reset cache metrics
   */
  async resetCacheMetrics(req: Request, res: Response): Promise<void> {
    try {
      await CacheMetricsService.resetMetrics();

      res.json({
        success: true,
        message: "Cache metrics reset successfully",
      });
    } catch (error) {
      logger.error("Error resetting cache metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reset cache metrics",
      });
    }
  },
};
