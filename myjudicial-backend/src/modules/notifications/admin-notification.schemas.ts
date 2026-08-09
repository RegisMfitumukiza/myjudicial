import { z } from "zod";
import { NotificationEvent, NotificationChannel } from "../../generated/prisma/client.js";

/**
 * Query params for listing notification logs
 */
export const listNotificationLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  event: z.nativeEnum(NotificationEvent).optional(),
  channel: z.nativeEnum(NotificationChannel).optional(),
  sent: z.coerce.boolean().optional(),
  search: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z.enum(["createdAt", "sentAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListNotificationLogsQuery = z.infer<typeof listNotificationLogsQuerySchema>;

/**
 * Body for sending broadcast notification
 */
export const sendBroadcastSchema = z.object({
  title: z.string().min(3).max(200),
  message: z.string().min(10).max(1000),
  audience: z.enum(["ALL", "CITIZEN", "EXPERT", "ADMIN"]),
  channels: z.array(z.nativeEnum(NotificationChannel)).min(1),
});

export type SendBroadcastBody = z.infer<typeof sendBroadcastSchema>;

/**
 * Params for getting single notification
 */
export const getNotificationParamsSchema = z.object({
  id: z.string().uuid(),
});

export type GetNotificationParams = z.infer<typeof getNotificationParamsSchema>;
