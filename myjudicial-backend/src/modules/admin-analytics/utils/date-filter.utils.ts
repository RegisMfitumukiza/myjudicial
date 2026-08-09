/**
 * Date Filter Utilities
 * 
 * Reusable utilities for converting time periods to date ranges
 */

import type { TimePeriod, DateRange } from "../types/analytics.types.js";

/**
 * Convert a time period to a date range
 */
export const periodToDateRange = (
  period: TimePeriod,
  customStartDate?: Date,
  customEndDate?: Date
): DateRange => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return {
        startDate: today,
        endDate: now,
      };

    case "7days": {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return {
        startDate: sevenDaysAgo,
        endDate: now,
      };
    }

    case "30days": {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return {
        startDate: thirtyDaysAgo,
        endDate: now,
      };
    }

    case "90days": {
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return {
        startDate: ninetyDaysAgo,
        endDate: now,
      };
    }

    case "year": {
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return {
        startDate: oneYearAgo,
        endDate: now,
      };
    }

    case "custom":
      if (!customStartDate || !customEndDate) {
        throw new Error("Custom period requires startDate and endDate");
      }
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };

    default:
      // Default to last 30 days
      const defaultStart = new Date(today);
      defaultStart.setDate(defaultStart.getDate() - 30);
      return {
        startDate: defaultStart,
        endDate: now,
      };
  }
};

/**
 * Get start of today
 */
export const getStartOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Get start of this month
 */
export const getStartOfThisMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Get start of this week (Monday)
 */
export const getStartOfThisWeek = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(now.getFullYear(), now.getMonth(), diff);
};

/**
 * Calculate number of days between two dates
 */
export const daysBetween = (start: Date, end: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((end.getTime() - start.getTime()) / msPerDay);
};

/**
 * Parse date range query parameters
 */
export const parseDateRange = (query: {
  period?: TimePeriod;
  startDate?: string;
  endDate?: string;
  timezone?: string;
}): DateRange | undefined => {
  if (!query.period) {
    return undefined;
  }

  if (query.period === "custom" && query.startDate && query.endDate) {
    return {
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    };
  }

  return periodToDateRange(query.period);
};
