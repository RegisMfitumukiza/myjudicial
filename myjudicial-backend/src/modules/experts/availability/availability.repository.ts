import { prisma } from "../../../infrastructure/database/prisma.js";
import type { DayOfWeek, PresenceStatus } from "../../../generated/prisma/client.js";
import type { TimeBlock } from "./time-blocks.types.js";
import { areValidTimeBlocks, sortTimeBlocks } from "./time-blocks.types.js";

type ScheduleSlot = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

type ScheduleSlotWithBlocks = {
  dayOfWeek: DayOfWeek;
  isAvailable: boolean;
  // Phase 4: Support time blocks
  timeBlocks?: TimeBlock[];
  // Legacy fields (still supported for backward compatibility)
  startTime?: string;
  endTime?: string;
};

export const AvailabilityRepository = {
  findByExpertId: async (expertId: string) => {
    return prisma.expertAvailability.findMany({
      where: { expertId },
      orderBy: { dayOfWeek: "asc" },
    });
  },

  /**
   * Current presence as the rest of the app reads it: the first weekday row
   * (same ordering as findByExpertId). Undefined when no rows exist yet.
   */
  getCurrentPresence: async (expertId: string): Promise<PresenceStatus | undefined> => {
    const first = await prisma.expertAvailability.findFirst({
      where: { expertId },
      orderBy: { dayOfWeek: "asc" },
      select: { presenceStatus: true },
    });
    return first?.presenceStatus;
  },

  /**
   * Upsert schedule slots — one per day per expert.
   * Phase 4: Now supports time blocks format.
   * Uses Prisma upsert with unique([expertId, dayOfWeek]).
   */
  upsertSchedule: async (expertId: string, slots: ScheduleSlot[]) => {
    // New weekday rows inherit the expert's current presence instead of the
    // column default (OFFLINE), so adding a day never flips presence per-row.
    const presence = await AvailabilityRepository.getCurrentPresence(expertId);
    const operations = slots.map((slot) =>
      prisma.expertAvailability.upsert({
        where: { expertId_dayOfWeek: { expertId, dayOfWeek: slot.dayOfWeek } },
        create: { expertId, ...slot, ...(presence && { presenceStatus: presence }) },
        update: {
          startTime: slot.startTime,
          endTime: slot.endTime,
          isAvailable: slot.isAvailable,
        },
      })
    );
    return prisma.$transaction(operations);
  },

  /**
   * Phase 4: Upsert schedule with time blocks support
   */
  upsertScheduleWithBlocks: async (expertId: string, slots: ScheduleSlotWithBlocks[]) => {
    const presence = await AvailabilityRepository.getCurrentPresence(expertId);
    const operations = slots.map((slot) => {
      // Validate time blocks if provided
      if (slot.timeBlocks && !areValidTimeBlocks(slot.timeBlocks)) {
        throw new Error(`Invalid time blocks for ${slot.dayOfWeek}`);
      }

      // Prepare data based on format
      const usesTimeBlocks = !!slot.timeBlocks;
      const sorted = slot.timeBlocks ? sortTimeBlocks(slot.timeBlocks) : undefined;

      const timeBlocksJson = sorted ? JSON.parse(JSON.stringify(sorted)) : undefined;

      return prisma.expertAvailability.upsert({
        where: { expertId_dayOfWeek: { expertId, dayOfWeek: slot.dayOfWeek } },
        create: {
          expertId,
          dayOfWeek: slot.dayOfWeek,
          isAvailable: slot.isAvailable,
          usesTimeBlocks,
          timeBlocks: timeBlocksJson,
          // Fallback to legacy format if no time blocks
          startTime: slot.startTime || (sorted ? sorted[0].start : "09:00"),
          endTime: slot.endTime || (sorted ? sorted[sorted.length - 1].end : "17:00"),
        },
        update: {
          isAvailable: slot.isAvailable,
          usesTimeBlocks,
          timeBlocks: timeBlocksJson,
          // Update legacy fields for backward compatibility
          startTime: slot.startTime || (sorted ? sorted[0].start : undefined),
          endTime: slot.endTime || (sorted ? sorted[sorted.length - 1].end : undefined),
        },
      });
    });

    return prisma.$transaction(operations);
  },

  updatePresence: async (expertId: string, presenceStatus: PresenceStatus) => {
    // Update presence on all availability rows for this expert
    return prisma.expertAvailability.updateMany({
      where: { expertId },
      data: { presenceStatus },
    });
  },
};
