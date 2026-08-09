/**
 * Drill-Down Routes
 * 
 * Endpoints for drilling down into aggregated metrics
 */

import { Router } from "express";
import { DrillDownController } from "../controllers/drill-down.controller.js";
import { authenticate } from "../../../shared/middleware/authenticate.js";
import { requireAdmin } from "../../../shared/middleware/requireAdmin.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

/**
 * GET /api/v1/admin/analytics/drill-down/bookings
 * Drill down into booking metrics with filtering and pagination
 * Query params: status, startDate, endDate, citizenId, expertId, page, limit, sortBy, sortOrder
 */
router.get("/bookings", asyncHandler(DrillDownController.drillDownBookings));

/**
 * GET /api/v1/admin/analytics/drill-down/bookings/:bookingId
 * Get detailed view of a single booking
 */
router.get("/bookings/:bookingId", asyncHandler(DrillDownController.getBookingDetail));

export default router;
