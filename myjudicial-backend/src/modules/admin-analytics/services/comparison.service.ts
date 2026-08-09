/**
 * Comparison Service
 * 
 * Provides period-over-period comparative analytics
 */

import { AnalyticsService } from "./analytics.service.js";
import { periodToDateRange } from "../utils/date-filter.utils.js";
import type { DateRangeQuery, TimePeriod } from "../types/analytics.types.js";
import type {
  MetricComparison,
  TrendDirection,
  BookingComparisonResult,
  RevenueComparisonResult,
  UserComparisonResult,
} from "../types/comparison.types.js";

export const ComparisonService = {
  /**
   * Calculate metric comparison
   */
  calculateComparison(current: number, previous: number): MetricComparison {
    const change = current - previous;
    const percentChange = previous > 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);

    let trend: TrendDirection = "stable";
    if (Math.abs(percentChange) >= 1) {
      trend = percentChange > 0 ? "up" : "down";
    }

    return {
      change,
      percentChange: Number(percentChange.toFixed(2)),
      trend,
    };
  },

  /**
   * Calculate previous period based on current period
   */
  calculatePreviousPeriod(query: DateRangeQuery): { startDate: Date; endDate: Date } {
    const currentRange = query.period
      ? periodToDateRange(query.period as TimePeriod)
      : {
          startDate: new Date(query.startDate!),
          endDate: new Date(query.endDate!),
        };

    // Calculate the duration of the current period
    const durationMs = currentRange.endDate.getTime() - currentRange.startDate.getTime();

    // Previous period ends where current period starts, and has the same duration
    const previousEnd = new Date(currentRange.startDate.getTime() - 1); // 1ms before current start
    const previousStart = new Date(previousEnd.getTime() - durationMs);

    return {
      startDate: previousStart,
      endDate: previousEnd,
    };
  },

  /**
   * Format period for display
   */
  formatPeriod(startDate: Date, endDate: Date): { start: string; end: string } {
    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  },

  /**
   * Compare booking analytics
   */
  async compareBookings(query: DateRangeQuery): Promise<BookingComparisonResult> {
    // Get current period data
    const currentRange = query.period
      ? periodToDateRange(query.period as TimePeriod)
      : { startDate: new Date(query.startDate!), endDate: new Date(query.endDate!) };

    const currentResult = await AnalyticsService.getBookingAnalytics({
      ...query,
      startDate: currentRange.startDate.toISOString(),
      endDate: currentRange.endDate.toISOString(),
    });
    const currentData = currentResult.data;

    // Calculate previous period
    const previousRange = this.calculatePreviousPeriod(query);
    const previousResult = await AnalyticsService.getBookingAnalytics({
      period: "custom",
      startDate: previousRange.startDate.toISOString(),
      endDate: previousRange.endDate.toISOString(),
    });
    const previousData = previousResult.data;

    // Build comparison
    return {
      current: {
        period: this.formatPeriod(currentRange.startDate, currentRange.endDate),
        totals: currentData.totals,
        metrics: currentData.metrics,
      },
      previous: {
        period: this.formatPeriod(previousRange.startDate, previousRange.endDate),
        totals: previousData.totals,
        metrics: previousData.metrics,
      },
      comparison: {
        totalBookings: this.calculateComparison(
          currentData.totals.totalBookings,
          previousData.totals.totalBookings
        ),
        completedBookings: this.calculateComparison(
          currentData.totals.completed,
          previousData.totals.completed
        ),
        successRate: this.calculateComparison(
          currentData.metrics.successRate,
          previousData.metrics.successRate
        ),
        averageBookingsPerDay: this.calculateComparison(
          currentData.metrics.averageBookingsPerDay,
          previousData.metrics.averageBookingsPerDay
        ),
      },
    };
  },

  /**
   * Compare revenue analytics
   */
  async compareRevenue(query: DateRangeQuery): Promise<RevenueComparisonResult> {
    // Get current period data
    const currentRange = query.period
      ? periodToDateRange(query.period as TimePeriod)
      : { startDate: new Date(query.startDate!), endDate: new Date(query.endDate!) };

    const currentResult = await AnalyticsService.getRevenueAnalytics({
      ...query,
      startDate: currentRange.startDate.toISOString(),
      endDate: currentRange.endDate.toISOString(),
    });
    const currentData = currentResult.data;

    // Calculate previous period
    const previousRange = this.calculatePreviousPeriod(query);
    const previousResult = await AnalyticsService.getRevenueAnalytics({
      period: "custom",
      startDate: previousRange.startDate.toISOString(),
      endDate: previousRange.endDate.toISOString(),
    });
    const previousData = previousResult.data;

    // Build comparison
    return {
      current: {
        period: this.formatPeriod(currentRange.startDate, currentRange.endDate),
        totals: {
          totalRevenue: currentData.totals.totalRevenue,
          platformFees: currentData.totals.platformFees,
          expertPayouts: currentData.totals.expertPayouts,
        },
      },
      previous: {
        period: this.formatPeriod(previousRange.startDate, previousRange.endDate),
        totals: {
          totalRevenue: previousData.totals.totalRevenue,
          platformFees: previousData.totals.platformFees,
          expertPayouts: previousData.totals.expertPayouts,
        },
      },
      comparison: {
        totalRevenue: this.calculateComparison(
          currentData.totals.totalRevenue,
          previousData.totals.totalRevenue
        ),
        platformFees: this.calculateComparison(
          currentData.totals.platformFees,
          previousData.totals.platformFees
        ),
        expertPayouts: this.calculateComparison(
          currentData.totals.expertPayouts,
          previousData.totals.expertPayouts
        ),
      },
    };
  },

  /**
   * Compare user analytics
   */
  async compareUsers(query: DateRangeQuery): Promise<UserComparisonResult> {
    // Get current period data
    const currentRange = query.period
      ? periodToDateRange(query.period as TimePeriod)
      : { startDate: new Date(query.startDate!), endDate: new Date(query.endDate!) };

    const currentResult = await AnalyticsService.getUserAnalytics({
      ...query,
      startDate: currentRange.startDate.toISOString(),
      endDate: currentRange.endDate.toISOString(),
    });
    const currentData = currentResult.data;

    // Calculate previous period
    const previousRange = this.calculatePreviousPeriod(query);
    const previousResult = await AnalyticsService.getUserAnalytics({
      period: "custom",
      startDate: previousRange.startDate.toISOString(),
      endDate: previousRange.endDate.toISOString(),
    });
    const previousData = previousResult.data;

    // Build comparison
    return {
      current: {
        period: this.formatPeriod(currentRange.startDate, currentRange.endDate),
        totals: {
          totalUsers: currentData.totals.totalUsers,
          newUsers: currentData.totals.newUsers,
        },
      },
      previous: {
        period: this.formatPeriod(previousRange.startDate, previousRange.endDate),
        totals: {
          totalUsers: previousData.totals.totalUsers,
          newUsers: previousData.totals.newUsers,
        },
      },
      comparison: {
        totalUsers: this.calculateComparison(
          currentData.totals.totalUsers,
          previousData.totals.totalUsers
        ),
        newUsers: this.calculateComparison(
          currentData.totals.newUsers,
          previousData.totals.newUsers
        ),
      },
    };
  },
};
