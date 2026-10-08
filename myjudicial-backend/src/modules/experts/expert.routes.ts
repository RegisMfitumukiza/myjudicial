import { getErrorMessage } from "../../shared/utils/i18n-messages.js";
import { Router } from "express";
import { authenticate, requireExpert } from "../../shared/middleware/authenticate.js";
import { validate, validateQuery } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { LegalSpecialty } from "../../generated/prisma/client.js";

// Profile
import { ProfileController } from "./profile/profile.controller.js";
import { createProfileSchema, updateProfileSchema } from "./profile/profile.schemas.js";

// Education
import { EducationController } from "./education/education.controller.js";
import { createEducationSchema, updateEducationSchema } from "./education/education.schemas.js";

// Certifications
import { CertificationsController } from "./certifications/certifications.controller.js";
import { createCertificationSchema, updateCertificationSchema } from "./certifications/certifications.schemas.js";

// Availability
import { AvailabilityController } from "./availability/availability.controller.js";
import { upsertAvailabilitySchema, upsertAvailabilityWithBlocksSchema, updatePresenceSchema } from "./availability/availability.schemas.js";

// Availability Overrides
import { OverridesController } from "./availability-overrides/overrides.controller.js";
import { 
  createOverrideSchema, 
  updateOverrideSchema, 
  bulkCreateOverridesSchema,
  listOverridesSchema 
} from "./availability-overrides/overrides.schemas.js";

// Schedule Settings
import { ScheduleSettingsController } from "./schedule-settings/schedule-settings.controller.js";
import { updateScheduleSettingsSchema } from "./schedule-settings/schedule-settings.schemas.js";

// Services (LegalService)
import { ServicesController } from "./services/services.controller.js";
import { createServiceSchema, updateServiceSchema } from "./services/services.schemas.js";

// Compliance
import { ComplianceController } from "./compliance/compliance.controller.js";

// Statistics
import { StatisticsController } from "./statistics/statistics.controller.js";

// Earnings
import { EarningsController } from "./earnings/earnings.controller.js";

// Onboarding
import { OnboardingController } from "./onboarding/onboarding.controller.js";
import { completeStepSchema, skipStepSchema, updateProgressSchema, saveDraftSchema } from "./onboarding/onboarding.schemas.js";

// Photo
import { PhotoController } from "./photo/photo.controller.js";

// Referral
import { ReferralController } from "./referral/referral.controller.js";

// Quotations
import quotationRoutes from "./quotations/quotations.routes.js";


// Verification
import { VerificationController } from "./verification/verification.controller.js";
import { submitVerificationSchema } from "./verification/verification.schemas.js";
import { avatarUpload, encryptedFilesUpload } from "../../shared/middleware/upload.js";

// Landing page
import { LandingService } from "./landing/landing.service.js";

// Search functionality (reuse map-search service)
import { MapSearchService } from "../map-search/services/map-search.service.js";
import { sendPaginated, sendSuccess } from "../../shared/utils/response.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const router = Router();

/* ── Health ── */
router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, module: "experts" });
});

/* ── Search/List Experts ── */
router.get("/", asyncHandler(async (req, res, next) => {
  try {
    const {
      lat,
      lng,
      radius,
      specialty,
      specialties: rawSpecialties,
      limit = 50,
      page = 1,
      search,
      sort,
      minRating,
      minYearsExperience,
      availableToday,
      today,
      instantConsult,
    } = req.query;

    const rawSpec = rawSpecialties || specialty;
    let parsedSpecialties: LegalSpecialty[] | undefined;
    if (rawSpec) {
      const items = Array.isArray(rawSpec)
        ? rawSpec.flatMap((s) => String(s).split(","))
        : String(rawSpec).split(",");
      const cleaned = items
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0) as LegalSpecialty[];
      if (cleaned.length > 0) {
        parsedSpecialties = cleaned;
      }
    }

    const isAvailableToday =
      availableToday === "true" ||
      availableToday === "1" ||
      today === "true" ||
      today === "1";

    const dto = {
      latitude: lat ? parseFloat(lat as string) : -1.9441,
      longitude: lng ? parseFloat(lng as string) : 30.0619,
      radiusKm: radius ? parseFloat(radius as string) : 50,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sort: (sort as string || "NEAREST") as "NEAREST" | "RECOMMENDED" | "HIGHEST_RATED" | "MOST_EXPERIENCED" | "MOST_REVIEWED" | "AVAILABLE_NOW",
      filters: {
        specialties: parsedSpecialties,
        includeOnLeave: false,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
        minYearsExperience: minYearsExperience ? parseInt(minYearsExperience as string, 10) : undefined,
        availability: isAvailableToday ? ("AVAILABLE_TODAY" as const) : undefined,
        instantConsult: instantConsult === "true" || instantConsult === "1" ? true : undefined,
      },
      search: search as string | undefined,
    };

    const { experts, pagination } = await MapSearchService.searchNearby(dto);

    const transformedExperts = experts.map(expert => ({
      id: expert.id,
      firstName: expert.fullName.split(' ')[0],
      lastName: expert.fullName.split(' ').slice(1).join(' ') || expert.fullName.split(' ')[0],
      email: '',
      bio: '',
      hourlyRate: expert.baseConsultationFee,
      currency: expert.currency,
      yearsExperience: expert.yearsOfExperience || 0,
      languages: expert.languages,
      specialties: expert.specialties,
      rating: expert.rating,
      reviewCount: expert.reviewCount,
      avatarObjectKey: expert.profileImage,
      avatarUrl: expert.avatarUrl,
      status: expert.verified ? 'VERIFIED' : 'PENDING_VERIFICATION',
      city: expert.city,
      latitude: expert.latitude,
      longitude: expert.longitude,
      distance: expert.distanceKm,
      verified: expert.verified,
    }));

    sendPaginated(res, transformedExperts, pagination, "Experts retrieved successfully");
  } catch (error) {
    next(error);
  }
}));

/* ═══════════════════════════════════════════
   LANDING PAGE ROUTES — no auth required
═══════════════════════════════════════════ */

router.get("/stats/public", asyncHandler(async (_req, res, next) => {
  try {
    const stats = await LandingService.getPublicStats();
    sendSuccess(res, stats, "Platform stats retrieved");
  } catch (error) {
    next(error);
  }
}));

router.get("/practice-areas", asyncHandler(async (_req, res, next) => {
  try {
    const areas = await LandingService.getPracticeAreas();
    sendSuccess(res, areas, "Practice areas retrieved");
  } catch (error) {
    next(error);
  }
}));

router.get("/newest", asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 6;
    const experts = await LandingService.getNewest(limit);
    sendSuccess(res, experts, "Newest experts retrieved");
  } catch (error) {
    next(error);
  }
}));

// GET /experts/most-booked — experts ranked by completed bookings
router.get("/most-booked", asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 6;
    const experts = await LandingService.getMostBooked(limit);
    sendSuccess(res, experts, "Most booked experts retrieved");
  } catch (error) {
    next(error);
  }
}));

// GET /experts/highest-rated — top experts by rating
router.get("/highest-rated", asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 6;
    const experts = await LandingService.getHighestRated(limit);
    sendSuccess(res, experts, "Highest rated experts retrieved");
  } catch (error) {
    next(error);
  }
}));

// GET /experts/available-today — experts with availability today
router.get("/available-today", asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 6;
    const experts = await LandingService.getAvailableToday(limit);
    sendSuccess(res, experts, "Available today experts retrieved");
  } catch (error) {
    next(error);
  }
}));

// GET /reviews/featured — verified consultation reviews for landing page
router.get("/reviews/featured", asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 6;
    const reviews = await LandingService.getFeaturedReviews(limit);
    sendSuccess(res, reviews, "Featured reviews retrieved");
  } catch (error) {
    next(error);
  }
}));

// GET /experts/recommended — top-rated + most booked blend for the homepage
router.get("/recommended", asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 8;
    const experts = await LandingService.getRecommended(limit);
    sendSuccess(res, experts, "Recommended experts retrieved");
  } catch (error) {
    next(error);
  }
}));

// GET /experts/legal-services — active legal services for homepage discovery
router.get("/legal-services", asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 8;
    const services = await LandingService.getLegalServices(limit);
    sendSuccess(res, services, "Legal services retrieved");
  } catch (error) {
    next(error);
  }
}));

// GET /experts/popular-searches — aggregated search categories for landing page
router.get("/popular-searches", asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 6;
    const searches = await LandingService.getPopularSearches(limit);
    sendSuccess(res, searches, "Popular searches retrieved");
  } catch (error) {
    next(error);
  }
}));


/* ═══════════════════════════════════════════
   PUBLIC ROUTES — no auth required
═══════════════════════════════════════════ */

// GET /experts/:id/profile
router.get("/:id/profile", asyncHandler(ProfileController.getPublic));

// GET /experts/:expertId/services
router.get("/:expertId/services", asyncHandler(ServicesController.getPublic));

// GET /experts/:expertId/statistics
router.get("/:expertId/statistics", asyncHandler(StatisticsController.getPublicStats));

/* ═══════════════════════════════════════════
   PROTECTED ROUTES — EXPERT role required
═══════════════════════════════════════════ */

// ── Profile ──────────────────────────────
router.post(
  "/profile",
  authenticate, requireExpert,
  validate(createProfileSchema),
  asyncHandler(ProfileController.create)
);
router.get("/profile/me", authenticate, requireExpert, asyncHandler(ProfileController.getMe));
router.patch(
  "/profile/me",
  authenticate, requireExpert,
  validate(updateProfileSchema),
  asyncHandler(ProfileController.update)
);

// ── Schedule Settings ────────────────────────────
router.get("/schedule-settings", authenticate, requireExpert, asyncHandler(ScheduleSettingsController.get));
router.patch(
  "/schedule-settings",
  authenticate, requireExpert,
  validate(updateScheduleSettingsSchema),
  asyncHandler(ScheduleSettingsController.update)
);

// ── Services ─────────────────────────────
router.get("/services", authenticate, requireExpert, asyncHandler(ServicesController.getAll));
router.post(
  "/services",
  authenticate, requireExpert,
  validate(createServiceSchema),
  asyncHandler(ServicesController.create)
);
// Static route must come before parameterized routes
router.put("/services/reorder", authenticate, requireExpert, asyncHandler(ServicesController.reorder));
router.patch(
  "/services/:id",
  authenticate, requireExpert,
  validate(updateServiceSchema),
  asyncHandler(ServicesController.update)
);
router.delete("/services/:id", authenticate, requireExpert, asyncHandler(ServicesController.delete));

// ── Education ────────────────────────────
router.get("/education", authenticate, requireExpert, asyncHandler(EducationController.getAll));
router.post(
  "/education",
  authenticate, requireExpert,
  validate(createEducationSchema),
  asyncHandler(EducationController.create)
);
router.patch(
  "/education/:id",
  authenticate, requireExpert,
  validate(updateEducationSchema),
  asyncHandler(EducationController.update)
);
router.delete("/education/:id", authenticate, requireExpert, asyncHandler(EducationController.delete));

// ── Certifications ────────────────────────
router.get("/certifications", authenticate, requireExpert, asyncHandler(CertificationsController.getAll));
router.post(
  "/certifications",
  authenticate, requireExpert,
  validate(createCertificationSchema),
  asyncHandler(CertificationsController.create)
);
router.patch(
  "/certifications/:id",
  authenticate, requireExpert,
  validate(updateCertificationSchema),
  asyncHandler(CertificationsController.update)
);
router.delete("/certifications/:id", authenticate, requireExpert, asyncHandler(CertificationsController.delete));

// ── Availability ──────────────────────────
router.get("/availability", authenticate, requireExpert, asyncHandler(AvailabilityController.get));
router.patch(
  "/availability",
  authenticate, requireExpert,
  validate(upsertAvailabilitySchema),
  asyncHandler(AvailabilityController.upsert)
);
// Phase 4: Time blocks support
router.patch(
  "/availability/v2",
  authenticate, requireExpert,
  validate(upsertAvailabilityWithBlocksSchema),
  asyncHandler(AvailabilityController.upsertWithBlocks)
);
router.patch(
  "/availability/presence",
  authenticate, requireExpert,
  validate(updatePresenceSchema),
  asyncHandler(AvailabilityController.updatePresence)
);

// ── Availability Overrides ────────────────
router.get(
  "/availability/overrides",
  authenticate, requireExpert,
  validateQuery(listOverridesSchema),
  asyncHandler(OverridesController.list)
);
router.post(
  "/availability/overrides",
  authenticate, requireExpert,
  validate(createOverrideSchema),
  asyncHandler(OverridesController.create)
);
router.patch(
  "/availability/overrides/:id",
  authenticate, requireExpert,
  validate(updateOverrideSchema),
  asyncHandler(OverridesController.update)
);
router.delete(
  "/availability/overrides/:id",
  authenticate, requireExpert,
  asyncHandler(OverridesController.delete)
);
router.post(
  "/availability/overrides/bulk",
  authenticate, requireExpert,
  validate(bulkCreateOverridesSchema),
  asyncHandler(OverridesController.bulkCreate)
);
router.delete(
  "/availability/overrides/range",
  authenticate, requireExpert,
  asyncHandler(OverridesController.deleteRange)
);

// ── Compliance ────────────────────────────
router.get("/compliance", authenticate, requireExpert, asyncHandler(ComplianceController.getStatus));
router.patch(
  "/compliance/credentials-expiry",
  authenticate, requireExpert,
  asyncHandler(ComplianceController.updateExpiry)
);

// ── Statistics ────────────────────────────
router.get("/statistics", authenticate, requireExpert, asyncHandler(StatisticsController.getMyStats));

// ── Earnings ──────────────────────────────
router.get("/earnings", authenticate, requireExpert, asyncHandler(EarningsController.getEarnings));

// ── Onboarding ────────────────────────────
router.get("/onboarding", authenticate, requireExpert, asyncHandler(OnboardingController.getProgress));
router.get("/onboarding/draft", authenticate, requireExpert, asyncHandler(OnboardingController.getDraft));
router.post(
  "/onboarding/draft",
  authenticate, requireExpert,
  validate(saveDraftSchema),
  asyncHandler(OnboardingController.saveDraft)
);
router.delete("/onboarding/draft", authenticate, requireExpert, asyncHandler(OnboardingController.clearDraft));
router.post(
  "/onboarding/complete-step",
  authenticate, requireExpert,
  validate(completeStepSchema),
  asyncHandler(OnboardingController.completeStep)
);
router.post(
  "/onboarding/skip-step",
  authenticate, requireExpert,
  validate(skipStepSchema),
  asyncHandler(OnboardingController.skipStep)
);
router.patch(
  "/onboarding/progress",
  authenticate, requireExpert,
  validate(updateProgressSchema),
  asyncHandler(OnboardingController.updateProgress)
);
router.post("/onboarding/reset", authenticate, requireExpert, asyncHandler(OnboardingController.resetOnboarding));

// ── Photo Upload ──────────────────────────
router.post(
  "/photo/profile",
  authenticate, requireExpert,
  avatarUpload,
  asyncHandler(PhotoController.uploadProfilePhoto)
);
router.delete("/photo/profile", authenticate, requireExpert, asyncHandler(PhotoController.removeProfilePhoto));
router.get("/photo/profile/url", authenticate, requireExpert, asyncHandler(PhotoController.getProfilePhotoUrl));

// ── Reviews ────────────────────────────────
router.get("/reviews", authenticate, requireExpert, asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "newest" } = req.query;
    const profile = await prisma.expertProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    
    // Import ReviewService
    const { ReviewService } = await import("../reviews/review.service.js");
    const result = await ReviewService.listExpertReviews({
      expertId: profile.id,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      sort: sort as "newest" | "oldest" | "highest" | "lowest"
    });
    
    sendPaginated(res, result.reviews, {
      ...result.pagination,
      totalPages: result.pagination.pages,
      hasNext: result.pagination.page < result.pagination.pages,
      hasPrev: result.pagination.page > 1
    }, "Reviews retrieved");
  } catch (error) {
    next(error);
  }
}));

router.get("/reviews/summary", authenticate, requireExpert, asyncHandler(async (req, res, next) => {
  try {
    const profile = await prisma.expertProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    
    const { ReviewService } = await import("../reviews/review.service.js");
    const data = await ReviewService.getExpertSummaryStats(profile.id);
    
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}));

router.get("/reviews/distribution", authenticate, requireExpert, asyncHandler(async (req, res, next) => {
  try {
    const profile = await prisma.expertProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    
    const { ReviewService } = await import("../reviews/review.service.js");
    const data = await ReviewService.getExpertRatingDistribution(profile.id);
    
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}));

// ── Messages ───────────────────────────────
router.get("/messages", authenticate, requireExpert, asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const profile = await prisma.expertProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    
    // Import ConversationService
    const { ConversationService } = await import("../chat/services/conversation.service.js");
    const result = await ConversationService.listUserConversations(req.user!.id, {
      page: parseInt(page as string, 10), 
      limit: parseInt(limit as string, 10)
    });
    
    sendPaginated(res, result.data, {
      ...result.pagination,
      hasNext: result.pagination.page < result.pagination.totalPages,
      hasPrev: result.pagination.page > 1
    }, "Conversations retrieved");
  } catch (error) {
    next(error);
  }
}));

router.get("/messages/:conversationId", authenticate, requireExpert, asyncHandler(async (req, res, next) => {
  try {
    const conversationId = req.params.conversationId as string;
    const { page = 1, limit = 50 } = req.query;
    
    // Import MessageService
    const { MessageService } = await import("../chat/services/message.service.js");
    const result = await MessageService.listMessages(conversationId, req.user!.id, req.user!.role, {
      limit: parseInt(limit as string, 10)
    });
    
    sendSuccess(res, result, "Messages retrieved");
  } catch (error) {
    next(error);
  }
}));

router.post("/messages", authenticate, requireExpert, asyncHandler(async (req, res, next) => {
  try {
    const { conversationId, content } = req.body;
    
    // Import MessageService
    const { MessageService } = await import("../chat/services/message.service.js");
    const message = await MessageService.sendMessage({
      conversationId,
      senderId: req.user!.id,
      senderRole: req.user!.role,
      messageType: "TEXT",
      content
    });
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
}));

// ── Verification ──────────────────────────
router.post(
  "/verification/submit",
  authenticate, requireExpert,
  encryptedFilesUpload,
  validate(submitVerificationSchema),
  asyncHandler(VerificationController.submit)
);

// ── Quotations ────────────────────────────
router.use("/quotations", quotationRoutes);

export default router;
