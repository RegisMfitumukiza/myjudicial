import { Request, Response } from "express";
import { SupabaseSyncService } from "../../infrastructure/supabase/sync.service.js";
import { logger } from "../../shared/utils/logger.js";
import { createHmac } from "crypto";

/**
 * Supabase Auth Webhook Controller
 * 
 * Handles webhook events from Supabase Auth to keep PostgreSQL in sync.
 * Events: user.created, user.updated, user.deleted
 */

/**
 * Verify webhook signature to ensure it's from Supabase
 */
const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
};

export const SupabaseWebhookController = {
  /**
   * Handle Supabase Auth webhook events
   * POST /auth/webhook/supabase
   */
  handleWebhook: async (req: Request, res: Response) => {
    try {
      const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        logger.error("SUPABASE_WEBHOOK_SECRET not configured");
        return res.status(500).json({ error: "Webhook not configured" });
      }

      // Get raw body for signature verification
      const rawBody = req.body as Buffer;
      const bodyText = rawBody.toString('utf8');

      // Verify webhook signature
      const signature = req.headers['x-webhook-signature'] as string;
      
      if (!signature || !verifyWebhookSignature(bodyText, signature, webhookSecret)) {
        logger.warn("Invalid webhook signature from Supabase", { 
          hasSignature: !!signature,
          bodyPreview: bodyText.substring(0, 100) 
        });
        return res.status(401).json({ error: "Invalid signature" });
      }

      // Parse the JSON body
      const webhookData = JSON.parse(bodyText);
      const { type, record, old_record } = webhookData;

      logger.info("Received Supabase Auth webhook", { 
        type, 
        userId: record?.id || old_record?.id 
      });

      switch (type) {
        case 'INSERT': // user.created
          if (record?.email) {
            await SupabaseSyncService.syncFromSupabaseAuth(
              record.id,
              record.email,
              record.raw_user_meta_data || record.user_metadata
            );
          }
          break;

        case 'UPDATE': // user.updated  
          if (record?.email) {
            await SupabaseSyncService.syncFromSupabaseAuth(
              record.id,
              record.email,
              record.raw_user_meta_data || record.user_metadata
            );
          }
          break;

        case 'DELETE': // user.deleted
          if (old_record?.id) {
            await SupabaseSyncService.syncDeleteFromSupabaseAuth(old_record.id);
          }
          break;

        default:
          logger.info("Unhandled webhook event type", { type });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error("Supabase webhook handler failed", { 
        error: error instanceof Error ? error.message : String(error),
        headers: req.headers 
      });
      res.status(500).json({ error: "Webhook processing failed" });
    }
  },

  /**
   * Trigger manual sync between Supabase Auth and PostgreSQL
   * POST /auth/webhook/sync/full
   * Admin only endpoint for maintenance/recovery
   */
  triggerFullSync: async (req: Request, res: Response) => {
    try {
      logger.info("Manual full sync triggered", { adminId: req.user?.id });
      
      const results = await SupabaseSyncService.performFullSync();
      
      res.status(200).json({
        message: "Full sync completed",
        results
      });
    } catch (error) {
      logger.error("Manual full sync failed", { 
        error: error instanceof Error ? error.message : String(error),
        adminId: req.user?.id 
      });
      res.status(500).json({ error: "Full sync failed" });
    }
  },
};