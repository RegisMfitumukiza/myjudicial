import { z } from "zod";

/**
 * Create a new booking
 * Client selects an expert, service, and available time slot
 */
export const createBookingSchema = z.object({
  expertId: z.string().uuid("Invalid expert ID"),
  serviceId: z.string().uuid("Invalid service ID"),
  scheduledStart: z.string().datetime("Invalid date format"),
  scheduledEnd: z.string().datetime("Invalid date format"),
  citizenNotes: z.string().max(500).optional(),
  paymentMNO: z.enum(["MTN", "Airtel"]).optional(),
  paymentPhoneNumber: z.preprocess(
    (val) => {
      if (typeof val !== "string") return val;
      const stripped = val.replace(/[\s\-\(\)]/g, "");
      return stripped === "" ? undefined : stripped;
    },
    z.string().regex(/^(\+?250|0)?[0-9]{9}$/, "Invalid Rwanda phone number").optional()
  ),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;

/**
 * Confirm payment and move booking from PENDING to CONFIRMED
 */
export const confirmBookingSchema = z.object({
  paymentReference: z.string().min(1, "Payment reference required"),
});

export type ConfirmBookingDto = z.infer<typeof confirmBookingSchema>;

/**
 * Update booking
 */
export const updateBookingSchema = z.object({
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  citizenNotes: z.string().max(500).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED", "REFUNDED"]).optional(),
});

export type UpdateBookingDto = z.infer<typeof updateBookingSchema>;

/**
 * Cancel a booking
 */
export const cancelBookingSchema = z.object({
  reason: z.string().min(5, "Cancellation reason must be at least 5 characters").max(200, "Cancellation reason must be at most 200 characters").optional(),
});

export type CancelBookingDto = z.infer<typeof cancelBookingSchema>;

/**
 * Reschedule a booking
 */
export const rescheduleBookingSchema = z.object({
  scheduledStart: z.string().datetime("Invalid scheduledStart format"),
  scheduledEnd: z.string().datetime("Invalid scheduledEnd format"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(200).optional(),
});

export type RescheduleBookingDto = z.infer<typeof rescheduleBookingSchema>;

/**
 * Mark consultation delivered by expert
 */
export const markDeliveredSchema = z.object({
  deliverySummary: z.string().max(1000, "Summary must be at most 1000 characters").optional(),
});

export type MarkDeliveredDto = z.infer<typeof markDeliveredSchema>;

/**
 * Report consultation issue / dispute by client
 */
export const reportIssueSchema = z.object({
  reason: z.string().min(5, "Issue reason must be at least 5 characters").max(500, "Reason must be at most 500 characters"),
});

export type ReportIssueDto = z.infer<typeof reportIssueSchema>;

/**
 * Date query parameter preprocessor:
 * - Empty string, null, or undefined -> undefined
 * - Validates any parseable ISO datetime or YYYY-MM-DD date string
 */
const dateQuerySchema = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : val),
  z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format").optional()
);

/**
 * List bookings query parameters
 */
export const listBookingsSchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be >= 1").default(1),
  limit: z.coerce.number().int().min(1).max(200, "Limit must be between 1 and 200").default(10),
  status: z.preprocess(
    (val) => (val === "" || val === "ALL" || val === undefined || val === null ? undefined : val),
    z.enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED", "REFUNDED"]).optional()
  ),
});

export type ListBookingsQuery = z.infer<typeof listBookingsSchema>;

/**
 * Get available time slots for an expert
 */
export const getAvailableSlotsSchema = z.object({
  date: z.string().date("Invalid date format (YYYY-MM-DD)"),
  serviceId: z.string().uuid("Invalid service ID").optional(),
});

export type GetAvailableSlotsDto = z.infer<typeof getAvailableSlotsSchema>;

/**
 * Admin List bookings query parameters
 */
export const adminListBookingsSchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be >= 1").default(1),
  limit: z.coerce.number().int().min(1).max(200, "Limit must be between 1 and 200").default(10),
  status: z.preprocess(
    (val) => (val === "" || val === "ALL" || val === undefined || val === null ? undefined : val),
    z.enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED", "REFUNDED"]).optional()
  ),
  expertId: z.preprocess(
    (val) => (val === "" || val === "ALL" || val === undefined || val === null ? undefined : val),
    z.string().uuid("Invalid expert ID").optional()
  ),
  citizenId: z.preprocess(
    (val) => (val === "" || val === "ALL" || val === undefined || val === null ? undefined : val),
    z.string().uuid("Invalid citizen ID").optional()
  ),
  dateFrom: dateQuerySchema,
  dateTo: dateQuerySchema,
});

export type AdminListBookingsQuery = z.infer<typeof adminListBookingsSchema>;

/**
 * Admin Manual Refund parameters
 */
export const adminRefundSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  percentage: z.preprocess((val) => Number(val), z.union([z.literal(50), z.literal(100)])),
});

export type AdminRefundDto = z.infer<typeof adminRefundSchema>;

/**
 * Admin Stats query parameters
 */
export const adminStatsSchema = z.object({
  dateFrom: dateQuerySchema,
  dateTo: dateQuerySchema,
});

export type AdminStatsQuery = z.infer<typeof adminStatsSchema>;

/**
 * Retry payment for a failed/expired booking
 */
export const retryPaymentSchema = z.object({
  paymentMNO: z.enum(["MTN", "Airtel"]).optional(),
  paymentPhoneNumber: z.preprocess(
    (val) => {
      if (typeof val !== "string") return val;
      const stripped = val.replace(/[\s\-\(\)]/g, "");
      return stripped === "" ? undefined : stripped;
    },
    z.string().regex(/^(\+?250|0)?[0-9]{9}$/, "Invalid Rwanda phone number").optional()
  ),
});

export type RetryPaymentDto = z.infer<typeof retryPaymentSchema>;
