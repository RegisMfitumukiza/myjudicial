import { prisma } from "../../../infrastructure/database/prisma.js";
import { ProfileRepository } from "../profile/profile.repository.js";


export const StatisticsService = {
  getStatistics: async (userId: string) => {
    const profile = await ProfileRepository.findByUserId(userId);

    // Return empty defaults for users who haven't created their expert profile yet.
    // Throwing NotFoundError here causes every new expert's dashboard to flood the
    // server logs with 404s before onboarding is complete.
    if (!profile) {
      return {
        completedConsultations: 0,
        activeConsultations: 0,
        pendingBookings: 0,
        averageRating: null,
        reviewCount: 0,
      };
    }

    const expertId = profile.id;

    const [completed, active, reviewAgg, pending] = await Promise.all([
      prisma.booking.count({ where: { expertId, status: "COMPLETED" } }),
      prisma.booking.count({ where: { expertId, status: "ACTIVE" } }),
      prisma.review.aggregate({
        where: { expertId, isDeleted: false, status: "PUBLISHED" },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.booking.count({ where: { expertId, status: "PENDING" } }),
    ]);

    return {
      completedConsultations: completed,
      activeConsultations: active,
      pendingBookings: pending,
      averageRating: reviewAgg._avg.rating
        ? Number(Number(reviewAgg._avg.rating).toFixed(2))
        : null,
      reviewCount: reviewAgg._count.id,
    };
  },

  /** Public stats for a specific expert — used on expert profile page */
  getPublicStatistics: async (expertId: string) => {
    const [completed, reviewAgg] = await Promise.all([
      prisma.booking.count({ where: { expertId, status: "COMPLETED" } }),
      prisma.review.aggregate({
        where: { expertId, isDeleted: false, status: "PUBLISHED" },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    return {
      completedConsultations: completed,
      averageRating: reviewAgg._avg.rating
        ? Number(Number(reviewAgg._avg.rating).toFixed(2))
        : null,
      reviewCount: reviewAgg._count.id,
    };
  },
};
