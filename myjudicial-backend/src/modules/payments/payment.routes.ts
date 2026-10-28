// src/modules/payments/payment.routes.ts
import { Router } from "express";
import { PaymentController } from "./payment.controller.js";
import { authenticate } from "../../shared/middleware/authenticate.js";

const router = Router();

/**
 * Single Unified AzamPay Webhook Callback (Public — verified via AZAMPAY_WEBHOOK_TOKEN).
 * Handles all AzamPay Rwanda v2 callbacks:
 *  - Collections / Checkout (`BM-...`)
 *  - Expert Disbursement Payouts (`PO-...`)
 *  - Citizen Refund Transfers (`RF-...`)
 */
router.post("/payments/webhook", PaymentController.handleWebhook);

/**
 * Backward-compatible alias that routes to the same unified webhook handler.
 */
router.post("/payments/payout-webhook", PaymentController.handlePayoutWebhook);

/**
 * Browser redirect callback after checkout.
 */
router.get("/payments/callback", PaymentController.paymentCallback);

/**
 * Authenticated v2 Account Lookup (§2.1 `GET /api/v2/rw/accounts/{accountNumber}`).
 */
router.get(
  "/payments/lookup-account/:accountNumber",
  authenticate,
  PaymentController.lookupAccount
);

/**
 * Authenticated live payment status verification & reconciliation (§2.4).
 */
router.post(
  "/payments/:bookingId/verify",
  authenticate,
  PaymentController.verifyBookingPayment
);

/**
 * Authenticated payment details by bookingId.
 */
router.get(
  "/payments/:bookingId",
  authenticate,
  PaymentController.getPaymentDetails
);

export default router;
