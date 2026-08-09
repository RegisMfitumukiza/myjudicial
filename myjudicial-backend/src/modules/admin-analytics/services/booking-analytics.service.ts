/**
 * Booking Analytics Service
 * 
 * Detailed booking metrics and time series
 */

import { BookingRepository } from "../../bookings/booking.repository.js";
import { daysBetween } from "../utils/date-filter.utils.js";
import type { DateRange, BookingAnalytics } from "../types/analytics.types.js";
import { prisma } from "../../../infrastructure/database/prisma.js";

export const BookingAnalyticsService = {
  async getBookingAnalytics(dateRange: DateRange): Promise<BookingAnalytics> {
    // Reuse existing booking stats
    const stats = await BookingRepository.getStats(dateRange.startDate, dateRange.endDate);

    const totalBookings = stats.counts.PENDING + stats.counts.CONFIRMED + 
                         stats.counts.ACTIVE + stats.counts.COMPLETED + 
                         stats.counts.CANCELLED + stats.counts.REFUNDED;

    const days = daysBetween(dateRange.startDate, dateRange.endDate);
    const averageBookingsPerDay = days > 0 ? totalBookings / days : 0;

    // Get peak hours
    const peakHours = await this.getPeakBookingHours(dateRange);

    return {
      totals: {
        totalBookings,
        pending: stats.counts.PENDING,
        confirmed: stats.counts.CONFIRMED,
        active: stats.counts.ACTIVE,
        completed: stats.counts.COMPLETED,
        cancelled: stats.counts.CANCELLED,
        refunded: stats.counts.REFUNDED,
      },
      metrics: {
        successRate: stats.conversionRate,
        averageBookingsPerDay: Number(averageBookingsPerDay.toFixed(2)),
        averageDurationMin: stats.averageDuration,
        totalDurationHours: Number((stats.averageDuration * stats.counts.COMPLETED / 60).toFixed(2)),
      },
      peakHours,
    };
  },

  async getPeakBookingHours(dateRange: DateRange): Promise<Array<{ hour: number; count: number }>> {
    const bookings = await prisma.booking.findMany({
      where: {
        scheduledStart: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      select: {
        scheduledStart: true,
      },
    });

    // Group by hour
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }

    bookings.forEach((booking) => {
      const hour = booking.scheduledStart.getHours();
      hourCounts[hour]++;
    });

    // Convert to array and sort by count
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 hours
  },
};
