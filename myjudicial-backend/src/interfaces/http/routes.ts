import { Router } from "express";

import authRoutes from "../../modules/auth/auth.routes.js";
import geocodingRoutes from "../../modules/geocoding/geocoding.routes.js";
import verificationRoutes from "../../modules/admin-verification/verification.routes.js";
import bookingRoutes from "../../modules/bookings/booking.routes.js";
import adminBookingRoutes from "../../modules/bookings/admin-booking.routes.js";
import expertRoutes from "../../modules/experts/expert.routes.js";
import adminExpertRoutes from "../../modules/experts/admin-expert.routes.js";
import adminComplianceRoutes from "../../modules/experts/compliance/admin-compliance.routes.js";
import mapSearchRoutes from "../../modules/map-search/routes/map-search.routes.js";
import userRoutes from "../../modules/users/user.routes.js";
import adminUserRoutes from "../../modules/users/admin-user.routes.js";
import fileStorageRoutes from "../../modules/file-storage/routes/file-storage.routes.js";
import reviewRoutes from "../../modules/reviews/review.routes.js";
import adminReviewRoutes from "../../modules/reviews/admin-review.routes.js";
import chatRoutes from "../../modules/chat/routes/index.js";
import analyticsRoutes from "../../modules/admin-analytics/routes/analytics.routes.js";
import adminAuditRoutes from "../../modules/audit/admin-audit.routes.js";
import adminFinanceRoutes from "../../modules/payments/admin-finance.routes.js";
import adminNotificationRoutes from "../../modules/notifications/admin-notification.routes.js";
import notificationRoutes from "../../modules/notifications/notification.routes.js";
import adminSettingRoutes from "../../modules/settings/admin-setting.routes.js";
import publicSettingRoutes from "../../modules/settings/public-setting.routes.js";
import aiRoutes from "../../modules/ai/ai.routes.js";
import savedExpertRoutes from "../../modules/saved-experts/saved-expert.routes.js";
import specialtyRoutes from "../../modules/specialties/specialty.routes.js";

const router = Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "myjudicial-api",
    version: "v1",
  });
});

router.use("/auth", authRoutes);
router.use("/geocoding", geocodingRoutes);
router.use("/users", userRoutes);
router.use("/admin/users", adminUserRoutes);
router.use("/experts", expertRoutes);
router.use("/bookings", bookingRoutes);
router.use("/admin/bookings", adminBookingRoutes);
router.use("/admin/experts", adminExpertRoutes);
router.use("/admin/compliance", adminComplianceRoutes);
router.use("/admin/audit-logs", adminAuditRoutes);
router.use("/admin/finance", adminFinanceRoutes);
router.use("/admin/notifications", adminNotificationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin-verification", verificationRoutes);
router.use("/map-search", mapSearchRoutes);
router.use("/search", mapSearchRoutes);
router.use("/search-map", mapSearchRoutes);
router.use("/files", fileStorageRoutes);
router.use("/", reviewRoutes);
router.use("/chat", chatRoutes);
router.use("/admin/reviews", adminReviewRoutes);
router.use("/admin/analytics", analyticsRoutes);
router.use("/admin/settings", adminSettingRoutes);
router.use("/settings", publicSettingRoutes);
router.use("/ai", aiRoutes);
router.use("/saved-experts", savedExpertRoutes);
router.use("/specialties", specialtyRoutes);

export default router;
