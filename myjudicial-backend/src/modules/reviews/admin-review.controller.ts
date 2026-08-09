import type { Request, Response, NextFunction } from "express";
import { AdminReviewService } from "./admin-review.service.js";
import { sendSuccess, sendPaginated } from "../../shared/utils/response.js";

export const AdminReviewController = {
  getStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await AdminReviewService.getStats();
      sendSuccess(res, stats, "Review statistics retrieved");
    } catch (error) {
      next(error);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        isFlagged,
        minRating,
        maxRating,
        search,
        expertId,
        citizenId,
        dateFrom,
        dateTo,
        sortBy = "newest",
      } = req.query;

      const filters = {
        status: status as any,
        isFlagged: isFlagged !== undefined ? isFlagged === "true" : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        maxRating: maxRating ? Number(maxRating) : undefined,
        search: search as string,
        expertId: expertId as string,
        citizenId: citizenId as string,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      };

      const result = await AdminReviewService.list({
        page: Number(page),
        limit: Number(limit),
        filters,
        sortBy: sortBy as any,
      });

      sendPaginated(res, result.reviews, result.pagination, "Reviews retrieved successfully");
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const review = await AdminReviewService.getById(id);
      sendSuccess(res, review, "Review details retrieved");
    } catch (error) {
      next(error);
    }
  },

  moderate: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { status, moderationNote } = req.body;
      const adminId = req.user!.id;

      const review = await AdminReviewService.moderate(id, {
        status,
        moderationNote,
        adminId,
      });

      sendSuccess(res, review, "Review moderated successfully");
    } catch (error) {
      next(error);
    }
  },

  deleteReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { reason } = req.body;
      const adminId = req.user!.id;

      const result = await AdminReviewService.deleteReview(id, adminId, reason);

      sendSuccess(res, result, "Review deleted successfully");
    } catch (error) {
      next(error);
    }
  },

  listReports: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 20, resolved, reason } = req.query;

      const result = await AdminReviewService.listReports({
        page: Number(page),
        limit: Number(limit),
        resolved: resolved !== undefined ? resolved === "true" : undefined,
        reason: reason as any,
      });

      sendPaginated(res, result.reports, result.pagination, "Reports retrieved successfully");
    } catch (error) {
      next(error);
    }
  },

  resolveReport: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const adminId = req.user!.id;

      const report = await AdminReviewService.resolveReport(id, adminId);

      sendSuccess(res, report, "Report resolved successfully");
    } catch (error) {
      next(error);
    }
  },
};
