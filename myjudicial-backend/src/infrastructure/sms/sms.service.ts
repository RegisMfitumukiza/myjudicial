import { prisma } from "../database/prisma.js";
import { logger } from "../../shared/utils/logger.js";
import type { NotificationEvent } from "../../generated/prisma/client.js";

/**
 * Multi-Provider Rwandan SMS Gateway Service
 *
 * Supports:
 * 1. Pindo (Rwanda native SMS gateway — `https://api.pindo.io/v1/sms/`)
 *    Env: PINDO_API_TOKEN, PINDO_SENDER_ID (default: "MyJudicial")
 * 2. Africa's Talking Rwanda (`https://api.africastalking.com/version1/messaging`)
 *    Env: AT_API_KEY, AT_USERNAME, AT_SENDER_ID
 * 3. Twilio (`https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json`)
 *    Env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 * 4. Custom MNO / Aggregator Webhook (e.g. FDI / MTN Rwanda Bulk SMS)
 *    Env: SMS_WEBHOOK_URL, SMS_WEBHOOK_API_KEY
 *
 * All dispatches are non-blocking: failures are logged and recorded in
 * `notification_logs` (`channel: "SMS"`) without breaking the caller's transaction.
 */

export type SmsLanguage = "en" | "fr" | "rw";
export type SmsProviderType = "pindo" | "africastalking" | "twilio" | "webhook" | "unconfigured";

export interface SendSmsOptions {
  to: string;
  message: string;
  userId?: string;
  event?: NotificationEvent;
}

export interface SmsDispatchResult {
  sent: boolean;
  provider: SmsProviderType;
  recipient: string;
  messageId?: string;
  error?: string;
}

/**
 * Normalizes Rwandan and international phone numbers to E.164 (`+2507...`).
 */
export function normalizeRwandaPhone(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  const cleaned = rawPhone.replace(/[\s\-().]/g, "");
  if (!cleaned) return null;

  // Local Rwandan 10-digit format: 078..., 079..., 072..., 073...
  if (/^07[2389]\d{7}$/.test(cleaned)) {
    return `+250${cleaned.slice(1)}`;
  }

  // 9-digit local format without leading 0: 78..., 79..., 72..., 73...
  if (/^7[2389]\d{7}$/.test(cleaned)) {
    return `+250${cleaned}`;
  }

  // 12-digit format without plus: 2507...
  if (/^2507[2389]\d{7}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Valid E.164 international format
  if (/^\+[1-9]\d{7,14}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

/**
 * Detects which SMS gateway is configured in environment variables.
 */
export function detectSmsProvider(): SmsProviderType {
  const explicit = (process.env.SMS_PROVIDER ?? "").trim().toLowerCase();
  if (explicit === "pindo" && process.env.PINDO_API_TOKEN) return "pindo";
  if (explicit === "africastalking" && process.env.AT_API_KEY && process.env.AT_USERNAME) {
    return "africastalking";
  }
  if (explicit === "twilio" && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return "twilio";
  }
  if (explicit === "webhook" && process.env.SMS_WEBHOOK_URL) return "webhook";

  // Auto-detect based on available credentials
  if (process.env.PINDO_API_TOKEN) return "pindo";
  if (process.env.AT_API_KEY && process.env.AT_USERNAME) return "africastalking";
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return "twilio";
  if (process.env.SMS_WEBHOOK_URL) return "webhook";

  return "unconfigured";
}

async function sendViaPindo(to: string, text: string): Promise<{ messageId?: string }> {
  const token = (process.env.PINDO_API_TOKEN ?? "").trim();
  const sender = (process.env.PINDO_SENDER_ID ?? "Pindo").trim();
  const url = (process.env.PINDO_API_URL ?? "https://api.pindo.io/v1/sms/").trim();

  const dispatchWithSender = async (senderId: string) =>
    fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, text, sender: senderId }),
    });

  let res = await dispatchWithSender(sender);

  // If custom Sender ID (e.g. "MyJudicial") is still pending MNO approval,
  // automatically fall back to Pindo's pre-approved "Pindo" Sender ID.
  if (!res.ok && (res.status === 400 || res.status === 422) && sender.toLowerCase() !== "pindo") {
    logger.warn("Custom Pindo Sender ID rejected or pending approval — retrying with default 'Pindo' sender", {
      attemptedSender: sender,
      status: res.status,
    });
    res = await dispatchWithSender("Pindo");
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Pindo SMS HTTP ${res.status}: ${errBody}`);
  }

  const data = (await res.json().catch(() => ({}))) as { sms_id?: string; id?: string };
  return { messageId: data.sms_id ?? data.id };
}

async function sendViaAfricasTalking(to: string, text: string): Promise<{ messageId?: string }> {
  const apiKey = (process.env.AT_API_KEY ?? "").trim();
  const username = (process.env.AT_USERNAME ?? "").trim();
  const senderId = (process.env.AT_SENDER_ID ?? "").trim();
  const isSandbox = username.toLowerCase() === "sandbox";
  const url = isSandbox
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";

  const params = new URLSearchParams({
    username,
    to,
    message: text,
    ...(senderId ? { from: senderId } : {}),
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      apiKey,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Africa's Talking SMS HTTP ${res.status}: ${errBody}`);
  }

  const data = (await res.json().catch(() => ({}))) as any;
  const recipientEntry = data?.SMSMessageData?.Recipients?.[0];
  return { messageId: recipientEntry?.messageId };
}

async function sendViaTwilio(to: string, text: string): Promise<{ messageId?: string }> {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID ?? "").trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN ?? "").trim();
  const from = (process.env.TWILIO_FROM_NUMBER ?? "MyJudicial").trim();
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: text });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Twilio SMS HTTP ${res.status}: ${errBody}`);
  }

  const data = (await res.json().catch(() => ({}))) as { sid?: string };
  return { messageId: data.sid };
}

async function sendViaWebhook(to: string, text: string): Promise<{ messageId?: string }> {
  const url = (process.env.SMS_WEBHOOK_URL ?? "").trim();
  const apiKey = (process.env.SMS_WEBHOOK_API_KEY ?? "").trim();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ to, message: text, sender: "MyJudicial" }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Webhook SMS HTTP ${res.status}: ${errBody}`);
  }

  const data = (await res.json().catch(() => ({}))) as { id?: string; messageId?: string };
  return { messageId: data.messageId ?? data.id };
}

export const SmsService = {
  /**
   * Returns true if at least one SMS gateway provider is configured in environment variables.
   */
  isConfigured: (): boolean => detectSmsProvider() !== "unconfigured",

  /**
   * Core non-blocking SMS dispatch method.
   */
  sendSms: async (options: SendSmsOptions): Promise<SmsDispatchResult> => {
    const normalizedPhone = normalizeRwandaPhone(options.to);
    const provider = detectSmsProvider();

    if (!normalizedPhone) {
      return {
        sent: false,
        provider,
        recipient: options.to,
        error: "Invalid phone number format",
      };
    }

    if (provider === "unconfigured") {
      logger.debug("SMS skipped — no SMS gateway configured in environment", {
        to: normalizedPhone,
      });
      return {
        sent: false,
        provider: "unconfigured",
        recipient: normalizedPhone,
        error: "SMS provider not configured",
      };
    }

    let sent = false;
    let messageId: string | undefined;
    let errorMessage: string | undefined;

    try {
      let result: { messageId?: string } = {};
      if (provider === "pindo") {
        result = await sendViaPindo(normalizedPhone, options.message);
      } else if (provider === "africastalking") {
        result = await sendViaAfricasTalking(normalizedPhone, options.message);
      } else if (provider === "twilio") {
        result = await sendViaTwilio(normalizedPhone, options.message);
      } else if (provider === "webhook") {
        result = await sendViaWebhook(normalizedPhone, options.message);
      }
      sent = true;
      messageId = result.messageId;
      logger.info("SMS dispatched", {
        provider,
        to: normalizedPhone,
        messageId,
      });
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Failed to dispatch SMS", {
        provider,
        to: normalizedPhone,
        error: errorMessage,
      });
    }

    // Persist audit entry in NotificationLog when userId and event are known
    if (options.userId && options.event && process.env.NODE_ENV !== "test") {
      try {
        await prisma.notificationLog.create({
          data: {
            userId: options.userId,
            event: options.event,
            channel: "SMS",
            recipient: normalizedPhone,
            subject: "MyJudicial SMS",
            body: options.message,
            sent,
            sentAt: sent ? new Date() : null,
            errorMsg: errorMessage ?? null,
          },
        });
      } catch {
        // Non-blocking
      }
    }

    return {
      sent,
      provider,
      recipient: normalizedPhone,
      messageId,
      error: errorMessage,
    };
  },

  /**
   * Sends a localized 6-digit verification OTP code via SMS.
   */
  sendOtpSms: async (
    phone: string,
    otpCode: string,
    lang: SmsLanguage = "en",
    userId?: string
  ): Promise<SmsDispatchResult> => {
    const messages: Record<SmsLanguage, string> = {
      en: `MyJudicial: Your verification code is ${otpCode}. Valid for 10 minutes. Do not share this code with anyone.`,
      fr: `MyJudicial : Votre code de vérification est ${otpCode}. Valable 10 minutes. Ne le partagez avec personne.`,
      rw: `MyJudicial: Kode yawe yo kwemeza ni ${otpCode}. Imara iminota 10. Ntuyihe undi muntu.`,
    };
    return SmsService.sendSms({
      to: phone,
      userId,
      event: "OTP_VERIFICATION" as NotificationEvent,
      message: messages[lang] ?? messages.en,
    });
  },

  /**
   * Sends a localized booking reminder SMS with scheduled timestamp.
   */
  sendBookingReminderSms: async (params: {
    phone: string;
    recipientName: string;
    counterpartName: string;
    scheduledAt: string;
    language?: SmsLanguage;
    userId?: string;
  }): Promise<SmsDispatchResult> => {
    const lang = params.language ?? "en";
    const messages: Record<SmsLanguage, string> = {
      en: `MyJudicial Reminder: Hello ${params.recipientName}, your consultation with ${params.counterpartName} is scheduled for ${params.scheduledAt}.`,
      fr: `Rappel MyJudicial : Bonjour ${params.recipientName}, votre consultation avec ${params.counterpartName} est prévue le ${params.scheduledAt}.`,
      rw: `MyJudicial Kwibutsa: Muraho ${params.recipientName}, inama yawe na ${params.counterpartName} iteganyijwe ku wa ${params.scheduledAt}.`,
    };
    return SmsService.sendSms({
      to: params.phone,
      userId: params.userId,
      event: "BOOKING_REMINDER",
      message: messages[lang] ?? messages.en,
    });
  },

  /**
   * Sends a localized booking confirmation SMS.
   */
  sendBookingConfirmationSms: async (params: {
    phone: string;
    userId?: string;
    expertName: string;
    scheduledDate: string;
    lang?: SmsLanguage;
  }): Promise<SmsDispatchResult> => {
    const lang = params.lang ?? "en";
    const messages: Record<SmsLanguage, string> = {
      en: `MyJudicial: Your legal consultation with ${params.expertName} on ${params.scheduledDate} is confirmed.`,
      fr: `MyJudicial : Votre consultation juridique avec ${params.expertName} le ${params.scheduledDate} est confirmée.`,
      rw: `MyJudicial: Inama yawe y'amategeko na ${params.expertName} ku wa ${params.scheduledDate} yemejwe.`,
    };
    return SmsService.sendSms({
      to: params.phone,
      userId: params.userId,
      event: "BOOKING_CONFIRMED",
      message: messages[lang] ?? messages.en,
    });
  },

  /**
   * Sends a localized consultation reminder SMS.
   */
  sendConsultationReminderSms: async (params: {
    phone: string;
    userId?: string;
    counterpartyName: string;
    minutesUntilStart: number;
    lang?: SmsLanguage;
  }): Promise<SmsDispatchResult> => {
    const lang = params.lang ?? "en";
    const messages: Record<SmsLanguage, string> = {
      en: `MyJudicial Reminder: Your consultation with ${params.counterpartyName} starts in ${params.minutesUntilStart} minutes.`,
      fr: `Rappel MyJudicial : Votre consultation avec ${params.counterpartyName} commence dans ${params.minutesUntilStart} minutes.`,
      rw: `MyJudicial Kwibutsa: Inama yawe na ${params.counterpartyName} iratangira mu minota ${params.minutesUntilStart}.`,
    };
    return SmsService.sendSms({
      to: params.phone,
      userId: params.userId,
      event: "BOOKING_REMINDER",
      message: messages[lang] ?? messages.en,
    });
  },
};
