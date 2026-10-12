import { Router } from "express";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";
import { validate, validateQuery } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { AdminClientController } from "./admin-client.controller.js";
import {
  listClientsSchema,
  updateClientStatusSchema,
} from "./admin-client.schemas.js";

const router = Router();

// Apply admin authentication to all client admin routes
router.use(authenticate, requireAdmin);

/**
 * GET /api/v1/admin/clients/stats
 * Aggregated client metrics (total, active, new this month, total bookings, lifetime spend)
 */
router.get("/stats", asyncHandler(AdminClientController.getStats));

/**
 * GET /api/v1/admin/clients
 * List clients with filters, search, activity metrics, and pagination
 */
router.get("/", validateQuery(listClientsSchema), asyncHandler(AdminClientController.list));

/**
 * GET /api/v1/admin/clients/:id
 * Retrieve client details, lifetime spend, booking history, and reviews
 */
router.get("/:id", asyncHandler(AdminClientController.getById));

/**
 * PATCH /api/v1/admin/clients/:id/status
 * Update client account status (e.g., ACTIVE, SUSPENDED)
 */
router.patch(
  "/:id/status",
  validate(updateClientStatusSchema),
  asyncHandler(AdminClientController.updateStatus)
);

export default router;
