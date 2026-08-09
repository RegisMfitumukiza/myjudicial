import { WhatsAppQueueService } from "./whatsapp-queue.service.js";
import { TEMPLATE_NAMES, TemplateName } from "./whatsapp-template.service.js";
import { validateAndFormatPhone } from "../utils/phone.utils.js";
import { logger } from "../../../shared/utils/logger.js";
import type { 
  BookingDetails, 
  PaymentDetails, 
  EscrowDetails, 
  CancellationDetails 
} from "../types/whatsapp.types.js";
import type { NotificationEvent } from "../../../generated/prisma/client.js";

/**
 * Core WhatsApp Service
 * High-level interface for sending different types of WhatsApp notifications
 */
export const WhatsAppService = {
  /**
   * Send OTP verification message
   */
  async sendOtpMessage(params: {
    userId?: string;
    phone: string;
    otpCode: string;
  }): Promise<void> {
    try {
      await WhatsAppQueueService.queueTemplateMessage({
        userId: params.userId,
        recipient: params.phone,
        templateName: TEMPLATE_NAMES.OTP,
        templateParams: { otpCode: params.otpCode },
        priority: 10, // High priority for auth
        event: 'OTP_SENT'
      });

      logger.info('OTP WhatsApp message queued', {
        userId: params.userId,
        phone: params.phone
      });
    } catch (error) {
      logger.error('Failed to send OTP WhatsApp message', { error, params });
      // Don't throw - WhatsApp failures shouldn't block auth flow
    }
  },

  /**
   * Send magic link confirmation message
   */
  async sendMagicLinkMessage(params: {
    userId?: string;
    phone: string;
    magicLink: string;
  }): Promise<void> {
    try {
      await WhatsAppQueueService.queueTemplateMessage({
        userId: params.userId,
        recipient: params.phone,
        templateName: TEMPLATE_NAMES.MAGIC_LINK,
        templateParams: { magicLink: params.magicLink },
        priority: 10, // High priority for auth
        event: 'MAGIC_LINK_SENT'
      });

      logger.info('Magic link WhatsApp message queued', {
        userId: params.userId,
        phone: params.phone
      });
    } catch (error) {
      logger.error('Failed to send magic link WhatsApp message', { error, params });
      // Don't throw - WhatsApp failures shouldn't block auth flow
    }
  },

  /**
   * Send welcome message after registration
   */
  async sendWelcomeMessage(params: {
    userId: string;
    phone: string;
    firstName: string;
    role: string;
  }): Promise<void> {
    try {
      const roleLabel = params.role === 'EXPERT' ? 'legal expert' : 'client';
      const loginUrl = `${process.env.FRONTEND_URL}/login`;

      await WhatsAppQueueService.queueTemplateMessage({
        userId: params.userId,
        recipient: params.phone,
        templateName: TEMPLATE_NAMES.WELCOME,
        templateParams: {
          firstName: params.firstName,
          roleLabel,
          loginUrl
        },
        priority: 5, // Medium priority
        event: 'WELCOME'
      });

      logger.info('Welcome WhatsApp message queued', {
        userId: params.userId,
        phone: params.phone,
        role: params.role
      });
    } catch (error) {
      logger.error('Failed to send welcome WhatsApp message', { error, params });
    }
  },

  /**
   * Send booking confirmation message
   */
  async sendBookingConfirmation(params: {
    userId: string;
    phone: string;
    bookingDetails: BookingDetails;
  }): Promise<void> {
    try {
      await WhatsAppQueueService.queueTemplateMessage({
        userId: params.userId,
        recipient: params.phone,
        templateName: TEMPLATE_NAMES.BOOKING_CONFIRMATION,
        templateParams: params.bookingDetails,
        priority: 8, // High priority for bookings
        event: 'BOOKING_CONFIRMED'
      });

      logger.info('Booking confirmation WhatsApp message queued', {
        userId: params.userId,
        phone: params.phone,
        bookingId: params.bookingDetails.bookingId
      });
    } catch (error) {
      logger.error('Failed to send booking confirmation WhatsApp message', { error, params });
    }
  },

  /**
   * Send booking reminder message
   */
  async sendBookingReminder(params: {
    userId: string;
    phone: string;
    bookingDetails: BookingDetails;
  }): Promise<void> {
    try {
      await WhatsAppQueueService.queueTemplateMessage({
        userId: params.userId,
        recipient: params.phone,
        templateName: TEMPLATE_NAMES.BOOKING_REMINDER,
        templateParams: params.bookingDetails,
        priority: 9, // Very high priority for reminders
        event: 'BOOKING_REMINDER'
      });

      logger.info('Booking reminder WhatsApp message queued', {
        userId: params.userId,
        phone: params.phone,
        bookingId: params.bookingDetails.bookingId
      });
    } catch (error) {
      logger.error('Failed to send booking reminder WhatsApp message', { error, params });
    }
  },

  /**
   * Send booking cancellation message
   */
  async sendBookingCancellation(params: {
    userId: string;
    phone: string;
    cancellationDetails: CancellationDetails;
  }): Promise<void> {
    try {
      await WhatsAppQueueService.queueTemplateMessage({
        userId: params.userId,
        recipient: params.phone,
        templateName: TEMPLATE_NAMES.BOOKING_CANCELLATION,
        templateParams: params.cancellationDetails,
        priority: 8, // High priority for cancellations
        event: 'BOOKING_CANCELLED'
      });

      logger.info('Booking cancellation WhatsApp message queued', {
        userId: params.userId,
        phone: params.phone,
        bookingId: params.cancellationDetails.bookingId
      });
    } catch (error) {
      logger.error('Failed to send booking cancellation WhatsApp message', { error, params });
    }
  },

  /**
   * Send payment success notification
   */
  async sendPaymentSuccess(params: {
    userId: string;
    phone: string;
    paymentDetails: PaymentDetails;
  }): Promise<void> {
    try {
      await WhatsAppQueueService.queueTemplateMessage({
        userId: params.userId,
        recipient: params.phone,
        templateName: TEMPLATE_NAMES.PAYMENT_SUCCESS,
        templateParams: params.paymentDetails,
        priority: 7, // High priority for payments
        event: 'PAYMENT_SUCCESS'
      });

      logger.info('Payment success WhatsApp message queued', {
        userId: params.userId,
        phone: params.phone,
        bookingId: params.paymentDetails.bookingId
      });
    } catch (error) {
      logger.error('Failed to send payment success WhatsApp message', { error, params });
    }
  },

  /**
   * Send escrow release notification
   */
  async sendEscrowRelease(params: {
    userId: string;
    phone: string;
    escrowDetails: EscrowDetails;
  }): Promise<void> {
    try {
      await WhatsAppQueueService.queueTemplateMessage({
        userId: params.userId,
        recipient: params.phone,
        templateName: TEMPLATE_NAMES.ESCROW_RELEASE,
        templateParams: params.escrowDetails,
        priority: 7, // High priority for payments
        event: 'ESCROW_RELEASED'
      });

      logger.info('Escrow release WhatsApp message queued', {
        userId: params.userId,
        phone: params.phone,
        bookingId: params.escrowDetails.bookingId
      });
    } catch (error) {
      logger.error('Failed to send escrow release WhatsApp message', { error, params });
    }
  },

  /**
   * Send refund notification
   */
  async sendRefundNotification(params: {
    userId: string;
    phone: string;
    refundDetails: {
      bookingId: string;
      amount: number;
      currency: string;
      reason?: string;
    };
  }): Promise<void> {
    try {
      await WhatsAppQueueService.queueTemplateMessage({
        userId: params.userId,
        recipient: params.phone,
        templateName: TEMPLATE_NAMES.REFUND_NOTIFICATION,
        templateParams: params.refundDetails,
        priority: 7, // High priority for refunds
        event: 'PAYMENT_SUCCESS' // Reusing existing event for refunds
      });

      logger.info('Refund notification WhatsApp message queued', {
        userId: params.userId,
        phone: params.phone,
        bookingId: params.refundDetails.bookingId
      });
    } catch (error) {
      logger.error('Failed to send refund notification WhatsApp message', { error, params });
    }
  },

  /**
   * Send credential expiry warning to expert
   */
  async sendCredentialExpiryWarning(params: {
    expertId: string;
    phone: string;
    expertName: string;
    expiryDate: string;
  }): Promise<void> {
    try {
      const renewalUrl = `${process.env.FRONTEND_URL}/expert/credentials`;

      await WhatsAppQueueService.queueTemplateMessage({
        userId: params.expertId,
        recipient: params.phone,
        templateName: TEMPLATE_NAMES.CREDENTIAL_EXPIRY,
        templateParams: {
          expertName: params.expertName,
          expiryDate: params.expiryDate,
          renewalUrl
        },
        priority: 8, // High priority for compliance
        event: 'CREDENTIAL_EXPIRY_WARNING'
      });

      logger.info('Credential expiry warning WhatsApp message queued', {
        expertId: params.expertId,
        phone: params.phone,
        expiryDate: params.expiryDate
      });
    } catch (error) {
      logger.error('Failed to send credential expiry warning WhatsApp message', { error, params });
    }
  },

  /**
   * Send review notification to expert
   */
  async sendReviewNotification(params: {
    expertId: string;
    phone: string;
    reviewDetails: {
      expertName: string;
      citizenName: string;
      rating: number;
      comment?: string;
    };
  }): Promise<void> {
    try {
      await WhatsAppQueueService.queueTemplateMessage({
        userId: params.expertId,
        recipient: params.phone,
        templateName: TEMPLATE_NAMES.REVIEW_NOTIFICATION,
        templateParams: params.reviewDetails,
        priority: 5, // Medium priority for reviews
        event: 'REVIEW_RECEIVED'
      });

      logger.info('Review notification WhatsApp message queued', {
        expertId: params.expertId,
        phone: params.phone,
        rating: params.reviewDetails.rating
      });
    } catch (error) {
      logger.error('Failed to send review notification WhatsApp message', { error, params });
    }
  },

  /**
   * Send test message (admin only)
   */
  async sendTestMessage(params: {
    phone: string;
    message: string;
  }): Promise<void> {
    try {
      // Validate phone number first
      const formattedPhone = validateAndFormatPhone(params.phone);

      await WhatsAppQueueService.queueTextMessage({
        recipient: formattedPhone,
        message: params.message,
        priority: 1, // Low priority for test messages
        event: 'OTP_SENT' // Using existing event for test messages
      });

      logger.info('Test WhatsApp message queued', {
        phone: formattedPhone,
        messageLength: params.message.length
      });
    } catch (error) {
      logger.error('Failed to send test WhatsApp message', { error, params });
      throw error; // Throw for admin endpoints to show error
    }
  },

  /**
   * Get service status and statistics
   */
  async getServiceStatus(): Promise<{
    isAvailable: boolean;
    queueStats: any;
    lastProcessed?: Date;
    configStatus: {
      hasAccessToken: boolean;
      hasPhoneNumberId: boolean;
      hasBusinessAccountId: boolean;
      hasVerifyToken: boolean;
    };
  }> {
    try {
      const queueStats = await WhatsAppQueueService.getQueueStats();
      
      return {
        isAvailable: true,
        queueStats,
        configStatus: {
          hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
          hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
          hasBusinessAccountId: !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
          hasVerifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
        }
      };
    } catch (error) {
      logger.error('Failed to get WhatsApp service status', { error });
      return {
        isAvailable: false,
        queueStats: { queued: 0, processing: 0, failed: 0, totalToday: 0 },
        configStatus: {
          hasAccessToken: false,
          hasPhoneNumberId: false,
          hasBusinessAccountId: false,
          hasVerifyToken: false,
        }
      };
    }
  }
};