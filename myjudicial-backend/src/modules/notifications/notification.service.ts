import { NotificationRepository } from "./notification.repository.js";
import { NotFoundError, AuthorizationError } from "../../shared/errors/index.js";
import type { NotificationLog } from "../../generated/prisma/client.js";

function toDto(n: NotificationLog) {
  return {
    id: n.id,
    userId: n.userId,
    event: n.event,
    subject: n.subject,
    body: n.body,
    isRead: n.readAt !== null,
    readAt: n.readAt,
    createdAt: n.createdAt,
  };
}

export const NotificationService = {
  listMyNotifications: async (filters: { userId: string; page: number; limit: number; unreadOnly?: boolean }) => {
    const result = await NotificationRepository.findByUserId(filters);
    return {
      notifications: result.data.map(toDto),
      pagination: result.pagination,
    };
  },

  getUnreadCount: async (userId: string) => {
    const count = await NotificationRepository.countUnread(userId);
    return { count };
  },

  markAsRead: async (id: string, userId: string) => {
    const notification = await NotificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundError("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new AuthorizationError("Cannot mark someone else's notification as read");
    }

    if (notification.readAt) {
      return toDto(notification);
    }

    const updated = await NotificationRepository.markAsRead(id);
    return toDto(updated);
  },

  markAllAsRead: async (userId: string) => {
    const result = await NotificationRepository.markAllAsRead(userId);
    return { updated: result.count };
  },
};
