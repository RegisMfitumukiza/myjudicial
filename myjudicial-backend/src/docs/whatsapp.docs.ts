import { z, registry } from "./registry.js";

/**
 * WhatsApp API Documentation
 */

// ============================================================================
// WEBHOOK ENDPOINTS (Public)
// ============================================================================

registry.registerPath({
  method: "get",
  path: "/whatsapp/webhook",
  tags: ["WhatsApp — Webhooks"],
  summary: "Webhook verification endpoint",
  description:
    "Meta WhatsApp calls this endpoint to verify the webhook URL during setup. Returns the challenge parameter if verification succeeds.",
  parameters: [
    { name: "hub.mode", in: "query", required: true, schema: { type: "string", example: "subscribe" } },
    { name: "hub.challenge", in: "query", required: true, schema: { type: "string", example: "1234567890" } },
    { name: "hub.verify_token", in: "query", required: true, schema: { type: "string", example: "your_verify_token" } },
  ],
  responses: {
    200: {
      description: "Verification successful",
      content: {
        "text/plain": {
          schema: {
            type: "string",
            example: "1234567890",
          },
        },
      },
    },
    403: {
      description: "Verification failed",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/whatsapp/webhook",
  tags: ["WhatsApp — Webhooks"],
  summary: "Webhook event receiver",
  description:
    "Receives webhook events from Meta WhatsApp including message status updates (sent, delivered, read, failed) and incoming messages.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              object: {
                type: "string",
                example: "whatsapp_business_account",
              },
              entry: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                    },
                    changes: {
                      type: "array",
                      items: {
                        type: "object",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Event received and queued for processing",
      content: {
        "text/plain": {
          schema: {
            type: "string",
            example: "EVENT_RECEIVED",
          },
        },
      },
    },
  },
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

registry.registerPath({
  method: "post",
  path: "/admin/whatsapp/test",
  tags: ["WhatsApp — Admin"],
  summary: "Send test message",
  description: "Send a test WhatsApp message to verify configuration and connectivity.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              phone: {
                type: "string",
                description: "Phone number in international format",
                example: "+250788123456",
              },
              message: {
                type: "string",
                description: "Test message content",
                example: "Hello from MyJudicial! This is a test message.",
              },
            },
            required: ["phone", "message"],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Test message queued successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true,
              },
              message: {
                type: "string",
                example: "Test message queued successfully",
              },
            },
          },
        },
      },
    },
    400: {
      description: "Invalid request parameters",
    },
    401: {
      description: "Authentication required",
    },
    403: {
      description: "Admin role required",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/whatsapp/templates",
  tags: ["WhatsApp — Admin"],
  summary: "List WhatsApp templates",
  description: "Get all configured WhatsApp message templates with their status and parameters.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Templates retrieved successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true,
              },
              data: {
                type: "object",
                properties: {
                  templates: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                          example: "otp_verification_myjudicial",
                        },
                        metaId: {
                          type: "string",
                          example: "template_abc123",
                        },
                        language: {
                          type: "string",
                          example: "en",
                        },
                        parameters: {
                          type: "array",
                          items: {
                            type: "string",
                          },
                          example: ["param1"],
                        },
                        bodyText: {
                          type: "string",
                          example: "Your verification code is {{1}}",
                        },
                        isActive: {
                          type: "boolean",
                          example: true,
                        },
                        lastUpdated: {
                          type: "string",
                          format: "date-time",
                        },
                      },
                    },
                  },
                  count: {
                    type: "number",
                    example: 10,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/whatsapp/templates/sync",
  tags: ["WhatsApp — Admin"],
  summary: "Sync templates from Meta",
  description:
    "Synchronize WhatsApp templates from Meta Business API. Can sync all templates or a specific template by name.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              templateName: {
                type: "string",
                description: "Optional: specific template to sync",
                example: "otp_verification_myjudicial",
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Templates synced successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true,
              },
              message: {
                type: "string",
                example: "Templates synced",
              },
              data: {
                type: "object",
                properties: {
                  synced: {
                    type: "number",
                    example: 8,
                  },
                  failed: {
                    type: "number",
                    example: 0,
                  },
                  failedTemplates: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/whatsapp/stats/delivery",
  tags: ["WhatsApp — Admin"],
  summary: "Get delivery statistics",
  description: "Get WhatsApp message delivery statistics for a specified date range.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      dateFrom: z.string().datetime().optional().describe("Start date (defaults to 30 days ago)"),
      dateTo: z.string().datetime().optional().describe("End date (defaults to now)"),
    }).openapi("WhatsAppDeliveryStatsQuery"),
  },
  responses: {
    200: {
      description: "Statistics retrieved successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true,
              },
              data: {
                type: "object",
                properties: {
                  period: {
                    type: "object",
                    properties: {
                      from: {
                        type: "string",
                        format: "date-time",
                      },
                      to: {
                        type: "string",
                        format: "date-time",
                      },
                    },
                  },
                  stats: {
                    type: "object",
                    properties: {
                      totalSent: {
                        type: "number",
                        example: 1250,
                      },
                      totalDelivered: {
                        type: "number",
                        example: 1230,
                      },
                      totalRead: {
                        type: "number",
                        example: 1100,
                      },
                      totalFailed: {
                        type: "number",
                        example: 20,
                      },
                      deliveryRate: {
                        type: "number",
                        description: "Percentage",
                        example: 98.4,
                      },
                      readRate: {
                        type: "number",
                        description: "Percentage",
                        example: 89.43,
                      },
                      failureReasons: {
                        type: "object",
                        additionalProperties: {
                          type: "number",
                        },
                        example: {
                          "Invalid phone number": 10,
                          "Rate limit exceeded": 5,
                          "User blocked bot": 5,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/whatsapp/stats/templates",
  tags: ["WhatsApp — Admin"],
  summary: "Get template usage statistics",
  description: "Get usage statistics for each WhatsApp template.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      dateFrom: z.string().datetime().optional().describe("Start date"),
      dateTo: z.string().datetime().optional().describe("End date"),
    }).openapi("WhatsAppTemplateStatsQuery"),
  },
  responses: {
    200: {
      description: "Template usage retrieved successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true,
              },
              data: {
                type: "object",
                properties: {
                  period: {
                    type: "object",
                  },
                  templates: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        templateName: {
                          type: "string",
                          example: "booking_confirmed_myjudicial",
                        },
                        messagesSent: {
                          type: "number",
                          example: 450,
                        },
                        deliveryRate: {
                          type: "number",
                          example: 98.5,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/whatsapp/queue/stats",
  tags: ["WhatsApp — Admin"],
  summary: "Get queue statistics",
  description: "Get current WhatsApp message queue statistics.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Queue stats retrieved successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true,
              },
              data: {
                type: "object",
                properties: {
                  queued: {
                    type: "number",
                    description: "Messages waiting to be sent",
                    example: 15,
                  },
                  processing: {
                    type: "number",
                    description: "Messages currently being sent",
                    example: 2,
                  },
                  failed: {
                    type: "number",
                    description: "Messages that failed after max retries",
                    example: 3,
                  },
                  totalToday: {
                    type: "number",
                    description: "Total messages queued today",
                    example: 567,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/whatsapp/queue/retry",
  tags: ["WhatsApp — Admin"],
  summary: "Retry failed messages",
  description: "Re-queue failed WhatsApp messages for retry.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of messages to retry",
                minimum: 1,
                maximum: 100,
                default: 50,
                example: 50,
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Messages queued for retry",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true,
              },
              message: {
                type: "string",
                example: "50 messages queued for retry",
              },
              data: {
                type: "object",
                properties: {
                  retriedCount: {
                    type: "number",
                    example: 50,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/whatsapp/queue/cleanup",
  tags: ["WhatsApp — Admin"],
  summary: "Clean up old queue records",
  description: "Remove old processed messages from the queue to free up database space.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              olderThanDays: {
                type: "number",
                description: "Delete messages older than this many days",
                minimum: 1,
                maximum: 365,
                default: 30,
                example: 30,
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Queue cleaned up successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true,
              },
              message: {
                type: "string",
                example: "127 old messages cleaned up",
              },
              data: {
                type: "object",
                properties: {
                  deletedCount: {
                    type: "number",
                    example: 127,
                  },
                  olderThanDays: {
                    type: "number",
                    example: 30,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/whatsapp/status",
  tags: ["WhatsApp — Admin"],
  summary: "Get WhatsApp service status",
  description: "Check WhatsApp service availability and configuration status.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Service status retrieved successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true,
              },
              data: {
                type: "object",
                properties: {
                  isAvailable: {
                    type: "boolean",
                    example: true,
                  },
                  queueStats: {
                    type: "object",
                    properties: {
                      queued: {
                        type: "number",
                        example: 5,
                      },
                      processing: {
                        type: "number",
                        example: 0,
                      },
                      failed: {
                        type: "number",
                        example: 2,
                      },
                      totalToday: {
                        type: "number",
                        example: 123,
                      },
                    },
                  },
                  configStatus: {
                    type: "object",
                    properties: {
                      hasAccessToken: {
                        type: "boolean",
                        example: true,
                      },
                      hasPhoneNumberId: {
                        type: "boolean",
                        example: true,
                      },
                      hasBusinessAccountId: {
                        type: "boolean",
                        example: true,
                      },
                      hasVerifyToken: {
                        type: "boolean",
                        example: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});