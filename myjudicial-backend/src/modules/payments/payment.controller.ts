import { Request, Response } from "express";
import crypto from "crypto";
import { EscrowService } from "./escrow.service.js";
import { AzamPayService } from "./azam.service.js";
import { logger } from "../../shared/utils/logger.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { NotFoundError, AuthorizationError, ValidationError } from "../../shared/errors/index.js";
import { PaymentRepository } from "./payment.repository.js";
import { BookingRepository } from "../bookings/booking.repository.js";

/**
 * Verifies the shared secret token passed by AzamPay on the webhook callback URL
 * (`?token=<secret>`) or via an `X-Webhook-Token` / `X-Callback-Token` header.
 *
 * Uses `crypto.timingSafeEqual` to prevent timing oracle attacks.
 */
const verifyWebhookToken = (req: Request): boolean => {
  const secret = process.env.AZAMPAY_WEBHOOK_TOKEN || process.env.AZAMPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("AZAMPAY_WEBHOOK_TOKEN not configured — rejecting webhook");
    return false;
  }

  const provided =
    (typeof req.query.token === "string" ? req.query.token : undefined) ||
    (req.headers["x-webhook-token"] as string | undefined) ||
    (req.headers["x-callback-token"] as string | undefined) ||
    (req.headers["x-azampay-signature"] as string | undefined);

  if (!provided) {
    logger.warn("AzamPay webhook missing verification token");
    return false;
  }

  const expectedBuf = Buffer.from(secret, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");

  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, providedBuf);
};

/**
 * Safely parses raw JSON buffer, string, or pre-parsed object body.
 */
const parseWebhookBody = (body: unknown): Record<string, any> | null => {
  try {
    if (Buffer.isBuffer(body)) {
      return JSON.parse(body.toString("utf8"));
    }
    if (typeof body === "string") {
      return JSON.parse(body);
    }
    if (body && typeof body === "object") {
      return body as Record<string, any>;
    }
    return null;
  } catch {
    return null;
  }
};

const unifiedWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!verifyWebhookToken(req)) {
    logger.warn("Invalid AzamPay webhook token", { ip: req.ip });
    return res.status(401).json({
      success: false,
      message: "Unauthorized webhook request",
    });
  }

  const payload = parseWebhookBody(req.body);
  if (!payload) {
    logger.error("Failed to parse AzamPay webhook body");
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }

  logger.info("AzamPay unified webhook received", { payload });

  try {
    const result = await EscrowService.handleUnifiedWebhook(payload);
    return res.status(200).json({
      received: true,
      ...(result
        ? {
            category: result.category,
            outcome: result.outcome,
            processed: result.processed,
          }
        : {}),
    });
  } catch (error) {
    // Never return 5xx to AzamPay after receiving a valid payload; log for reconciliation cron
    logger.error("Error processing AzamPay unified webhook", { error, payload });
    return res.status(200).json({ received: true });
  }
});

export const PaymentController = {
  /**
   * POST /api/v1/payments/webhook
   * (Also aliased at POST /api/v1/payments/payout-webhook)
   *
   * Single Unified AzamPay Callback Endpoint.
   */
  handleWebhook: unifiedWebhookHandler,

  /**
   * POST /api/v1/payments/payout-webhook
   * Backward-compatible alias that delegates to the unified webhook handler.
   */
  handlePayoutWebhook: unifiedWebhookHandler,

  /**
   * GET /api/v1/payments/callback
   *
   * Browser redirect endpoint after checkout.
   * Resolves the outcome from our database — and if the booking is still `PENDING`,
   * actively queries AzamPay v2 (`GET /api/v2/rw/payments/references/{referenceId}`)
   * before redirecting so delayed webhooks never strand the user!
   */
  paymentCallback: asyncHandler(async (req: Request, res: Response) => {
    const rawRef =
      req.query.reference ??
      req.query.referenceId ??
      req.query.tx_ref ??
      req.query.externalId ??
      req.query.transactionId;
    const reference = typeof rawRef === "string" ? rawRef.trim() : "";

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    if (!reference) {
      logger.info("Payment callback hit without reference param", { query: req.query });
      return res.redirect(`${frontendUrl}/client/dashboard/consultations`);
    }

    const outcome = await EscrowService.resolvePaymentOutcome(reference);
    logger.info("Payment callback resolved outcome", { reference, outcome });

    const encodedRef = encodeURIComponent(reference);
    if (outcome === "PAID") {
      return res.redirect(`${frontendUrl}/bookings/success?ref=${encodedRef}`);
    }
    if (outcome === "FAILED") {
      return res.redirect(`${frontendUrl}/bookings/failed?ref=${encodedRef}`);
    }
    return res.redirect(`${frontendUrl}/client/dashboard/consultations`);
  }),

  /**
   * GET /api/v1/payments/lookup-account/:accountNumber
   *
   * Resolves a Rwandan mobile money MSISDN via AzamPay Checkout API v2 (§2.1)
   * (`GET /api/v2/rw/accounts/{accountNumber}`) to return the account holder's KYC name
   * and MNO provider (`MTN` or `AIRTEL`).
   */
  lookupAccount: asyncHandler(async (req: Request, res: Response) => {
    const accountNumber = String(req.params.accountNumber || "").trim();
    const digits = accountNumber.replace(/\D/g, "");
    if (digits.length < 9 || digits.length > 20) {
      throw new ValidationError("Account number must be between 9 and 20 digits");
    }

    const result = await AzamPayService.lookupPaymentAccount(digits);
    return res.status(200).json({
      success: result.success,
      data: result.data ?? null,
      message: result.message,
    });
  }),

  /**
   * POST /api/v1/payments/:bookingId/verify
   *
   * Actively polls AzamPay v2 (`GET /api/v2/rw/payments/references/{referenceId}`)
   * for a booking's payment status and reconciles our database state immediately.
   * Useful when a webhook is delayed while the client is waiting on `MomoPaymentTracker`.
   */
  verifyBookingPayment: asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    const isCitizen = booking.citizenId === userId;
    const isExpert = (booking as any).expert?.user?.id === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isCitizen && !isExpert && !isAdmin) {
      throw new AuthorizationError("Unauthorized to verify payment for this booking");
    }

    const reconciliation = await EscrowService.reconcileBookingPayment(bookingId);

    return res.status(200).json({
      success: true,
      data: reconciliation,
    });
  }),

  /**
   * GET /api/v1/payments/:bookingId
   * Get payment details for a booking (actively reconciles with AzamPay v2 if still PENDING).
   */
  getPaymentDetails: asyncHandler(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let payment = await PaymentRepository.findByBookingIdWithDetails(bookingId);

    // If no payment record exists yet, check if the booking is PENDING and can be reconciled live
    if (!payment) {
      await EscrowService.reconcileBookingPayment(bookingId);
      payment = await PaymentRepository.findByBookingIdWithDetails(bookingId);
    }

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    const isOwner =
      payment.booking.citizenId === userId ||
      payment.booking.expertId === userId ||
      (payment.booking as any).expert?.user?.id === userId ||
      userRole === "ADMIN";

    if (!isOwner) {
      throw new AuthorizationError("Unauthorized to view this payment");
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  }),
};
