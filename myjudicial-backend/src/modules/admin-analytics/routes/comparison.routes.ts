/**
 * Comparison Routes
 * 
 * Period-over-period comparison endpoints
 */

import { Router } from "express";
import { ComparisonController } from "../controllers/comparison.controller.js";
import { authenticate } from "../../../shared/middleware/authenticate.js";
import { requireAdmin } from "../../../shared/middleware/requireAdmin.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

/**
 * GET /api/v1/admin/analytics/compare/bookings
 * Compare booking analytics across periods
 * Query params: period, startDate, endDate
 */
router.get("/bookings", asyncHandler(ComparisonController.compareBookings));

/**
 * GET /api/v1/admin/analytics/compare/revenue
 * Compare revenue analytics across periods
 * Query params: period, startDate, endDate
 */
router.get("/revenue", asyncHandler(ComparisonController.compareRevenue));

/**
 * GET /api/v1/admin/analytics/compare/users
 * Compare user analytics across periods
 * Query params: period, startDate, endDate
 */
router.get("/users", asyncHandler(ComparisonController.compareUsers));

export default router;
