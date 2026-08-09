import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { LiveKitWebhookController } from "./livekit.webhook.controller.js";

const router = Router();

/**
 * POST /api/v1/livekit/webhook
 * LiveKit Cloud calls this when room events occur.
 * The body must be kept as raw text for JWT signature verification.
 */
router.post(
  "/webhook",
  asyncHandler(LiveKitWebhookController.handleWebhook)
);

export default router;
