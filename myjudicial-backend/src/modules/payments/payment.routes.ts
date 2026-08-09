// src/modules/payment/payment.routes.ts
import { Router } from "express";
import { PaymentController } from "./payment.controller.js";
import { authenticate } from "../../shared/middleware/authenticate.js";

const router = Router();

// ─── Public routes — Azam Pay calls these directly ──────────────────────────
router.post(
  "/payments/webhook",
  PaymentController.handleWebhook
);

router.post(
  "/payments/payout-webhook",
  PaymentController.handlePayoutWebhook
);

router.get(
  "/payments/callback",
  PaymentController.handleCallback
);

// ─── Protected routes — require auth ────────────────────────────────────────
router.get(
  "/payments/:bookingId",
  authenticate,
  PaymentController.getPaymentByBooking
);

router.get(
  "/payments/:bookingId/receipt",
  authenticate,
  PaymentController.getReceipt
);

export default router;