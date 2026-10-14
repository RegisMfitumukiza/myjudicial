import type { Request, Response, NextFunction } from "express";
import { AdminExpertService } from "./admin-expert.service.js";
import { AdminExpertNotificationsService } from "./admin-expert-notifications.service.js";
import { sendSuccess, sendPaginated } from "../../shared/utils/response.js";

export const AdminExpertController = {
  /**
   * GET /api/v1/admin/experts
   * List all experts with filters
   */
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        specialty,
        search,
        verified,
        verificationStatus,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const filters = {
        status: status as any,
        specialty: specialty as any,
        search: search as string,
        verified: verified === "true" ? true : verified === "false" ? false : undefined,
        verificationStatus: verificationStatus as "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | undefined,
      };

      const { experts, pagination } = await AdminExpertService.list({
        page: Number(page),
        limit: Number(limit),
        filters,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      sendPaginated(res, experts, pagination, "Experts retrieved successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/experts/:id
   * Get detailed expert information
   */
  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const expert = await AdminExpertService.getById(id);
      sendSuccess(res, expert, "Expert details retrieved");
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/experts/:id/suspend
   * Suspend expert account
   */
  suspend: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { reason, suspendUntil, notifyExpert } = req.body;

      const expert = await AdminExpertService.suspend(id, {
        reason,
        suspendUntil,
        notifyExpert,
        adminId: req.user!.id,
      });

      sendSuccess(res, expert, "Expert suspended successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/experts/:id/activate
   * Reactivate suspended expert
   */
  activate: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const expert = await AdminExpertService.activate(id, req.user!.id);
      sendSuccess(res, expert, "Expert activated successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/experts/:id/status
   * Update expert status
   */
  updateStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status, reason } = req.body;

      const expert = await AdminExpertService.updateStatus(id, {
        status,
        reason,
        adminId: req.user!.id,
      });

      sendSuccess(res, expert, "Expert status updated");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/experts/:id/bookings
   * Get expert's bookings
   */
  getExpertBookings: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { page = 1, limit = 20 } = req.query;

      const { bookings, pagination } = await AdminExpertService.getExpertBookings(id, {
        page: Number(page),
        limit: Number(limit),
      });

      sendPaginated(res, bookings, pagination, "Expert bookings retrieved");
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin/experts/:id/send-verification-reminder
   * Send reminder to expert to submit verification documents
   */
  sendVerificationReminder: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await AdminExpertNotificationsService.sendVerificationReminder(id, req.user!.id);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/experts/:id/reset-to-resubmit
   * Reset a REJECTED expert back to DRAFT so they can resubmit verification documents
   */
  resetToResubmit: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await AdminExpertService.resetToResubmit(id, req.user!.id);
      sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/experts/:id/credentials
   * Direct backfill or update of validity dates on expert credentials
   */
  setCredentialDates: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await AdminExpertService.setCredentialDates(id, req.body, req.user!.id);
      sendSuccess(res, result, "Credential dates set successfully");
    } catch (error) {
      next(error);
    }
  },
};

