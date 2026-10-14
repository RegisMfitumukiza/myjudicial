import { Router } from "express";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";
import { validate, validateQuery } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { AdminExpertController } from "./admin-expert.controller.js";
import {
  listExpertsSchema,
  suspendExpertSchema,
  updateExpertStatusSchema,
  setCredentialDatesSchema,
} from "./admin-expert.schemas.js";

const router = Router();

/**
 * GET /api/v1/admin/experts
 * List all experts with filters and pagination
 * Admin only
 */
router.get(
  "/",
  authenticate,
  requireAdmin,
  validateQuery(listExpertsSchema),
  asyncHandler(AdminExpertController.list)
);

/**
 * GET /api/v1/admin/experts/:id
 * Get detailed expert information
 * Admin only
 */
router.get(
  "/:id",
  authenticate,
  requireAdmin,
  asyncHandler(AdminExpertController.getById)
);

/**
 * PATCH /api/v1/admin/experts/:id/suspend
 * Suspend an expert account (hides map pin, prevents bookings)
 * Admin only
 */
router.patch(
  "/:id/suspend",
  authenticate,
  requireAdmin,
  validate(suspendExpertSchema),
  asyncHandler(AdminExpertController.suspend)
);

/**
 * PATCH /api/v1/admin/experts/:id/activate
 * Reactivate a suspended expert account
 * Admin only
 */
router.patch(
  "/:id/activate",
  authenticate,
  requireAdmin,
  asyncHandler(AdminExpertController.activate)
);

/**
 * PATCH /api/v1/admin/experts/:id/status
 * Update expert account status
 * Admin only
 */
router.patch(
  "/:id/status",
  authenticate,
  requireAdmin,
  validate(updateExpertStatusSchema),
  asyncHandler(AdminExpertController.updateStatus)
);

/**
 * GET /api/v1/admin/experts/:id/bookings
 * Get all bookings for a specific expert
 * Admin only
 */
router.get(
  "/:id/bookings",
  authenticate,
  requireAdmin,
  asyncHandler(AdminExpertController.getExpertBookings)
);

/**
 * POST /api/v1/admin/experts/:id/send-verification-reminder
 * Send reminder email to expert to submit verification documents
 * Admin only
 */
router.post(
  "/:id/send-verification-reminder",
  authenticate,
  requireAdmin,
  asyncHandler(AdminExpertController.sendVerificationReminder)
);

/**
 * PATCH /api/v1/admin/experts/:id/reset-to-resubmit
 * Reset a REJECTED expert back to DRAFT so they can resubmit verification documents
 * Admin only
 */
router.patch(
  "/:id/reset-to-resubmit",
  authenticate,
  requireAdmin,
  asyncHandler(AdminExpertController.resetToResubmit)
);

/**
 * PATCH /api/v1/admin/experts/:id/credentials
 * Direct backfill or update of validity dates on expert credentials
 * Admin only
 */
router.patch(
  "/:id/credentials",
  authenticate,
  requireAdmin,
  validate(setCredentialDatesSchema),
  asyncHandler(AdminExpertController.setCredentialDates)
);

export default router;

