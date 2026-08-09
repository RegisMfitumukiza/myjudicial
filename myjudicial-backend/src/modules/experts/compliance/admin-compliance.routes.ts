import { Router } from "express";
import { authenticate, requireAdmin } from "../../../shared/middleware/authenticate.js";
import { validate } from "../../../shared/middleware/validate.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { AdminComplianceController } from "./admin-compliance.controller.js";
import { extendCredentialsSchema } from "./admin-compliance.schemas.js";

const router = Router();

// Apply admin authentication to all routes
router.use(authenticate, requireAdmin);

/**
 * GET /api/v1/admin/compliance/overview
 * Get compliance statistics dashboard
 */
router.get("/overview", asyncHandler(AdminComplianceController.getOverview));

/**
 * GET /api/v1/admin/compliance/expiring
 * List experts with credentials expiring within threshold (default 30 days)
 */
router.get("/expiring", asyncHandler(AdminComplianceController.getExpiringCredentials));

/**
 * GET /api/v1/admin/compliance/expired
 * List experts with expired credentials
 */
router.get("/expired", asyncHandler(AdminComplianceController.getExpiredCredentials));

/**
 * GET /api/v1/admin/compliance/suspended
 * List experts suspended for compliance issues
 */
router.get("/suspended", asyncHandler(AdminComplianceController.getSuspendedExperts));

/**
 * POST /api/v1/admin/compliance/:id/send-warning
 * Send compliance warning email to expert
 */
router.post("/:id/send-warning", asyncHandler(AdminComplianceController.sendWarning));

/**
 * POST /api/v1/admin/compliance/:id/extend
 * Manually extend expert credentials expiry date
 */
router.post(
  "/:id/extend",
  validate(extendCredentialsSchema),
  asyncHandler(AdminComplianceController.extendCredentials)
);

export default router;
