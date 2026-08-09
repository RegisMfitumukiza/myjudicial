import { prisma } from "../../../infrastructure/database/prisma.js";
import { 
  NotificationEvent, 
  NotificationChannel,
  WhatsAppTemplate, 
  WhatsAppQueue 
} from "../../../generated/prisma/client.js";
import { logger } from "../../../shared/utils/logger.js";

export const WhatsAppRepository = {
  /**
   * Log a notification in the database
   */
  async logNotification(_params: {
    userId: string;
    event: NotificationEvent;
    recipient: string;
    subject?: string;
    body?: string;
    whatsappId?: string;
    templateId?: string;
    templateParams?: any;
    deliveryStatus?: string;
  }): Promise<void> {
    // WhatsApp logging disabled — will come in a future version
  },

  /**
   * Update delivery status based on webhook
   */
  async updateDeliveryStatus(whatsappId: string, status: string): Promise<void> {
    try {
      await prisma.notificationLog.updateMany({
        where: { whatsappId },
        data: { deliveryStatus: status }
      });

      logger.debug('Delivery status updated', { whatsappId, status });
    } catch (error) {
      logger.error('Failed to update delivery status', { error, whatsappId, status });
    }
  },

  /**
   * Get template by name
   */
  async getTemplate(name: string): Promise<WhatsAppTemplate | null> {
    try {
      return await prisma.whatsAppTemplate.findUnique({
        where: { name }
      });
    } catch (error) {
      logger.error('Failed to get template', { error, name });
      return null;
    }
  },

  /**
   * Get all active templates
   */
  async getAllActiveTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      return await prisma.whatsAppTemplate.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });
    } catch (error) {
      logger.error('Failed to get active templates', { error });
      return [];
    }
  },

  /**
   * Create or update template
   */
  async upsertTemplate(template: {
    name: string;
    metaId: string;
    language: string;
    parameters: string[];
    bodyText: string;
    isActive?: boolean;
  }): Promise<WhatsAppTemplate> {
    return prisma.whatsAppTemplate.upsert({
      where: { name: template.name },
      update: {
        metaId: template.metaId,
        language: template.language,
        parameters: template.parameters,
        bodyText: template.bodyText,
        isActive: template.isActive ?? true,
      },
      create: {
        name: template.name,
        metaId: template.metaId,
        language: template.language,
        parameters: template.parameters,
        bodyText: template.bodyText,
        isActive: template.isActive ?? true,
      },
    });
  },

  /**
   * Queue a message for sending
   */
  async queueMessage(params: {
    userId?: string;
    recipient: string;
    messageType: 'template' | 'text';
    templateName?: string;
    templateParams?: any;
    textMessage?: string;
    priority?: number;
    scheduledAt?: Date;
  }): Promise<WhatsAppQueue> {
    return prisma.whatsAppQueue.create({
      data: {
        userId: params.userId,
        recipient: params.recipient,
        messageType: params.messageType,
        templateName: params.templateName,
        templateParams: params.templateParams,
        textMessage: params.textMessage,
        priority: params.priority ?? 0,
        scheduledAt: params.scheduledAt ?? new Date(),
        status: 'queued',
      },
    });
  },

  /**
   * Get pending messages from queue
   */
  async getPendingMessages(limit: number = 10): Promise<WhatsAppQueue[]> {
    return prisma.whatsAppQueue.findMany({
      where: {
        status: 'queued',
        scheduledAt: {
          lte: new Date()
        },
        attempts: {
          lt: prisma.whatsAppQueue.fields.maxAttempts
        }
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledAt: 'asc' }
      ],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  },

  /**
   * Mark message as sent
   */
  async markMessageSent(queueId: string, whatsappId: string): Promise<void> {
    await prisma.whatsAppQueue.update({
      where: { id: queueId },
      data: {
        status: 'sent',
        whatsappId,
        processedAt: new Date(),
      }
    });
  },

  /**
   * Mark message as failed
   */
  async markMessageFailed(queueId: string, errorMessage: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Increment attempts
      const message = await tx.whatsAppQueue.findUnique({
        where: { id: queueId }
      });

      if (!message) return;

      const newAttempts = message.attempts + 1;
      const shouldRetry = newAttempts < message.maxAttempts;

      await tx.whatsAppQueue.update({
        where: { id: queueId },
        data: {
          attempts: newAttempts,
          status: shouldRetry ? 'queued' : 'failed',
          errorMessage,
          processedAt: shouldRetry ? null : new Date(),
          scheduledAt: shouldRetry 
            ? new Date(Date.now() + Math.pow(2, newAttempts) * 60000) // Exponential backoff in minutes
            : message.scheduledAt
        }
      });
    });
  },

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(dateFrom: Date, dateTo: Date): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
    deliveryRate: number;
    readRate: number;
    failureReasons: Record<string, number>;
  }> {
    try {
      // Get counts by delivery status
      const stats = await prisma.notificationLog.groupBy({
        by: ['deliveryStatus'],
        where: {
          channel: NotificationChannel.WHATSAPP,
          createdAt: {
            gte: dateFrom,
            lte: dateTo
          }
        },
        _count: {
          deliveryStatus: true
        }
      });

      // Get failure reasons
      const failedMessages = await prisma.whatsAppQueue.groupBy({
        by: ['errorMessage'],
        where: {
          status: 'failed',
          createdAt: {
            gte: dateFrom,
            lte: dateTo
          }
        },
        _count: {
          errorMessage: true
        }
      });

      // Process statistics
      const statusCounts = stats.reduce((acc, stat) => {
        acc[stat.deliveryStatus || 'unknown'] = stat._count.deliveryStatus;
        return acc;
      }, {} as Record<string, number>);

      const totalSent = statusCounts.sent || 0;
      const totalDelivered = statusCounts.delivered || 0;
      const totalRead = statusCounts.read || 0;
      const totalFailed = statusCounts.failed || 0;

      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      const readRate = totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0;

      const failureReasons = failedMessages.reduce((acc, failure) => {
        const reason = failure.errorMessage || 'Unknown error';
        acc[reason] = failure._count.errorMessage;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalSent,
        totalDelivered,
        totalRead,
        totalFailed,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        readRate: Math.round(readRate * 100) / 100,
        failureReasons
      };
    } catch (error) {
      logger.error('Failed to get delivery stats', { error });
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalFailed: 0,
        deliveryRate: 0,
        readRate: 0,
        failureReasons: {}
      };
    }
  },

  /**
   * Get template usage statistics
   */
  async getTemplateUsage(dateFrom: Date, dateTo: Date): Promise<{
    templateName: string;
    messagesSent: number;
    deliveryRate: number;
  }[]> {
    try {
      const usage = await prisma.notificationLog.groupBy({
        by: ['templateId'],
        where: {
          channel: NotificationChannel.WHATSAPP,
          createdAt: {
            gte: dateFrom,
            lte: dateTo
          },
          templateId: {
            not: null
          }
        },
        _count: {
          id: true
        }
      });

      // Get delivery counts per template
      const deliveryStats = await prisma.notificationLog.groupBy({
        by: ['templateId', 'deliveryStatus'],
        where: {
          channel: NotificationChannel.WHATSAPP,
          createdAt: {
            gte: dateFrom,
            lte: dateTo
          },
          templateId: {
            not: null
          }
        },
        _count: {
          id: true
        }
      });

      // Process results
      return usage.map(u => {
        const templateId = u.templateId!;
        const messagesSent = u._count.id;
        
        const delivered = deliveryStats
          .filter(d => d.templateId === templateId && d.deliveryStatus === 'delivered')
          .reduce((sum, d) => sum + d._count.id, 0);
        
        const deliveryRate = messagesSent > 0 ? (delivered / messagesSent) * 100 : 0;

        return {
          templateName: templateId,
          messagesSent,
          deliveryRate: Math.round(deliveryRate * 100) / 100
        };
      });
    } catch (error) {
      logger.error('Failed to get template usage', { error });
      return [];
    }
  },

  /**
   * Clean up old queue records (for maintenance)
   */
  async cleanupOldQueue(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.whatsAppQueue.deleteMany({
      where: {
        OR: [
          { status: 'sent', processedAt: { lt: cutoffDate } },
          { status: 'failed', processedAt: { lt: cutoffDate } }
        ]
      }
    });

    logger.info('Cleaned up old WhatsApp queue records', { 
      deletedCount: result.count,
      olderThanDays 
    });

    return result.count;
  }
};