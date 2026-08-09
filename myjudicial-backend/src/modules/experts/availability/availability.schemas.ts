import { z } from "zod";

const days = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"] as const;
const presenceStatuses = ["ONLINE","OFFLINE","BUSY","ON_LEAVE"] as const;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Phase 4: Time block schema
const timeBlock = z.object({
  start: z.string().regex(timeRegex, "Start time must be HH:MM format"),
  end: z.string().regex(timeRegex, "End time must be HH:MM format"),
}).refine(
  (data) => {
    const [startH, startM] = data.start.split(':').map(Number);
    const [endH, endM] = data.end.split(':').map(Number);
    return (endH * 60 + endM) > (startH * 60 + startM);
  },
  { message: "End time must be after start time" }
);

// Legacy schedule slot (Phase 1-3 compatibility)
const scheduleSlot = z.object({
  dayOfWeek: z.enum(days),
  startTime: z.string().regex(timeRegex, "Start time must be HH:MM format"),
  endTime: z.string().regex(timeRegex, "End time must be HH:MM format"),
  isAvailable: z.boolean().default(true),
});

// Phase 4: Schedule slot with time blocks support
const scheduleSlotWithBlocks = z.object({
  dayOfWeek: z.enum(days),
  isAvailable: z.boolean().default(true),
  // Either use time blocks (new) or legacy startTime/endTime (old)
  timeBlocks: z.array(timeBlock).min(1).max(10).optional(),
  startTime: z.string().regex(timeRegex).optional(),
  endTime: z.string().regex(timeRegex).optional(),
}).refine(
  (data) => {
    // Must have either timeBlocks or both startTime+endTime
    const hasTimeBlocks = data.timeBlocks && data.timeBlocks.length > 0;
    const hasLegacy = data.startTime && data.endTime;
    return hasTimeBlocks || hasLegacy;
  },
  { message: "Must provide either timeBlocks or startTime+endTime" }
).refine(
  (data) => {
    // If time blocks provided, validate no overlaps
    if (!data.timeBlocks || data.timeBlocks.length <= 1) return true;
    
    const sorted = [...data.timeBlocks].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1].start < sorted[i].end) {
        return false; // Overlap detected
      }
    }
    return true;
  },
  { message: "Time blocks must not overlap" }
);

export const upsertAvailabilitySchema = z.object({
  presenceStatus: z.enum(presenceStatuses).optional(),
  schedule: z.array(scheduleSlot).max(7).optional(),
});

// Phase 4: New schema with time blocks support
export const upsertAvailabilityWithBlocksSchema = z.object({
  presenceStatus: z.enum(presenceStatuses).optional(),
  schedule: z.array(scheduleSlotWithBlocks).max(7).optional(),
});

export const updatePresenceSchema = z.object({
  presenceStatus: z.enum(presenceStatuses),
});

export type UpsertAvailabilityDto = z.infer<typeof upsertAvailabilitySchema>;
export type UpsertAvailabilityWithBlocksDto = z.infer<typeof upsertAvailabilityWithBlocksSchema>;
export type UpdatePresenceDto = z.infer<typeof updatePresenceSchema>;
export type TimeBlockDto = z.infer<typeof timeBlock>;
export type ScheduleSlotWithBlocksDto = z.infer<typeof scheduleSlotWithBlocks>;
