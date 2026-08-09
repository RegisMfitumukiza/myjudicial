import { Router } from "express";
import { NotificationController } from "./notification.controller.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { validateQuery } from "../../shared/middleware/validate.js";
import { listNotificationsSchema } from "./notification.schemas.js";

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/notifications
 * List notifications for the authenticated user
 */
router.get(
  "/",
  validateQuery(listNotificationsSchema),
  NotificationController.listMyNotifications
);

/**
 * GET /api/v1/notifications/unread-count
 * Unread notification count for the authenticated user
 */
router.get("/unread-count", NotificationController.getUnreadCount);

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all of the authenticated user's notifications as read
 */
router.patch("/read-all", NotificationController.markAllAsRead);

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read (owner only)
 */
router.patch("/:id/read", NotificationController.markAsRead);

export default router;
