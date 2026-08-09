import { Router } from "express";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { VerificationController } from "./verification.controller.js";

const router = Router();

// All admin verification routes require authentication + ADMIN role
router.use(authenticate, requireAdmin);

/**
 * GET /admin-verification/queue
 * List all pending expert verification requests (paginated)
 */
router.get("/queue", asyncHandler(VerificationController.listPending));

/**
 * GET /admin-verification/:id
 * Get a single verification request with full expert details
 */
router.get("/:id", asyncHandler(VerificationController.getOne));

/**
 * PATCH /admin-verification/:id/approve
 * Approve an expert — sets status to VERIFIED, sends approval email
 */
router.patch("/:id/approve", asyncHandler(VerificationController.approve));

/**
 * PATCH /admin-verification/:id/reject
 * Reject an expert — sets status to REJECTED, sends rejection email with reason
 */
router.patch("/:id/reject", asyncHandler(VerificationController.reject));

/**
 * POST /admin-verification/:id/remind
 * Send a reminder email to the expert to upload missing documents
 */
router.post("/:id/remind", asyncHandler(VerificationController.sendReminder));

/**
 * GET /admin-verification/:id/document-stream?key=<objectKey>
 * Fetch, decrypt, and stream a document for admin preview
 */
router.get("/:id/document-stream", asyncHandler(VerificationController.streamDocument));

/**
 * POST /admin-verification/:id/request-corrections
 * Notify the expert that corrections are needed, with specific notes
 */
router.post("/:id/request-corrections", asyncHandler(VerificationController.requestCorrections));

export default router;
