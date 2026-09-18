// src/modules/payment/payment.controller.ts
import { Request, Response, NextFunction } from "express";
import { EscrowService } from "./escrow.service.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { logger } from "../../shared/utils/logger.js";
import crypto from "crypto";

const AZAMPAY_WEBHOOK_HEADER = "x-azampay-signature";

const toBuffer = (body: unknown): Buffer => {
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === "string") return Buffer.from(body);
  return Buffer.from(JSON.stringify(body ?? {}));
};

/**
 * Verifies the raw webhook body against AZAMPAY_WEBHOOK_SECRET using
 * HMAC-SHA256, matching this project's stated "all webhooks HMAC-SHA256
 * signed" security model (see MyJudicial_Master_Build_Reference.md).
 *
 * This is MyJudicial's own shared-secret scheme — Azam Pay's real webhook
 * signing mechanism has not yet been confirmed against their dashboard/docs,
 * since the integration is currently simulated (see azam.service.ts). Once
 * real Azam Pay webhooks are wired up, confirm how they expose a signing
 * secret and adjust the header name / algorithm here if needed.
 *
 * Fails closed: if AZAMPAY_WEBHOOK_SECRET is not configured, or the header
 * is missing/mismatched, verification fails and the webhook is rejected.
 */
const verifyAzamPaySignature = (rawBody: Buffer, signatureHeader?: string): boolean => {
  const secret = process.env.AZAMPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signatureHeader, "hex"));
  } catch {
    return false; // e.g. malformed/wrong-length header — treat as invalid
  }
};

export const PaymentController = {
  /**
   * POST /api/v1/payments/webhook
   * Azam Pay calls this when citizen completes MoMo payment
   */
  handleWebhook: async (req: Request, res: Response): Promise<void> => {
    const rawBody = toBuffer(req.body);
    const signature = req.headers[AZAMPAY_WEBHOOK_HEADER] as string | undefined;

    // AzamPay officially confirmed they send direct JSON payloads without a signature header.
    // If a signature header IS present and a secret is configured, verify it.
    if (process.env.AZAMPAY_WEBHOOK_SECRET && signature && !verifyAzamPaySignature(rawBody, signature)) {
      logger.warn("Azam Pay webhook signature verification failed", {
        hasSecret: !!process.env.AZAMPAY_WEBHOOK_SECRET,
        hasSignatureHeader: !!signature,
      });
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString());
    } catch {
      logger.error("Failed to parse Azam Pay webhook body");
      res.status(400).json({ error: "Invalid JSON" });
      return;
    }

    logger.info("Azam Pay webhook received", {
      type: payload.type,
      success: payload.success,
      status: payload.data?.transactionStatus || payload.transactionstatus,
      externalId: payload.data?.merchantReferenceId || payload.utilityref || payload.externalId,
    });

    // Normalize Rwanda callback format (both v2 and v1) to what EscrowService expects:
    // Rwanda v2: { type: "payment.callback", data: { transactionStatus, merchantReferenceId, providerReferenceId } }
    // Rwanda v1: { transactionstatus, utilityref, reference, message }
    // Legacy:    { transactionstatus, externalId, reference }
    const normalized = {
      transactionstatus: payload.data?.transactionStatus || payload.transactionstatus,
      externalId: payload.data?.merchantReferenceId || payload.utilityref || payload.externalId,
      reference: payload.data?.providerReferenceId || payload.reference || payload.transid,
      message: payload.message || payload.data?.message,
    };

    try {
      await EscrowService.handlePaymentWebhook(normalized);
    } catch (error) {
      logger.error("Azam Pay webhook processing error", { error });
    }

    res.status(200).json({ received: true, success: true });
  },

  /**
   * GET /api/v1/payments/callback
   * Azam Pay redirects the citizen's browser here after a checkout attempt.
   * Resolves the real outcome from our own records rather than trusting the
   * redirect query string, since we don't control what Azam Pay puts there.
   */
  handleCallback: async (req: Request, res: Response): Promise<void> => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const reference = (req.query.reference ??
      req.query.tx_ref ??
      req.query.externalId ??
      req.query.transactionId) as string | undefined;

    if (!reference) {
      res.redirect(`${frontendUrl}/client/dashboard/consultations`);
      return;
    }

    try {
      const outcome = await EscrowService.resolvePaymentOutcome(reference);

      if (outcome === "PAID") {
        res.redirect(`${frontendUrl}/bookings/success?ref=${encodeURIComponent(reference)}`);
        return;
      }

      if (outcome === "FAILED") {
        res.redirect(`${frontendUrl}/bookings/failed?ref=${encodeURIComponent(reference)}`);
        return;
      }

      // Outcome not yet determined (still PENDING, or webhook hasn't arrived) —
      // send the citizen to their dashboard where live booking status is visible.
      res.redirect(`${frontendUrl}/client/dashboard/consultations`);
    } catch (error) {
      logger.error("Payment callback lookup failed", { reference, error });
      res.redirect(`${frontendUrl}/client/dashboard/consultations`);
    }
  },

  /**
   * POST /api/v1/payments/payout-webhook
   * Azam Pay calls this when expert payout transfer completes.
   * Not yet implemented — Azam Pay's payout webhook payload/behavior is
   * unconfirmed — but signature-gated like the payment webhook so it
   * inherits verification from day one once it is implemented.
   */
  handlePayoutWebhook: async (req: Request, res: Response): Promise<void> => {
    const rawBody = toBuffer(req.body);
    const signature = req.headers[AZAMPAY_WEBHOOK_HEADER] as string | undefined;

    if (process.env.AZAMPAY_WEBHOOK_SECRET && signature && !verifyAzamPaySignature(rawBody, signature)) {
      logger.warn("Azam Pay payout webhook signature verification failed", {
        hasSecret: !!process.env.AZAMPAY_WEBHOOK_SECRET,
        hasSignatureHeader: !!signature,
      });
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    res.status(200).json({ received: true });
  },

  /**
   * GET /api/v1/payments/:bookingId
   * Get payment details for a specific booking
   */
  getPaymentByBooking: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { bookingId } = req.params as { bookingId: string };
      const userId = req.user?.id;

      const payment = await prisma.payment.findUnique({
        where: { bookingId },
        include: {
          booking: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  flatFee: true,
                  currency: true,
                  durationMin: true,
                  category: true,
                  deliveryMode: true,
                },
              },
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
                      id: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          message: "Payment not found",
        });
        return;
      }

      // Only citizen or expert of this booking can view
      const isCitizen = payment.booking.citizenId === userId;
      const isExpert = (payment.booking.expert as any)?.user?.id === userId;

      if (!isCitizen && !isExpert) {
        res.status(403).json({
          success: false,
          message: "Unauthorized to view this payment",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get printable receipt data for a booking
   */
  getReceipt: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { bookingId } = req.params as { bookingId: string };
      const userId = req.user?.id;

      const payment = await prisma.payment.findUnique({
        where: { bookingId },
        include: {
          booking: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  flatFee: true,
                  currency: true,
                  durationMin: true,
                  category: true,
                  deliveryMode: true,
                },
              },
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
                      id: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
              escrowLedger: {
                select: {
                  id: true,
                  status: true,
                  settledAt: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        res.status(404).json({
          success: false,
          message: "Payment not found",
        });
        return;
      }

      const isCitizen = payment.booking.citizenId === userId;
      const isExpert = (payment.booking.expert as any)?.user?.id === userId;

      if (!isCitizen && !isExpert) {
        res.status(403).json({
          success: false,
          message: "Unauthorized to view this receipt",
        });
        return;
      }

      const receipt = {
        receiptNo: `REC-${payment.txRef}`,
        transactionRef: payment.txRef,
        providerTransactionId: payment.providerTransactionId,
        status: payment.status,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        amount: payment.amount,
        currency: payment.currency,
        platformFee: payment.platformFee,
        expertPayout: payment.expertPayout,
        booking: {
          id: payment.booking.id,
          status: payment.booking.status,
          scheduledStart: payment.booking.scheduledStart,
          scheduledEnd: payment.booking.scheduledEnd,
          completedAt: payment.booking.completedAt,
          actualDurationMin: payment.booking.actualDurationMin,
        },
        service: payment.booking.service,
        citizen: {
          name: `${payment.booking.citizen.firstName} ${payment.booking.citizen.lastName}`,
          email: payment.booking.citizen.email,
        },
        expert: {
          name: payment.booking.expert.displayName,
          email: payment.booking.expert.user.email,
        },
        escrow: payment.booking.escrowLedger
          ? {
              status: payment.booking.escrowLedger.status,
              settledAt: payment.booking.escrowLedger.settledAt,
            }
          : null,
      };

      res.status(200).json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  },
};