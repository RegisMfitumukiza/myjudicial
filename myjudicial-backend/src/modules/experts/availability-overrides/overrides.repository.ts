import { prisma } from "../../../infrastructure/database/prisma.js";
import type { Prisma } from "../../../generated/prisma/client.js";
import type { CreateOverrideDto } from "./overrides.schemas.js";

export const OverridesRepository = {
  /**
   * Find overrides by expert ID within date range
   */
  findByExpertId: async (
    expertId: string,
    fromDate?: Date,
    toDate?: Date,
    tx?: Prisma.TransactionClient
  ) => {
    const client = tx || prisma;

    const where: Prisma.AvailabilityOverrideWhereInput = {
      expertId,
      ...(fromDate || toDate
        ? {
            date: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    };

    return client.availabilityOverride.findMany({
      where,
      orderBy: { date: "asc" },
    });
  },

  /**
   * Find override by expert ID and specific date
   */
  findByDate: async (
    expertId: string,
    date: Date,
    tx?: Prisma.TransactionClient
  ) => {
    const client = tx || prisma;

    return client.availabilityOverride.findUnique({
      where: {
        expertId_date: {
          expertId,
          date,
        },
      },
    });
  },

  /**
   * Find override by ID
   */
  findById: async (
    id: string,
    tx?: Prisma.TransactionClient
  ) => {
    const client = tx || prisma;

    return client.availabilityOverride.findUnique({
      where: { id },
    });
  },

  /**
   * Create new override
   */
  create: async (
    expertId: string,
    data: CreateOverrideDto,
    tx?: Prisma.TransactionClient
  ) => {
    const client = tx || prisma;

    return client.availabilityOverride.create({
      data: {
        expertId,
        date: new Date(data.date),
        overrideType: data.overrideType,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        maxBookings: data.maxBookings || null,
        reason: data.reason || null,
      },
    });
  },

  /**
   * Update existing override
   */
  update: async (
    id: string,
    data: Partial<CreateOverrideDto>,
    tx?: Prisma.TransactionClient
  ) => {
    const client = tx || prisma;

    return client.availabilityOverride.update({
      where: { id },
      data: {
        ...(data.overrideType && { overrideType: data.overrideType }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.maxBookings !== undefined && { maxBookings: data.maxBookings }),
        ...(data.reason !== undefined && { reason: data.reason }),
      },
    });
  },

  /**
   * Delete override by ID
   */
  delete: async (id: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;

    return client.availabilityOverride.delete({
      where: { id },
    });
  },

  /**
   * Delete overrides in date range (for bulk operations)
   */
  deleteRange: async (
    expertId: string,
    fromDate: Date,
    toDate: Date,
    tx?: Prisma.TransactionClient
  ) => {
    const client = tx || prisma;

    return client.availabilityOverride.deleteMany({
      where: {
        expertId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });
  },

  /**
   * Bulk create overrides (for vacation mode)
   */
  bulkCreate: async (
    expertId: string,
    dates: Date[],
    overrideType: "CLOSED" | "CUSTOM_HOURS" | "REDUCED_CAPACITY",
    reason?: string,
    tx?: Prisma.TransactionClient
  ) => {
    const client = tx || prisma;

    const data = dates.map((date) => ({
      expertId,
      date,
      overrideType,
      reason: reason || null,
      startTime: null,
      endTime: null,
      maxBookings: null,
    }));

    return client.availabilityOverride.createMany({
      data,
      skipDuplicates: true, // Skip if override already exists for that date
    });
  },

  /**
   * Check if expert has any bookings on specific date
   */
  hasBookingsOnDate: async (
    expertId: string,
    date: Date,
    tx?: Prisma.TransactionClient
  ) => {
    const client = tx || prisma;

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const count = await client.booking.count({
      where: {
        expertId,
        scheduledStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["PENDING", "CONFIRMED", "ACTIVE"],
        },
      },
    });

    return count > 0;
  },
};
