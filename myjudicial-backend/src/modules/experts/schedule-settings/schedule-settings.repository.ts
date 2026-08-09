import { prisma } from "../../../infrastructure/database/prisma.js";

export const ScheduleSettingsRepository = {
  /**
   * Find settings by expert ID
   */
  findByExpertId: async (expertId: string) => {
    return prisma.expertScheduleSettings.findUnique({
      where: { expertId },
    });
  },

  /**
   * Get settings or create default if not exists
   */
  findOrCreateDefault: async (expertId: string) => {
    const existing = await prisma.expertScheduleSettings.findUnique({
      where: { expertId },
    });

    if (existing) {
      return existing;
    }

    // Create default settings
    return prisma.expertScheduleSettings.create({
      data: {
        expertId,
        timezone: "Africa/Kigali",
        bufferTimeMinutes: 15,
        advanceNoticeHours: 24,
        maxDaysInAdvance: 60,
        maxBookingsPerDay: null,
        respectPresenceStatus: true,
      },
    });
  },

  /**
   * Update settings
   */
  update: async (
    expertId: string,
    data: {
      timezone?: string;
      bufferTimeMinutes?: number;
      advanceNoticeHours?: number;
      maxDaysInAdvance?: number;
      maxBookingsPerDay?: number | null;
      respectPresenceStatus?: boolean;
    }
  ) => {
    return prisma.expertScheduleSettings.upsert({
      where: { expertId },
      create: {
        expertId,
        timezone: data.timezone ?? "Africa/Kigali",
        bufferTimeMinutes: data.bufferTimeMinutes ?? 15,
        advanceNoticeHours: data.advanceNoticeHours ?? 24,
        maxDaysInAdvance: data.maxDaysInAdvance ?? 60,
        maxBookingsPerDay: data.maxBookingsPerDay,
        respectPresenceStatus: data.respectPresenceStatus ?? true,
      },
      update: data,
    });
  },
};
