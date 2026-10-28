import { Router } from "express";
import { AdminFinanceController } from "./admin-finance.controller.js";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";
import { validateQuery } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import {
  listPaymentsQuerySchema,
  listEscrowQuerySchema,
  financeStatsQuerySchema,
} from "./admin-finance.schemas.js";

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/admin/finance/stats
 * @desc    Get finance statistics
 * @access  Admin only
 */
router.get(
  "/stats",
  validateQuery(financeStatsQuerySchema),
  asyncHandler(AdminFinanceController.getStats)
);

/**
 * @route   GET /api/v1/admin/finance/payments
 * @desc    List payments with filters and pagination
 * @access  Admin only
 */
router.get(
  "/payments",
  validateQuery(listPaymentsQuerySchema),
  asyncHandler(AdminFinanceController.listPayments)
);

/**
 * @route   GET /api/v1/admin/finance/escrow
 * @desc    List escrow ledgers with filters and pagination
 * @access  Admin only
 */
router.get(
  "/escrow",
  validateQuery(listEscrowQuerySchema),
  asyncHandler(AdminFinanceController.listEscrowLedgers)
);

/**
 * @route   GET /api/v1/admin/finance/failed-settlements
 * @desc    Get failed settlements (payouts that failed)
 * @access  Admin only
 */
router.get("/failed-settlements", asyncHandler(AdminFinanceController.getFailedSettlements));

/**
 * @route   POST /api/v1/admin/finance/retry-payout
 * @desc    Retry failed payout
 * @access  Admin only
 */
router.post("/retry-payout", asyncHandler(AdminFinanceController.retryPayout));

/**
 * @route   GET /api/v1/admin/finance/payments/:id
 * @desc    Get payment by ID
 * @access  Admin only
 */
router.get("/payments/:id", asyncHandler(AdminFinanceController.getPaymentById));

/**
 * @route   GET /api/v1/admin/finance/escrow/:id
 * @desc    Get escrow ledger by ID
 * @access  Admin only
 */
router.get("/escrow/:id", asyncHandler(AdminFinanceController.getEscrowLedgerById));

/**
 * @route   GET /api/v1/admin/finance/azampay-balance
 * @desc    Get live AzamPay disbursement float balance (§3.2)
 * @access  Admin only
 */
router.get("/azampay-balance", asyncHandler(AdminFinanceController.getAzamPayBalance));

/**
 * @route   POST /api/v1/admin/finance/reconcile/:id
 * @desc    Actively reconcile a booking's payment and payout status with AzamPay v2
 * @access  Admin only
 */
router.post("/reconcile/:id", asyncHandler(AdminFinanceController.reconcileBookingFinance));

export default router;
