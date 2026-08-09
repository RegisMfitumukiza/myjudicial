import { prisma } from "../../infrastructure/database/prisma.js";
import type { NotificationEvent } from "../../generated/prisma/client.js";

export const NotificationRepository = {
  /**
   * Check whether a user has opted in to in-app notifications.
   * Returns true when no preference record exists (opt-in by default).
   */
  async isInAppEnabled(userId: string): Promise<boolean> {
    const pref = await prisma.notificationPreference.findUnique({ where: { userId } });
    return pref?.inApp !== false; // default true
  },

  /**
   * Write an in-app notification for a user.
   * Respects the user's notification preferences — returns null when the
   * user has disabled in-app notifications.
   */
  create: async (data: {
    userId: string;
    event: NotificationEvent;
    recipient: string;
    subject?: string;
    body?: string;
  }) => {
    // Respect user preference — skip if in-app disabled
    const enabled = await NotificationRepository.isInAppEnabled(data.userId);
    if (!enabled) return null;

    return prisma.notificationLog.create({
      data: {
        userId: data.userId,
        event: data.event,
        channel: "PUSH",
        recipient: data.recipient,
        subject: data.subject,
        body: data.body,
        sent: true,
        sentAt: new Date(),
      },
    });
  },

  findByUserId: async (filters: { userId: string; page: number; limit: number; unreadOnly?: boolean }) => {
    const skip = (filters.page - 1) * filters.limit;
    const where = {
      userId: filters.userId,
      ...(filters.unreadOnly ? { readAt: null } : {}),
    };

    const [notifications, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notificationLog.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    };
  },

  countUnread: async (userId: string) => {
    return prisma.notificationLog.count({ where: { userId, readAt: null } });
  },

  findById: async (id: string) => {
    return prisma.notificationLog.findUnique({ where: { id } });
  },

  markAsRead: async (id: string) => {
    return prisma.notificationLog.update({
      where: { id },
      data: { readAt: new Date() },
    });
  },

  markAllAsRead: async (userId: string) => {
    return prisma.notificationLog.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  },
};
