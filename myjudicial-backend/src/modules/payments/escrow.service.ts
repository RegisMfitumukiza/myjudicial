// src/modules/payments/escrow.service.ts
import { AzamPayService, interpretV2Outcome } from "./azam.service.js";
import { resolveExpertPayoutPhone } from "./payout.helper.js";
import { writeAuditLog } from "../../shared/utils/audit.js";
import { logger } from "../../shared/utils/logger.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { PaymentRepository } from "./payment.repository.js";
import { EscrowLedgerRepository } from "./escrow.repository.js";
import { BookingRepository } from "../bookings/booking.repository.js";
import { LiveKitService } from "../../infrastructure/livekit/livekit.service.js";
import { NotificationRepository } from "../notifications/notification.repository.js";
import { AdminSettingService } from "../settings/admin-setting.service.js";
import { ConversationService } from "../chat/services/conversation.service.js";
import {
  sendBookingConfirmationEmail,
  sendExpertBookingConfirmationEmail,
  sendConversationStartedEmail,
} from "../../infrastructure/email/email.service.js";

export type WebhookCategory = "PAYMENT" | "PAYOUT" | "REFUND";

export interface NormalizedAzamWebhookPayload {
  category: WebhookCategory;
  outcome: "SUCCESS" | "PENDING" | "FAILURE";
  referenceId: string;
  pgReferenceId?: string;
  fspReferenceId?: string | null;
  externalReferenceId?: string | null;
  operator?: string;
  providerStatusCode?: string;
  transactionStatus?: string;
  message?: string;
  amount?: number | string;
  raw: Record<string, any>;
}

/**
 * Shared confirmation side effects, used by BOTH confirmation paths so a
 * confirmed booking always ends up with notifications, confirmation emails
 * and a chat conversation regardless of how it was confirmed:
 *
 * - Payment flow:    EscrowService.lockFunds          (PAYMENT_SUCCESS too)
 * - Booking-first:   EscrowService.confirmBookingForExpert (expert accepted)
 *
 * Fire-and-forget throughout — confirmation must never fail because of a
 * notification/email error.
 */
async function runConfirmationSideEffects(
  bookingId: string,
  opts: { notifyPaymentSuccess: boolean; amount?: number; currency?: string }
): Promise<void> {
  const booking = await BookingRepository.findById(bookingId);
  if (!booking) return;

  // In-app notifications for the citizen
  try {
    if (opts.notifyPaymentSuccess) {
      await NotificationRepository.create({
        userId: booking.citizenId,
        event: "PAYMENT_SUCCESS",
        recipient: booking.citizen.email,
        subject: "Payment confirmed",
        body: `Your payment of ${opts.amount} ${opts.currency || "RWF"} for ${booking.service?.name} was confirmed. Your consultation is booked.`,
      });
    }
    await NotificationRepository.create({
      userId: booking.citizenId,
      event: "BOOKING_CONFIRMED",
      recipient: booking.citizen.email,
      subject: "Booking confirmed",
      body: `Your consultation for ${booking.service?.name} is confirmed.`,
    });
  } catch (notifyError) {
    logger.error("Failed to write booking-confirmed notification", { bookingId, error: notifyError });
  }

  // Fetch the full booking (citizen/expert names, expert user email) once for the
  // confirmation email + conversation side effects below.
  const fullBooking = await BookingRepository.findFullBookingById(bookingId);

  // Send booking-confirmation email to both parties (fire-and-forget)
  const citizenLanguage = (fullBooking?.citizen?.preferredLanguage as "en" | "fr" | "rw") || "en";
  const expertLanguage = (fullBooking?.expert?.user?.preferredLanguage as "en" | "fr" | "rw") || "en";

  if (fullBooking?.citizen && fullBooking.expert) {
    const citizenName = `${fullBooking.citizen.firstName} ${fullBooking.citizen.lastName}`;
    const expertName =
      fullBooking.expert.displayName ?? fullBooking.expert.user?.firstName ?? "Expert";

    // Format the scheduled date once for both emails (human-readable, not raw ISO)
    const scheduledAtFormatted =
      fullBooking.scheduledStart.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }) +
      " at " +
      fullBooking.scheduledStart.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

    sendBookingConfirmationEmail(
      fullBooking.citizen.email,
      {
        recipientName: fullBooking.citizen.firstName,
        expertName,
        clientName: citizenName,
        serviceName: fullBooking.service.name,
        scheduledAt: scheduledAtFormatted,
        bookingId,
      },
      citizenLanguage
    ).catch((e) => logger.error("Failed to send booking confirmation email to citizen", { e }));

    if (fullBooking.expert.user?.email) {
      sendExpertBookingConfirmationEmail(
        fullBooking.expert.user.email,
        {
          expertName,
          clientName: citizenName,
          serviceName: fullBooking.service.name,
          scheduledAt: scheduledAtFormatted,
          bookingId,
        },
        expertLanguage
      ).catch((e) => logger.error("Failed to send booking confirmation email to expert", { e }));
    }

    // In-app notification for the expert on payment confirmed
    if (fullBooking.expert.user?.id) {
      NotificationRepository.create({
        userId: fullBooking.expert.user.id,
        event: "PAYMENT_SUCCESS",
        recipient: fullBooking.expert.user.email ?? "",
        subject: "Payment received — consultation confirmed",
        body: `Payment confirmed for ${citizenName}'s booking. Consultation: ${fullBooking.service.name} on ${scheduledAtFormatted}.`,
      }).catch((e) =>
        logger.error("Failed to write payment-confirmed notification for expert", { e })
      );
    }
  }

  // Create the chat conversation for this booking (fire-and-forget, idempotent)
  ConversationService.createConversation(bookingId, "SYSTEM")
    .then((conversation) => {
      logger.info("Conversation created for booking", {
        bookingId,
        conversationId: conversation.id,
      });

      if (!fullBooking?.citizen || !fullBooking.expert) return;

      const chatLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/chat/${conversation.id}`;
      const expertName = fullBooking.expert.displayName ?? "Expert";

      sendConversationStartedEmail(
        fullBooking.citizen.email,
        {
          recipientName: fullBooking.citizen.firstName,
          expertName,
          bookingId,
          chatLink,
          recipientRole: "CITIZEN",
        },
        citizenLanguage
      ).catch((e) => logger.error("Failed to send conversation started email to citizen", { e }));

      if (fullBooking.expert.user?.email) {
        sendConversationStartedEmail(
          fullBooking.expert.user.email,
          {
            recipientName: expertName,
            expertName: `${fullBooking.citizen.firstName} ${fullBooking.citizen.lastName}`,
            bookingId,
            chatLink,
            recipientRole: "EXPERT",
          },
          expertLanguage
        ).catch((e) => logger.error("Failed to send conversation started email to expert", { e }));
      }
    })
    .catch((error) => {
      logger.error("Failed to create conversation for booking", { bookingId, error });
    });
}

/**
 * Extracts and normalizes fields from any AzamPay webhook payload (v2 nested envelope or flat callback),
 * and determines whether the callback belongs to a Collection (`PAYMENT`), Expert Disbursement (`PAYOUT`),
 * or Citizen Refund (`REFUND`).
 */
export async function normalizeAndClassifyAzamWebhook(
  rawPayload: Record<string, any>
): Promise<NormalizedAzamWebhookPayload> {
  const data =
    rawPayload.data && typeof rawPayload.data === "object" ? rawPayload.data : undefined;

  const referenceId = String(
    data?.referenceId ??
      rawPayload.referenceId ??
      rawPayload.utilityref ??
      rawPayload.externalId ??
      rawPayload.merchantReferenceId ??
      ""
  ).trim();

  const pgReferenceId =
    String(
      data?.pgReferenceId ??
        rawPayload.pgReferenceId ??
        rawPayload.transid ??
        rawPayload.transactionId ??
        rawPayload.reference ??
        ""
    ).trim() || undefined;

  const fspReferenceId =
    (data?.fspReferenceId ?? rawPayload.fspReferenceId ?? null)
      ? String(data?.fspReferenceId ?? rawPayload.fspReferenceId)
      : null;

  const externalReferenceId =
    (data?.externalReferenceId ??
      rawPayload.externalReferenceId ??
      data?.additionalProperties?.bookingId ??
      rawPayload.additionalProperties?.bookingId ??
      null)
      ? String(
          data?.externalReferenceId ??
            rawPayload.externalReferenceId ??
            data?.additionalProperties?.bookingId ??
            rawPayload.additionalProperties?.bookingId
        )
      : null;

  const operator =
    String(
      data?.provider ??
        data?.institution ??
        data?.destination?.institution ??
        rawPayload.operator ??
        rawPayload.provider ??
        ""
    ).trim() || undefined;

  const providerStatusCode =
    String(data?.providerStatusCode ?? rawPayload.providerStatusCode ?? "")
      .trim()
      .toUpperCase() || undefined;

  const transactionStatus =
    String(
      rawPayload.transactionStatus ??
        rawPayload.transactionstatus ??
        data?.transactionStatus ??
        rawPayload.status ??
        ""
    ).trim() || undefined;

  const message =
    String(rawPayload.message ?? data?.message ?? data?.remarks ?? "").trim() || undefined;

  const amount = data?.amount ?? data?.transferDetails?.amount ?? rawPayload.amount;

  const outcome = interpretV2Outcome({
    success: rawPayload.success,
    statusCode: rawPayload.statusCode,
    transactionStatus,
    data: {
      providerStatusCode,
      transactionStatus,
    },
  });

  // Classify callback category:
  // 1. Prefix check on referenceId (fastest, deterministic)
  let category: WebhookCategory = "PAYMENT";
  const upperRef = referenceId.toUpperCase();
  const explicitType = String(
    rawPayload.type ?? rawPayload.event ?? data?.type ?? data?.transferDetails?.type ?? ""
  )
    .trim()
    .toLowerCase();

  if (upperRef.startsWith("PO-")) {
    category = "PAYOUT";
  } else if (upperRef.startsWith("RF-")) {
    category = "REFUND";
  } else if (upperRef.startsWith("BM-")) {
    category = "PAYMENT";
  } else if (explicitType.includes("refund")) {
    category = "REFUND";
  } else if (
    explicitType.includes("payout") ||
    explicitType.includes("transfer") ||
    explicitType.includes("disbursement")
  ) {
    category = "PAYOUT";
  } else if (referenceId) {
    // Fallback DB check if referenceId has a custom prefix
    const matchingPayout = await PaymentRepository.findByPayoutRef(referenceId).catch(() => null);
    if (matchingPayout) {
      category = "PAYOUT";
    }
  }

  return {
    category,
    outcome,
    referenceId,
    pgReferenceId,
    fspReferenceId,
    externalReferenceId,
    operator,
    providerStatusCode,
    transactionStatus,
    message,
    amount,
    raw: rawPayload,
  };
}

export const EscrowService = {
  /**
   * Lock funds after AzamPay confirms payment.
   * Booking:       PENDING → CONFIRMED
   * PaymentStatus: PENDING → PAID
   *
   * Idempotent & concurrency-safe (uses advisory lock + upsert).
   */
  lockFunds: async (
    bookingId: string,
    txRef: string,
    providerTransactionId: string,
    operator?: string
  ) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        expert: { include: { user: { select: { phone: true } } } },
        citizen: { select: { email: true } },
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking ${bookingId} not found`);
    }

    if (booking.paymentStatus === "PAID") {
      logger.warn("Duplicate confirmation received — booking already paid", {
        bookingId,
        txRef,
      });
      return;
    }

    const amount = Number(booking.service.flatFee);
    const feePercent = await AdminSettingService.get("platformFeePercent");
    const commission = feePercent / 100;
    const platformFee = amount * commission;
    const expertPayout = amount * (1 - commission);

    let meetingRoomId: string | null = booking.meetingRoomId;
    let meetingJoinUrl: string | null = booking.meetingJoinUrl;

    const isVideoMeeting =
      !booking.service?.deliveryMode || booking.service.deliveryMode === "VIDEO";
    if (isVideoMeeting && !meetingRoomId) {
      try {
        const durationMin = booking.service?.durationMin ?? 30;
        meetingRoomId = await LiveKitService.createRoom(bookingId, durationMin);
        meetingJoinUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/bookings/${bookingId}/join`;
      } catch (error) {
        logger.error("LiveKit room creation failed during payment confirm", { bookingId, error });
      }
    }

    const effectiveTxRef = booking.paymentReferenceId || txRef;
    const effectiveProviderTxId = providerTransactionId || txRef;
    let alreadyPaidInTx = false;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${bookingId}))`;

      const freshBooking = await tx.booking.findUnique({
        where: { id: bookingId },
        select: { paymentStatus: true },
      });

      if (freshBooking?.paymentStatus === "PAID") {
        alreadyPaidInTx = true;
        return;
      }

      // 1. Create or update Payment record (idempotent)
      const existingPayment = await PaymentRepository.findByBookingId(bookingId, tx);
      if (existingPayment) {
        await PaymentRepository.updateByBookingId(
          bookingId,
          {
            status: "PAID",
            providerTransactionId: effectiveProviderTxId,
            paidAt: new Date(),
          },
          tx
        );
      } else {
        await PaymentRepository.create(
          {
            bookingId,
            amount,
            currency: booking.service.currency,
            platformFee,
            expertPayout,
            txRef: effectiveTxRef,
            providerTransactionId: effectiveProviderTxId,
            status: "PAID",
            paidAt: new Date(),
          },
          tx
        );
      }

      // 2. Update Booking (preserve paymentReferenceId = BM-... so callback lookups always work)
      await BookingRepository.update(
        bookingId,
        {
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentReferenceId: effectiveTxRef,
          platformFee: Number(platformFee),
          expertPayout: Number(expertPayout),
          escrowLockedAt: new Date(),
          meetingRoomId,
          meetingJoinUrl,
        },
        tx
      );

      // 3. Create or update EscrowLedger entry (idempotent)
      const existingLedger = await EscrowLedgerRepository.findByBookingId(bookingId, tx);
      if (existingLedger) {
        await EscrowLedgerRepository.updateStatus(bookingId, "LOCKED", undefined, tx);
      } else {
        await EscrowLedgerRepository.create(
          {
            roomId: meetingRoomId || `consultation_${bookingId}`,
            bookingId,
            lawyerWalletPhone:
              resolveExpertPayoutPhone(booking.expert)?.phone || booking.expert.momoNumber || "",
            totalFee: Number(amount),
            status: "LOCKED",
          },
          tx
        );
      }
    });

    if (alreadyPaidInTx) {
      logger.info("Concurrent payment lock skipped — already settled in parallel transaction", {
        bookingId,
        txRef: effectiveTxRef,
      });
      return;
    }

    // 4. Audit log
    await writeAuditLog({
      actorId: booking.citizenId,
      action: "ESCROW_LOCKED",
      resource: "PAYMENT",
      resourceId: bookingId,
      description: `Escrow locked. Amount: ${amount} ${booking.service.currency || "RWF"}. Ref: ${effectiveTxRef}`,
      metadata: {
        amount,
        platformFee,
        expertPayout,
        txRef: effectiveTxRef,
        providerTransactionId: effectiveProviderTxId,
        operator: operator ?? null,
      },
    });

    logger.info("Escrow locked successfully", {
      bookingId,
      amount,
      platformFee,
      expertPayout,
      txRef: effectiveTxRef,
      providerTransactionId: effectiveProviderTxId,
      operator,
    });

    // Shared confirmation side effects (notifications, emails, conversation)
    await runConfirmationSideEffects(bookingId, {
      notifyPaymentSuccess: true,
      amount,
      currency: booking.service.currency,
    });

    return { amount, platformFee, expertPayout };
  },

  /**
   * Booking-first mode: confirm a booking without any payment.
   *
   * Booking:       PENDING → CONFIRMED
   * PaymentStatus: NOT_REQUIRED (unchanged)
   */
  confirmBookingForExpert: async (bookingId: string) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });

    if (!booking) {
      throw new NotFoundError(`Booking ${bookingId} not found`);
    }

    if (booking.status !== "PENDING") {
      throw new ValidationError(
        `Only pending booking requests can be confirmed. Current status: ${booking.status}`
      );
    }

    const amount = Number(booking.service.flatFee);

    let meetingRoomId: string | null = null;
    let meetingJoinUrl: string | null = null;

    const isVideoMeeting =
      !booking.service?.deliveryMode || booking.service.deliveryMode === "VIDEO";
    if (isVideoMeeting) {
      try {
        const durationMin = booking.service?.durationMin ?? 30;
        meetingRoomId = await LiveKitService.createRoom(bookingId, durationMin);
        meetingJoinUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/bookings/${bookingId}/join`;
      } catch (error) {
        logger.error("LiveKit room creation failed during expert confirmation", {
          bookingId,
          error,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      await BookingRepository.update(
        bookingId,
        {
          status: "CONFIRMED",
          paymentStatus: "NOT_REQUIRED",
          meetingRoomId,
          meetingJoinUrl,
        },
        tx
      );
    });

    await writeAuditLog({
      actorId: booking.citizenId,
      action: "ESCROW_LOCKED",
      resource: "PAYMENT",
      resourceId: bookingId,
      description: `Booking confirmed by expert (booking-first). Amount: ${amount} ${booking.service.currency || "RWF"}. No escrow/payment recorded.`,
      metadata: { amount, meetingRoomId },
    });

    logger.info("Booking confirmed by expert (booking-first)", {
      bookingId,
      amount,
      meetingRoomId,
    });

    await runConfirmationSideEffects(bookingId, {
      notifyPaymentSuccess: false,
      amount,
      currency: booking.service.currency,
    });

    return { amount };
  },

  /**
   * Unified AzamPay Callback Handler (`POST /api/v1/payments/webhook`).
   *
   * Because AzamPay configures a SINGLE callback URL per merchant account for all operations,
   * this handler inspects the callback payload, classifies it as:
   *  - `PAYMENT` (citizen MoMo checkout collection, e.g. `BM-...`)
   *  - `PAYOUT`  (expert disbursement transfer, e.g. `PO-...`)
   *  - `REFUND`  (citizen refund transfer, e.g. `RF-...`)
   * and routes it to the appropriate domain handler.
   */
  handleUnifiedWebhook: async (rawPayload: Record<string, any>) => {
    const normalized = await normalizeAndClassifyAzamWebhook(rawPayload);

    logger.info("AzamPay unified webhook classified", {
      category: normalized.category,
      outcome: normalized.outcome,
      referenceId: normalized.referenceId,
      pgReferenceId: normalized.pgReferenceId,
      fspReferenceId: normalized.fspReferenceId,
      providerStatusCode: normalized.providerStatusCode,
    });

    if (normalized.category === "PAYOUT") {
      return EscrowService.handlePayoutWebhook(normalized);
    }

    if (normalized.category === "REFUND") {
      return EscrowService.handleRefundWebhook(normalized);
    }

    return EscrowService.handlePaymentWebhook({
      transactionstatus:
        normalized.outcome === "SUCCESS"
          ? "success"
          : normalized.outcome === "FAILURE"
          ? "failure"
          : "pending",
      message: normalized.message,
      externalId: normalized.referenceId,
      reference: normalized.pgReferenceId || normalized.fspReferenceId || normalized.referenceId,
      operator: normalized.operator,
      externalReferenceId: normalized.externalReferenceId ?? undefined,
      providerStatusCode: normalized.providerStatusCode,
    });
  },

  /**
   * Process an AzamPay MNO checkout collection webhook payload.
   * Never throws — the webhook must always ack 200 to AzamPay.
   */
  handlePaymentWebhook: async (payload: {
    transactionstatus?: string;
    message?: string;
    externalId?: string;
    reference?: string;
    operator?: string;
    externalReferenceId?: string;
    providerStatusCode?: string;
  }) => {
    const {
      transactionstatus,
      message,
      externalId,
      reference,
      operator,
      externalReferenceId,
      providerStatusCode,
    } = payload;

    if (!externalId && !externalReferenceId) {
      logger.warn("AzamPay payment webhook missing both externalId and externalReferenceId", {
        payload,
      });
      return { processed: false, category: "PAYMENT" as const, reason: "Missing referenceId" };
    }

    const outcome = interpretV2Outcome({
      transactionStatus: transactionstatus,
      data: { providerStatusCode },
    });

    // Resolve booking by paymentReferenceId (BM-...) or fallback by booking UUID (externalReferenceId)
    let booking = externalId ? await BookingRepository.findByPaymentReference(externalId) : null;
    if (!booking && externalReferenceId) {
      booking = await BookingRepository.findById(externalReferenceId);
    }

    if (outcome === "PENDING") {
      logger.info("AzamPay payment webhook reports transaction still pending", {
        externalId,
        bookingId: booking?.id,
        providerStatusCode,
      });
      return {
        processed: false,
        category: "PAYMENT" as const,
        outcome: "PENDING" as const,
        reason: "Transaction still pending",
      };
    }

    if (outcome === "FAILURE") {
      logger.warn("AzamPay payment failed via webhook", {
        externalId,
        bookingId: booking?.id,
        message,
        providerStatusCode,
      });

      if (booking && booking.paymentStatus === "PENDING") {
        await BookingRepository.update(booking.id, { paymentStatus: "FAILED" });
        await writeAuditLog({
          actorId: booking.citizenId,
          action: "PAYMENT",
          resource: "PAYMENT",
          resourceId: booking.id,
          description: `Mobile Money collection failed (${providerStatusCode || transactionstatus}): ${message || "Rejected by provider"}`,
          metadata: { externalId, reference, providerStatusCode, message },
        });
      }
      return {
        processed: true,
        category: "PAYMENT" as const,
        outcome: "FAILURE" as const,
        bookingId: booking?.id,
      };
    }

    // Outcome === "SUCCESS"
    if (!booking) {
      logger.error("AzamPay payment webhook: no booking matches reference", {
        externalId,
        externalReferenceId,
      });
      return {
        processed: false,
        category: "PAYMENT" as const,
        outcome: "SUCCESS" as const,
        reason: "Booking not found",
      };
    }

    const txRef = booking.paymentReferenceId || externalId || reference || `BM-${booking.id}`;
    await EscrowService.lockFunds(
      booking.id,
      txRef,
      reference || externalId || txRef,
      operator
    );

    logger.info("Booking confirmed via AzamPay payment webhook", {
      bookingId: booking.id,
      txRef,
      providerTransactionId: reference,
    });

    return {
      processed: true,
      category: "PAYMENT" as const,
      outcome: "SUCCESS" as const,
      bookingId: booking.id,
    };
  },

  /**
   * Process an AzamPay Disbursement (Expert Payout `PO-...`) callback from the unified webhook.
   *
   * Per `Rwanda_API_v2_Guide.md` §3.3:
   *  - `POST /api/v2/rw/transfers` queues a two-step GTBank job in Hangfire (`transactionStatus: "pending"`).
   *  - When the transfer settles (`"success"`), we confirm `payoutSentAt` and log `fspReferenceId`.
   *  - When the transfer fails (`"failure"` / `"RJCT"`), we clear `payoutSentAt = null` and revert
   *    `EscrowLedger.status` to `HELD_IN_ESCROW` so `payout-retry.cron.ts` (and Admin Finance)
   *    can automatically retry with a fresh `referenceId`!
   */
  handlePayoutWebhook: async (normalized: NormalizedAzamWebhookPayload) => {
    const { referenceId, pgReferenceId, fspReferenceId, externalReferenceId, outcome, message } =
      normalized;

    let payment = referenceId
      ? await PaymentRepository.findByPayoutRef(referenceId)
      : null;

    if (!payment && externalReferenceId) {
      payment = await PaymentRepository.findByBookingIdWithDetails(externalReferenceId);
    }

    if (!payment) {
      logger.warn("AzamPay payout webhook: no matching Payment record found", {
        referenceId,
        externalReferenceId,
        pgReferenceId,
      });
      return {
        processed: false,
        category: "PAYOUT" as const,
        outcome,
        reason: "Payment record not found for payout reference",
      };
    }

    const bookingId = payment.bookingId;

    if (outcome === "PENDING") {
      logger.info("AzamPay payout webhook: transfer still pending in Hangfire/GTBank", {
        bookingId,
        referenceId,
        pgReferenceId,
      });
      return {
        processed: false,
        category: "PAYOUT" as const,
        outcome: "PENDING" as const,
        bookingId,
      };
    }

    if (outcome === "FAILURE") {
      logger.error("AzamPay payout webhook: expert disbursement FAILED asynchronously — queuing for retry", {
        bookingId,
        referenceId,
        pgReferenceId,
        message,
      });

      await prisma.$transaction(async (tx) => {
        await PaymentRepository.updateByBookingId(
          bookingId,
          {
            payoutSentAt: null,
          },
          tx
        );

        const ledger = await EscrowLedgerRepository.findByBookingId(bookingId, tx);
        if (ledger) {
          await EscrowLedgerRepository.updateStatus(bookingId, "HELD_IN_ESCROW", undefined, tx);
        }
      });

      await writeAuditLog({
        actorId: "SYSTEM",
        action: "PAYMENT",
        resource: "PAYMENT",
        resourceId: payment.id,
        description: `Expert payout transfer ${referenceId} failed asynchronously: ${message || "Rejected by gateway"}. Re-queued for retry.`,
        metadata: {
          bookingId,
          referenceId,
          pgReferenceId,
          fspReferenceId,
          message,
        },
      });

      return {
        processed: true,
        category: "PAYOUT" as const,
        outcome: "FAILURE" as const,
        bookingId,
      };
    }

    // Outcome === "SUCCESS"
    await prisma.$transaction(async (tx) => {
      await PaymentRepository.updateByBookingId(
        bookingId,
        {
          providerPayoutRef: referenceId || payment.providerPayoutRef,
          payoutSentAt: payment.payoutSentAt || new Date(),
        },
        tx
      );

      const ledger = await EscrowLedgerRepository.findByBookingId(bookingId, tx);
      if (ledger && ledger.status !== "DISBURSED_TO_EXPERT") {
        await EscrowLedgerRepository.updateStatus(
          bookingId,
          "DISBURSED_TO_EXPERT",
          new Date(),
          tx
        );
      }
    });

    await writeAuditLog({
      actorId: "SYSTEM",
      action: "ESCROW_RELEASED",
      resource: "PAYMENT",
      resourceId: payment.id,
      description: `Expert payout transfer ${referenceId} confirmed settled by AzamPay.`,
      metadata: {
        bookingId,
        referenceId,
        pgReferenceId,
        fspReferenceId,
      },
    });

    logger.info("AzamPay payout webhook: expert disbursement settled", {
      bookingId,
      referenceId,
      pgReferenceId,
      fspReferenceId,
    });

    return {
      processed: true,
      category: "PAYOUT" as const,
      outcome: "SUCCESS" as const,
      bookingId,
    };
  },

  /**
   * Process an AzamPay Refund (`RF-...`) callback from the unified webhook.
   */
  handleRefundWebhook: async (normalized: NormalizedAzamWebhookPayload) => {
    const { referenceId, pgReferenceId, fspReferenceId, externalReferenceId, outcome, message } =
      normalized;

    await writeAuditLog({
      actorId: "SYSTEM",
      action: "PAYMENT",
      resource: "PAYMENT",
      resourceId: externalReferenceId || referenceId,
      description: `Refund transfer ${referenceId} webhook outcome: ${outcome}${message ? ` (${message})` : ""}`,
      metadata: {
        referenceId,
        pgReferenceId,
        fspReferenceId,
        externalReferenceId,
        outcome,
        message,
      },
    });

    logger.info("AzamPay refund webhook processed", {
      referenceId,
      pgReferenceId,
      fspReferenceId,
      outcome,
    });

    return {
      processed: true,
      category: "REFUND" as const,
      outcome,
      referenceId,
    };
  },

  /**
   * Active API Polling & Reconciliation for a Booking's Collection Payment.
   *
   * Queries `GET /api/v2/rw/payments/references/{referenceId}` (§2.4) on AzamPay when a booking's
   * payment is still `PENDING`. If AzamPay reports `"success"` / `"ACSC"`, immediately locks escrow
   * and confirms the booking. If AzamPay reports `"failure"` / `"RJCT"`, marks payment `FAILED`.
   */
  reconcileBookingPayment: async (
    bookingIdOrReference: string
  ): Promise<{
    bookingId: string | null;
    paymentStatus: "PAID" | "FAILED" | "PENDING" | "NOT_REQUIRED" | "REFUNDED" | "UNKNOWN";
    reconciled: boolean;
    pgReferenceId?: string;
    providerStatusCode?: string;
  }> => {
    let booking = await BookingRepository.findByPaymentReference(bookingIdOrReference);
    if (!booking) {
      booking = await BookingRepository.findById(bookingIdOrReference);
    }

    if (!booking) {
      return { bookingId: null, paymentStatus: "UNKNOWN", reconciled: false };
    }

    if (booking.paymentStatus === "PAID") {
      return { bookingId: booking.id, paymentStatus: "PAID", reconciled: false };
    }

    if (booking.paymentStatus !== "PENDING" || !booking.paymentReferenceId) {
      return {
        bookingId: booking.id,
        paymentStatus: booking.paymentStatus as any,
        reconciled: false,
      };
    }

    try {
      const envelope = await AzamPayService.getPaymentStatusByRef(booking.paymentReferenceId);
      const outcome = interpretV2Outcome(envelope);
      const pgReferenceId = envelope.data?.pgReferenceId;
      const providerStatusCode = envelope.data?.providerStatusCode;

      if (outcome === "SUCCESS") {
        await EscrowService.lockFunds(
          booking.id,
          booking.paymentReferenceId,
          pgReferenceId || envelope.data?.fspReferenceId || booking.paymentReferenceId,
          envelope.data?.provider || "MTN"
        );
        logger.info("Reconciled PENDING booking payment to PAID via AzamPay v2 status API", {
          bookingId: booking.id,
          paymentReferenceId: booking.paymentReferenceId,
          pgReferenceId,
        });
        return {
          bookingId: booking.id,
          paymentStatus: "PAID",
          reconciled: true,
          pgReferenceId,
          providerStatusCode,
        };
      }

      if (outcome === "FAILURE") {
        await BookingRepository.update(booking.id, { paymentStatus: "FAILED" });
        await writeAuditLog({
          actorId: booking.citizenId,
          action: "PAYMENT",
          resource: "PAYMENT",
          resourceId: booking.id,
          description: `Reconciled PENDING booking payment to FAILED via AzamPay v2 status API (${providerStatusCode || envelope.transactionStatus})`,
          metadata: {
            paymentReferenceId: booking.paymentReferenceId,
            pgReferenceId,
            providerStatusCode,
            message: envelope.message,
          },
        });
        logger.info("Reconciled PENDING booking payment to FAILED via AzamPay v2 status API", {
          bookingId: booking.id,
          paymentReferenceId: booking.paymentReferenceId,
          providerStatusCode,
        });
        return {
          bookingId: booking.id,
          paymentStatus: "FAILED",
          reconciled: true,
          pgReferenceId,
          providerStatusCode,
        };
      }

      return {
        bookingId: booking.id,
        paymentStatus: "PENDING",
        reconciled: false,
        pgReferenceId,
        providerStatusCode,
      };
    } catch (error) {
      logger.warn("Active AzamPay payment status poll failed — keeping current state", {
        bookingId: booking.id,
        paymentReferenceId: booking.paymentReferenceId,
        error,
      });
      return {
        bookingId: booking.id,
        paymentStatus: booking.paymentStatus as any,
        reconciled: false,
      };
    }
  },

  /**
   * Active API Polling & Reconciliation for an Expert Payout Transfer (`PO-...`).
   * Queries `GET /api/v2/rw/transfers/references/{referenceId}` (§3.5) on AzamPay.
   */
  reconcilePayoutTransfer: async (
    payoutReferenceId: string
  ): Promise<{
    referenceId: string;
    outcome: "SUCCESS" | "PENDING" | "FAILURE";
    reconciled: boolean;
  }> => {
    try {
      const envelope = await AzamPayService.getTransferStatusByRef(payoutReferenceId);
      const outcome = interpretV2Outcome(envelope);

      if (outcome === "PENDING") {
        return { referenceId: payoutReferenceId, outcome: "PENDING", reconciled: false };
      }

      await EscrowService.handlePayoutWebhook({
        category: "PAYOUT",
        outcome,
        referenceId: payoutReferenceId,
        pgReferenceId: envelope.data?.pgReferenceId,
        fspReferenceId: envelope.data?.fspReferenceId ?? null,
        externalReferenceId: envelope.data?.externalReferenceId ?? null,
        transactionStatus: envelope.transactionStatus,
        message: envelope.message,
        raw: envelope as any,
      });

      return { referenceId: payoutReferenceId, outcome, reconciled: true };
    } catch (error) {
      logger.warn("Active AzamPay transfer status poll failed", {
        payoutReferenceId,
        error,
      });
      return { referenceId: payoutReferenceId, outcome: "PENDING", reconciled: false };
    }
  },

  /**
   * Resolve the current payment outcome for a booking by its provider
   * transaction reference — used by GET /payments/callback to decide which
   * frontend page to redirect the citizen's browser to.
   *
   * If our database still says `PENDING`, actively polls AzamPay v2 (§2.4)
   * so the user gets an accurate redirect even if the webhook was delayed!
   */
  resolvePaymentOutcome: async (
    reference: string
  ): Promise<"PAID" | "FAILED" | "UNKNOWN"> => {
    const booking = await BookingRepository.findByPaymentReference(reference);
    if (!booking) return "UNKNOWN";
    if (booking.paymentStatus === "PAID") return "PAID";
    if (booking.paymentStatus === "FAILED") return "FAILED";

    if (booking.paymentStatus === "PENDING") {
      const reconciled = await EscrowService.reconcileBookingPayment(reference);
      if (reconciled.paymentStatus === "PAID") return "PAID";
      if (reconciled.paymentStatus === "FAILED") return "FAILED";
    }

    return "UNKNOWN";
  },

  /**
   * Release escrow after consultation ends.
   * Sends expert payout via AzamPay Disbursement API v2 (`POST /api/v2/rw/transfers`).
   * Booking: CONFIRMED/ACTIVE → COMPLETED
   */
  releaseEscrow: async (bookingId: string) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        expert: { include: { user: { select: { phone: true } } } },
        service: true,
        payment: true,
        citizen: true,
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking ${bookingId} not found`);
    }

    const isCompletedAwaitingPayout =
      booking.status === "COMPLETED" &&
      Boolean(booking.payment) &&
      !booking.payment?.payoutSentAt;

    if (
      booking.status !== "CONFIRMED" &&
      booking.status !== "ACTIVE" &&
      !isCompletedAwaitingPayout
    ) {
      throw new ValidationError(
        `Cannot release escrow. Booking status is ${booking.status}`
      );
    }

    const paymentMode = await AdminSettingService.get("paymentMode");
    if (paymentMode === "BOOKING_FIRST" || !booking.payment) {
      await BookingRepository.update(bookingId, {
        status: "COMPLETED",
        completedAt: new Date(),
      });
      logger.info(
        "Booking marked COMPLETED without escrow payout (booking-first or non-payment)",
        { bookingId }
      );
      return;
    }

    const resolvedPayout = resolveExpertPayoutPhone(booking.expert);
    if (!resolvedPayout) {
      throw new ValidationError(
        "Expert has no valid Rwandan Mobile Money payout number registered (neither dedicated MoMo nor valid contact phone)."
      );
    }

    if (resolvedPayout.isFallback) {
      logger.info("Expert using contact phone fallback for MoMo payout", {
        bookingId,
        payoutPhone: resolvedPayout.phone,
        provider: resolvedPayout.provider,
      });
    }

    if (!booking.payment) {
      throw new ValidationError("No payment record found for this booking.");
    }

    const expertPayoutAmount = Number(booking.expertPayout);
    const platformFeeAmount = Number(booking.platformFee);

    // 1. Send payout to expert MoMo account (MTN or Airtel) via Disbursement v2 API
    const payout = await AzamPayService.sendExpertPayout({
      bookingId,
      momoNumber: resolvedPayout.phone,
      mno: resolvedPayout.provider !== "UNKNOWN" ? resolvedPayout.provider : undefined,
      amount: expertPayoutAmount,
      expertName: booking.expert.displayName ?? "Legal Expert",
    });

    await prisma.$transaction(async (tx) => {
      // 2. Update Payment record
      await PaymentRepository.updateByBookingId(
        bookingId,
        {
          providerPayoutRef: payout.reference,
          payoutSentAt: new Date(),
        },
        tx
      );

      // 3. Update Booking
      await BookingRepository.update(
        bookingId,
        {
          status: "COMPLETED",
          completedAt: booking.completedAt || new Date(),
          escrowReleasedAt: new Date(),
        },
        tx
      );

      // 4. Update EscrowLedger status
      await EscrowLedgerRepository.updateStatus(
        bookingId,
        "DISBURSED_TO_EXPERT",
        new Date(),
        tx
      );
    });

    // 5. Audit log
    await writeAuditLog({
      actorId: booking.citizenId,
      action: "ESCROW_RELEASED",
      resource: "PAYMENT",
      resourceId: bookingId,
      description: `Escrow released. Expert payout: ${expertPayoutAmount} RWF. Platform fee: ${platformFeeAmount} RWF.`,
      metadata: {
        expertPayoutAmount,
        platformFeeAmount,
        payoutReference: payout.reference,
        pgReferenceId: payout.pgReferenceId ?? null,
        transactionStatus: payout.transactionStatus,
      },
    });

    logger.info("Escrow released successfully", {
      bookingId,
      expertPayoutAmount,
      platformFeeAmount,
      payoutReference: payout.reference,
      pgReferenceId: payout.pgReferenceId,
      transactionStatus: payout.transactionStatus,
    });

    return payout;
  },
};
