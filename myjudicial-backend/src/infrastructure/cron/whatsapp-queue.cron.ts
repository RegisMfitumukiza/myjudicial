import cron from "node-cron";
import { WhatsAppQueueService } from "../../modules/whatsapp/services/whatsapp-queue.service.js";
import { logger } from "../../shared/utils/logger.js";

/**
 * WhatsApp Queue Processor — runs every 30 seconds.
 * 
 * Processes pending WhatsApp messages from the queue and sends them via
 * the Meta WhatsApp Cloud API. Handles retries with exponential backoff
 * for failed messages.
 */
export const startWhatsAppQueueCron = (): void => {
  cron.schedule("*/30 * * * * *", async () => {
    try {
      const stats = await WhatsAppQueueService.processQueue(10); // Process 10 messages per batch
      
      if (stats.processed > 0) {
        logger.info('WhatsApp queue processing completed', {
          processed: stats.processed,
          succeeded: stats.succeeded,
          failed: stats.failed
        });
      }
    } catch (error) {
      logger.error('WhatsApp queue cron error', { error });
    }
  });

  logger.info('WhatsApp queue cron scheduled — runs every 30 seconds');
};

/**
 * WhatsApp Queue Cleanup — runs daily at 03:00 AM.
 * 
 * Removes old processed messages from the queue to prevent database bloat.
 * Messages older than 30 days that are either sent or failed are deleted.
 */
export const startWhatsAppCleanupCron = (): void => {
  cron.schedule("0 3 * * *", async () => {
    try {
      logger.info('WhatsApp queue cleanup: starting');
      const deletedCount = await WhatsAppQueueService.cleanupOldMessages(30);
      logger.info('WhatsApp queue cleanup: completed', { deletedCount });
    } catch (error) {
      logger.error('WhatsApp queue cleanup error', { error });
    }
  });

  logger.info('WhatsApp queue cleanup cron scheduled — runs daily at 03:00 AM');
};