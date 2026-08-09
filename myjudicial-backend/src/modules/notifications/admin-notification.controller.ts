import type { Request, Response, NextFunction } from "express";
import { AdminNotificationService } from "./admin-notification.service.js";
import {
  listNotificationLogsQuerySchema,
  sendBroadcastSchema,
  getNotificationParamsSchema,
} from "./admin-notification.schemas.js";

export const AdminNotificationController = {
  /**
   * GET /api/v1/admin/notifications/stats
   * Get notification statistics
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminNotificationService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/notifications/logs
   * List notification logs with filters
   */
  async listLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listNotificationLogsQuerySchema.parse(req.query);

      const result = await AdminNotificationService.list({
        page: query.page,
        limit: query.limit,
        filters: {
          event: query.event,
          channel: query.channel,
          sent: query.sent,
          search: query.search,
          fromDate: query.fromDate,
          toDate: query.toDate,
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
   * GET /api/v1/admin/notifications/logs/:id
   * Get single notification log by ID
   */
  async getLogById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getNotificationParamsSchema.parse(req.params);
      const log = await AdminNotificationService.getById(id);
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/admin/notifications/broadcast
   * Send broadcast notification
   */
  async sendBroadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const body = sendBroadcastSchema.parse(req.body);
      const adminId = (req as any).user?.id;

      const result = await AdminNotificationService.sendBroadcast({
        ...body,
        adminId,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
