import { z } from "zod";

// Override types enum
export const OverrideTypeEnum = z.enum(["CLOSED", "CUSTOM_HOURS", "REDUCED_CAPACITY"]);
export type OverrideType = z.infer<typeof OverrideTypeEnum>;

// Time validation regex (HH:MM format)
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Create override schema
export const createOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  overrideType: OverrideTypeEnum,
  startTime: z.string().regex(timeRegex, "Time must be in HH:MM format").optional(),
  endTime: z.string().regex(timeRegex, "Time must be in HH:MM format").optional(),
  maxBookings: z.number().int().min(1).max(50).optional(),
  reason: z.string().max(500).optional(),
}).refine(
  (data) => {
    // CUSTOM_HOURS requires both startTime and endTime
    if (data.overrideType === "CUSTOM_HOURS") {
      return data.startTime && data.endTime;
    }
    return true;
  },
  {
    message: "CUSTOM_HOURS override requires both startTime and endTime",
  }
).refine(
  (data) => {
    // REDUCED_CAPACITY requires maxBookings
    if (data.overrideType === "REDUCED_CAPACITY") {
      return data.maxBookings !== undefined;
    }
    return true;
  },
  {
    message: "REDUCED_CAPACITY override requires maxBookings",
  }
).refine(
  (data) => {
    // Validate start time is before end time
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  {
    message: "Start time must be before end time",
  }
);

export type CreateOverrideDto = z.infer<typeof createOverrideSchema>;

// Update override schema (all fields optional except date)
export const updateOverrideSchema = z.object({
  overrideType: OverrideTypeEnum.optional(),
  startTime: z.string().regex(timeRegex).nullable().optional(),
  endTime: z.string().regex(timeRegex).nullable().optional(),
  maxBookings: z.number().int().min(1).max(50).nullable().optional(),
  reason: z.string().max(500).nullable().optional(),
});

export type UpdateOverrideDto = z.infer<typeof updateOverrideSchema>;

// Query params for listing overrides
export const listOverridesSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format").optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type ListOverridesQuery = z.infer<typeof listOverridesSchema>;

// Bulk create schema (for vacation mode)
export const bulkCreateOverridesSchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overrideType: OverrideTypeEnum,
  reason: z.string().max(500).optional(),
}).refine(
  (data) => {
    return data.fromDate <= data.toDate;
  },
  {
    message: "fromDate must be before or equal to toDate",
  }
);

export type BulkCreateOverridesDto = z.infer<typeof bulkCreateOverridesSchema>;
