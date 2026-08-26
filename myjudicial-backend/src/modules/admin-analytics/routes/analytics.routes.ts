/**
 * Analytics Routes
 * 
 * Admin-only analytics endpoints
 */

import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller.js";
import { authenticate } from "../../../shared/middleware/authenticate.js";
import { requireAdmin } from "../../../shared/middleware/requireAdmin.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { cacheMonitoringMiddleware } from "../middleware/cache-monitoring.middleware.js";
import comparisonRoutes from "./comparison.routes.js";
import drillDownRoutes from "./drill-down.routes.js";

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Apply cache monitoring to all analytics endpoints
router.use(cacheMonitoringMiddleware);

// Mount comparison routes
router.use("/compare", comparisonRoutes);

// Mount drill-down routes
router.use("/drill-down", drillDownRoutes);

/**
 * GET /api/v1/admin/analytics/summary
 * Platform overview - high-level summary
 */
router.get("/summary", asyncHandler(AnalyticsController.getSummary));

/**
 * GET /api/v1/admin/analytics/bookings
 * Booking analytics with optional date range
 * Query params: period, startDate, endDate, timezone
 */
router.get("/bookings", asyncHandler(AnalyticsController.getBookings));

/**
 * GET /api/v1/admin/analytics/revenue
 * Revenue analytics with optional date range
 * Query params: period, startDate, endDate, timezone
 */
router.get("/revenue", asyncHandler(AnalyticsController.getRevenue));

/**
 * GET /api/v1/admin/analytics/users
 * User analytics with optional date range
 * Query params: period, startDate, endDate, timezone
 */
router.get("/users", asyncHandler(AnalyticsController.getUsers));

/**
 * GET /api/v1/admin/analytics/experts
 * Expert analytics and rankings
 */
router.get("/experts", asyncHandler(AnalyticsController.getExperts));

/**
 * GET /api/v1/admin/analytics/clients
 * Client analytics with optional date range
 * Query params: period, startDate, endDate, timezone
 */
router.get("/clients", asyncHandler(AnalyticsController.getClients));

/**
 * GET /api/v1/admin/analytics/reviews
 * Review analytics with optional date range
 * Query params: period, startDate, endDate, timezone
 */
router.get("/reviews", asyncHandler(AnalyticsController.getReviews));

/**
 * GET /api/v1/admin/analytics/communications
 * Communication analytics (chat, email)
 * Query params: period, startDate, endDate, timezone
 */
router.get("/communications", asyncHandler(AnalyticsController.getCommunications));

/**
 * GET /api/v1/admin/analytics/compliance
 * Compliance and verification analytics
 */
router.get("/compliance", asyncHandler(AnalyticsController.getCompliance));

/**
 * GET /api/v1/admin/analytics/geographic
 * Geographic distribution of experts by city
 */
router.get("/geographic", asyncHandler(AnalyticsController.getGeographic));

/**
 * GET /api/v1/admin/analytics/realtime
 * Real-time operational dashboard with live metrics
 * Query params: timeRange, severity, components, includeResolved
 */
router.get("/realtime", asyncHandler(AnalyticsController.getRealtime));

/**
 * GET /api/v1/admin/analytics/predictive
 * Advanced predictive analytics and forecasting
 * Query params: horizonDays, confidenceLevel, includeSeasonality, includeHolidays
 */
router.get("/predictive", asyncHandler(AnalyticsController.getPredictive));

/**
 * GET /api/v1/admin/analytics/escrow
 * Escrow fund analytics and balances
 */
router.get("/escrow", asyncHandler(AnalyticsController.getEscrow));

/**
 * GET /api/v1/admin/analytics/system
 * System health metrics
 */
router.get("/system", asyncHandler(AnalyticsController.getSystemHealth));

/**
 * GET /api/v1/admin/analytics/cache-metrics
 * Cache performance metrics
 */
router.get("/cache-metrics", asyncHandler(AnalyticsController.getCacheMetrics));

/**
 * POST /api/v1/admin/analytics/cache-metrics/reset
 * Reset cache performance metrics
 */
router.post("/cache-metrics/reset", asyncHandler(AnalyticsController.resetCacheMetrics));

export default router;
