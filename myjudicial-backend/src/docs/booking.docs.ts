/**
 * Booking module OpenAPI documentation.
 * Uses zod-to-openapi to generate schemas from Zod definitions.
 * registry.ts must be imported first — it calls extendZodWithOpenApi(z).
 */
import { z, registry } from "./registry.js";

/* ── Reusable field primitives ── */
const uuidField = z.string().uuid().describe("UUID identifier");
const emailField = z.string().email().describe("Valid email address");
const isoDateTimeField = z
  .string()
  .datetime()
  .describe("ISO 8601 datetime string");

/* ── Enums ── */
const BookingStatusEnum = z
  .enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED", "REFUNDED"])
  .describe("Booking lifecycle status");

const PaymentStatusEnum = z
  .enum(["NOT_REQUIRED", "PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED"])
  .describe("Payment status");

/* ── Request body schemas ── */

const CreateBookingDtoSchema = z
  .object({
    expertId: uuidField,
    serviceId: uuidField,
    scheduledStart: isoDateTimeField,
    scheduledEnd: isoDateTimeField,
    citizenNotes: z.string().max(500).optional().describe("Optional notes from citizen"),
    paymentMNO: z
      .string()
      .optional()
      .describe("Mobile Network Operator for the MoMo push (e.g. Airtel, Tigo, Halopesa, AzamPesa). Defaults to Airtel."),
    paymentPhoneNumber: z
      .string()
      .optional()
      .describe("Phone number to receive the MoMo USSD prompt. Defaults to the citizen's profile phone number."),
  })
  .openapi("CreateBookingDto");

const UpdateBookingDtoSchema = z
  .object({
    scheduledStart: isoDateTimeField.optional(),
    scheduledEnd: isoDateTimeField.optional(),
    citizenNotes: z.string().max(500).optional(),
    status: BookingStatusEnum.optional(),
  })
  .openapi("UpdateBookingDto");

const ConfirmBookingDtoSchema = z
  .object({
    paymentReference: z.string().min(1).describe("Azam Pay transaction reference"),
  })
  .openapi("ConfirmBookingDto");

const CancelBookingDtoSchema = z
  .object({
    reason: z.string().min(5).max(200).optional().describe("Cancellation reason"),
  })
  .openapi("CancelBookingDto");

const GetAvailableSlotsDtoSchema = z
  .object({
    expertId: uuidField,
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("Date in YYYY-MM-DD format"),
    serviceId: uuidField.optional().describe(
      "Service being booked — determines slot length. Falls back to a 30-minute default when omitted."
    ),
  })
  .openapi("GetAvailableSlotsDto");

/* ── Response schemas ── */

const CitizenNestedSchema = z
  .object({
    id: uuidField,
    email: emailField,
    firstName: z.string(),
    lastName: z.string(),
  })
  .openapi("CitizenNested");

const ExpertNestedSchema = z
  .object({
    id: uuidField,
    displayName: z.string(),
    user: z
      .object({
        email: emailField,
      })
      .optional(),
  })
  .openapi("ExpertNested");

const ServiceNestedSchema = z
  .object({
    id: uuidField,
    name: z.string(),
    flatFee: z.number().describe("Flat fee in RWF"),
    currency: z.string().default("RWF"),
    durationMin: z.number().int().describe("Duration in minutes"),
  })
  .openapi("ServiceNested");

const ReviewNestedSchema = z
  .object({
    id: uuidField,
    bookingId: uuidField,
    citizenId: uuidField,
    expertId: uuidField,
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional().nullable(),
    createdAt: isoDateTimeField,
  })
  .openapi("ReviewNested");

const PaymentNestedSchema = z
  .object({
    id: uuidField,
    amount: z.number().describe("Total amount in RWF"),
    currency: z.string().default("RWF"),
    platformFee: z.number().describe("15% platform commission"),
    expertPayout: z.number().describe("85% paid to expert"),
    txRef: z.string().describe("Azam Pay transaction reference"),
    status: PaymentStatusEnum,
    paidAt: isoDateTimeField.nullable().optional(),
    payoutSentAt: isoDateTimeField.nullable().optional(),
  })
  .openapi("PaymentNested");

export const BookingSchema = z
  .object({
    id: uuidField,
    citizenId: uuidField,
    expertId: uuidField,
    serviceId: uuidField,
    status: BookingStatusEnum,
    paymentStatus: PaymentStatusEnum,
    scheduledStart: isoDateTimeField,
    scheduledEnd: isoDateTimeField,
    meetingRoomId: z.string().optional().nullable(),
    meetingJoinUrl: z.string().optional().nullable(),
    paymentReferenceId: z.string().optional().nullable(),
    cancellationReason: z.string().optional().nullable(),
    citizenNotes: z.string().optional().nullable(),
    escrowLockedAt: isoDateTimeField.optional().nullable(),
    escrowReleasedAt: isoDateTimeField.optional().nullable(),
    pendingRescheduleStart: isoDateTimeField.optional().nullable().describe("Requested reschedule window start"),
    pendingRescheduleEnd: isoDateTimeField.optional().nullable().describe("Requested reschedule window end"),
    pendingRescheduleReason: z.string().optional().nullable().describe("Why the reschedule was requested"),
    pendingRescheduleRequestedBy: z.string().optional().nullable().describe("Who requested: CITIZEN or EXPERT"),
    platformFee: z.number().optional().nullable(),
    expertPayout: z.number().optional().nullable(),
    completedAt: isoDateTimeField.optional().nullable(),
    createdAt: isoDateTimeField,
    updatedAt: isoDateTimeField,
    citizen: CitizenNestedSchema.optional(),
    expert: ExpertNestedSchema.optional(),
    service: ServiceNestedSchema.optional(),
    review: ReviewNestedSchema.optional().nullable(),
    payment: PaymentNestedSchema.optional().nullable(),
  })
  .openapi("Booking");

const CreateBookingResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      booking: BookingSchema,
      payment: z.object({
        paymentLink: z
          .string()
          .nullable()
          .describe(
            "Always null for Azam Pay MNO checkout — the citizen receives a USSD Mobile Money " +
            "prompt directly on their phone instead of a hosted redirect page."
          ),
        txRef: z.string().describe("Transaction reference"),
        amount: z.number().describe("Amount in RWF"),
        currency: z.string().default("RWF"),
      }),
    }),
    message: z.string(),
  })
  .openapi("CreateBookingResponse");

const BookingListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(BookingSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
  })
  .openapi("BookingListResponse");

const AvailableSlotSchema = z
  .object({
    start: isoDateTimeField,
    end: isoDateTimeField,
  })
  .openapi("AvailableSlot");

const AvailableSlotsResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({
      expertId: uuidField,
      date: z.string(),
      totalSlots: z.number().int().nonnegative(),
      slots: z.array(AvailableSlotSchema),
    }),
  })
  .openapi("AvailableSlotsResponse");

const MessageSchema = z
  .object({ success: z.literal(true), message: z.string() })
  .openapi("MessageResponse");

const ErrorResponseSchema = z
  .object({
    success: z.literal(false),
    message: z.string(),
    errors: z.array(z.string()).optional(),
  })
  .openapi("ErrorResponse");

/* ── Register schemas ── */
registry.register("CreateBookingDto", CreateBookingDtoSchema);
registry.register("UpdateBookingDto", UpdateBookingDtoSchema);
registry.register("ConfirmBookingDto", ConfirmBookingDtoSchema);
registry.register("CancelBookingDto", CancelBookingDtoSchema);
registry.register("GetAvailableSlotsDto", GetAvailableSlotsDtoSchema);
registry.register("CitizenNested", CitizenNestedSchema);
registry.register("ExpertNested", ExpertNestedSchema);
registry.register("ServiceNested", ServiceNestedSchema);
registry.register("ReviewNested", ReviewNestedSchema);
registry.register("PaymentNested", PaymentNestedSchema);
registry.register("Booking", BookingSchema);
registry.register("CreateBookingResponse", CreateBookingResponseSchema);
registry.register("BookingListResponse", BookingListResponseSchema);
registry.register("AvailableSlot", AvailableSlotSchema);
registry.register("AvailableSlotsResponse", AvailableSlotsResponseSchema);
registry.register("MessageResponse", MessageSchema);
registry.register("ErrorResponse", ErrorResponseSchema);

/* ── Standard error responses ── */
export const errorResponses = {
  400: {
    description: "Validation error",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  401: {
    description: "Authentication required",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  403: {
    description: "Forbidden - insufficient permissions",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  404: {
    description: "Booking, expert, or service not found",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  409: {
    description: "Conflict - expert unavailable or booking in invalid state",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
  429: {
    description: "Too many requests",
    content: { "application/json": { schema: ErrorResponseSchema } },
  },
};

/* ── Route registrations ── */

// Health check
registry.registerPath({
  method: "get",
  path: "/bookings/health",
  tags: ["Bookings"],
  summary: "Health check for bookings module",
  responses: {
    200: {
      description: "Bookings module is healthy",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            module: z.literal("bookings"),
          }).openapi("BookingsHealthResponse"),
        },
      },
    },
  },
});

// List all bookings
registry.registerPath({
  method: "get",
  path: "/bookings",
  tags: ["Bookings"],
  summary: "List all bookings",
  description:
    "Returns bookings filtered by the authenticated user's role. " +
    "Clients see their own bookings, experts see their expert bookings.",
  request: {
    query: z.object({
      page: z.number().int().positive().default(1).optional().describe("Page number for pagination"),
      limit: z.number().int().positive().default(10).optional().describe("Number of items per page"),
      status: BookingStatusEnum.optional().describe("Filter by booking status"),
    }),
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "List of bookings retrieved successfully",
      content: { "application/json": { schema: BookingListResponseSchema } },
    },
    ...errorResponses,
  },
});

// Get a specific booking
registry.registerPath({
  method: "get",
  path: "/bookings/{id}",
  tags: ["Bookings"],
  summary: "Get a specific booking",
  description: "Retrieve detailed information about a booking. Only the client or expert can access their bookings.",
  request: {
    params: z.object({ id: uuidField }),
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Booking retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: BookingSchema,
          }),
        },
      },
    },
    ...errorResponses,
  },
});

// Create a new booking
registry.registerPath({
  method: "post",
  path: "/bookings",
  tags: ["Bookings"],
  summary: "Create a new booking",
  description:
    "Citizens create bookings with an expert for a specific service. " +
    "Initiates an Azam Pay Mobile Money (MNO) checkout — the citizen receives a USSD payment " +
    "prompt directly on their phone; `payment.paymentLink` is always null for this provider.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateBookingDtoSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
  responses: {
    201: {
      description: "Booking created. Redirect citizen to paymentLink.",
      content: {
        "application/json": {
          schema: CreateBookingResponseSchema,
        },
      },
    },
    ...errorResponses,
  },
});

// Update booking
registry.registerPath({
  method: "patch",
  path: "/bookings/{id}",
  tags: ["Bookings"],
  summary: "Update a booking",
  description:
    "Update booking details such as notes, status, or rescheduling. " +
    "Only the client or expert can update their bookings.",
  request: {
    params: z.object({ id: uuidField }).openapi("BookingIdParam2"),
    body: {
      required: true,
      content: { "application/json": { schema: UpdateBookingDtoSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Booking updated successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: BookingSchema,
          }),
        },
      },
    },
    ...errorResponses,
  },
});

// Cancel a booking
registry.registerPath({
  method: "post",
  path: "/bookings/{id}/cancel",
  tags: ["Bookings"],
  summary: "Cancel a booking",
  description:
    "Cancel a PENDING or CONFIRMED booking. Refunds are processed if cancelled within 24 hours of the scheduled time. " +
    "Only the client who created the booking can cancel it.",
  request: {
    params: z.object({ id: uuidField }).openapi("BookingIdParam3"),
    body: {
      required: true,
      content: { "application/json": { schema: CancelBookingDtoSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Booking cancelled successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: BookingSchema,
          }),
        },
      },
    },
    ...errorResponses,
  },
});

// Confirm booking after payment (admin-only manual override)
registry.registerPath({
  method: "post",
  path: "/bookings/{id}/confirm",
  tags: ["Bookings"],
  summary: "Manually confirm a booking (admin-only)",
  description:
    "Admin-only manual override to confirm a booking whose Mobile Money payment was verified " +
    "out-of-band. Real payment confirmations flow through the Azam Pay webhook " +
    "(POST /payments/webhook), which locks escrow and confirms the booking automatically. " +
    "Requires ADMIN role.",
  request: {
    params: z.object({ id: uuidField }).openapi("BookingIdParam4"),
    body: {
      required: true,
      content: { "application/json": { schema: ConfirmBookingDtoSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Booking confirmed and escrow locked",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: BookingSchema,
          }),
        },
      },
    },
    ...errorResponses,
  },
});

// Join consultation — LiveKit token
registry.registerPath({
  method: "post",
  path: "/bookings/{id}/join",
  tags: ["Bookings"],
  summary: "Get a LiveKit token to join a consultation",
  description:
    "Generates a LiveKit access token for the video consultation room. " +
    "Only the citizen or expert on the booking may join, and only once the booking is CONFIRMED or ACTIVE.",
  request: {
    params: z.object({ id: uuidField }).openapi("BookingIdParam5"),
  },
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "LiveKit token issued",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              token: z.string().describe("LiveKit access token for the consultation room"),
            }),
          }),
        },
      },
    },
    ...errorResponses,
  },
});

// Get available slots
registry.registerPath({
  method: "get",
  path: "/bookings/expert/{id}/slots",
  tags: ["Bookings"],
  summary: "Get available time slots for an expert",
  description:
    "Retrieve available time slots for a specific expert on a given date, sized to the " +
    "duration of the given serviceId (falls back to 30 minutes if serviceId is omitted). " +
    "Excludes already booked slots and non-working hours.",
  request: {
    params: z.object({ id: uuidField }).openapi("ExpertIdParam"),
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date in YYYY-MM-DD format"),
      serviceId: uuidField.optional().describe("Service being booked — determines slot length"),
    }).openapi("AvailableSlotsQuery"),
  },
  responses: {
    200: {
      description: "Available slots retrieved successfully",
      content: { "application/json": { schema: AvailableSlotsResponseSchema } },
    },
    ...errorResponses,
  },
});


