import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from "../../../shared/utils/logger.js";
import { WhatsAppError, WhatsAppErrorType } from "../utils/whatsapp.errors.js";
import { retryWithBackoff } from "../utils/retry.utils.js";
import { MessageParams } from "../types/whatsapp.types.js";

/**
 * WhatsApp Cloud API Provider Service
 * Handles direct communication with Meta's WhatsApp Business API
 */
export class WhatsAppProviderService {
  private readonly client: AxiosInstance;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly businessAccountId: string;

  constructor() {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (!accessToken || !phoneNumberId || !businessAccountId) {
      logger.warn(
        'WhatsApp provider disabled: missing WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, or WHATSAPP_BUSINESS_ACCOUNT_ID. WhatsApp notifications will not be sent.'
      );

      this.accessToken = '';
      this.phoneNumberId = '';
      this.businessAccountId = '';

      this.client = axios.create({
        baseURL: 'https://graph.facebook.com/v18.0',
        timeout: 30000,
      });

      this.client.interceptors.request.use(() => {
        throw new WhatsAppError(
          'WhatsApp provider is not configured. Set WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_BUSINESS_ACCOUNT_ID environment variables.',
          WhatsAppErrorType.AUTH_ERROR
        );
      });

      return;
    }

    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.businessAccountId = businessAccountId;

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      timeout: 30000, // 30 second timeout
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('WhatsApp API request', {
          method: config.method,
          url: config.url,
          headers: { ...config.headers, Authorization: '[REDACTED]' }
        });
        return config;
      },
      (error) => {
        logger.error('WhatsApp API request error', { error });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('WhatsApp API response', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error: AxiosError) => {
        const whatsappError = this.handleApiError(error);
        return Promise.reject(whatsappError);
      }
    );
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, text: string): Promise<string> {
    return retryWithBackoff(async () => {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: text
        }
      };

      const response = await this.client.post(`/${this.phoneNumberId}/messages`, payload);
      
      const messageId = response.data?.messages?.[0]?.id;
      if (!messageId) {
        throw new WhatsAppError(
          'No message ID returned from WhatsApp API',
          WhatsAppErrorType.NETWORK_ERROR,
          true
        );
      }

      logger.info('Text message sent successfully', {
        to,
        messageId,
        textLength: text.length
      });

      return messageId;
    });
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateParams: any[] = [],
    languageCode: string = 'en'
  ): Promise<string> {
    return retryWithBackoff(async () => {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: templateParams.length > 0 ? [
            {
              type: 'body',
              parameters: templateParams.map(param => ({
                type: 'text',
                text: String(param)
              }))
            }
          ] : []
        }
      };

      const response = await this.client.post(`/${this.phoneNumberId}/messages`, payload);
      
      const messageId = response.data?.messages?.[0]?.id;
      if (!messageId) {
        throw new WhatsAppError(
          'No message ID returned from WhatsApp API',
          WhatsAppErrorType.NETWORK_ERROR,
          true
        );
      }

      logger.info('Template message sent successfully', {
        to,
        templateName,
        messageId,
        paramsCount: templateParams.length
      });

      return messageId;
    });
  }

  /**
   * Get business profile information
   */
  async getBusinessProfile(): Promise<any> {
    return retryWithBackoff(async () => {
      const response = await this.client.get(`/${this.phoneNumberId}`, {
        params: {
          fields: 'verified_name,display_phone_number,quality_rating'
        }
      });

      return response.data;
    });
  }

  /**
   * Get message template information
   */
  async getTemplate(templateName: string): Promise<any> {
    return retryWithBackoff(async () => {
      const response = await this.client.get(`/${this.businessAccountId}/message_templates`, {
        params: {
          name: templateName
        }
      });

      const templates = response.data?.data || [];
      const template = templates.find((t: any) => t.name === templateName);
      
      if (!template) {
        throw new WhatsAppError(
          `Template '${templateName}' not found`,
          WhatsAppErrorType.TEMPLATE_NOT_FOUND
        );
      }

      return template;
    });
  }

  /**
   * Handle API errors and convert to WhatsAppError
   */
  private handleApiError(error: AxiosError): WhatsAppError {
    if (error.response?.data) {
      const errorData = error.response.data as any;
      
      // WhatsApp API returns errors in error.error_data or error.details
      const whatsappError = errorData?.error || errorData?.error_data || errorData;
      
      if (whatsappError) {
        logger.error('WhatsApp API error', {
          code: whatsappError.code,
          message: whatsappError.message,
          type: whatsappError.type,
          fbtrace_id: whatsappError.fbtrace_id
        });

        return WhatsAppError.fromMetaError(whatsappError);
      }
    }

    // Handle network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return new WhatsAppError(
        `Network error: ${error.message}`,
        WhatsAppErrorType.NETWORK_ERROR,
        true
      );
    }

    // Handle rate limiting (429 status)
    if (error.response?.status === 429) {
      return new WhatsAppError(
        'Rate limit exceeded',
        WhatsAppErrorType.RATE_LIMIT,
        true
      );
    }

    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      return new WhatsAppError(
        'Authentication failed - check access token',
        WhatsAppErrorType.AUTH_ERROR,
        false
      );
    }

    // Generic error
    return new WhatsAppError(
      `API request failed: ${error.message}`,
      WhatsAppErrorType.NETWORK_ERROR,
      true
    );
  }
}

// Create singleton instance
export const whatsappProvider = new WhatsAppProviderService();