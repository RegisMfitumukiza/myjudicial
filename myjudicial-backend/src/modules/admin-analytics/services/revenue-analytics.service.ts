/**
 * Revenue Analytics Service
 * 
 * Financial metrics and revenue tracking
 */

import { BookingRepository } from "../../bookings/booking.repository.js";
import { EscrowLedgerRepository } from "../../payments/escrow.repository.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import type { DateRange, RevenueAnalytics } from "../types/analytics.types.js";

export const RevenueAnalyticsService = {
  async getRevenueAnalytics(dateRange: DateRange): Promise<RevenueAnalytics> {
    // Get booking revenue stats and escrow stats in parallel
    const [stats, escrowStats] = await Promise.all([
      BookingRepository.getStats(dateRange.startDate, dateRange.endDate),
      EscrowLedgerRepository.getEscrowStats(),
    ]);

    return {
      totals: {
        totalRevenue: stats.totalRevenue,
        platformFees: stats.totalPlatformFees,
        expertPayouts: stats.totalExpertPayouts,
        escrowLocked: escrowStats.byStatus.LOCKED.total + escrowStats.byStatus.HELD_IN_ESCROW.total,
        escrowReleased: escrowStats.byStatus.DISBURSED_TO_EXPERT.total,
        refundsProcessed: escrowStats.byStatus.REFUNDED.total,
      },
    };
  },

  async getEscrowStats(dateRange: DateRange) {
    const escrowData = await prisma.escrowLedger.findMany({
      where: {
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      select: {
        status: true,
        totalFeeRwf: true,
      },
    });

    const locked = escrowData
      .filter((e) => e.status === "LOCKED" || e.status === "HELD_IN_ESCROW")
      .reduce((sum, e) => sum + Number(e.totalFeeRwf), 0);

    const released = escrowData
      .filter((e) => e.status === "DISBURSED_TO_EXPERT")
      .reduce((sum, e) => sum + Number(e.totalFeeRwf), 0);

    const refunded = escrowData
      .filter((e) => e.status === "REFUNDED")
      .reduce((sum, e) => sum + Number(e.totalFeeRwf), 0);

    return { locked, released, refunded };
  },
};
