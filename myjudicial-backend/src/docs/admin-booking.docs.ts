/**
 * Admin booking management OpenAPI documentation.
 * Mirrors the routes in src/modules/bookings/admin-booking.routes.ts.
 * registry.ts must be imported first — it calls extendZodWithOpenApi(z).
 */
import { z, registry } from "./registry.js";
import { BookingSchema, errorResponses } from "./booking.docs.js";

const uuidField = z.string().uuid().describe("UUID identifier");

const BookingStatusEnum = z
  .enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED", "REFUNDED"])
  .describe("Booking lifecycle status");

const AdminBookingListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(BookingSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      pages: z.number().int().nonnegative(),
    }),
  })
  .openapi("AdminBookingListResponse");

const AdminBookingStatsResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      counts: z.object({
        PENDING: z.number().int().nonnegative(),
        CONFIRMED: z.number().int().nonnegative(),
        ACTIVE: z.number().int().nonnegative(),
        COMPLETED: z.number().int().nonnegative(),
        CANCELLED: z.number().int().nonnegative(),
        REFUNDED: z.number().int().nonnegative(),
      }),
      totalBookings: z.number().int().nonnegative(),
      totalRevenue: z.number().describe("Platform fee + expert payout across all bookings in range"),
      totalPlatformFees: z.number(),
      totalExpertPayouts: z.number(),
      averageDuration: z.number().describe("Average actual consultation duration in minutes (completed bookings only)"),
      conversionRate: z.number().describe("Percentage of bookings in range that reached COMPLETED"),
    }),
  })
  .openapi("AdminBookingStatsResponse");

const AdminCompleteBookingResponseSchema = z
  .object({
    success: z.literal(true),
    data: BookingSchema.nullable(),
    message: z.string(),
  })
  .openapi("AdminCompleteBookingResponse");

registry.register("AdminBookingListResponse", AdminBookingListResponseSchema);
registry.register("AdminBookingStatsResponse", AdminBookingStatsResponseSchema);
registry.register("AdminCompleteBookingResponse", AdminCompleteBookingResponseSchema);

// GET /admin/bookings
registry.registerPath({
  method: "get",
  path: "/admin/bookings",
  tags: ["Admin — Bookings"],
  summary: "List all bookings (admin)",
  description: "Returns all bookings across the platform, filterable by status, expert, citizen, and date range. Requires ADMIN role.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional().describe("Page number (default: 1)"),
      limit: z.string().optional().describe("Items per page (default: 10)"),
      status: BookingStatusEnum.optional(),
      expertId: uuidField.optional(),
      citizenId: uuidField.optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }).openapi("AdminListBookingsQuery"),
  },
  responses: {
    200: {
      description: "Paginated list of bookings",
      content: { "application/json": { schema: AdminBookingListResponseSchema } },
    },
    ...errorResponses,
  },
});

// GET /admin/bookings/stats
registry.registerPath({
  method: "get",
  path: "/admin/bookings/stats",
  tags: ["Admin — Bookings"],
  summary: "Get booking statistics (admin)",
  description: "Returns aggregate booking counts, revenue, platform fees, expert payouts, and conversion rate, optionally scoped to a date range. Requires ADMIN role.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }).openapi("AdminBookingStatsQuery"),
  },
  responses: {
    200: {
      description: "Booking statistics",
      content: { "application/json": { schema: AdminBookingStatsResponseSchema } },
    },
    ...errorResponses,
  },
});

// PATCH /admin/bookings/:id/complete
registry.registerPath({
  method: "patch",
  path: "/admin/bookings/{id}/complete",
  tags: ["Admin — Bookings"],
  summary: "Manually complete a booking (admin)",
  description: "Manually triggers escrow release and expert payout for an ACTIVE or CONFIRMED booking. Requires ADMIN role.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }).openapi("AdminBookingIdParam1"),
  },
  responses: {
    200: {
      description: "Booking marked as completed and escrow released",
      content: { "application/json": { schema: AdminCompleteBookingResponseSchema } },
    },
    ...errorResponses,
  },
});

// PATCH /admin/bookings/:id/refund
registry.registerPath({
  method: "patch",
  path: "/admin/bookings/{id}/refund",
  tags: ["Admin — Bookings"],
  summary: "Manually refund a booking (admin)",
  description: "Marks a booking as REFUNDED and initiates a 50% or 100% refund of the original payment. Requires ADMIN role.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }).openapi("AdminBookingIdParam2"),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            reason: z.string().min(5).describe("Reason for the manual refund"),
            percentage: z.union([z.literal(50), z.literal(100)]).describe("Refund percentage"),
          }).openapi("AdminRefundBookingDto"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Refund initiated",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
          }).openapi("AdminRefundBookingResponse"),
        },
      },
    },
    ...errorResponses,
  },
});
