import { WhatsAppRepository } from "../repositories/whatsapp.repository.js";
import { whatsappProvider } from "./whatsapp-provider.service.js";
import { WhatsAppError, WhatsAppErrorType } from "../utils/whatsapp.errors.js";
import { logger } from "../../../shared/utils/logger.js";

/**
 * Template names - these must match the templates approved by Meta
 */
export const TEMPLATE_NAMES = {
  OTP: 'otp_verification_myjudicial',
  MAGIC_LINK: 'magic_link_myjudicial',
  BOOKING_CONFIRMATION: 'booking_confirmed_myjudicial',
  BOOKING_REMINDER: 'consultation_reminder_myjudicial',
  BOOKING_CANCELLATION: 'booking_cancelled_myjudicial',
  PAYMENT_SUCCESS: 'payment_received_myjudicial',
  ESCROW_RELEASE: 'escrow_released_myjudicial',
  REFUND_NOTIFICATION: 'refund_processed_myjudicial',
  CREDENTIAL_EXPIRY: 'credential_expiry_myjudicial',
  REVIEW_NOTIFICATION: 'review_received_myjudicial',
  WELCOME: 'welcome_myjudicial',
} as const;

export type TemplateName = typeof TEMPLATE_NAMES[keyof typeof TEMPLATE_NAMES];

/**
 * WhatsApp Template Management Service
 * Handles template operations and parameter formatting
 */
export const WhatsAppTemplateService = {
  /**
   * Get template Meta ID by template name
   */
  async getTemplateId(templateName: TemplateName): Promise<string> {
    try {
      // First check our local cache
      const template = await WhatsAppRepository.getTemplate(templateName);
      if (template?.isActive) {
        return template.metaId;
      }

      // If not found or inactive, sync with Meta
      logger.info('Template not found locally, syncing with Meta', { templateName });
      await this.syncTemplateFromMeta(templateName);

      // Try again after sync
      const syncedTemplate = await WhatsAppRepository.getTemplate(templateName);
      if (syncedTemplate?.isActive) {
        return syncedTemplate.metaId;
      }

      throw new WhatsAppError(
        `Template '${templateName}' not found or inactive`,
        WhatsAppErrorType.TEMPLATE_NOT_FOUND
      );
    } catch (error) {
      if (error instanceof WhatsAppError) {
        throw error;
      }
      
      logger.error('Failed to get template ID', { error, templateName });
      throw new WhatsAppError(
        `Failed to get template ID for '${templateName}'`,
        WhatsAppErrorType.TEMPLATE_NOT_FOUND
      );
    }
  },

  /**
   * Format template parameters based on template type
   */
  formatTemplateParams(templateName: TemplateName, params: any): string[] {
    switch (templateName) {
      case TEMPLATE_NAMES.OTP:
        return [params.otpCode];

      case TEMPLATE_NAMES.MAGIC_LINK:
        return [params.magicLink];

      case TEMPLATE_NAMES.BOOKING_CONFIRMATION:
        return [
          params.expertName,
          params.scheduledAt,
          params.serviceName,
          params.bookingId
        ];

      case TEMPLATE_NAMES.BOOKING_REMINDER:
        return [
          params.expertName,
          params.scheduledAt,
          params.joinUrl
        ];

      case TEMPLATE_NAMES.BOOKING_CANCELLATION:
        return [
          params.bookingId,
          params.cancelledBy,
          params.reason,
          params.refunded ? 'Yes' : 'No'
        ];

      case TEMPLATE_NAMES.PAYMENT_SUCCESS:
        return [
          params.amount.toString(),
          params.currency,
          params.bookingId
        ];

      case TEMPLATE_NAMES.ESCROW_RELEASE:
        return [
          params.amount.toString(),
          params.currency,
          params.expertName,
          params.bookingId
        ];

      case TEMPLATE_NAMES.REFUND_NOTIFICATION:
        return [
          params.amount.toString(),
          params.currency,
          params.bookingId,
          params.reason || 'Booking cancelled'
        ];

      case TEMPLATE_NAMES.CREDENTIAL_EXPIRY:
        return [
          params.expertName,
          params.expiryDate,
          params.renewalUrl || `${process.env.FRONTEND_URL}/expert/credentials`
        ];

      case TEMPLATE_NAMES.REVIEW_NOTIFICATION:
        return [
          params.citizenName,
          params.rating.toString(),
          params.comment || 'No comment provided'
        ];

      case TEMPLATE_NAMES.WELCOME:
        return [
          params.firstName,
          params.roleLabel,
          params.loginUrl || `${process.env.FRONTEND_URL}/login`
        ];

      default:
        logger.warn('Unknown template name, returning empty parameters', { templateName });
        return [];
    }
  },

  /**
   * Sync template from Meta WhatsApp Business API
   */
  async syncTemplateFromMeta(templateName: TemplateName): Promise<void> {
    try {
      const metaTemplate = await whatsappProvider.getTemplate(templateName);
      
      if (!metaTemplate) {
        throw new WhatsAppError(
          `Template '${templateName}' not found in Meta`,
          WhatsAppErrorType.TEMPLATE_NOT_FOUND
        );
      }

      // Extract template parameters from Meta template
      const parameters = extractParametersFromMeta(metaTemplate);
      
      // Save to local database
      await WhatsAppRepository.upsertTemplate({
        name: templateName,
        metaId: metaTemplate.id,
        language: metaTemplate.language || 'en',
        parameters,
        bodyText: extractBodyTextFromMeta(metaTemplate),
        isActive: metaTemplate.status === 'APPROVED'
      });

      logger.info('Template synced successfully', { 
        templateName, 
        metaId: metaTemplate.id,
        status: metaTemplate.status 
      });
    } catch (error) {
      logger.error('Failed to sync template from Meta', { error, templateName });
      throw error;
    }
  },

  /**
   * Sync all templates from Meta
   */
  async syncAllTemplates(): Promise<{ synced: number; failed: string[] }> {
    const templateNames = Object.values(TEMPLATE_NAMES);
    let synced = 0;
    const failed: string[] = [];

    for (const templateName of templateNames) {
      try {
        await this.syncTemplateFromMeta(templateName);
        synced++;
      } catch (error) {
        logger.error('Failed to sync template', { error, templateName });
        failed.push(templateName);
      }
    }

    logger.info('Template sync completed', { synced, failed: failed.length });
    return { synced, failed };
  },

  /**
   * Get all local templates with their status
   */
  async getAllTemplates(): Promise<any[]> {
    const templates = await WhatsAppRepository.getAllActiveTemplates();
    return templates.map(t => ({
      name: t.name,
      metaId: t.metaId,
      language: t.language,
      parameters: t.parameters,
      bodyText: t.bodyText,
      isActive: t.isActive,
      lastUpdated: t.updatedAt
    }));
  }
};

/**
/**
 * Extract parameters from Meta template structure
 */
function extractParametersFromMeta(metaTemplate: any): string[] {
  try {
    const components = metaTemplate.components || [];
    const bodyComponent = components.find((c: any) => c.type === 'BODY');
    
    if (!bodyComponent?.example?.body_text?.[0]) {
      return [];
    }

    const exampleText = bodyComponent.example.body_text[0];
    const paramMatches = exampleText.match(/\{\{(\d+)\}\}/g) || [];
    
    return paramMatches.map((match: string, index: number) => `param${index + 1}`);
  } catch (error) {
    logger.error('Failed to extract parameters from Meta template', { error });
    return [];
  }
}

/**
 * Extract body text from Meta template structure
 */
function extractBodyTextFromMeta(metaTemplate: any): string {
  try {
    const components = metaTemplate.components || [];
    const bodyComponent = components.find((c: any) => c.type === 'BODY');
    
    return bodyComponent?.text || `Template: ${metaTemplate.name}`;
  } catch (error) {
    logger.error('Failed to extract body text from Meta template', { error });
    return `Template: ${metaTemplate.name}`;
  }
}