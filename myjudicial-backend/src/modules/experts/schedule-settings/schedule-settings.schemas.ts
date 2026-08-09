import { z } from "zod";

// List of common IANA timezone identifiers
const commonTimezones = [
  "Africa/Kigali",
  "Africa/Nairobi",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "UTC",
] as const;

export const updateScheduleSettingsSchema = z.object({
  timezone: z.string().max(50).optional(),
  bufferTimeMinutes: z.number().int().min(0).max(120).optional(),
  advanceNoticeHours: z.number().int().min(0).max(168).optional(), // Max 1 week
  maxDaysInAdvance: z.number().int().min(1).max(365).optional(), // Max 1 year
  maxBookingsPerDay: z.number().int().min(1).max(50).nullable().optional(),
  respectPresenceStatus: z.boolean().optional(),
});

export type UpdateScheduleSettingsDto = z.infer<typeof updateScheduleSettingsSchema>;

// Validation helper
export function validateTimezone(timezone: string): boolean {
  try {
    // Test if timezone is valid by creating a formatter
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
