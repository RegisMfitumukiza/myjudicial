/**
 * Comparison Types
 * 
 * Type definitions for comparative analytics
 */

export type TrendDirection = "up" | "down" | "stable";

export interface MetricComparison {
  change: number;
  percentChange: number;
  trend: TrendDirection;
}

export interface PeriodData {
  period: {
    start: string;
    end: string;
  };
  [key: string]: any;
}

export interface ComparisonResult {
  current: PeriodData;
  previous: PeriodData;
  comparison: Record<string, MetricComparison>;
}

export interface BookingComparisonResult {
  current: {
    period: { start: string; end: string };
    totals: {
      totalBookings: number;
      pending: number;
      confirmed: number;
      active: number;
      completed: number;
      cancelled: number;
      refunded: number;
    };
    metrics: {
      successRate: number;
      averageBookingsPerDay: number;
      averageDurationMin: number;
    };
  };
  previous: {
    period: { start: string; end: string };
    totals: {
      totalBookings: number;
      pending: number;
      confirmed: number;
      active: number;
      completed: number;
      cancelled: number;
      refunded: number;
    };
    metrics: {
      successRate: number;
      averageBookingsPerDay: number;
      averageDurationMin: number;
    };
  };
  comparison: {
    totalBookings: MetricComparison;
    completedBookings: MetricComparison;
    successRate: MetricComparison;
    averageBookingsPerDay: MetricComparison;
  };
}

export interface RevenueComparisonResult {
  current: {
    period: { start: string; end: string };
    totals: {
      totalRevenue: number;
      platformFees: number;
      expertPayouts: number;
    };
  };
  previous: {
    period: { start: string; end: string };
    totals: {
      totalRevenue: number;
      platformFees: number;
      expertPayouts: number;
    };
  };
  comparison: {
    totalRevenue: MetricComparison;
    platformFees: MetricComparison;
    expertPayouts: MetricComparison;
  };
}

export interface UserComparisonResult {
  current: {
    period: { start: string; end: string };
    totals: {
      totalUsers: number;
      newUsers: number;
    };
  };
  previous: {
    period: { start: string; end: string };
    totals: {
      totalUsers: number;
      newUsers: number;
    };
  };
  comparison: {
    totalUsers: MetricComparison;
    newUsers: MetricComparison;
  };
}
