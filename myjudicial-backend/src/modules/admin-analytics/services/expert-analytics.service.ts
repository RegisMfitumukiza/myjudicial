/**
 * Expert Analytics Service
 * 
 * Expert-specific metrics and rankings
 */

import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import type { ExpertAnalytics } from "../types/analytics.types.js";

export const ExpertAnalyticsService = {
  async getExpertAnalytics(): Promise<ExpertAnalytics> {
    const [stats, topRated, mostBooked] = await Promise.all([
      AnalyticsRepository.getExpertStats(),
      AnalyticsRepository.getTopRatedExperts(10),
      AnalyticsRepository.getMostBookedExperts(10),
    ]);

    // Process status distribution
    const active = stats.expertsByStatus.find((s) => s.status === "VERIFIED")?._count || 0;
    const suspended = stats.expertsByStatus.find((s) => s.status === "SUSPENDED")?._count || 0;
    const pendingVerification = stats.expertsByStatus.find((s) => s.status === "PENDING_VERIFICATION")?._count || 0;

    // Process verification distribution
    const verified = stats.verificationCounts.find((v) => v.status === "APPROVED")?._count || 0;
    const pendingReview = stats.verificationCounts.find((v) => v.status === "PENDING")?._count || 0;
    const rejected = stats.verificationCounts.find((v) => v.status === "REJECTED")?._count || 0;

    return {
      totals: {
        totalExperts: stats.totalExperts,
        activeExperts: active,
        suspendedExperts: suspended,
        pendingVerification,
        verifiedExperts: verified,
      },
      byStatus: {
        VERIFIED: active,
        SUSPENDED: suspended,
        PENDING_VERIFICATION: pendingVerification,
      },
      verificationStatus: {
        APPROVED: verified,
        PENDING: pendingReview,
        REJECTED: rejected,
      },
      topRated: topRated.map((expert) => ({
        expertId: expert.id,
        displayName: expert.displayName,
        averageRating: Number(expert.averageRating || 0),
        reviewCount: expert.reviewCount,
      })),
      mostBooked: mostBooked.map((expert) => ({
        expertId: expert.expertId,
        displayName: expert.displayName,
        bookingCount: expert.bookingCount,
      })),
    };
  },
};
