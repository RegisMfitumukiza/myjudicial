import { Router } from "express";
import { authenticate, requireAdmin } from "../../../shared/middleware/authenticate.js";
import { validate, validateQuery } from "../../../shared/middleware/validate.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { AdminServiceCategoryController } from "./admin-service-category.controller.js";
import {
  listServiceCategoriesQuerySchema,
  promoteServiceCategorySchema,
  mergeServiceCategorySchema,
} from "./admin-service-category.schemas.js";

const router = Router();

router.get(
  "/",
  authenticate,
  requireAdmin,
  validateQuery(listServiceCategoriesQuerySchema),
  asyncHandler(AdminServiceCategoryController.list)
);

router.post(
  "/promote",
  authenticate,
  requireAdmin,
  validate(promoteServiceCategorySchema),
  asyncHandler(AdminServiceCategoryController.promote)
);

router.post(
  "/merge",
  authenticate,
  requireAdmin,
  validate(mergeServiceCategorySchema),
  asyncHandler(AdminServiceCategoryController.merge)
);

export default router;
