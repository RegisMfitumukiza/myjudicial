import { prisma } from "../../infrastructure/database/prisma.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { NotificationEvent, NotificationChannel, Role } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { logger } from "../../shared/utils/logger.js";
import { sendBroadcastEmail } from "../../infrastructure/email/email.service.js";

interface ListFilters {
  event?: NotificationEvent;
  channel?: NotificationChannel;
  sent?: boolean;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
}

interface ListOptions {
  page: number;
  limit: number;
  filters: ListFilters;
  sortBy: "createdAt" | "sentAt";
  sortOrder: "asc" | "desc";
}

interface BroadcastOptions {
  title: string;
  message: string;
  audience: "ALL" | Role;
  channels: NotificationChannel[];
  adminId: string;
}

export const AdminNotificationService = {
  /**
   * Get notification statistics
   */
  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLogs,
      sentToday,
      sentThisWeek,
      successRate,
      byChannel,
      byEvent,
      failedRecent,
    ] = await Promise.all([
      prisma.notificationLog.count(),
      prisma.notificationLog.count({
        where: { sent: true, sentAt: { gte: today } },
      }),
      prisma.notificationLog.count({
        where: { sent: true, sentAt: { gte: thisWeek } },
      }),
      prisma.notificationLog.aggregate({
        _count: { sent: true },
        where: { sent: true },
      }),
      // By channel
      prisma.notificationLog.groupBy({
        by: ["channel"],
        _count: { channel: true },
        orderBy: { _count: { channel: "desc" } },
      }),
      // By event
      prisma.notificationLog.groupBy({
        by: ["event"],
        _count: { event: true },
        orderBy: { _count: { event: "desc" } },
        take: 10,
      }),
      // Recent failures
      prisma.notificationLog.count({
        where: {
          sent: false,
          createdAt: { gte: thisWeek },
        },
      }),
    ]);

    const totalCount = await prisma.notificationLog.count();
    const sentCount = successRate._count.sent;
    const successPercentage = totalCount > 0 ? (sentCount / totalCount) * 100 : 0;

    return {
      totalLogs,
      sentToday,
      sentThisWeek,
      successRate: Math.round(successPercentage),
      failedRecent,
      byChannel: byChannel.map((item) => ({
        channel: item.channel,
        count: item._count.channel,
      })),
      byEvent: byEvent.map((item) => ({
        event: item.event,
        count: item._count.event,
      })),
    };
  },

  /**
   * List notification logs with filters
   */
  async list(options: ListOptions) {
    const { page, limit, filters, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationLogWhereInput = {
      ...(filters.event && { event: filters.event }),
      ...(filters.channel && { channel: filters.channel }),
      ...(filters.sent !== undefined && { sent: filters.sent }),
      ...(filters.fromDate &&
        filters.toDate && {
          createdAt: {
            gte: filters.fromDate,
            lte: filters.toDate,
          },
        }),
      ...(filters.search && {
        OR: [
          { subject: { contains: filters.search, mode: "insensitive" as const } },
          { recipient: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const orderBy: Prisma.NotificationLogOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [logs, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.notificationLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        event: log.event,
        channel: log.channel,
        recipient: log.recipient,
        subject: log.subject,
        body: log.body,
        sent: log.sent,
        sentAt: log.sentAt,
        errorMsg: log.errorMsg,
        deliveryStatus: log.deliveryStatus,
        createdAt: log.createdAt,
        user: log.user,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get notification log by ID
   */
  async getById(logId: string) {
    const log = await prisma.notificationLog.findUnique({
      where: { id: logId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundError("Notification log not found");
    }

    return {
      id: log.id,
      event: log.event,
      channel: log.channel,
      recipient: log.recipient,
      subject: log.subject,
      body: log.body,
      sent: log.sent,
      sentAt: log.sentAt,
      errorMsg: log.errorMsg,
      whatsappId: log.whatsappId,
      templateId: log.templateId,
      templateParams: log.templateParams,
      deliveryStatus: log.deliveryStatus,
      createdAt: log.createdAt,
      user: log.user,
    };
  },

  /**
   * Send broadcast notification — creates in-app records and sends emails
   */
  async sendBroadcast(options: BroadcastOptions) {
    const { title, message, audience, channels, adminId } = options;

    // Get target users
    let userWhere: Prisma.UserWhereInput = {
      status: "ACTIVE",
    };

    if (audience !== "ALL") {
      userWhere.role = audience as Role;
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    const emailChannel = channels.includes(NotificationChannel.EMAIL);

    // Create in-app notification records
    const inAppLogs = users.map((user) => ({
      userId: user.id,
      event: NotificationEvent.WELCOME,
      channel: NotificationChannel.PUSH,
      recipient: user.email,
      subject: title,
      body: message,
      sent: true,
      sentAt: new Date(),
    }));

    if (inAppLogs.length > 0) {
      await prisma.notificationLog.createMany({ data: inAppLogs });
    }

    // Send actual emails (fire-and-forget)
    if (emailChannel) {
      const emailPromises = users.map((user) =>
        sendBroadcastEmail(user.email, user.firstName, title, message)
          .catch((err) => logger.error("Broadcast email failed", { userId: user.id, error: err }))
      );
      // Don't await — fire-and-forget
      Promise.allSettled(emailPromises);
    }

    // Log admin action
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "CREATE",
        resource: "MESSAGE",
        description: `Broadcast notification sent to ${audience}`,
        metadata: {
          title,
          recipients: users.length,
          channels,
        } as any,
      },
    });

    return {
      recipientCount: users.length,
      notificationCount: inAppLogs.length,
      channels,
    };
  },
};
