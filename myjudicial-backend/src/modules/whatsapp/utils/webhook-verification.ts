import crypto from 'crypto';
import { logger } from "../../../shared/utils/logger.js";

/**
 * Verifies WhatsApp webhook signature using HMAC-SHA256
 */
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  if (!signature || !secret) {
    logger.warn('Missing signature or secret for webhook verification');
    return false;
  }

  try {
    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace(/^sha256=/, '');
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(cleanSignature, 'hex')
    );
  } catch (error) {
    logger.error('Webhook signature verification failed', { error });
    return false;
  }
};

/**
 * Verifies WhatsApp webhook verification challenge
 * Used during webhook endpoint setup with Meta
 */
export const verifyWebhookChallenge = (
  mode: string,
  token: string,
  challenge: string,
  verifyToken: string
): string | null => {
  // Check if verification mode and token match
  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('Webhook verification challenge successful');
    return challenge;
  }
  
  logger.warn('Webhook verification challenge failed', { 
    mode, 
    tokenMatch: token === verifyToken 
  });
  return null;
};