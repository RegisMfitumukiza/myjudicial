/**
 * Analytics Validation Schemas
 * 
 * Zod schemas for request validation
 */

import { z } from "zod";

/**
 * Time period schema
 */
export const timePeriodSchema = z.enum(["today", "7days", "30days", "90days", "year", "custom"]);

/**
 * Common analytics query schema
 */
export const analyticsQuerySchema = z.object({
  period: timePeriodSchema.optional().default("30days"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timezone: z.string().optional().default("UTC"),
}).refine(
  (data) => {
    // If period is custom, startDate and endDate are required
    if (data.period === "custom") {
      return !!data.startDate && !!data.endDate;
    }
    return true;
  },
  {
    message: "startDate and endDate are required when period is 'custom'",
  }
).refine(
  (data) => {
    // If startDate and endDate provided, startDate must be before endDate
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: "startDate must be before or equal to endDate",
  }
).refine(
  (data) => {
    // Dates cannot be in the future
    if (data.endDate) {
      return new Date(data.endDate) <= new Date();
    }
    return true;
  },
  {
    message: "endDate cannot be in the future",
  }
);

export type AnalyticsQueryDto = z.infer<typeof analyticsQuerySchema>;

/**
 * Validate analytics query parameters
 */
export function validateAnalyticsQuery(query: unknown): AnalyticsQueryDto {
  return analyticsQuerySchema.parse(query);
}
