import { z } from "zod";
import { EscrowStatus, PaymentStatus, BookingStatus } from "../../generated/prisma/client.js";

/**
 * Query params for listing payments
 */
export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(PaymentStatus).optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "amount", "paidAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;

/**
 * Query params for listing escrow ledgers
 */
export const listEscrowQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(EscrowStatus).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "totalFeeRwf", "settledAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListEscrowQuery = z.infer<typeof listEscrowQuerySchema>;

/**
 * Query params for getting finance statistics
 */
export const financeStatsQuerySchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export type FinanceStatsQuery = z.infer<typeof financeStatsQuerySchema>;

/**
 * Body for manual payout retry
 */
export const retryPayoutSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().min(10).max(500),
});

export type RetryPayoutBody = z.infer<typeof retryPayoutSchema>;

/**
 * Params for getting single payment/escrow
 */
export const getByIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type GetByIdParams = z.infer<typeof getByIdParamsSchema>;
