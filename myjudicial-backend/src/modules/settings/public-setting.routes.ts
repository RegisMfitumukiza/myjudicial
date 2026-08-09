import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { AdminSettingService } from "./admin-setting.service.js";

const router = Router();

/**
 * GET /api/v1/settings
 *
 * Public-safe platform settings. Only exposes values the frontend needs to
 * render without authentication (currently the payment mode, which decides
 * whether the booking flow collects Mobile Money at creation time).
 */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const paymentMode = await AdminSettingService.get("paymentMode");
    res.json({ success: true, data: { paymentMode } });
  })
);

export default router;
