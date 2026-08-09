import type { Request, Response, NextFunction } from "express";
import { AdminUserService } from "./admin-user.service.js";
import { sendSuccess, sendPaginated } from "../../shared/utils/response.js";

export const AdminUserController = {
  /**
   * GET /api/v1/admin/users/stats
   */
  getStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await AdminUserService.getStats();
      sendSuccess(res, stats, "User statistics retrieved");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/users
   */
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        accountStatus,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const filters = {
        role: role as any,
        status: accountStatus as any,
        search: search as string,
      };

      const result = await AdminUserService.list({
        page: Number(page),
        limit: Number(limit),
        filters,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      sendPaginated(res, result.users, result.pagination, "Users retrieved successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/users/:id
   */
  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const user = await AdminUserService.getById(id);
      sendSuccess(res, user, "User details retrieved");
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/users/:id/status
   */
  updateStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status, reason } = req.body;
      const adminId = req.user!.id;

      const user = await AdminUserService.updateStatus(id, {
        status,
        reason,
        adminId,
      });

      sendSuccess(res, user, "User status updated");
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/admin/users/:id
   */
  deleteUser: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const adminId = req.user!.id;

      const result = await AdminUserService.deleteUser(id, adminId, reason);

      sendSuccess(res, result, "User account deleted");
    } catch (error) {
      next(error);
    }
  },
};
