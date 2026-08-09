/**
 * Platform Overview Service
 * 
 * High-level platform statistics
 */

import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import { getStartOfToday, getStartOfThisMonth } from "../utils/date-filter.utils.js";
import type { PlatformSummary, BookingSummary, RevenueSummary, ActivitySummary } from "../types/analytics.types.js";

export const PlatformOverviewService = {
  async getPlatformSummary(): Promise<PlatformSummary> {
    const { userCounts, expertCounts } = await AnalyticsRepository.getPlatformCounts();

    // Process user counts
    const totalClients = userCounts.find((c) => c.role === "CITIZEN")?._count || 0;
    const totalExperts = userCounts.find((c) => c.role === "EXPERT")?._count || 0;
    const totalUsers = userCounts.reduce((sum, c) => sum + c._count, 0);

    // Process expert counts
    const verifiedExperts = expertCounts.find((c) => c.status === "VERIFIED")?._count || 0;
    const activeExperts = verifiedExperts; // VERIFIED status means verified and active
    const suspendedExperts = expertCounts.find((c) => c.status === "SUSPENDED")?._count || 0;

    // Get new users
    const today = getStartOfToday();
    const thisMonth = getStartOfThisMonth();
    const { today: newToday, thisMonth: newThisMonth } = await AnalyticsRepository.getNewUserCounts({
      startDate: today,
      endDate: new Date(),
    });

    return {
      totalUsers,
      totalClients,
      totalExperts,
      verifiedExperts,
      activeExperts,
      suspendedExperts,
      newUsersToday: newToday,
      newUsersThisMonth: newThisMonth,
    };
  },

  async getBookingSummary(): Promise<BookingSummary> {
    const { bookingCounts } = await AnalyticsRepository.getPlatformCounts();

    const pending = bookingCounts.find((c) => c.status === "PENDING")?._count || 0;
    const confirmed = bookingCounts.find((c) => c.status === "CONFIRMED")?._count || 0;
    const completed = bookingCounts.find((c) => c.status === "COMPLETED")?._count || 0;
    const cancelled = bookingCounts.find((c) => c.status === "CANCELLED")?._count || 0;

    const totalBookings = bookingCounts.reduce((sum, c) => sum + c._count, 0);
    const successRate = totalBookings > 0 ? (completed / totalBookings) * 100 : 0;

    return {
      totalBookings,
      pendingBookings: pending,
      confirmedBookings: confirmed,
      completedBookings: completed,
      cancelledBookings: cancelled,
      successRate: Number(successRate.toFixed(2)),
    };
  },

  async getRevenueSummary(): Promise<RevenueSummary> {
    // Get booking stats and escrow balance in parallel
    const { BookingRepository } = await import("../../bookings/booking.repository.js");
    const { EscrowLedgerRepository } = await import("../../payments/escrow.repository.js");
    
    const [stats, escrowBalance] = await Promise.all([
      BookingRepository.getStats(),
      EscrowLedgerRepository.getEscrowBalance(),
    ]);

    return {
      totalRevenue: stats.totalRevenue,
      platformFees: stats.totalPlatformFees,
      expertPayouts: stats.totalExpertPayouts,
      escrowBalance,
    };
  },

  async getActivitySummary(): Promise<ActivitySummary> {
    const today = getStartOfToday();
    const dateRange = { startDate: today, endDate: new Date() };

    const [chatStats, notificationStats] = await Promise.all([
      AnalyticsRepository.getChatStats(dateRange),
      AnalyticsRepository.getNotificationStats(dateRange),
    ]);

    const whatsappSent = notificationStats.whatsappStats.reduce((sum, s) => sum + s._count, 0);
    const emailSent = notificationStats.emailStats.reduce((sum, s) => sum + s._count, 0);

    return {
      activeConversations: chatStats.activeConversations,
      messagesToday: chatStats.messageCount,
      whatsappSentToday: whatsappSent,
      emailsSentToday: emailSent,
    };
  },
};
