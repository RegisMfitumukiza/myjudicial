import { Router } from "express";
import { AdminFinanceController } from "./admin-finance.controller.js";
import { authenticate, requireAdmin } from "../../shared/middleware/authenticate.js";

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/admin/finance/stats
 * @desc    Get finance statistics
 * @access  Admin only
 */
router.get("/stats", AdminFinanceController.getStats);

/**
 * @route   GET /api/v1/admin/finance/payments
 * @desc    List payments with filters and pagination
 * @access  Admin only
 */
router.get("/payments", AdminFinanceController.listPayments);

/**
 * @route   GET /api/v1/admin/finance/escrow
 * @desc    List escrow ledgers with filters and pagination
 * @access  Admin only
 */
router.get("/escrow", AdminFinanceController.listEscrowLedgers);

/**
 * @route   GET /api/v1/admin/finance/failed-settlements
 * @desc    Get failed settlements (payouts that failed)
 * @access  Admin only
 */
router.get("/failed-settlements", AdminFinanceController.getFailedSettlements);

/**
 * @route   POST /api/v1/admin/finance/retry-payout
 * @desc    Retry failed payout
 * @access  Admin only
 */
router.post("/retry-payout", AdminFinanceController.retryPayout);

/**
 * @route   GET /api/v1/admin/finance/payments/:id
 * @desc    Get payment by ID
 * @access  Admin only
 */
router.get("/payments/:id", AdminFinanceController.getPaymentById);

/**
 * @route   GET /api/v1/admin/finance/escrow/:id
 * @desc    Get escrow ledger by ID
 * @access  Admin only
 */
router.get("/escrow/:id", AdminFinanceController.getEscrowLedgerById);

export default router;
