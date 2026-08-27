import { Router } from "express";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";
import { validate, validateQuery } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { SpecialtyController } from "./specialty.controller.js";
import {
  createSpecialtySchema,
  updateSpecialtySchema,
  listSpecialtiesQuerySchema,
} from "./specialty.schemas.js";

const router = Router();

// ── Public: active specialties (for sign-up, expert profile) ──
router.get("/", asyncHandler(SpecialtyController.listActive));

// ── Admin: full CRUD ──
router.get(
  "/admin",
  authenticate,
  requireAdmin,
  validateQuery(listSpecialtiesQuerySchema),
  asyncHandler(SpecialtyController.list)
);

router.get(
  "/admin/groups",
  authenticate,
  requireAdmin,
  asyncHandler(SpecialtyController.getGroups)
);

router.get(
  "/admin/:id",
  authenticate,
  requireAdmin,
  asyncHandler(SpecialtyController.getById)
);

router.post(
  "/admin",
  authenticate,
  requireAdmin,
  validate(createSpecialtySchema),
  asyncHandler(SpecialtyController.create)
);

router.put(
  "/admin/:id",
  authenticate,
  requireAdmin,
  validate(updateSpecialtySchema),
  asyncHandler(SpecialtyController.update)
);

router.patch(
  "/admin/:id/toggle",
  authenticate,
  requireAdmin,
  asyncHandler(SpecialtyController.toggleActive)
);

router.delete(
  "/admin/:id",
  authenticate,
  requireAdmin,
  asyncHandler(SpecialtyController.remove)
);

router.put(
  "/admin/reorder",
  authenticate,
  requireAdmin,
  asyncHandler(SpecialtyController.reorder)
);

export default router;
