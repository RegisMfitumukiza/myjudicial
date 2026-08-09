import { z } from 'zod';

/**
 * Phone number validation schema
 */
export const phoneSchema = z.string()
  .min(8, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format');

/**
 * Send test message schema
 */
export const sendTestMessageSchema = z.object({
  phone: phoneSchema,
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(4096, 'Message is too long (max 4096 characters)')
});

export type SendTestMessageInput = z.infer<typeof sendTestMessageSchema>;

/**
 * Webhook verification schema (GET request)
 */
export const webhookVerificationSchema = z.object({
  'hub.mode': z.string(),
  'hub.challenge': z.string(),
  'hub.verify_token': z.string()
});

export type WebhookVerificationInput = z.infer<typeof webhookVerificationSchema>;

/**
 * Webhook event schema (POST request)
 */
export const webhookEventSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.string(),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string()
            }),
            messages: z.array(
              z.object({
                from: z.string(),
                id: z.string(),
                timestamp: z.string(),
                type: z.string(),
                text: z.object({
                  body: z.string()
                }).optional()
              })
            ).optional(),
            statuses: z.array(
              z.object({
                id: z.string(),
                status: z.enum(['sent', 'delivered', 'read', 'failed']),
                timestamp: z.string(),
                recipient_id: z.string(),
                errors: z.array(
                  z.object({
                    code: z.number(),
                    title: z.string(),
                    message: z.string()
                  })
                ).optional()
              })
            ).optional()
          }),
          field: z.string()
        })
      )
    })
  )
});

export type WebhookEventInput = z.infer<typeof webhookEventSchema>;

/**
 * Template sync request schema
 */
export const syncTemplateSchema = z.object({
  templateName: z.string().optional()
});

export type SyncTemplateInput = z.infer<typeof syncTemplateSchema>;

/**
 * Get delivery stats schema
 */
export const getDeliveryStatsSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
});

export type GetDeliveryStatsInput = z.infer<typeof getDeliveryStatsSchema>;

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Queue management schemas
 */
export const retryFailedMessagesSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50)
});

export type RetryFailedMessagesInput = z.infer<typeof retryFailedMessagesSchema>;

export const cleanupQueueSchema = z.object({
  olderThanDays: z.number().int().min(1).max(365).default(30)
});

export type CleanupQueueInput = z.infer<typeof cleanupQueueSchema>;