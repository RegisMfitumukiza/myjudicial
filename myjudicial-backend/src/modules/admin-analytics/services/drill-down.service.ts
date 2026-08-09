/**
 * Drill-Down Service
 * 
 * Provides detailed record views from aggregated metrics
 */

import { prisma } from "../../../infrastructure/database/prisma.js";
import type {
  DrillDownFilters,
  PaginationParams,
  BookingDrillDownRecord,
  BookingDrillDownResult,
} from "../types/drill-down.types.js";
import type { BookingDrillDownQueryDto } from "../schemas/drill-down.schemas.js";
import { logger } from "../../../shared/utils/logger.js";

export const DrillDownService = {
  /**
   * Drill down into booking metrics
   */
  async drillDownBookings(query: BookingDrillDownQueryDto): Promise<BookingDrillDownResult> {
    const { status, startDate, endDate, citizenId, expertId, page, limit, sortBy, sortOrder } = query;

    // Build where clause
    const where: any = {
      isDeleted: false,
    };

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.scheduledStart = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (citizenId) {
      where.citizenId = citizenId;
    }

    if (expertId) {
      where.expertId = expertId;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build order by
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries in parallel
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          citizenId: true,
          expertId: true,
          serviceId: true,
          status: true,
          scheduledStart: true,
          scheduledEnd: true,
          totalAmount: true,
          platformFee: true,
          expertPayout: true,
          actualDurationMin: true,
          createdAt: true,
          citizen: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          expert: {
            select: {
              displayName: true,
            },
          },
          legalService: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    // Format records
    const records: BookingDrillDownRecord[] = bookings.map((booking: any) => ({
      id: booking.id,
      citizenId: booking.citizenId,
      citizenName: `${booking.citizen.firstName} ${booking.citizen.lastName}`,
      expertId: booking.expertId,
      expertName: booking.expert.displayName,
      serviceId: booking.serviceId,
      serviceName: booking.legalService?.name || "Unknown Service",
      status: booking.status,
      scheduledStart: booking.scheduledStart,
      scheduledEnd: booking.scheduledEnd,
      totalAmount: Number(booking.totalAmount),
      platformFee: Number(booking.platformFee || 0),
      expertPayout: Number(booking.expertPayout || 0),
      actualDurationMin: booking.actualDurationMin,
      createdAt: booking.createdAt,
    }));

    // Build result
    const result: BookingDrillDownResult = {
      metric: status ? `${status.toLowerCase()}-bookings` : "all-bookings",
      filters: {
        ...(status && { status }),
        ...(startDate && endDate && {
          dateRange: {
            start: startDate,
            end: endDate,
          },
        }),
      },
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    logger.debug("Booking drill-down executed", {
      filters: result.filters,
      recordCount: records.length,
      total,
    });

    return result;
  },

  /**
   * Get single booking detail
   */
  async getBookingDetail(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        expert: {
          select: {
            id: true,
            displayName: true,
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
        legalService: {
          select: {
            id: true,
            name: true,
            description: true,
            specialty: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            method: true,
            providerTransactionId: true,
            paidAt: true,
          },
        },
        escrowLedgerEntries: {
          select: {
            id: true,
            status: true,
            amount: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        reviews: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            rating: true,
            comment: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      return null;
    }

    return {
      booking,
      timeline: [
        {
          event: "Booking Created",
          timestamp: booking.createdAt,
          status: "PENDING",
        },
        ...(booking.completedAt
          ? [
              {
                event: "Consultation Completed",
                timestamp: booking.completedAt,
                status: "COMPLETED",
              },
            ]
          : []),
      ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    };
  },
};
