/**
 * Analytics Repository
 * 
 * Centralized analytics queries - all database access for analytics
 */

import { prisma } from "../../../infrastructure/database/prisma.js";
import type { DateRange } from "../types/analytics.types.js";

export const AnalyticsRepository = {
  /**
   * Platform Overview Queries
   */
  async getPlatformCounts() {
    const [userCounts, expertCounts, bookingCounts] = await Promise.all([
      // User counts by role
      prisma.user.groupBy({
        by: ["role"],
        _count: true,
      }),
      
      // Expert counts by status
      prisma.expertProfile.groupBy({
        by: ["status"],
        _count: true,
      }),
      
      // Booking counts by status
      prisma.booking.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    return { userCounts, expertCounts, bookingCounts };
  },

  async getNewUserCounts(dateRange: DateRange) {
    const [today, thisMonth] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),
      
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return { today, thisMonth };
  },

  /**
   * User Analytics Queries
   */
  async getUserStats(dateRange?: DateRange) {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    } : undefined;

    const [totalUsers, usersByRole, usersByStatus, newUsers] = await Promise.all([
      prisma.user.count(),
      
      prisma.user.groupBy({
        by: ["role"],
        _count: true,
      }),
      
      prisma.user.groupBy({
        by: ["status"],
        _count: true,
      }),
      
      dateRange ? prisma.user.count({ where }) : Promise.resolve(0),
    ]);

    return { totalUsers, usersByRole, usersByStatus, newUsers };
  },

  async getUserTimeSeries(dateRange: DateRange) {
    // Get daily user registrations
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return users;
  },

  /**
   * Expert Analytics Queries
   */
  async getExpertStats() {
    const [totalExperts, expertsByStatus, verificationCounts] = await Promise.all([
      prisma.expertProfile.count(),
      
      prisma.expertProfile.groupBy({
        by: ["status"],
        _count: true,
      }),
      
      prisma.expertVerification.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    return { totalExperts, expertsByStatus, verificationCounts };
  },

  async getTopRatedExperts(limit: number = 10) {
    return prisma.expertProfile.findMany({
      where: {
        averageRating: { not: null },
        reviewCount: { gt: 0 },
        status: "VERIFIED",
      },
      select: {
        id: true,
        displayName: true,
        averageRating: true,
        reviewCount: true,
      },
      orderBy: [
        { averageRating: "desc" },
        { reviewCount: "desc" },
      ],
      take: limit,
    });
  },

  async getMostBookedExperts(limit: number = 10) {
    const bookingCounts = await prisma.booking.groupBy({
      by: ["expertId"],
      _count: true,
      where: {
        status: "COMPLETED",
      },
      orderBy: {
        _count: {
          expertId: "desc",
        },
      },
      take: limit,
    });

    // Get expert details
    const expertIds = bookingCounts.map((b) => b.expertId);
    const experts = await prisma.expertProfile.findMany({
      where: {
        id: { in: expertIds },
      },
      select: {
        id: true,
        displayName: true,
      },
    });

    return bookingCounts.map((count) => {
      const expert = experts.find((e) => e.id === count.expertId);
      return {
        expertId: count.expertId,
        displayName: expert?.displayName || "Unknown",
        bookingCount: count._count,
      };
    });
  },

  /**
   * Review Analytics Queries
   */
  async getReviewStats() {
    const [totalReviews, avgRating, distribution] = await Promise.all([
      prisma.review.count({
        where: { isDeleted: false, status: "PUBLISHED" },
      }),
      
      prisma.review.aggregate({
        where: { isDeleted: false, status: "PUBLISHED" },
        _avg: { rating: true },
      }),
      
      prisma.review.groupBy({
        by: ["rating"],
        where: { isDeleted: false, status: "PUBLISHED" },
        _count: true,
      }),
    ]);

    return { totalReviews, avgRating: avgRating._avg.rating, distribution };
  },

  async getReviewTimeSeries(dateRange: DateRange) {
    const reviews = await prisma.review.findMany({
      where: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
        isDeleted: false,
        status: "PUBLISHED",
      },
      select: {
        createdAt: true,
        rating: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return reviews;
  },

  /**
   * Communication Analytics Queries
   */
  async getChatStats(dateRange?: DateRange) {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    } : undefined;

    const [activeConversations, messageCount] = await Promise.all([
      prisma.conversation.count({
        where: { status: "ACTIVE" },
      }),
      
      prisma.message.count({
        where: {
          ...where,
          isDeleted: false,
        },
      }),
    ]);

    return { activeConversations, messageCount };
  },

  async getNotificationStats(dateRange?: DateRange) {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    } : undefined;

    const emailsSent = await prisma.notificationLog.count({
      where: {
        ...where,
        channel: "EMAIL",
      },
    });

    return { emailsSent };
  },

  /**
   * Compliance Analytics Queries
   */
  async getComplianceStats() {
    const [verificationCounts, certCounts] = await Promise.all([
      prisma.expertVerification.groupBy({
        by: ["status"],
        _count: true,
      }),
      
      prisma.expertCertification.findMany({
        select: {
          expiryDate: true,
        },
      }),
    ]);

    return { verificationCounts, certCounts };
  },

  /**
   * System Health Queries
   */
  async getSystemStats(dateRange?: DateRange) {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      },
    } : undefined;

    const [auditLogCount, documentStats, notificationCount] = await Promise.all([
      prisma.auditLog.count({ where }),
      
      prisma.document.aggregate({
        _count: true,
        _sum: { fileSize: true },
      }),
      
      prisma.notificationLog.count({ where }),
    ]);

    return {
      auditLogCount,
      totalDocuments: documentStats._count,
      totalStorageBytes: documentStats._sum.fileSize || 0,
      notificationCount,
    };
  },
};
