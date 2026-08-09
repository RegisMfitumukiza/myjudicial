import { Router } from "express";
import { AdminNotificationController } from "./admin-notification.controller.js";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/admin/notifications/stats
 * @desc    Get notification statistics
 * @access  Admin only
 */
router.get("/stats", AdminNotificationController.getStats);

/**
 * @route   GET /api/v1/admin/notifications/logs
 * @desc    List notification logs with filters
 * @access  Admin only
 */
router.get("/logs", AdminNotificationController.listLogs);

/**
 * @route   POST /api/v1/admin/notifications/broadcast
 * @desc    Send broadcast notification
 * @access  Admin only
 */
router.post("/broadcast", AdminNotificationController.sendBroadcast);

/**
 * @route   GET /api/v1/admin/notifications/logs/:id
 * @desc    Get single notification log by ID
 * @access  Admin only
 */
router.get("/logs/:id", AdminNotificationController.getLogById);

export default router;
