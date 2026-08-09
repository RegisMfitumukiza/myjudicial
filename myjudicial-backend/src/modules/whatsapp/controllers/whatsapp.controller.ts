import { Request, Response, NextFunction } from 'express';
import { WhatsAppService } from '../services/whatsapp.service.js';
import { WhatsAppQueueService } from '../services/whatsapp-queue.service.js';
import { WhatsAppTemplateService } from '../services/whatsapp-template.service.js';
import { WhatsAppRepository } from '../repositories/whatsapp.repository.js';
import { 
  sendTestMessageSchema, 
  syncTemplateSchema,
  getDeliveryStatsSchema,
  paginationSchema,
  retryFailedMessagesSchema,
  cleanupQueueSchema
} from '../schemas/whatsapp.schemas.js';
import { logger } from '../../../shared/utils/logger.js';

/**
 * WhatsApp Controller
 * Handles admin endpoints for WhatsApp management
 */
export const WhatsAppController = {
  /**
   * POST /admin/whatsapp/test
   * Send a test WhatsApp message
   */
  async sendTestMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = sendTestMessageSchema.parse(req.body);
      
      await WhatsAppService.sendTestMessage({
        phone: validated.phone,
        message: validated.message
      });

      res.status(200).json({
        success: true,
        message: 'Test message queued successfully'
      });
    } catch (error) {
      logger.error('Failed to send test message', { error });
      next(error);
    }
  },

  /**
   * GET /admin/whatsapp/templates
   * List all WhatsApp templates
   */
  async listTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await WhatsAppTemplateService.getAllTemplates();

      res.status(200).json({
        success: true,
        data: {
          templates,
          count: templates.length
        }
      });
    } catch (error) {
      logger.error('Failed to list templates', { error });
      next(error);
    }
  },

  /**
   * POST /admin/whatsapp/templates/sync
   * Sync templates from Meta
   */
  async syncTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = syncTemplateSchema.parse(req.body);
      
      if (validated.templateName) {
        // Sync specific template
        await WhatsAppTemplateService.syncTemplateFromMeta(validated.templateName as any);
        
        res.status(200).json({
          success: true,
          message: `Template '${validated.templateName}' synced successfully`
        });
      } else {
        // Sync all templates
        const result = await WhatsAppTemplateService.syncAllTemplates();
        
        res.status(200).json({
          success: true,
          message: 'Templates synced',
          data: {
            synced: result.synced,
            failed: result.failed.length,
            failedTemplates: result.failed
          }
        });
      }
    } catch (error) {
      logger.error('Failed to sync templates', { error });
      next(error);
    }
  },

  /**
   * GET /admin/whatsapp/stats/delivery
   * Get delivery statistics
   */
  async getDeliveryStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = getDeliveryStatsSchema.parse(req.query);
      
      // Default to last 30 days if not specified
      const dateTo = validated.dateTo ? new Date(validated.dateTo) : new Date();
      const dateFrom = validated.dateFrom 
        ? new Date(validated.dateFrom)
        : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

      const stats = await WhatsAppRepository.getDeliveryStats(dateFrom, dateTo);

      res.status(200).json({
        success: true,
        data: {
          period: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString()
          },
          stats
        }
      });
    } catch (error) {
      logger.error('Failed to get delivery stats', { error });
      next(error);
    }
  },

  /**
   * GET /admin/whatsapp/stats/templates
   * Get template usage statistics
   */
  async getTemplateUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = getDeliveryStatsSchema.parse(req.query);
      
      const dateTo = validated.dateTo ? new Date(validated.dateTo) : new Date();
      const dateFrom = validated.dateFrom 
        ? new Date(validated.dateFrom)
        : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

      const usage = await WhatsAppRepository.getTemplateUsage(dateFrom, dateTo);

      res.status(200).json({
        success: true,
        data: {
          period: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString()
          },
          templates: usage
        }
      });
    } catch (error) {
      logger.error('Failed to get template usage', { error });
      next(error);
    }
  },

  /**
   * GET /admin/whatsapp/queue/stats
   * Get queue statistics
   */
  async getQueueStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await WhatsAppQueueService.getQueueStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get queue stats', { error });
      next(error);
    }
  },

  /**
   * POST /admin/whatsapp/queue/retry
   * Retry failed messages
   */
  async retryFailedMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = retryFailedMessagesSchema.parse(req.body);
      
      const retriedCount = await WhatsAppQueueService.retryFailedMessages(validated.limit);

      res.status(200).json({
        success: true,
        message: `${retriedCount} messages queued for retry`,
        data: {
          retriedCount
        }
      });
    } catch (error) {
      logger.error('Failed to retry messages', { error });
      next(error);
    }
  },

  /**
   * POST /admin/whatsapp/queue/cleanup
   * Clean up old queue records
   */
  async cleanupQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = cleanupQueueSchema.parse(req.body);
      
      const deletedCount = await WhatsAppQueueService.cleanupOldMessages(validated.olderThanDays);

      res.status(200).json({
        success: true,
        message: `${deletedCount} old messages cleaned up`,
        data: {
          deletedCount,
          olderThanDays: validated.olderThanDays
        }
      });
    } catch (error) {
      logger.error('Failed to cleanup queue', { error });
      next(error);
    }
  },

  /**
   * GET /admin/whatsapp/status
   * Get WhatsApp service status
   */
  async getServiceStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await WhatsAppService.getServiceStatus();

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Failed to get service status', { error });
      next(error);
    }
  }
};