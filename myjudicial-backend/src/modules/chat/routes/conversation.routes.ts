import { Router } from "express";
import { ConversationController } from "../controllers/conversation.controller.js";
import { authenticate } from "../../../shared/middleware/authenticate.js";
import { requireConversationAccess } from "../middleware/conversation-access.middleware.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /conversations
 * List conversations for authenticated user
 */
router.get(
  "/",
  ConversationController.listConversations
);

/**
 * GET /conversations/unread-count
 * Get total unread count across all conversations
 */
router.get(
  "/unread-count",
  ConversationController.getUnreadCount
);

/**
 * GET /conversations/by-booking/:bookingId
 * Resolve the conversation tied to a booking (authorization checked in the service,
 * since we don't have a conversationId yet for requireConversationAccess to key off)
 */
router.get(
  "/by-booking/:bookingId",
  ConversationController.getConversationByBookingId
);

/**
 * GET /conversations/:conversationId
 * Get conversation details
 */
router.get(
  "/:conversationId",
  requireConversationAccess,
  ConversationController.getConversation
);

/**
 * PATCH /conversations/:conversationId/archive
 * Archive a conversation
 */
router.patch(
  "/:conversationId/archive",
  requireConversationAccess,
  ConversationController.archiveConversation
);

/**
 * GET /conversations/:conversationId/participants
 * List participants in a conversation
 */
router.get(
  "/:conversationId/participants",
  requireConversationAccess,
  ConversationController.getParticipants
);

export default router;
