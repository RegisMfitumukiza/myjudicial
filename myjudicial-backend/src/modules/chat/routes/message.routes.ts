import { Router } from "express";
import { MessageController } from "../controllers/message.controller.js";
import { authenticate } from "../../../shared/middleware/authenticate.js";
import { validate } from "../../../shared/middleware/validate.js";
import { rateLimit } from "express-rate-limit";
import { sendMessageSchema } from "../schemas/message.schemas.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Rate limit for sending messages (prevent spam)
const messageSendLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: "Too many messages sent. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /messages
 * Send a message
 */
router.post(
  "/",
  messageSendLimiter,
  validate(sendMessageSchema),
  MessageController.sendMessage
);

/**
 * GET /messages/search
 * Search messages by keyword
 */
router.get(
  "/search",
  MessageController.searchMessages
);

/**
 * POST /messages/read
 * Mark messages as read
 */
router.post(
  "/read",
  MessageController.markAsRead
);

/**
 * GET /messages/:messageId
 * Get a single message
 */
router.get(
  "/:messageId",
  MessageController.getMessage
);

/**
 * PATCH /messages/:messageId
 * Edit a message
 */
router.patch(
  "/:messageId",
  MessageController.editMessage
);

/**
 * DELETE /messages/:messageId
 * Delete a message
 */
router.delete(
  "/:messageId",
  MessageController.deleteMessage
);

export default router;
