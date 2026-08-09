/**
 * Drill-Down Validation Schemas
 * 
 * Zod schemas for drill-down request validation
 */

import { z } from "zod";

// Import BookingStatus enum values manually
const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

/**
 * Booking drill-down query schema
 */
export const bookingDrillDownQuerySchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED", "REFUNDED"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  citizenId: z.string().uuid().optional(),
  expertId: z.string().uuid().optional(),
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1)).default(1),
  limit: z.preprocess((val) => Number(val) || 50, z.number().min(1).max(100)).default(50),
  sortBy: z.enum(["scheduledStart", "createdAt", "totalAmount"]).default("scheduledStart"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).refine(
  (data) => {
    // If startDate provided, endDate is required and vice versa
    if (data.startDate && !data.endDate) return false;
    if (data.endDate && !data.startDate) return false;
    return true;
  },
  {
    message: "Both startDate and endDate must be provided together",
  }
).refine(
  (data) => {
    // If both dates provided, startDate must be before endDate
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
    // Page must be >= 1
    return data.page >= 1;
  },
  {
    message: "Page must be greater than or equal to 1",
  }
).refine(
  (data) => {
    // Limit must be between 1 and 100
    return data.limit >= 1 && data.limit <= 100;
  },
  {
    message: "Limit must be between 1 and 100",
  }
);

export type BookingDrillDownQueryDto = z.infer<typeof bookingDrillDownQuerySchema>;

/**
 * Validate booking drill-down query
 */
export function validateBookingDrillDownQuery(query: unknown): BookingDrillDownQueryDto {
  return bookingDrillDownQuerySchema.parse(query);
}
