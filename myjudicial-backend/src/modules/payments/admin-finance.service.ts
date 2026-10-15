import { prisma } from "../../infrastructure/database/prisma.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { EscrowStatus, PaymentStatus } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { EscrowService } from "./escrow.service.js";
import { resolveExpertPayoutPhone } from "./payout.helper.js";

interface PaymentFilters {
  status?: PaymentStatus;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

interface EscrowFilters {
  status?: EscrowStatus;
  search?: string;
}

interface ListOptions<T> {
  page: number;
  limit: number;
  filters: T;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const AdminFinanceService = {
  /**
   * Get finance statistics
   */
  async getStats(fromDate?: Date, toDate?: Date) {
    const dateFilter: Prisma.PaymentWhereInput = {};
    if (fromDate && toDate) {
      dateFilter.createdAt = { gte: fromDate, lte: toDate };
    } else if (fromDate) {
      dateFilter.createdAt = { gte: fromDate };
    } else if (toDate) {
      dateFilter.createdAt = { lte: toDate };
    }

    const [
      totalRevenue,
      totalPayouts,
      totalPlatformFees,
      pendingPayments,
      paidPayments,
      failedPayments,
      escrowHolds,
      escrowDisbursed,
      escrowRefunded,
      recentRefunds,
    ] = await Promise.all([
      // Total revenue (all paid payments)
      prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID, ...dateFilter },
        _sum: { amount: true },
      }),
      // Total payouts to experts
      prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID, payoutSentAt: { not: null }, ...dateFilter },
        _sum: { expertPayout: true },
      }),
      // Total platform fees
      prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID, ...dateFilter },
        _sum: { platformFee: true },
      }),
      // Pending payments count
      prisma.payment.count({
        where: { status: PaymentStatus.PENDING, ...dateFilter },
      }),
      // Paid payments count
      prisma.payment.count({
        where: { status: PaymentStatus.PAID, ...dateFilter },
      }),
      // Failed payments count
      prisma.payment.count({
        where: { status: PaymentStatus.FAILED, ...dateFilter },
      }),
      // Escrow holds (LOCKED or HELD_IN_ESCROW)
      prisma.escrowLedger.count({
        where: { status: { in: [EscrowStatus.LOCKED, EscrowStatus.HELD_IN_ESCROW] } },
      }),
      // Escrow disbursed
      prisma.escrowLedger.count({
        where: { status: EscrowStatus.DISBURSED_TO_EXPERT },
      }),
      // Escrow refunded
      prisma.escrowLedger.count({
        where: { status: EscrowStatus.REFUNDED },
      }),
      // Recent refunds (last 7 days)
      prisma.payment.count({
        where: {
          status: PaymentStatus.REFUNDED,
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      revenue: {
        total: Number(totalRevenue._sum.amount ?? 0),
        payouts: Number(totalPayouts._sum.expertPayout ?? 0),
        platformFees: Number(totalPlatformFees._sum.platformFee ?? 0),
      },
      payments: {
        pending: pendingPayments,
        paid: paidPayments,
        failed: failedPayments,
        refunded: recentRefunds,
      },
      escrow: {
        holds: escrowHolds,
        disbursed: escrowDisbursed,
        refunded: escrowRefunded,
      },
    };
  },

  /**
   * List payments with filters and pagination
   */
  async listPayments(options: ListOptions<PaymentFilters>) {
    const { page, limit, filters, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...((filters.fromDate || filters.toDate) && {
        createdAt: {
          ...(filters.fromDate && { gte: filters.fromDate }),
          ...(filters.toDate && { lte: filters.toDate }),
        },
      }),
      ...(filters.search && {
        OR: [
          { txRef: { contains: filters.search, mode: "insensitive" as const } },
          { providerTransactionId: { contains: filters.search, mode: "insensitive" as const } },
          { booking: { citizen: { firstName: { contains: filters.search, mode: "insensitive" as const } } } },
          { booking: { citizen: { lastName: { contains: filters.search, mode: "insensitive" as const } } } },
          { booking: { citizen: { email: { contains: filters.search, mode: "insensitive" as const } } } },
          { booking: { expert: { displayName: { contains: filters.search, mode: "insensitive" as const } } } },
          { booking: { expert: { momoNumber: { contains: filters.search, mode: "insensitive" as const } } } },
          { booking: { expert: { user: { email: { contains: filters.search, mode: "insensitive" as const } } } } },
        ],
      }),
    };

    const orderBy: Prisma.PaymentOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              citizen: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              expert: {
                select: {
                  id: true,
                  displayName: true,
                  momoNumber: true,
                  user: {
                    select: {
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments: payments.map((p) => {
        const expert = p.booking?.expert;
        const resolved = expert ? resolveExpertPayoutPhone(expert) : null;
        return {
          id: p.id,
          bookingId: p.bookingId,
          amount: Number(p.amount),
          currency: p.currency,
          platformFee: Number(p.platformFee),
          expertPayout: Number(p.expertPayout),
          txRef: p.txRef,
          providerTransactionId: p.providerTransactionId,
          providerPayoutRef: p.providerPayoutRef,
          status: p.status,
          paidAt: p.paidAt,
          payoutSentAt: p.payoutSentAt,
          createdAt: p.createdAt,
          citizen: p.booking?.citizen ?? {
            id: "",
            firstName: "Unknown",
            lastName: "Citizen",
            email: "",
          },
          expert: expert
            ? {
                id: expert.id,
                displayName: expert.displayName,
                momoNumber: expert.momoNumber,
                contactPhone: expert.user?.phone ?? null,
                payoutPhone: resolved?.phone ?? null,
                isPayoutFallback: resolved?.isFallback ?? false,
                payoutProvider: resolved?.provider ?? null,
              }
            : {
                id: "",
                displayName: "Unknown Expert",
                momoNumber: null,
                contactPhone: null,
                payoutPhone: null,
                isPayoutFallback: false,
                payoutProvider: null,
              },
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * List escrow ledgers with filters and pagination
   */
  async listEscrowLedgers(options: ListOptions<EscrowFilters>) {
    const { page, limit, filters, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.EscrowLedgerWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        OR: [
          { roomId: { contains: filters.search, mode: "insensitive" as const } },
          { lawyerWalletPhone: { contains: filters.search, mode: "insensitive" as const } },
          { booking: { citizen: { firstName: { contains: filters.search, mode: "insensitive" as const } } } },
          { booking: { citizen: { lastName: { contains: filters.search, mode: "insensitive" as const } } } },
          { booking: { expert: { displayName: { contains: filters.search, mode: "insensitive" as const } } } },
        ],
      }),
    };

    const orderBy: Prisma.EscrowLedgerOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [ledgers, total] = await Promise.all([
      prisma.escrowLedger.findMany({
        where,
        include: {
          booking: {
            include: {
              citizen: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              expert: {
                select: {
                  id: true,
                  displayName: true,
                  momoNumber: true,
                  user: {
                    select: {
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.escrowLedger.count({ where }),
    ]);

    return {
      ledgers: ledgers.map((l) => {
        const expert = l.booking?.expert;
        const resolved = expert ? resolveExpertPayoutPhone(expert) : null;
        return {
          id: l.id,
          roomId: l.roomId,
          bookingId: l.bookingId,
          lawyerWalletPhone: l.lawyerWalletPhone,
          totalFee: Number(l.totalFee),
          status: l.status,
          createdAt: l.createdAt,
          settledAt: l.settledAt,
          citizen: l.booking?.citizen ?? {
            id: "",
            firstName: "Unknown",
            lastName: "Citizen",
            email: "",
          },
          expert: expert
            ? {
                id: expert.id,
                displayName: expert.displayName,
                momoNumber: expert.momoNumber,
                contactPhone: expert.user?.phone ?? null,
                payoutPhone: resolved?.phone ?? null,
                isPayoutFallback: resolved?.isFallback ?? false,
                payoutProvider: resolved?.provider ?? null,
              }
            : {
                id: "",
                displayName: "Unknown Expert",
                momoNumber: null,
                contactPhone: null,
                payoutPhone: null,
                isPayoutFallback: false,
                payoutProvider: null,
              },
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get failed settlements (payouts that failed)
   */
  async getFailedSettlements(page: number, limit: number) {
    const skip = (page - 1) * limit;

    // Payments that are PAID but payout hasn't been sent
    // and booking is COMPLETED (meaning escrow should have been released)
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.PAID,
          payoutSentAt: null,
          booking: {
            status: "COMPLETED",
          },
        },
        include: {
          booking: {
            include: {
              citizen: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              expert: {
                select: {
                  id: true,
                  displayName: true,
                  momoNumber: true,
                  user: {
                    select: {
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.payment.count({
        where: {
          status: PaymentStatus.PAID,
          payoutSentAt: null,
          booking: {
            status: "COMPLETED",
          },
        },
      }),
    ]);

    return {
      payments: payments.map((p) => {
        const expert = p.booking?.expert;
        const resolved = expert ? resolveExpertPayoutPhone(expert) : null;
        return {
          id: p.id,
          bookingId: p.bookingId,
          amount: Number(p.amount),
          expertPayout: Number(p.expertPayout),
          txRef: p.txRef,
          providerTransactionId: p.providerTransactionId,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          citizen: p.booking?.citizen ?? {
            id: "",
            firstName: "Unknown",
            lastName: "Citizen",
            email: "",
          },
          expert: expert
            ? {
                id: expert.id,
                displayName: expert.displayName,
                momoNumber: expert.momoNumber,
                contactPhone: expert.user?.phone ?? null,
                payoutPhone: resolved?.phone ?? null,
                isPayoutFallback: resolved?.isFallback ?? false,
                payoutProvider: resolved?.provider ?? null,
              }
            : {
                id: "",
                displayName: "Unknown Expert",
                momoNumber: null,
                contactPhone: null,
                payoutPhone: null,
                isPayoutFallback: false,
                payoutProvider: null,
              },
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Retry failed payout
   */
  async retryPayout(bookingId: string, adminId: string, reason: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        expert: true,
      },
    });

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (!booking.payment) {
      throw new ValidationError("No payment record found for this booking");
    }

    if (booking.payment.payoutSentAt) {
      throw new ValidationError("Payout already sent for this booking");
    }

    // Retry escrow release
    const result = await EscrowService.releaseEscrow(bookingId);

    // Log the retry
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "PAYMENT",
        resource: "PAYMENT",
        resourceId: booking.payment.id,
        description: `Payout retry initiated by admin`,
        metadata: {
          reason,
          bookingId,
          payoutAmount: Number(booking.expertPayout),
        } as any,
      },
    });

    return result;
  },

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
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
                momoNumber: true,
                user: {
                  select: {
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                flatFee: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    return {
      id: payment.id,
      bookingId: payment.bookingId,
      amount: Number(payment.amount),
      currency: payment.currency,
      platformFee: Number(payment.platformFee),
      expertPayout: Number(payment.expertPayout),
      txRef: payment.txRef,
      providerTransactionId: payment.providerTransactionId,
      providerPayoutRef: payment.providerPayoutRef,
      status: payment.status,
      paidAt: payment.paidAt,
      payoutSentAt: payment.payoutSentAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      booking: payment.booking,
    };
  },

  /**
   * Get escrow ledger by ID
   */
  async getEscrowLedgerById(ledgerId: string) {
    const ledger = await prisma.escrowLedger.findUnique({
      where: { id: ledgerId },
      include: {
        booking: {
          include: {
            citizen: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            expert: {
              select: {
                id: true,
                displayName: true,
                momoNumber: true,
              },
            },
            payment: true,
          },
        },
      },
    });

    if (!ledger) {
      throw new NotFoundError("Escrow ledger not found");
    }

    return {
      id: ledger.id,
      roomId: ledger.roomId,
      bookingId: ledger.bookingId,
      lawyerWalletPhone: ledger.lawyerWalletPhone,
      totalFee: Number(ledger.totalFee),
      status: ledger.status,
      createdAt: ledger.createdAt,
      settledAt: ledger.settledAt,
      booking: ledger.booking,
    };
  },
};
