import { z } from "zod";
import { EscrowStatus, PaymentStatus } from "../../generated/prisma/client.js";

/**
 * Robust date query parameter preprocessor:
 * - Empty string, null, "null", "undefined", or undefined -> undefined
 * - Accepts ISO strings, date strings, epoch numbers, or Date instances
 * - Rejects / defaults invalid dates to undefined rather than throwing 400 validation error
 */
export const dateQueryParamSchema = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null || val === "null" || val === "undefined") {
    return undefined;
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? undefined : val;
  }
  if (typeof val === "string" || typeof val === "number") {
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}, z.date().optional());

/**
 * Robust payment status preprocessor:
 * - Empty string, "ALL", "all", null, undefined -> undefined
 * - Case-insensitive match against PaymentStatus enum
 * - Maps "AUTHORIZED" gracefully to PAID (matching escrow-held payment lifecycle)
 */
export const paymentStatusQuerySchema = z.preprocess((val) => {
  if (!val || val === "" || val === "ALL" || val === "all") return undefined;
  if (typeof val === "string") {
    const upper = val.toUpperCase().trim();
    if (upper === "ALL" || upper === "") return undefined;
    if (upper === "AUTHORIZED") return PaymentStatus.PAID;
    if (Object.values(PaymentStatus).includes(upper as PaymentStatus)) {
      return upper as PaymentStatus;
    }
  }
  return undefined;
}, z.nativeEnum(PaymentStatus).optional());

/**
 * Robust escrow status preprocessor:
 * - Empty string, "ALL", "all", null, undefined -> undefined
 * - Case-insensitive match against EscrowStatus enum
 */
export const escrowStatusQuerySchema = z.preprocess((val) => {
  if (!val || val === "" || val === "ALL" || val === "all") return undefined;
  if (typeof val === "string") {
    const upper = val.toUpperCase().trim();
    if (upper === "ALL" || upper === "") return undefined;
    if (Object.values(EscrowStatus).includes(upper as EscrowStatus)) {
      return upper as EscrowStatus;
    }
  }
  return undefined;
}, z.nativeEnum(EscrowStatus).optional());

/**
 * Query params for listing payments
 */
export const listPaymentsQuerySchema = z.object({
  page: z.preprocess((val) => {
    const n = Number(val);
    return !isNaN(n) && n >= 1 ? Math.floor(n) : 1;
  }, z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => {
    const n = Number(val);
    return !isNaN(n) && n >= 1 ? Math.min(Math.floor(n), 1000) : 20;
  }, z.number().int().min(1).max(1000).default(20)),
  status: paymentStatusQuerySchema,
  fromDate: dateQueryParamSchema,
  toDate: dateQueryParamSchema,
  search: z.preprocess((val) => {
    if (typeof val !== "string" || !val.trim()) return undefined;
    return val.trim();
  }, z.string().optional()),
  sortBy: z.preprocess((val) => {
    if (!val || typeof val !== "string") return "createdAt";
    const valid = ["createdAt", "amount", "paidAt"];
    return valid.includes(val) ? val : "createdAt";
  }, z.enum(["createdAt", "amount", "paidAt"]).default("createdAt")),
  sortOrder: z.preprocess((val) => {
    if (!val || typeof val !== "string") return "desc";
    const lower = val.toLowerCase().trim();
    return lower === "asc" ? "asc" : "desc";
  }, z.enum(["asc", "desc"]).default("desc")),
});

export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;

/**
 * Query params for listing escrow ledgers
 */
export const listEscrowQuerySchema = z.object({
  page: z.preprocess((val) => {
    const n = Number(val);
    return !isNaN(n) && n >= 1 ? Math.floor(n) : 1;
  }, z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => {
    const n = Number(val);
    return !isNaN(n) && n >= 1 ? Math.min(Math.floor(n), 1000) : 20;
  }, z.number().int().min(1).max(1000).default(20)),
  status: escrowStatusQuerySchema,
  search: z.preprocess((val) => {
    if (typeof val !== "string" || !val.trim()) return undefined;
    return val.trim();
  }, z.string().optional()),
  sortBy: z.preprocess((val) => {
    if (!val || typeof val !== "string") return "createdAt";
    const valid = ["createdAt", "totalFee", "settledAt"];
    return valid.includes(val) ? val : "createdAt";
  }, z.enum(["createdAt", "totalFee", "settledAt"]).default("createdAt")),
  sortOrder: z.preprocess((val) => {
    if (!val || typeof val !== "string") return "desc";
    const lower = val.toLowerCase().trim();
    return lower === "asc" ? "asc" : "desc";
  }, z.enum(["asc", "desc"]).default("desc")),
});

export type ListEscrowQuery = z.infer<typeof listEscrowQuerySchema>;

/**
 * Query params for getting finance statistics
 */
export const financeStatsQuerySchema = z.object({
  fromDate: dateQueryParamSchema,
  toDate: dateQueryParamSchema,
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
