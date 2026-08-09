import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller.js';
import { authenticate, requireAdmin } from '../../../shared/middleware/authenticate.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireAdmin);

/**
 * POST /admin/whatsapp/test
 * Send a test WhatsApp message
 */
router.post('/test', asyncHandler(WhatsAppController.sendTestMessage));

/**
 * GET /admin/whatsapp/templates
 * List all WhatsApp templates
 */
router.get('/templates', asyncHandler(WhatsAppController.listTemplates));

/**
 * POST /admin/whatsapp/templates/sync
 * Sync templates from Meta
 */
router.post('/templates/sync', asyncHandler(WhatsAppController.syncTemplates));

/**
 * GET /admin/whatsapp/stats/delivery
 * Get delivery statistics
 */
router.get('/stats/delivery', asyncHandler(WhatsAppController.getDeliveryStats));

/**
 * GET /admin/whatsapp/stats/templates
 * Get template usage statistics
 */
router.get('/stats/templates', asyncHandler(WhatsAppController.getTemplateUsage));

/**
 * GET /admin/whatsapp/queue/stats
 * Get queue statistics
 */
router.get('/queue/stats', asyncHandler(WhatsAppController.getQueueStats));

/**
 * POST /admin/whatsapp/queue/retry
 * Retry failed messages
 */
router.post('/queue/retry', asyncHandler(WhatsAppController.retryFailedMessages));

/**
 * POST /admin/whatsapp/queue/cleanup
 * Clean up old queue records
 */
router.post('/queue/cleanup', asyncHandler(WhatsAppController.cleanupQueue));

/**
 * GET /admin/whatsapp/status
 * Get WhatsApp service status
 */
router.get('/status', asyncHandler(WhatsAppController.getServiceStatus));

export default router;