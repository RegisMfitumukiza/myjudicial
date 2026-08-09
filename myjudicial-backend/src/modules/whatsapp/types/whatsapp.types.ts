/**
 * WhatsApp Cloud API Types and Interfaces
 */

export enum WhatsAppErrorType {
  RATE_LIMIT = 'rate_limit',
  INVALID_PHONE = 'invalid_phone',
  TEMPLATE_NOT_FOUND = 'template_not_found',
  NETWORK_ERROR = 'network_error',
  AUTH_ERROR = 'auth_error',
  USER_BLOCKED_BOT = 'user_blocked',
  WEBHOOK_VERIFICATION_FAILED = 'webhook_verification_failed',
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  metaId: string;
  language: string;
  parameters: string[];
  bodyText: string;
  isActive: boolean;
}

export interface MessageParams {
  to: string;
  templateName?: string;
  templateParams?: any[];
  text?: string;
}

export interface WhatsAppMessage {
  id: string;
  to: string;
  type: 'template' | 'text';
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  whatsappId?: string;
  errorMessage?: string;
  createdAt: Date;
  sentAt?: Date;
}

export interface WebhookEvent {
  object: string;
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    messages?: IncomingMessage[];
    statuses?: MessageStatus[];
  };
  field: string;
}

export interface IncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: string;
}

export interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

export interface DeliveryStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  deliveryRate: number;
  readRate: number;
  failureReasons: Record<string, number>;
}

export interface TemplateUsage {
  templateName: string;
  messagesSent: number;
  deliveryRate: number;
}

export interface ResponseTimeMetrics {
  averageQueueTime: number;
  averageDeliveryTime: number;
  p95QueueTime: number;
  p95DeliveryTime: number;
}

// Notification event types for WhatsApp
export interface BookingDetails {
  bookingId: string;
  expertName: string;
  clientName: string;
  serviceName: string;
  scheduledAt: string;
  joinUrl?: string;
}

export interface PaymentDetails {
  bookingId: string;
  amount: number;
  currency: string;
  expertName: string;
}

export interface EscrowDetails {
  bookingId: string;
  amount: number;
  currency: string;
  expertName: string;
  receiptUrl?: string;
}

export interface CancellationDetails {
  bookingId: string;
  cancelledBy: string;
  reason: string;
  refunded: boolean;
  refundAmount?: number;
}