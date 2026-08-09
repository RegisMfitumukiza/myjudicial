/**
 * Communication Analytics Service
 * 
 * Chat, WhatsApp, and email metrics
 */

import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import type { DateRange, CommunicationAnalytics } from "../types/analytics.types.js";

export const CommunicationAnalyticsService = {
  async getCommunicationAnalytics(dateRange?: DateRange): Promise<CommunicationAnalytics> {
    const [chatStats, notificationStats] = await Promise.all([
      AnalyticsRepository.getChatStats(dateRange),
      AnalyticsRepository.getNotificationStats(dateRange),
    ]);

    // Process WhatsApp stats
    const whatsappDelivered = notificationStats.whatsappStats.find((s) => s.deliveryStatus === "DELIVERED")?._count || 0;
    const whatsappFailed = notificationStats.whatsappStats.find((s) => s.deliveryStatus === "FAILED")?._count || 0;
    const whatsappPending = notificationStats.whatsappStats.find((s) => s.deliveryStatus === "PENDING")?._count || 0;
    const whatsappTotal = whatsappDelivered + whatsappFailed + whatsappPending;
    const whatsappSuccessRate = whatsappTotal > 0 ? (whatsappDelivered / whatsappTotal) * 100 : 0;

    // Process Email stats
    const emailDelivered = notificationStats.emailStats.find((s) => s.deliveryStatus === "DELIVERED")?._count || 0;
    const emailFailed = notificationStats.emailStats.find((s) => s.deliveryStatus === "FAILED")?._count || 0;
    const emailPending = notificationStats.emailStats.find((s) => s.deliveryStatus === "PENDING")?._count || 0;
    const emailTotal = emailDelivered + emailFailed + emailPending;
    const emailSuccessRate = emailTotal > 0 ? (emailDelivered / emailTotal) * 100 : 0;

    return {
      chat: {
        activeConversations: chatStats.activeConversations,
        totalMessages: chatStats.messageCount,
      },
      whatsapp: {
        totalSent: whatsappTotal,
        delivered: whatsappDelivered,
        failed: whatsappFailed,
        pending: whatsappPending,
        successRate: Number(whatsappSuccessRate.toFixed(2)),
      },
      email: {
        totalSent: emailTotal,
        delivered: emailDelivered,
        failed: emailFailed,
        pending: emailPending,
        successRate: Number(emailSuccessRate.toFixed(2)),
      },
    };
  },
};
