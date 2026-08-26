/**
 * Communication Analytics Service
 *
 * Chat and email metrics
 */

import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import type { DateRange, CommunicationAnalytics } from "../types/analytics.types.js";

export const CommunicationAnalyticsService = {
  async getCommunicationAnalytics(dateRange?: DateRange): Promise<CommunicationAnalytics> {
    const [chatStats, notificationStats] = await Promise.all([
      AnalyticsRepository.getChatStats(dateRange),
      AnalyticsRepository.getNotificationStats(dateRange),
    ]);

    return {
      chat: {
        activeConversations: chatStats.activeConversations,
        totalMessages: chatStats.messageCount,
      },
      email: {
        totalSent: notificationStats.emailsSent,
      },
    };
  },
};
