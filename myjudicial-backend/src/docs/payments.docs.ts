/**
 * Payment module OpenAPI documentation.
 * Derived from: payment.routes.ts, payment.controller.ts
 *
 * registry.ts must be imported first — it calls extendZodWithOpenApi(z).
 */
import { z, registry } from "./registry.js";

/* ─────────────────────────────────────────────────────────────────────────────
   Reusable primitives
───────────────────────────────────────────────────────────────────────────── */

const uuidField = z
  .string()
  .uuid()
  .openapi({ example: "3fa85f64-5717-4562-b3fc-2c963f66afa6" });

const isoDateTimeField = z
  .string()
  .datetime()
  .openapi({ example: "2025-09-15T10:00:00.000Z" });

/* ─────────────────────────────────────────────────────────────────────────────
   Nested schemas — match prisma include shapes in controller
───────────────────────────────────────────────────────────────────────────── */

/** citizen select: id, firstName, lastName, email */
const CitizenNestedSchema = z
  .object({
    id: uuidField,
    firstName: z.string().openapi({ example: "Jane" }),
    lastName: z.string().openapi({ example: "Doe" }),
    email: z.string().email().openapi({ example: "jane@myjudicial.com" }),
  })
  .openapi("CitizenNested");

/** expert select: id, displayName, momoNumber */
const ExpertNestedSchema = z
  .object({
    id: uuidField,
    displayName: z.string().openapi({ example: "Dr. Amara Nkosi" }),
    momoNumber: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "0781234567" }),
    contactPhone: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "+250783456723" }),
    payoutPhone: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "+250783456723" }),
    isPayoutFallback: z.boolean().optional(),
    payoutProvider: z.string().nullable().optional(),
  })
  .openapi("ExpertNested");

/** booking include shape as seen by payment.getPaymentByBooking */
const BookingNestedSchema = z
  .object({
    id: uuidField,
    citizenId: uuidField,
    expertId: uuidField,
    scheduledStart: isoDateTimeField,
    scheduledEnd: isoDateTimeField,
    status: z
      .enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED", "REFUNDED"])
      .openapi({ example: "CONFIRMED" }),
    citizen: CitizenNestedSchema,
    expert: ExpertNestedSchema,
  })
  .openapi("BookingNested");

/**
 * Full Payment object — fields match the Prisma Payment model exactly.
 *
 * Prisma model:
 *   id, bookingId, amount (Decimal), currency, platformFee (Decimal),
 *   expertPayout (Decimal), txRef (unique), providerTransactionId?, providerPayoutRef?,
 *   status, paidAt?, payoutSentAt?, createdAt, updatedAt
 *
 * Decimal columns are serialised as strings by Prisma JSON to preserve precision.
 */
const PaymentSchema = z
  .object({
    // ── Identity ──────────────────────────────────────────────────────────────
    id: uuidField,
    bookingId: uuidField,

    // ── Money — Decimal(12,2) serialised as string ────────────────────────────
    amount: z
      .string()
      .openapi({ example: "75000.00" })
      .describe("Total charged amount in RWF (Decimal → string)"),
    currency: z
      .string()
      .openapi({ example: "RWF" })
      .describe("ISO currency code, defaults to RWF"),
    platformFee: z
      .string()
      .openapi({ example: "11250.00" })
      .describe("15% platform commission in RWF (Decimal → string)"),
    expertPayout: z
      .string()
      .openapi({ example: "63750.00" })
      .describe("Amount to be paid out to expert after commission (Decimal → string)"),

    // ── Azam Pay references ───────────────────────────────────────────────────
    txRef: z
      .string()
      .openapi({ example: "BM-1726394400000-a1b2c" })
      .describe("Unique transaction reference generated at booking creation (Azam Pay externalId)"),
    providerTransactionId: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "BM-1726394400000-a1b2c" })
      .describe("Azam Pay external transaction ID — populated after webhook confirms payment"),
    providerPayoutRef: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "PO-1726394400000-x9z8y" })
      .describe("Reference for expert payout transfer — populated when payout is initiated"),

    // ── Status ────────────────────────────────────────────────────────────────
    status: z
      .enum(["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED"])
      .openapi({ example: "PAID" })
      .describe("Payment lifecycle status"),

    // ── Timestamps ────────────────────────────────────────────────────────────
    paidAt: isoDateTimeField
      .nullable()
      .optional()
      .describe("When the payment was confirmed as PAID — set by webhook handler"),
    payoutSentAt: isoDateTimeField
      .nullable()
      .optional()
      .describe("When the expert payout transfer was confirmed — set by payout webhook"),
    createdAt: isoDateTimeField,
    updatedAt: isoDateTimeField,

    // ── Relations ─────────────────────────────────────────────────────────────
    booking: BookingNestedSchema,
  })
  .openapi("Payment");

/* ─────────────────────────────────────────────────────────────────────────────
   Webhook request body schemas — match the Azam Pay MNO checkout callback
   payload as parsed by PaymentController.handleWebhook.
───────────────────────────────────────────────────────────────────────────── */

/** POST /payments/webhook — Azam Pay MNO checkout callback body */
const AzamPayWebhookBodySchema = z
  .object({
    transactionstatus: z
      .string()
      .openapi({ example: "success" })
      .describe("Azam Pay transaction outcome — \"success\"/\"SUCCESS\" triggers escrow lock, anything else is logged and ignored"),
    message: z.string().optional().openapi({ example: "Payment completed" }),
    externalId: z
      .string()
      .openapi({ example: "BM-1726394400000-a1b2c" })
      .describe("The externalId generated by AzamPayService at booking creation — matched against Booking.paymentReferenceId"),
    reference: z
      .string()
      .optional()
      .openapi({ example: "azam-ref-abc123" })
      .describe("Azam Pay's own reference for the transaction"),
    amount: z.union([z.string(), z.number()]).optional().openapi({ example: 75000 }),
  })
  .openapi("AzamPayWebhookBody");

/* ─────────────────────────────────────────────────────────────────────────────
   Response schemas
───────────────────────────────────────────────────────────────────────────── */

/** Always returned by webhook endpoints — keeps Azam Pay from retrying */
const WebhookAckSchema = z
  .object({ received: z.literal(true) })
  .openapi("WebhookAck");

const PaymentResponseSchema = z
  .object({
    success: z.literal(true),
    data: PaymentSchema,
  })
  .openapi("PaymentResponse");

const ErrorResponseSchema = z
  .object({
    success: z.literal(false),
    message: z.string().openapi({ example: "Payment not found" }),
  })
  .openapi("PaymentErrorResponse");

/* ─────────────────────────────────────────────────────────────────────────────
   Register all schemas
───────────────────────────────────────────────────────────────────────────── */

registry.register("CitizenNested", CitizenNestedSchema);
registry.register("ExpertNested", ExpertNestedSchema);
registry.register("BookingNested", BookingNestedSchema);
registry.register("Payment", PaymentSchema);
registry.register("AzamPayWebhookBody", AzamPayWebhookBodySchema);
registry.register("WebhookAck", WebhookAckSchema);
registry.register("PaymentResponse", PaymentResponseSchema);
registry.register("PaymentErrorResponse", ErrorResponseSchema);

/* ─────────────────────────────────────────────────────────────────────────────
   Shared error responses
───────────────────────────────────────────────────────────────────────────── */

const errorContent = { "application/json": { schema: ErrorResponseSchema } };

const commonErrors = {
  403: {
    description: "Forbidden — caller is not the citizen or expert on this booking",
    content: errorContent,
  },
  404: { description: "Payment not found", content: errorContent },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Route registrations — order matches payment.routes.ts exactly
───────────────────────────────────────────────────────────────────────────── */

// ── POST /payments/webhook  (public — Azam Pay → server) ─────────────────────
registry.registerPath({
  method: "post",
  path: "/payments/webhook",
  tags: ["Payments"],
  summary: "AzamPay Unified Callback Webhook (Collections, Payouts & Refunds)",
  description:
    "**Called by AzamPay**, not by the client app. " +
    "AzamPay configures a single callback URL per merchant account (`POST /api/v1/payments/webhook?token=<AZAMPAY_WEBHOOK_TOKEN>`). " +
    "This unified handler classifies incoming callbacks by `referenceId` prefix (`BM-` for citizen MoMo collections, " +
    "`PO-` for expert payout disbursements, `RF-` for citizen refund disbursements) or payload type, and routes them to:\n" +
    "- **Collection (`BM-...`)**: `EscrowService.handlePaymentWebhook` (`ACSC`/`success` locks escrow & confirms booking; `RJCT`/`failure` marks `FAILED`).\n" +
    "- **Expert Payout (`PO-...`)**: `EscrowService.handlePayoutWebhook` (`success` confirms `DISBURSED_TO_EXPERT`; `failure` re-queues for automated retry with a fresh `referenceId`).\n" +
    "- **Refund (`RF-...`)**: `EscrowService.handleRefundWebhook`.\n\n" +
    "**Security:** verified via `?token=<AZAMPAY_WEBHOOK_TOKEN>` query parameter or `X-Webhook-Token` header using `crypto.timingSafeEqual`.",
  parameters: [
    {
      name: "token",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Shared webhook verification token matching AZAMPAY_WEBHOOK_TOKEN",
    },
  ],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: AzamPayWebhookBodySchema } },
    },
  },
  responses: {
    200: {
      description: "Webhook received and routed",
      content: { "application/json": { schema: WebhookAckSchema } },
    },
    400: {
      description: "Body was not valid JSON",
      content: errorContent,
    },
    401: {
      description: "Missing or invalid webhook token",
      content: errorContent,
    },
  },
});

// ── POST /payments/payout-webhook  (public — backward-compatible alias) ──────
registry.registerPath({
  method: "post",
  path: "/payments/payout-webhook",
  tags: ["Payments"],
  summary: "AzamPay payout webhook alias (delegates to unified /payments/webhook)",
  description:
    "Backward-compatible alias that delegates to the unified `POST /payments/webhook` handler.",
  parameters: [
    {
      name: "token",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Shared webhook verification token matching AZAMPAY_WEBHOOK_TOKEN",
    },
  ],
  responses: {
    200: {
      description: "Webhook received and routed",
      content: { "application/json": { schema: WebhookAckSchema } },
    },
    401: {
      description: "Missing or invalid webhook token",
      content: errorContent,
    },
  },
});

// ── GET /payments/callback  (public — Azam Pay browser redirect) ─────────────
registry.registerPath({
  method: "get",
  path: "/payments/callback",
  tags: ["Payments"],
  summary: "Azam Pay payment redirect callback",
  description:
    "**Azam Pay redirects the citizen's browser here** after a direct checkout payment attempt. " +
    "Not called programmatically.\n\n" +
    "Reads a transaction reference from the query string (accepts `reference`, `tx_ref`, " +
    "`externalId`, or `transactionId` — the exact param name Azam Pay uses has not been confirmed) " +
    "and resolves the outcome from `Booking.paymentStatus` in our own database, rather than " +
    "trusting any status value in the redirect URL itself:\n" +
    "- `PAID` → `FRONTEND_URL/bookings/success?ref=<reference>`\n" +
    "- `FAILED` → `FRONTEND_URL/bookings/failed?ref=<reference>`\n" +
    "- no reference given, or outcome still undetermined (e.g. webhook hasn't arrived yet) → " +
    "`FRONTEND_URL/client/dashboard/consultations`",
  parameters: [
    {
      name: "reference",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Transaction reference (aliases: tx_ref, externalId, transactionId)",
    },
  ],
  responses: {
    302: {
      description: "Redirect to the success, failed, or dashboard page depending on resolved outcome",
    },
  },
});

// ── GET /payments/:bookingId  (authenticate) ─────────────────────────────────
registry.registerPath({
  method: "get",
  path: "/payments/{bookingId}",
  tags: ["Payments"],
  summary: "Get payment details for a booking",
  description:
    "Returns the full payment record including nested booking, citizen, and expert. " +
    "Only the citizen or expert on the booking may access it. " +
    "Middleware: authenticate.",
  security: [{ bearerAuth: [] }],
  parameters: [
    {
      name: "bookingId",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
      description: "Booking UUID — one-to-one with Payment",
    },
  ],
  responses: {
    200: {
      description: "Payment details retrieved successfully",
      content: { "application/json": { schema: PaymentResponseSchema } },
    },
    ...commonErrors,
  },
});