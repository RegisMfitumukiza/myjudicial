import { prisma } from "../../infrastructure/database/prisma.js";
import { EscrowStatus } from "../../generated/prisma/client.js";

export const EscrowLedgerRepository = {
  create: async (
    data: {
      roomId: string;
      bookingId: string;
      lawyerWalletPhone: string;
      totalFee: number;
      status: EscrowStatus;
    },
    tx?: any
  ) => {
    const db = tx || prisma;
    return db.escrowLedger.create({
      data: {
        roomId: data.roomId,
        bookingId: data.bookingId,
        lawyerWalletPhone: data.lawyerWalletPhone,
        totalFee: data.totalFee,
        status: data.status,
      },
    });
  },

  findByBookingId: async (bookingId: string, tx?: any) => {
    const db = tx || prisma;
    return db.escrowLedger.findUnique({
      where: { bookingId },
    });
  },

  findByRoomId: async (roomId: string, tx?: any) => {
    const db = tx || prisma;
    return db.escrowLedger.findUnique({
      where: { roomId },
    });
  },

  updateStatus: async (
    bookingId: string,
    status: EscrowStatus,
    settledAt?: Date,
    tx?: any
  ) => {
    const db = tx || prisma;
    return db.escrowLedger.update({
      where: { bookingId },
      data: {
        status,
        ...(settledAt && { settledAt }),
      },
    });
  },

  /**
   * Calculate total escrow balance (funds locked in escrow but not yet released)
   * Includes: LOCKED and HELD_IN_ESCROW statuses
   */
  getEscrowBalance: async (tx?: any): Promise<number> => {
    const db = tx || prisma;
    
    const result = await db.escrowLedger.aggregate({
      where: {
        status: {
          in: ["LOCKED", "HELD_IN_ESCROW"],
        },
      },
      _sum: {
        totalFee: true,
      },
    });

    return Number(result._sum.totalFee || 0);
  },

  /**
   * Get detailed escrow statistics for analytics
   */
  getEscrowStats: async (tx?: any) => {
    const db = tx || prisma;

    const [statusCounts, totalsByStatus] = await Promise.all([
      // Count of escrow entries by status
      db.escrowLedger.groupBy({
        by: ['status'],
        _count: {
          id: true,
        },
      }),
      // Sum of amounts by status
      db.escrowLedger.groupBy({
        by: ['status'],
        _sum: {
          totalFee: true,
        },
      }),
    ]);

    // Combine counts and sums
    const stats: Record<EscrowStatus, { count: number; total: number }> = {
      PENDING: { count: 0, total: 0 },
      LOCKED: { count: 0, total: 0 },
      HELD_IN_ESCROW: { count: 0, total: 0 },
      DISBURSED_TO_EXPERT: { count: 0, total: 0 },
      REFUNDED: { count: 0, total: 0 },
    };

    statusCounts.forEach((item: { status: EscrowStatus; _count: { id: number } }) => {
      stats[item.status].count = item._count.id;
    });

    totalsByStatus.forEach((item: { status: EscrowStatus; _sum: { totalFee: number | null } }) => {
      stats[item.status].total = Number(item._sum.totalFee || 0);
    });

    return {
      byStatus: stats,
      totalEscrowBalance: stats.LOCKED.total + stats.HELD_IN_ESCROW.total,
      totalDisbursed: stats.DISBURSED_TO_EXPERT.total,
      totalRefunded: stats.REFUNDED.total,
    };
  },
};
