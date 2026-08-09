/**
 * Holiday Calendar Utilities
 * 
 * Rwanda holiday calendar for predictive analytics
 */

export type Holiday = {
  date: string;
  name: string;
  type: "national" | "religious" | "cultural";
  impact: "high" | "medium" | "low";
};

/**
 * Rwanda National Holidays 2024-2025
 */
export const RWANDA_HOLIDAYS: Holiday[] = [
  // 2024 holidays
  { date: "2024-01-01", name: "New Year's Day", type: "national", impact: "high" },
  { date: "2024-02-01", name: "National Heroes Day", type: "national", impact: "medium" },
  { date: "2024-03-29", name: "Good Friday", type: "religious", impact: "high" },
  { date: "2024-04-01", name: "Easter Monday", type: "religious", impact: "medium" },
  { date: "2024-04-07", name: "Genocide Memorial Day", type: "national", impact: "high" },
  { date: "2024-05-01", name: "Labour Day", type: "national", impact: "medium" },
  { date: "2024-07-01", name: "Independence Day", type: "national", impact: "high" },
  { date: "2024-07-04", name: "Liberation Day", type: "national", impact: "high" },
  { date: "2024-08-15", name: "Assumption Day", type: "religious", impact: "low" },
  { date: "2024-12-25", name: "Christmas Day", type: "religious", impact: "high" },
  { date: "2024-12-26", name: "Boxing Day", type: "national", impact: "medium" },

  // 2025 holidays
  { date: "2025-01-01", name: "New Year's Day", type: "national", impact: "high" },
  { date: "2025-02-01", name: "National Heroes Day", type: "national", impact: "medium" },
  { date: "2025-04-18", name: "Good Friday", type: "religious", impact: "high" },
  { date: "2025-04-21", name: "Easter Monday", type: "religious", impact: "medium" },
  { date: "2025-04-07", name: "Genocide Memorial Day", type: "national", impact: "high" },
  { date: "2025-05-01", name: "Labour Day", type: "national", impact: "medium" },
  { date: "2025-07-01", name: "Independence Day", type: "national", impact: "high" },
  { date: "2025-07-04", name: "Liberation Day", type: "national", impact: "high" },
  { date: "2025-08-15", name: "Assumption Day", type: "religious", impact: "low" },
  { date: "2025-12-25", name: "Christmas Day", type: "religious", impact: "high" },
  { date: "2025-12-26", name: "Boxing Day", type: "national", impact: "medium" },
];

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date | string): Holiday | null {
  const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  return RWANDA_HOLIDAYS.find(holiday => holiday.date === dateString) || null;
}

/**
 * Get holidays within a date range
 */
export function getHolidaysInRange(startDate: Date, endDate: Date): Holiday[] {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];
  
  return RWANDA_HOLIDAYS.filter(holiday => {
    return holiday.date >= start && holiday.date <= end;
  });
}

/**
 * Calculate holiday impact on business metrics
 */
export function calculateHolidayImpact(holiday: Holiday): number {
  // Return impact multiplier (business reduction factor)
  switch (holiday.impact) {
    case "high": return 0.3; // 70% reduction
    case "medium": return 0.6; // 40% reduction
    case "low": return 0.8; // 20% reduction
    default: return 1.0; // No impact
  }
}

/**
 * Get next upcoming holidays
 */
export function getUpcomingHolidays(count: number = 5): Holiday[] {
  const today = new Date().toISOString().split('T')[0];
  
  return RWANDA_HOLIDAYS
    .filter(holiday => holiday.date > today)
    .slice(0, count);
}

/**
 * Adjust forecast for holiday impact
 */
export function adjustForHolidays(
  forecastValues: number[],
  forecastDates: string[]
): number[] {
  return forecastValues.map((value, index) => {
    const date = forecastDates[index];
    const holiday = isHoliday(date);
    
    if (holiday) {
      const impactMultiplier = calculateHolidayImpact(holiday);
      return value * impactMultiplier;
    }
    
    return value;
  });
}