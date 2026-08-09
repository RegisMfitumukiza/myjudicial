import { Router } from "express";
import { authenticate, requireExpert } from "../../../shared/middleware/authenticate.js";
import { validate } from "../../../shared/middleware/validate.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";
import { QuotationsController } from "./quotations.controller.js";
import {
  createQuotationSchema,
  updateQuotationSchema,
  updateQuotationStatusSchema,
} from "./quotations.schemas.js";

const router = Router();

router.use(authenticate, requireExpert);

router.get("/", asyncHandler(QuotationsController.getAll));
router.get("/:id", asyncHandler(QuotationsController.getById));
router.post("/", validate(createQuotationSchema), asyncHandler(QuotationsController.create));
router.patch("/:id", validate(updateQuotationSchema), asyncHandler(QuotationsController.update));
router.patch("/:id/status", validate(updateQuotationStatusSchema), asyncHandler(QuotationsController.updateStatus));
router.delete("/:id", asyncHandler(QuotationsController.delete));

export default router;
