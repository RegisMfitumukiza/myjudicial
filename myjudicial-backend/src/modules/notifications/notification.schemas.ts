import { z } from "zod";

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.coerce.boolean().optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsSchema>;

export const notificationParamsSchema = z.object({
  id: z.string().uuid(),
});

export type NotificationParams = z.infer<typeof notificationParamsSchema>;
