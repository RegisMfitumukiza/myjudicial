import { Request, Response, NextFunction } from "express";
import { NotificationService } from "./notification.service.js";
import type { ListNotificationsQuery } from "./notification.schemas.js";

export const NotificationController = {
  /**
   * GET /api/v1/notifications
   */
  listMyNotifications: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const query = (req.validatedQuery ?? req.query) as unknown as ListNotificationsQuery;

      const result = await NotificationService.listMyNotifications({
        userId,
        page: query.page,
        limit: query.limit,
        unreadOnly: query.unreadOnly,
      });

      res.status(200).json({
        success: true,
        data: result.notifications,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/notifications/unread-count
   */
  getUnreadCount: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await NotificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  markAsRead: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const notification = await NotificationService.markAsRead(id, userId);

      res.status(200).json({
        success: true,
        data: notification,
        message: "Notification marked as read",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/notifications/read-all
   */
  markAllAsRead: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await NotificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        data: result,
        message: "All notifications marked as read",
      });
    } catch (error) {
      next(error);
    }
  },
};
