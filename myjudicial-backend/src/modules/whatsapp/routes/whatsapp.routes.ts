import { Router } from 'express';
import { WhatsAppWebhookController } from '../controllers/whatsapp-webhook.controller.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';

const router = Router();

/**
 * GET /whatsapp/webhook
 * Webhook verification endpoint for Meta
 * This is called by Meta to verify the webhook URL
 */
router.get('/webhook', asyncHandler(WhatsAppWebhookController.verify));

/**
 * POST /whatsapp/webhook
 * Webhook event receiver
 * This receives status updates and incoming messages from Meta
 */
router.post('/webhook', asyncHandler(WhatsAppWebhookController.handleWebhook));

export default router;