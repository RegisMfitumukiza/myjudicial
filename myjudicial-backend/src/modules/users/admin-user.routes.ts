import { Router } from "express";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";
import { validate } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { AdminUserController } from "./admin-user.controller.js";
import { updateStatusSchema, deleteUserSchema } from "./admin-user.schemas.js";

const router = Router();

// Apply admin authentication to all routes
router.use(authenticate, requireAdmin);

/**
 * GET /api/v1/admin/users/stats
 * Get user statistics
 */
router.get("/stats", asyncHandler(AdminUserController.getStats));

/**
 * GET /api/v1/admin/users
 * List all users with filters and pagination
 */
router.get("/", asyncHandler(AdminUserController.list));

/**
 * GET /api/v1/admin/users/:id
 * Get user details
 */
router.get("/:id", asyncHandler(AdminUserController.getById));

/**
 * PATCH /api/v1/admin/users/:id/status
 * Update user account status
 */
router.patch(
  "/:id/status",
  validate(updateStatusSchema),
  asyncHandler(AdminUserController.updateStatus)
);

/**
 * DELETE /api/v1/admin/users/:id
 * Delete user account (soft delete)
 */
router.delete(
  "/:id",
  validate(deleteUserSchema),
  asyncHandler(AdminUserController.deleteUser)
);

export default router;
