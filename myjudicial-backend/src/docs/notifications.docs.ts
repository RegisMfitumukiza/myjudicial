/**
 * Notifications module OpenAPI documentation.
 * Uses zod-to-openapi to generate schemas from Zod definitions.
 */
import { z } from "zod";
import { registry } from "./registry.js";

const uuidField = z.string().uuid().describe("UUID identifier");
const isoDateTimeField = z.string().datetime().describe("ISO 8601 datetime string");

const NotificationEventSchema = z
  .enum([
    "OTP_SENT",
    "BOOKING_CONFIRMED",
    "BOOKING_CANCELLED",
    "BOOKING_REMINDER",
    "PAYMENT_SUCCESS",
    "ESCROW_RELEASED",
    "CREDENTIAL_EXPIRY_WARNING",
    "REVIEW_RECEIVED",
    "WELCOME",
    "MAGIC_LINK_SENT",
    "REFUND_PROCESSED",
  ])
  .openapi("NotificationEvent");

const NotificationResponseSchema = z
  .object({
    id: uuidField,
    userId: uuidField,
    event: NotificationEventSchema,
    subject: z.string().nullable(),
    body: z.string().nullable(),
    isRead: z.boolean(),
    readAt: isoDateTimeField.nullable(),
    createdAt: isoDateTimeField,
  })
  .openapi("NotificationResponse");

const NotificationListResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.array(NotificationResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
    }),
  })
  .openapi("NotificationListResponse");

const ErrorResponseSchema = z
  .object({
    error: z.string(),
    details: z.array(z.string()).optional(),
  })
  .openapi("NotificationErrorResponse");

/**
 * GET /api/v1/notifications
 */
registry.registerPath({
  method: "get",
  path: "/notifications",
  summary: "List notifications for the authenticated user",
  description: "Returns the authenticated user's in-app notification feed, paginated, newest first.",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z
      .object({
        page: z.string().default("1").describe("Page number"),
        limit: z.string().default("20").describe("Items per page"),
        unreadOnly: z.enum(["true", "false"]).optional().describe("When true, only return unread notifications"),
      })
      .openapi("ListNotificationsQuery"),
  },
  responses: {
    200: {
      description: "Notifications retrieved successfully",
      content: { "application/json": { schema: NotificationListResponseSchema } },
    },
    401: {
      description: "Unauthorized - authentication required",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

/**
 * GET /api/v1/notifications/unread-count
 */
registry.registerPath({
  method: "get",
  path: "/notifications/unread-count",
  summary: "Get unread notification count",
  description: "Returns the number of unread notifications for the authenticated user.",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Unread count retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ count: z.number() }),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized - authentication required",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

/**
 * PATCH /api/v1/notifications/read-all
 */
registry.registerPath({
  method: "patch",
  path: "/notifications/read-all",
  summary: "Mark all notifications as read",
  description: "Marks every unread notification belonging to the authenticated user as read.",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "All notifications marked as read",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ updated: z.number() }),
            message: z.string(),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized - authentication required",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

/**
 * PATCH /api/v1/notifications/:id/read
 */
registry.registerPath({
  method: "patch",
  path: "/notifications/{id}/read",
  summary: "Mark a single notification as read",
  description: "Marks one notification as read. Only the owning user can mark their own notification.",
  tags: ["Notifications"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField.describe("The notification ID") }).openapi("MarkNotificationReadParams"),
  },
  responses: {
    200: {
      description: "Notification marked as read",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: NotificationResponseSchema,
            message: z.string(),
          }),
        },
      },
    },
    401: {
      description: "Unauthorized - authentication required",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    403: {
      description: "Forbidden - not the notification owner",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    404: {
      description: "Notification not found",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});
