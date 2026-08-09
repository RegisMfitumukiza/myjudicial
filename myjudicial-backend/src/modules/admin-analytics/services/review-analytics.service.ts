/**
 * Review Analytics Service
 * 
 * Review and rating metrics
 */

import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import type { DateRange, ReviewAnalytics } from "../types/analytics.types.js";

export const ReviewAnalyticsService = {
  async getReviewAnalytics(dateRange?: DateRange): Promise<ReviewAnalytics> {
    const { totalReviews, avgRating, distribution } = 
      await AnalyticsRepository.getReviewStats();

    // Build rating distribution
    const ratingDistribution = {
      "5": distribution.find((d) => d.rating === 5)?._count || 0,
      "4": distribution.find((d) => d.rating === 4)?._count || 0,
      "3": distribution.find((d) => d.rating === 3)?._count || 0,
      "2": distribution.find((d) => d.rating === 2)?._count || 0,
      "1": distribution.find((d) => d.rating === 1)?._count || 0,
    };

    // Get time series data if date range provided
    let timeSeries: Array<{ date: string; count: number; avgRating: number }> = [];
    if (dateRange) {
      const reviews = await AnalyticsRepository.getReviewTimeSeries(dateRange);
      timeSeries = this.groupByDate(reviews);
    }

    return {
      totals: {
        totalReviews,
        averageRating: avgRating ? Number(avgRating.toFixed(2)) : 0,
        publishedReviews: totalReviews,
      },
      distribution: ratingDistribution,
      timeSeries,
    };
  },

  /**
   * Group reviews by date with average rating
   */
  groupByDate(reviews: Array<{ createdAt: Date; rating: number }>): Array<{
    date: string;
    count: number;
    avgRating: number;
  }> {
    const grouped = new Map<string, { count: number; totalRating: number }>();

    reviews.forEach((review) => {
      const dateStr = review.createdAt.toISOString().split("T")[0];
      const existing = grouped.get(dateStr) || { count: 0, totalRating: 0 };
      grouped.set(dateStr, {
        count: existing.count + 1,
        totalRating: existing.totalRating + review.rating,
      });
    });

    return Array.from(grouped.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        avgRating: Number((data.totalRating / data.count).toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};
