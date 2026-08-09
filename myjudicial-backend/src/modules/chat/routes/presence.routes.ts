import { Router } from "express";
import { PresenceController } from "../controllers/presence.controller.js";
import { authenticate } from "../../../shared/middleware/authenticate.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /presence/typing
 * Set typing indicator
 */
router.post(
  "/typing",
  PresenceController.setTyping
);

/**
 * GET /presence/typing/:conversationId
 * Get typing users in a conversation
 */
router.get(
  "/typing/:conversationId",
  PresenceController.getTyping
);

/**
 * POST /presence
 * Update online presence
 */
router.post(
  "/",
  PresenceController.updatePresence
);

/**
 * POST /presence/heartbeat
 * Keep user online
 */
router.post(
  "/heartbeat",
  PresenceController.heartbeat
);

/**
 * GET /presence/:userId
 * Get user presence status
 */
router.get(
  "/:userId",
  PresenceController.getPresence
);

export default router;
