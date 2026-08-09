import { Request, Response, NextFunction } from 'express';
import { webhookVerificationSchema, webhookEventSchema } from '../schemas/whatsapp.schemas.js';
import { WhatsAppRepository } from '../repositories/whatsapp.repository.js';
import { verifyWebhookChallenge, verifyWebhookSignature } from '../utils/webhook-verification.js';
import { logger } from '../../../shared/utils/logger.js';
import { ValidationError } from '../../../shared/errors/index.js';

/**
 * WhatsApp Webhook Controller
 * Handles Meta webhook verification and incoming webhook events
 */
export const WhatsAppWebhookController = {
  /**
   * GET /whatsapp/webhook
   * Webhook verification endpoint for Meta
   */
  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validated = webhookVerificationSchema.parse(req.query);
      
      const mode = validated['hub.mode'];
      const token = validated['hub.verify_token'];
      const challenge = validated['hub.challenge'];
      
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
      
      if (!verifyToken) {
        logger.error('WHATSAPP_VERIFY_TOKEN not configured');
        res.status(500).send('Server configuration error');
        return;
      }

      // Verify the webhook
      const challengeResponse = verifyWebhookChallenge(mode, token, challenge, verifyToken);
      
      if (challengeResponse) {
        logger.info('Webhook verification successful');
        res.status(200).send(challengeResponse);
        return;
      }
      
      logger.warn('Webhook verification failed', { mode, tokenMatch: token === verifyToken });
      res.status(403).send('Verification failed');
      
    } catch (error) {
      logger.error('Webhook verification error', { error });
      next(new ValidationError('Invalid webhook verification parameters'));
    }
  },

  /**
   * POST /whatsapp/webhook
   * Receives webhook events from Meta
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Verify webhook signature (if signature verification is enabled)
      const signature = req.headers['x-hub-signature-256'] as string;
      
      if (signature && process.env.WHATSAPP_WEBHOOK_SECRET) {
        const payload = JSON.stringify(req.body);
        const isValid = verifyWebhookSignature(
          payload, 
          signature, 
          process.env.WHATSAPP_WEBHOOK_SECRET
        );
        
        if (!isValid) {
          logger.warn('Invalid webhook signature', { 
            signature: signature.substring(0, 20) + '...' 
          });
          res.status(403).send('Invalid signature');
          return;
        }
      }

      // Validate webhook payload
      const event = webhookEventSchema.parse(req.body);
      
      // WhatsApp requires 200 OK response immediately
      res.status(200).send('EVENT_RECEIVED');

      // Process webhook asynchronously
      setImmediate(async () => {
        try {
          await WhatsAppWebhookController.processWebhookEvent(event);
        } catch (error) {
          logger.error('Failed to process webhook event', { error, event });
        }
      });
      
    } catch (error) {
      logger.error('Webhook handling error', { error, body: req.body });
      
      // Still return 200 OK to Meta to avoid retries for invalid payloads
      res.status(200).send('EVENT_RECEIVED');
    }
  },

  /**
   * Process webhook event
   * Updates delivery status and handles incoming messages
   */
  async processWebhookEvent(event: any): Promise<void> {
    try {
      logger.debug('Processing webhook event', { 
        object: event.object,
        entryCount: event.entry?.length 
      });

      for (const entry of event.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Handle message status updates
          if (value.statuses && value.statuses.length > 0) {
            await this.handleStatusUpdates(value.statuses);
          }

          // Handle incoming messages (for future two-way communication)
          if (value.messages && value.messages.length > 0) {
            await this.handleIncomingMessages(value.messages);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to process webhook event', { error, event });
      throw error;
    }
  },

  /**
   * Handle message status updates
   */
  async handleStatusUpdates(statuses: any[]): Promise<void> {
    for (const status of statuses) {
      try {
        const { id: messageId, status: messageStatus, recipient_id, errors } = status;

        logger.info('Message status update received', {
          messageId,
          status: messageStatus,
          recipient: recipient_id
        });

        // Update delivery status in database
        await WhatsAppRepository.updateDeliveryStatus(messageId, messageStatus);

        // Handle errors
        if (messageStatus === 'failed' && errors && errors.length > 0) {
          for (const error of errors) {
            logger.error('WhatsApp message delivery failed', {
              messageId,
              errorCode: error.code,
              errorTitle: error.title,
              errorMessage: error.message,
              recipient: recipient_id
            });
          }
        }

        // Log success cases
        if (messageStatus === 'delivered') {
          logger.info('WhatsApp message delivered successfully', {
            messageId,
            recipient: recipient_id
          });
        } else if (messageStatus === 'read') {
          logger.info('WhatsApp message read by recipient', {
            messageId,
            recipient: recipient_id
          });
        }

      } catch (error) {
        logger.error('Failed to handle status update', { error, status });
      }
    }
  },

  /**
   * Handle incoming messages
   * For future two-way communication features
   */
  async handleIncomingMessages(messages: any[]): Promise<void> {
    for (const message of messages) {
      try {
        const { from, id: messageId, type, text, timestamp } = message;

        logger.info('Incoming WhatsApp message received', {
          from,
          messageId,
          type,
          timestamp
        });

        // For now, just log incoming messages
        // Future: Handle customer support, interactive responses, etc.
        if (text?.body) {
          logger.debug('Message content', {
            from,
            body: text.body.substring(0, 100) // Log first 100 chars
          });
        }

        // TODO: Implement message handling logic
        // - Store in database
        // - Route to customer support
        // - Auto-respond to common queries
        // - Trigger AI triage for legal queries

      } catch (error) {
        logger.error('Failed to handle incoming message', { error, message });
      }
    }
  }
};