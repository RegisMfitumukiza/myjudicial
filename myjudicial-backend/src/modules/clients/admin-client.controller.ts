import type { Request, Response, NextFunction } from "express";
import { AdminClientService } from "./admin-client.service.js";
import { sendSuccess, sendPaginated } from "../../shared/utils/response.js";

export const AdminClientController = {
  /**
   * GET /api/v1/admin/clients/stats
   */
  getStats: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await AdminClientService.getStats();
      sendSuccess(res, stats, "Client statistics retrieved successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/clients
   */
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = (req.validatedQuery || req.query) as any;
      const {
        page = 1,
        limit = 20,
        status,
        activity,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = q;

      const filters = {
        status: status as string | undefined,
        activity: activity as any,
        search: search as string | undefined,
      };

      const result = await AdminClientService.list({
        page: Number(page),
        limit: Number(limit),
        filters,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      sendPaginated(res, result.clients, result.pagination, "Clients retrieved successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/clients/:id
   */
  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const client = await AdminClientService.getById(id);
      sendSuccess(res, client, "Client details retrieved successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/admin/clients/:id/status
   */
  updateStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status, reason } = req.body;
      const adminId = req.user!.id;

      const updated = await AdminClientService.updateStatus(id, {
        status,
        reason,
        adminId,
      });

      sendSuccess(res, updated, "Client status updated successfully");
    } catch (error) {
      next(error);
    }
  },
};
