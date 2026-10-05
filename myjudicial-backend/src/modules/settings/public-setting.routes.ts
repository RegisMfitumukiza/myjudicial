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
        platformFeePercent: s.platformFeePercent,
        socialLinks: s.socialLinks,
        supportEmail: s.supportEmail,
        hotlinePhone: s.hotlinePhone,
        whatsappNumber: s.whatsappNumber,
        officeBuilding: s.officeBuilding,
        officeStreet: s.officeStreet,
        officeDistrict: s.officeDistrict,
        officePoBox: s.officePoBox,
        supportWorkingHours: s.supportWorkingHours,
        aboutVision: s.aboutVision,
        aboutMission: s.aboutMission,
        aboutStory: s.aboutStory,
        aboutCoreValues: s.aboutCoreValues,
        aboutMilestones: s.aboutMilestones,
        careersEmail: s.careersEmail,
        careersHiringStatus: s.careersHiringStatus,
        careersOpenRoles: s.careersOpenRoles,
        supplementalFaqs: s.supplementalFaqs,
        legalEffectiveDate: s.legalEffectiveDate,
        dpoContactEmail: s.dpoContactEmail,
        ogImageUrl: s.ogImageUrl,
        seoTitle: s.seoTitle,
        seoDescription: s.seoDescription,
        seoKeywords: s.seoKeywords,
        platformTagline: s.platformTagline,
        copyrightNotice: s.copyrightNotice,
        maintenanceNotice: s.maintenanceNotice,
        legalDisclaimer: s.legalDisclaimer,
        minAdvanceBookingHours: s.minAdvanceBookingHours,
        cancellationGraceHours: s.cancellationGraceHours,
      },
    });
  })
);

export default router;
