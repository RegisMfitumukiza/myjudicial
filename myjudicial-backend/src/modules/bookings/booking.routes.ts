import { Router } from "express";
import { authenticate, requireCitizen, requireAdmin } from "../../shared/middleware/authenticate.js";
import { validate, validateQuery } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { BookingController } from "./booking.controller.js";
import {
  createBookingSchema,
  updateBookingSchema,
  confirmBookingSchema,
  listBookingsSchema,
  cancelBookingSchema,
  getAvailableSlotsSchema,
  retryPaymentSchema,
  rescheduleBookingSchema,
} from "./booking.schemas.js";

const router = Router();

/**
 * Public routes
 */
router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    module: "bookings",
  });
});

/**
 * Protected routes — require authentication
 */

// List all bookings for authenticated user
router.get(
  "/",
  authenticate,
  validateQuery(listBookingsSchema),
  asyncHandler(BookingController.listBookings)
);

// Get available time slots for an expert
router.get(
  "/expert/:id/slots",
  validateQuery(getAvailableSlotsSchema),
  asyncHandler(BookingController.getExpertSlots)
);

// Get a specific booking by ID
router.get(
  "/:id",
  authenticate,
  asyncHandler(BookingController.getBooking)
);

// Create a new booking (client initiates payment)
router.post(
  "/",
  authenticate,
  requireCitizen,
  validate(createBookingSchema),
  asyncHandler(BookingController.createBooking)
);

// Update booking (notes, status, etc.)
router.patch(
  "/:id",
  authenticate,
  validate(updateBookingSchema),
  asyncHandler(BookingController.updateBooking)
);

// Cancel a booking (triggers refund if applicable)
router.post(
  "/:id/cancel",
  authenticate,
  validate(cancelBookingSchema),
  asyncHandler(BookingController.cancelBooking)
);

// Admin-only manual override: confirm a booking whose payment was verified
// out-of-band. Real payment confirmations flow through the Azam Pay webhook
// (POST /payments/webhook) -> EscrowService.lockFunds.
router.post(
  "/:id/confirm",
  authenticate,
  requireAdmin,
  validate(confirmBookingSchema),
  asyncHandler(BookingController.confirmBooking)
);



// Generate LiveKit token to join consultation
router.post(
  "/:id/join",
  authenticate,
  asyncHandler(BookingController.joinConsultation)
);

// Retry payment for a failed/expired booking
router.post(
  "/:id/retry-payment",
  authenticate,
  requireCitizen,
  validate(retryPaymentSchema),
  asyncHandler(BookingController.retryPayment)
);

// Expert accepts a booking request (booking-first flow)
router.post(
  "/:id/accept",
  authenticate,
  asyncHandler(BookingController.acceptBooking)
);

// Reschedule a booking to a new time
router.post(
  "/:id/reschedule",
  authenticate,
  validate(rescheduleBookingSchema),
  asyncHandler(BookingController.rescheduleBooking)
);

// Approve a pending reschedule request
router.post(
  "/:id/approve-reschedule",
  authenticate,
  asyncHandler(BookingController.approveReschedule)
);

// Decline a pending reschedule request
router.post(
  "/:id/decline-reschedule",
  authenticate,
  asyncHandler(BookingController.declineReschedule)
);


export default router;
