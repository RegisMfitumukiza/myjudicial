import { WhatsAppRepository } from "../repositories/whatsapp.repository.js";
import { whatsappProvider } from "./whatsapp-provider.service.js";
import { WhatsAppTemplateService, TemplateName } from "./whatsapp-template.service.js";
import { WhatsAppError, WhatsAppErrorType } from "../utils/whatsapp.errors.js";
import { validateAndFormatPhone } from "../utils/phone.utils.js";
import { logger } from "../../../shared/utils/logger.js";
import type { NotificationEvent } from "../../../generated/prisma/client.js";

/**
 * WhatsApp Queue Service
 * Handles queueing and processing of WhatsApp messages
 */
export const WhatsAppQueueService = {
  /**
   * Queue a template message for sending
   */
  async queueTemplateMessage(params: {
    userId?: string;
    recipient: string;
    templateName: TemplateName;
    templateParams: any;
    priority?: number;
    scheduledAt?: Date;
    event: NotificationEvent;
  }): Promise<void> {
    try {
      // Validate and format phone number
      const formattedPhone = validateAndFormatPhone(params.recipient);
      
      // Format template parameters
      const formattedParams = WhatsAppTemplateService.formatTemplateParams(
        params.templateName,
        params.templateParams
      );

      // Queue the message
      await WhatsAppRepository.queueMessage({
        userId: params.userId,
        recipient: formattedPhone,
        messageType: 'template',
        templateName: params.templateName,
        templateParams: formattedParams,
        priority: params.priority ?? 0,
        scheduledAt: params.scheduledAt,
      });

      logger.info('Template message queued', {
        templateName: params.templateName,
        recipient: formattedPhone,
        userId: params.userId,
        event: params.event
      });
    } catch (error) {
      logger.error('Failed to queue template message', { error, params });
      throw error;
    }
  },

  /**
   * Queue a text message for sending
   */
  async queueTextMessage(params: {
    userId?: string;
    recipient: string;
    message: string;
    priority?: number;
    scheduledAt?: Date;
    event: NotificationEvent;
  }): Promise<void> {
    try {
      // Validate and format phone number
      const formattedPhone = validateAndFormatPhone(params.recipient);

      // Queue the message
      await WhatsAppRepository.queueMessage({
        userId: params.userId,
        recipient: formattedPhone,
        messageType: 'text',
        textMessage: params.message,
        priority: params.priority ?? 0,
        scheduledAt: params.scheduledAt,
      });

      logger.info('Text message queued', {
        recipient: formattedPhone,
        userId: params.userId,
        messageLength: params.message.length,
        event: params.event
      });
    } catch (error) {
      logger.error('Failed to queue text message', { error, params });
      throw error;
    }
  },

  /**
   * Process queued messages
   * Called by cron job every 30 seconds
   */
  async processQueue(batchSize: number = 10): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    const stats = { processed: 0, succeeded: 0, failed: 0 };

    try {
      const pendingMessages = await WhatsAppRepository.getPendingMessages(batchSize);
      
      if (pendingMessages.length === 0) {
        logger.debug('No pending WhatsApp messages to process');
        return stats;
      }

      logger.info('Processing WhatsApp message queue', { 
        pendingCount: pendingMessages.length 
      });

      // Process messages sequentially to respect rate limits
      for (const message of pendingMessages) {
        stats.processed++;
        
        try {
          let whatsappId: string;

          if (message.messageType === 'template' && message.templateName) {
            // Send template message
            const templateId = await WhatsAppTemplateService.getTemplateId(
              message.templateName as TemplateName
            );
            
            whatsappId = await whatsappProvider.sendTemplateMessage(
              message.recipient,
              templateId,
              message.templateParams as any[] || [],
              'en' // Default to English for now
            );
          } else if (message.messageType === 'text' && message.textMessage) {
            // Send text message
            whatsappId = await whatsappProvider.sendTextMessage(
              message.recipient,
              message.textMessage
            );
          } else {
            throw new WhatsAppError(
              'Invalid message type or missing content',
              WhatsAppErrorType.INVALID_PHONE
            );
          }

          // Mark as sent
          await WhatsAppRepository.markMessageSent(message.id, whatsappId);
          
          // Log notification if user ID is available
          if (message.userId) {
            await WhatsAppRepository.logNotification({
              userId: message.userId,
              event: 'OTP_SENT', // Default event, should be passed from queue
              recipient: message.recipient,
              whatsappId,
              templateId: message.templateName || undefined,
              templateParams: message.templateParams || undefined,
              body: message.textMessage || undefined,
              deliveryStatus: 'sent'
            });
          }

          stats.succeeded++;
          
          logger.info('WhatsApp message sent successfully', {
            queueId: message.id,
            whatsappId,
            recipient: message.recipient,
            type: message.messageType
          });

        } catch (error) {
          // Mark as failed
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await WhatsAppRepository.markMessageFailed(message.id, errorMessage);
          
          stats.failed++;
          
          logger.error('Failed to send WhatsApp message', {
            queueId: message.id,
            recipient: message.recipient,
            error: errorMessage,
            attempts: message.attempts + 1,
            maxAttempts: message.maxAttempts
          });
        }

        // Small delay between messages to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      logger.info('WhatsApp queue processing completed', stats);
      
    } catch (error) {
      logger.error('Failed to process WhatsApp queue', { error });
    }

    return stats;
  },

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    queued: number;
    processing: number;
    failed: number;
    totalToday: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const [queuedCount, processingCount, failedCount, totalTodayCount] = await Promise.all([
        // Queued messages
        WhatsAppRepository.getPendingMessages(1000).then(messages => messages.length),
        
        // Processing messages (not implemented yet, return 0)
        Promise.resolve(0),
        
        // Failed messages (attempts >= maxAttempts)
        // This would require a direct Prisma query since repository doesn't have this method
        Promise.resolve(0),
        
        // Total messages queued today
        // This would also require a direct query
        Promise.resolve(0)
      ]);

      return {
        queued: queuedCount,
        processing: processingCount,
        failed: failedCount,
        totalToday: totalTodayCount
      };
    } catch (error) {
      logger.error('Failed to get queue stats', { error });
      return {
        queued: 0,
        processing: 0,
        failed: 0,
        totalToday: 0
      };
    }
  },

  /**
   * Retry failed messages
   */
  async retryFailedMessages(limit: number = 50): Promise<number> {
    try {
      // This would require updating the repository to support retry operations
      // For now, return 0
      logger.info('Retry failed messages not yet implemented');
      return 0;
    } catch (error) {
      logger.error('Failed to retry messages', { error });
      return 0;
    }
  },

  /**
   * Clear old processed messages
   */
  async cleanupOldMessages(olderThanDays: number = 30): Promise<number> {
    try {
      const deletedCount = await WhatsAppRepository.cleanupOldQueue(olderThanDays);
      
      logger.info('Cleaned up old WhatsApp messages', { 
        deletedCount,
        olderThanDays 
      });
      
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old messages', { error });
      return 0;
    }
  }
};