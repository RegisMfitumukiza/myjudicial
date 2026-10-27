import { prisma } from "../../infrastructure/database/prisma.js";
import { BookingStatus, PaymentStatus } from "../../generated/prisma/client.js";

export const BookingRepository = {
  /**
   * Create a new booking
   */
  create: async (data: {
    citizenId: string;
    expertId: string;
    serviceId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    citizenNotes?: string;
    /**
     * Defaults to "PENDING" (payment-required flow). Booking-first flow passes
     * "NOT_REQUIRED" since no payment is collected at creation.
     */
    paymentStatus?: "PENDING" | "NOT_REQUIRED" | "PAID" | "FAILED" | "REFUNDED";
  }, tx?: any) => {
    const db = tx || prisma;
    return db.booking.create({
      data: {
        citizenId: data.citizenId,
        expertId: data.expertId,
        serviceId: data.serviceId,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        citizenNotes: data.citizenNotes,
        status: "PENDING",
        paymentStatus: data.paymentStatus ?? "PENDING",
      },
      include: {
        citizen: { select: { id: true, email: true, firstName: true, lastName: true } },
        expert: { select: { id: true, displayName: true, officeAddress: true, city: true, user: { select: { email: true } } } },
        service: { select: { id: true, name: true, description: true, category: true, deliveryMode: true, flatFee: true, durationMin: true, currency: true } },
      },
    });
  },

  /**
   * Get booking by ID
   */
  findById: async (id: string, tx?: any) => {
    const db = tx || prisma;
    return db.booking.findUnique({
      where: { id },
      include: {
        citizen: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, preferredLanguage: true, avatarObjectKey: true } },
        expert: { select: { id: true, displayName: true, momoNumber: true, officeAddress: true, city: true, profileImageObjectKey: true, user: { select: { id: true, email: true, phone: true, preferredLanguage: true, avatarObjectKey: true } } } },
        service: { select: { id: true, name: true, description: true, category: true, deliveryMode: true, flatFee: true, durationMin: true, currency: true } },
        review: true,
      },
    });
  },

  /**
   * List bookings with filtering and pagination
   */
  list: async (filters: {
    citizenId?: string;
    expertId?: string;
    status?: BookingStatus;
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    limit: number;
  }) => {
    const skip = (filters.page - 1) * filters.limit;
    const where = {
      ...(filters.citizenId && { citizenId: filters.citizenId }),
      ...(filters.expertId && { expertId: filters.expertId }),
      ...(filters.status && { status: filters.status }),
      ...((filters.dateFrom || filters.dateTo) && {
        scheduledStart: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: filters.limit,
        include: {
          citizen: { select: { id: true, email: true, firstName: true, lastName: true, avatarObjectKey: true } },
          expert: {
            select: {
              id: true,
              displayName: true,
              officeAddress: true,
              city: true,
              profileImageObjectKey: true,
              primarySpecialty: true,
              user: {
                select: {
                  email: true,
                  phone: true,
                },
              },
            },
          },
          service: { select: { id: true, name: true, description: true, category: true, deliveryMode: true, flatFee: true, durationMin: true, currency: true } },
          payment: {
            select: {
              id: true,
              amount: true,
              currency: true,
              platformFee: true,
              expertPayout: true,
              txRef: true,
              status: true,
              paidAt: true,
              payoutSentAt: true,
            },
          },
        },
        orderBy: { scheduledStart: "desc" },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      pagination: { page: filters.page, limit: filters.limit, total, pages: Math.ceil(total / filters.limit) },
    };
  },

  getStats: async (dateFrom?: Date, dateTo?: Date) => {
    const where = {
      ...((dateFrom || dateTo) && {
        scheduledStart: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      }),
    };

    const [bookings, stats] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          status: true,
          platformFee: true,
          expertPayout: true,
          actualDurationMin: true,
        },
      }),
      prisma.booking.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
    ]);

    let totalRevenue = 0;
    let totalPlatformFees = 0;
    let totalExpertPayouts = 0;
    let completedCount = 0;
    let totalDuration = 0;

    for (const b of bookings) {
      const fee = Number(b.platformFee ?? 0);
      const payout = Number(b.expertPayout ?? 0);
      totalPlatformFees += fee;
      totalExpertPayouts += payout;
      totalRevenue += (fee + payout);

      if (b.status === "COMPLETED") {
        completedCount++;
        totalDuration += b.actualDurationMin ?? 0;
      }
    }

    const counts = {
      PENDING: 0,
      CONFIRMED: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    };

    for (const s of stats) {
      if (s.status in counts) {
        counts[s.status as keyof typeof counts] = s._count;
      }
    }

    const totalBookings = bookings.length;
    const conversionRate = totalBookings > 0 ? (counts.COMPLETED / totalBookings) * 100 : 0;
    const averageDuration = completedCount > 0 ? totalDuration / completedCount : 0;

    return {
      counts,
      totalBookings,
      totalRevenue,
      totalPlatformFees,
      totalExpertPayouts,
      averageDuration,
      conversionRate,
    };
  },

  /**
   * Update booking
   */
  update: async (
    id: string,
    data: {
      status?: BookingStatus;
      paymentStatus?: PaymentStatus;
      paymentReferenceId?: string;
      cancellationReason?: string;
      meetingRoomId?: string | null;
      meetingJoinUrl?: string | null;
      platformFee?: number;
      expertPayout?: number;
      escrowLockedAt?: Date;
      escrowReleasedAt?: Date;
      completedAt?: Date;
      citizenNotes?: string;
      scheduledStart?: Date;
      scheduledEnd?: Date;
      actualStartTime?: Date | null;
      actualEndTime?: Date | null;
      actualDurationMin?: number | null;
      pendingRescheduleStart?: Date | null;
      pendingRescheduleEnd?: Date | null;
      pendingRescheduleReason?: string | null;
      pendingRescheduleRequestedBy?: string | null;
      deliveredAt?: Date | null;
      deliverySummary?: string | null;
      autoReleaseAt?: Date | null;
      issueReportedAt?: Date | null;
      issueReason?: string | null;
    },
    tx?: any
  ) => {
    const db = tx || prisma;
    return db.booking.update({
      where: { id },
      data,
      include: {
        citizen: { select: { id: true, email: true, firstName: true, lastName: true } },
        expert: { select: { id: true, displayName: true, user: { select: { email: true } } } },
        service: { select: { id: true, name: true, flatFee: true, durationMin: true } },
      },
    });
  },

  /**
   * Get bookings for availability check
   */
  getByDateRange: async (expertId: string, startDate: Date, endDate: Date, tx?: any) => {
    const db = tx || prisma;
    return db.booking.findMany({
      where: {
        expertId,
        status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        scheduledStart: { lt: endDate },
        scheduledEnd: { gt: startDate },
      },
      select: { id: true, scheduledStart: true, scheduledEnd: true },
      orderBy: { scheduledStart: "asc" },
    });
  },

  /**
   * Helper functions to avoid direct prisma calls in service
   */
  findExpertProfileForBooking: async (expertId: string) => {
    return prisma.expertProfile.findUnique({
      where: { id: expertId },
      include: { user: true, services: true },
    });
  },

  findCitizenForBooking: async (citizenId: string) => {
    return prisma.user.findUnique({
      where: { id: citizenId },
    });
  },

  findExpertProfileStatus: async (expertId: string) => {
    return prisma.expertProfile.findUnique({
      where: { id: expertId },
      select: { id: true, status: true },
    });
  },

  /**
   * Look up a booking by the provider transaction reference stored at
   * creation time — used by the payment webhook and callback to resolve
   * which booking a Mobile Money transaction belongs to.
   */
  findByPaymentReference: async (paymentReferenceId: string) => {
    return prisma.booking.findFirst({
      where: { paymentReferenceId },
    });
  },

  findFullBookingById: async (id: string) => {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        expert: { include: { user: { select: { id: true, email: true, fullName: true, firstName: true, preferredLanguage: true } } } },
        service: true,
        citizen: { select: { id: true, firstName: true, lastName: true, email: true, preferredLanguage: true } },
      },
    });
  },
};
