import { Router } from "express";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";
import { validate, validateQuery } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { BookingController } from "./booking.controller.js";
import {
  adminListBookingsSchema,
  adminRefundSchema,
  adminStatsSchema,
} from "./booking.schemas.js";

const router = Router();

// Apply admin protection to all routes in this router
router.use(authenticate, requireAdmin);

// GET /api/v1/admin/bookings
router.get(
  "/",
  validateQuery(adminListBookingsSchema),
  asyncHandler(BookingController.adminListBookings)
);

// GET /api/v1/admin/bookings/stats
router.get(
  "/stats",
  validateQuery(adminStatsSchema),
  asyncHandler(BookingController.adminGetStats)
);

// PATCH /api/v1/admin/bookings/:id/complete
router.patch(
  "/:id/complete",
  asyncHandler(BookingController.adminCompleteBooking)
);

// PATCH /api/v1/admin/bookings/:id/refund
router.patch(
  "/:id/refund",
  validate(adminRefundSchema),
  asyncHandler(BookingController.adminRefundBooking)
);

export default router;
