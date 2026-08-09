import { Router } from "express";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";
import { validate } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { AdminReviewController } from "./admin-review.controller.js";
import { moderateReviewSchema, deleteReviewSchema } from "./admin-review.schemas.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/stats", asyncHandler(AdminReviewController.getStats));
router.get("/", asyncHandler(AdminReviewController.list));
router.get("/reports", asyncHandler(AdminReviewController.listReports));
router.get("/:id", asyncHandler(AdminReviewController.getById));
router.patch("/:id/moderate", validate(moderateReviewSchema), asyncHandler(AdminReviewController.moderate));
router.patch("/reports/:id/resolve", asyncHandler(AdminReviewController.resolveReport));
router.delete("/:id", validate(deleteReviewSchema), asyncHandler(AdminReviewController.deleteReview));

export default router;
