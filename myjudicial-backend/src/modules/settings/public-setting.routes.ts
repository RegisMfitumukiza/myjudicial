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
    const all = await AdminSettingService.getAll();
    const s = all.data;
    res.json({
      success: true,
      data: {
        platformName: s.platformName,
        paymentMode: s.paymentMode,
        maintenanceMode: s.maintenanceMode,
        socialLinks: s.socialLinks,
        supportEmail: s.supportEmail,
        hotlinePhone: s.hotlinePhone,
        whatsappNumber: s.whatsappNumber,
        officeBuilding: s.officeBuilding,
        officeStreet: s.officeStreet,
        officeDistrict: s.officeDistrict,
        officePoBox: s.officePoBox,
        aboutVision: s.aboutVision,
        aboutMission: s.aboutMission,
        aboutStory: s.aboutStory,
      },
    });
  })
);

export default router;
