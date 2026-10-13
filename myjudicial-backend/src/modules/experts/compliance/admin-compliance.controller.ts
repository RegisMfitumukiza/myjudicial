import type { Request, Response, NextFunction } from "express";
import { AdminComplianceService } from "./admin-compliance.service.js";
import { sendSuccess, sendPaginated } from "../../../shared/utils/response.js";

export const AdminComplianceController = {
  /**
   * GET /api/v1/admin/compliance/overview
   * Get compliance statistics
   */
  getOverview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await AdminComplianceService.getOverview();
      sendSuccess(res, stats, "Compliance overview retrieved");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/compliance/expiring
   * List experts with expiring credentials (within threshold days)
   */
  getExpiringCredentials: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 20, daysThreshold = 30, search } = req.query;

      const result = await AdminComplianceService.getExpiringCredentials({
        page: Number(page),
        limit: Number(limit),
        daysThreshold: Number(daysThreshold),
        search: search ? String(search) : undefined,
      });

      sendPaginated(res, result.experts, result.pagination, "Expiring credentials retrieved");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/compliance/expired
   * List experts with expired credentials
   */
  getExpiredCredentials: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 20, search } = req.query;

      const result = await AdminComplianceService.getExpiredCredentials({
        page: Number(page),
        limit: Number(limit),
        search: search ? String(search) : undefined,
      });

      sendPaginated(res, result.experts, result.pagination, "Expired credentials retrieved");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/compliance/suspended
   * List suspended experts
   */
  getSuspendedExperts: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 20, search } = req.query;

      const result = await AdminComplianceService.getSuspendedExperts({
        page: Number(page),
        limit: Number(limit),
        search: search ? String(search) : undefined,
      });

      sendPaginated(res, result.experts, result.pagination, "Suspended experts retrieved");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/compliance/verified
   * List verified compliant experts
   */
  getVerifiedExperts: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 20, search } = req.query;

      const result = await AdminComplianceService.getVerifiedExperts({
        page: Number(page),
        limit: Number(limit),
        search: search ? String(search) : undefined,
      });

      sendPaginated(res, result.experts, result.pagination, "Verified experts retrieved");
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin/compliance/:id/send-warning
   * Send compliance warning email to expert
   */
  sendWarning: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const adminId = req.user!.id;

      await AdminComplianceService.sendComplianceWarning(id, adminId);

      sendSuccess(res, { sent: true }, "Warning email sent to expert");
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin/compliance/:id/extend
   * Manually extend expert credentials expiry
   */
  extendCredentials: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { newExpiryDate, reason } = req.body;
      const adminId = req.user!.id;

      const result = await AdminComplianceService.extendCredentials(id, {
        newExpiryDate,
        reason,
        adminId,
      });

      sendSuccess(res, result, "Credentials expiry extended");
    } catch (error) {
      next(error);
    }
  },
};
