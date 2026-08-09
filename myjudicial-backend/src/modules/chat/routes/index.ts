import { Router } from "express";
import conversationRoutes from "./conversation.routes.js";
import messageRoutes from "./message.routes.js";
import presenceRoutes from "./presence.routes.js";
import { MessageController } from "../controllers/message.controller.js";
import { authenticate } from "../../../shared/middleware/authenticate.js";
import { requireConversationAccess } from "../middleware/conversation-access.middleware.js";

const router = Router();

// Mount sub-routers
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/presence", presenceRoutes);

// Nested route: List messages in a conversation
router.get(
  "/conversations/:conversationId/messages",
  authenticate,
  requireConversationAccess,
  MessageController.listMessages
);

// Nested route: Get unread count for a conversation
router.get(
  "/conversations/:conversationId/unread-count",
  authenticate,
  requireConversationAccess,
  MessageController.getUnreadCount
);

export default router;
