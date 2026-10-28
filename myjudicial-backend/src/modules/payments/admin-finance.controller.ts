import type { Request, Response, NextFunction } from "express";
import { AdminFinanceService } from "./admin-finance.service.js";
import {
  listPaymentsQuerySchema,
  listEscrowQuerySchema,
  financeStatsQuerySchema,
  retryPayoutSchema,
  getByIdParamsSchema,
} from "./admin-finance.schemas.js";

export const AdminFinanceController = {
  /**
   * GET /api/v1/admin/finance/stats
   * Get finance statistics
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const rawQuery = (req as any).validatedQuery ?? req.query;
      const query = financeStatsQuerySchema.parse(rawQuery);
      const stats = await AdminFinanceService.getStats(query.fromDate, query.toDate);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/finance/payments
   * List payments with filters and pagination
   */
  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const rawQuery = (req as any).validatedQuery ?? req.query;
      const query = listPaymentsQuerySchema.parse(rawQuery);

      const result = await AdminFinanceService.listPayments({
        page: query.page,
        limit: query.limit,
        filters: {
          status: query.status,
          fromDate: query.fromDate,
          toDate: query.toDate,
          search: query.search,
        },
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/finance/escrow
   * List escrow ledgers with filters and pagination
   */
  async listEscrowLedgers(req: Request, res: Response, next: NextFunction) {
    try {
      const rawQuery = (req as any).validatedQuery ?? req.query;
      const query = listEscrowQuerySchema.parse(rawQuery);

      const result = await AdminFinanceService.listEscrowLedgers({
        page: query.page,
        limit: query.limit,
        filters: {
          status: query.status,
          search: query.search,
        },
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/finance/failed-settlements
   * Get failed settlements (payouts that failed)
   */
  async getFailedSettlements(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit as string) || 20));

      const result = await AdminFinanceService.getFailedSettlements(page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin/finance/retry-payout
   * Retry failed payout
   */
  async retryPayout(req: Request, res: Response, next: NextFunction) {
    try {
      const body = retryPayoutSchema.parse(req.body);
      const adminId = (req as any).user?.id;

      const result = await AdminFinanceService.retryPayout(
        body.bookingId,
        adminId,
        body.reason
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/finance/payments/:id
   * Get payment by ID
   */
  async getPaymentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getByIdParamsSchema.parse(req.params);
      const payment = await AdminFinanceService.getPaymentById(id);
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/finance/escrow/:id
   * Get escrow ledger by ID
   */
  async getEscrowLedgerById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getByIdParamsSchema.parse(req.params);
      const ledger = await AdminFinanceService.getEscrowLedgerById(id);
      res.json({ success: true, data: ledger });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/finance/azampay-balance
   * Get live AzamPay Disbursement float balance (§3.2)
   */
  async getAzamPayBalance(_req: Request, res: Response, next: NextFunction) {
    try {
      const balance = await AdminFinanceService.getAzamPayBalance();
      res.json({ success: true, data: balance });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin/finance/reconcile/:id
   * Actively reconcile a booking's payment and payout status with AzamPay v2
   */
  async reconcileBookingFinance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getByIdParamsSchema.parse(req.params);
      const result = await AdminFinanceService.reconcilePayment(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
