// src/modules/payment/escrow.service.ts
import { AzamPayService } from "./azam.service.js";
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
  const citizenLanguage = (fullBooking?.citizen?.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
  const expertLanguage = (fullBooking?.expert?.user?.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';

  if (fullBooking?.citizen && fullBooking.expert) {
    const citizenName = `${fullBooking.citizen.firstName} ${fullBooking.citizen.lastName}`;
    const expertName = fullBooking.expert.displayName ?? fullBooking.expert.user?.firstName ?? "Expert";

    sendBookingConfirmationEmail(fullBooking.citizen.email, {
      recipientName: fullBooking.citizen.firstName,
      expertName,
      clientName: citizenName,
      serviceName: fullBooking.service.name,
      scheduledAt: fullBooking.scheduledStart.toISOString(),
      bookingId,
    }, citizenLanguage).catch((e) => logger.error("Failed to send booking confirmation email to citizen", { e }));

    if (fullBooking.expert.user?.email) {
      sendExpertBookingConfirmationEmail(fullBooking.expert.user.email, {
        expertName,
        clientName: citizenName,
        serviceName: fullBooking.service.name,
        scheduledAt: fullBooking.scheduledStart.toISOString(),
        bookingId,
      }, expertLanguage).catch((e) => logger.error("Failed to send booking confirmation email to expert", { e }));
    }
  }

  // Create the chat conversation for this booking (fire-and-forget, idempotent)
  ConversationService.createConversation(bookingId, "SYSTEM")
    .then((conversation) => {
      logger.info("Conversation created for booking", { bookingId, conversationId: conversation.id });

      if (!fullBooking?.citizen || !fullBooking.expert) return;

      const chatLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/chat/${conversation.id}`;
      const expertName = fullBooking.expert.displayName ?? "Expert";

      sendConversationStartedEmail(fullBooking.citizen.email, {
        recipientName: fullBooking.citizen.firstName,
        expertName,
        bookingId,
        chatLink,
        recipientRole: "CITIZEN",
      }, citizenLanguage).catch((e) => logger.error("Failed to send conversation started email to citizen", { e }));

      if (fullBooking.expert.user?.email) {
        sendConversationStartedEmail(fullBooking.expert.user.email, {
          recipientName: expertName,
          expertName: `${fullBooking.citizen.firstName} ${fullBooking.citizen.lastName}`,
          bookingId,
          chatLink,
          recipientRole: "EXPERT",
        }, expertLanguage).catch((e) => logger.error("Failed to send conversation started email to expert", { e }));
      }
    })
    .catch((error) => {
      logger.error("Failed to create conversation for booking", { bookingId, error });
    });
}

export const EscrowService = {
  /**
   * Lock funds after Azam Pay confirms payment
   * Booking:       PENDING → CONFIRMED
   * PaymentStatus: PENDING → PAID
   */
  lockFunds: async (
    bookingId: string,
    txRef: string,
    providerTransactionId: string
  ) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, expert: true, citizen: { select: { email: true } } },
    });

    if (!booking) {
      throw new NotFoundError(`Booking ${bookingId} not found`);
    }

    if (booking.paymentStatus === "PAID") {
      logger.warn("Duplicate webhook received — booking already paid", {
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

    let meetingRoomId: string | null = null;
    let meetingJoinUrl: string | null = null;

    const isVideoMeeting = !booking.service?.deliveryMode || booking.service.deliveryMode === "VIDEO";
    if (isVideoMeeting) {
      try {
        const durationMin = booking.service?.durationMin ?? 30;
        meetingRoomId = await LiveKitService.createRoom(bookingId, durationMin);
        meetingJoinUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/bookings/${bookingId}/join`;
      } catch (error) {
        logger.error("LiveKit room creation failed during webhook payment confirm", { bookingId, error });
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      await PaymentRepository.create({
        bookingId,
        amount,
        currency: booking.service.currency,
        platformFee,
        expertPayout,
        txRef,
        providerTransactionId,
        status: "PAID",
        paidAt: new Date(),
      }, tx);

      // 2. Update Booking
      await BookingRepository.update(bookingId, {
        status: "CONFIRMED",
        paymentStatus: "PAID",
        paymentReferenceId: txRef,
        platformFee: Number(platformFee),
        expertPayout: Number(expertPayout),
        escrowLockedAt: new Date(),
        meetingRoomId,
        meetingJoinUrl,
      }, tx);

      // 3. Create EscrowLedger entry
      await EscrowLedgerRepository.create({
        roomId: meetingRoomId || `consultation_${bookingId}`,
        bookingId,
        lawyerWalletPhone: booking.expert.momoNumber || "",
        totalFee: Number(amount),
        status: "LOCKED",
      }, tx);
    });

    // 3. Audit log
    await writeAuditLog({
      actorId: booking.citizenId,
      action: "ESCROW_LOCKED",
      resource: "PAYMENT",
      resourceId: bookingId,
      description: `Escrow locked. Amount: ${amount} ${booking.service.currency || "RWF"}. Ref: ${txRef}`,
      metadata: { amount, platformFee, expertPayout, txRef },
    });

    logger.info("Escrow locked successfully", {
      bookingId,
      amount,
      platformFee,
      expertPayout,
      txRef,
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
   * The expert accepted the booking request, so we mark it CONFIRMED, create
   * the LiveKit room and run the same confirmation side effects as a paid
   * confirmation — but no Payment / escrow records are created and the
   * booking stays paymentStatus NOT_REQUIRED.
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

    const isVideoMeeting = !booking.service?.deliveryMode || booking.service.deliveryMode === "VIDEO";
    if (isVideoMeeting) {
      try {
        const durationMin = booking.service?.durationMin ?? 30;
        meetingRoomId = await LiveKitService.createRoom(bookingId, durationMin);
        meetingJoinUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/bookings/${bookingId}/join`;
      } catch (error) {
        logger.error("LiveKit room creation failed during expert confirmation", { bookingId, error });
      }
    }

    await prisma.$transaction(async (tx) => {
      await BookingRepository.update(bookingId, {
        status: "CONFIRMED",
        paymentStatus: "NOT_REQUIRED",
        meetingRoomId,
        meetingJoinUrl,
      }, tx);
    });

    // Audit log
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

    // Shared confirmation side effects (notifications, emails, conversation)
    await runConfirmationSideEffects(bookingId, {
      notifyPaymentSuccess: false,
      amount,
      currency: booking.service.currency,
    });

    return { amount };
  },

  /**
   * Process an Azam Pay MNO checkout webhook payload (after signature
   * verification has already passed in the controller). Never throws —
   * the webhook must always ack 200 to Azam Pay regardless of outcome.
   */
  handlePaymentWebhook: async (payload: {
    transactionstatus?: string;
    message?: string;
    externalId?: string;
    reference?: string;
  }) => {
    const { transactionstatus, message, externalId, reference } = payload;

    if (!externalId) {
      logger.warn("Azam Pay webhook missing externalId", { payload });
      return;
    }

    const isSuccess = transactionstatus?.toUpperCase() === "SUCCESS";

    if (!isSuccess) {
      logger.warn("Azam Pay payment failed", { externalId, message });

      // Record the failure on the booking (if it's still awaiting payment) so
      // GET /payments/callback can resolve a definitive outcome for the citizen.
      const booking = await BookingRepository.findByPaymentReference(externalId);
      if (booking && booking.paymentStatus === "PENDING") {
        await BookingRepository.update(booking.id, { paymentStatus: "FAILED" });
      }
      return;
    }

    const existingPayment = await PaymentRepository.findByTxRef(externalId);
    if (existingPayment) {
      logger.warn("Webhook received for already-processed payment", { externalId });
      return;
    }

    const booking = await BookingRepository.findByPaymentReference(externalId);
    if (!booking) {
      logger.error("Azam Pay webhook: no booking matches externalId", { externalId });
      return;
    }

    await EscrowService.lockFunds(booking.id, externalId, reference || "azam-pay-tx");

    logger.info("Booking confirmed via Azam Pay webhook", {
      bookingId: booking.id,
      txRef: externalId,
    });
  },

  /**
   * Resolve the current payment outcome for a booking by its provider
   * transaction reference — used by GET /payments/callback to decide which
   * frontend page to redirect the citizen's browser to. Reads our own
   * recorded Booking.paymentStatus rather than trusting any status value
   * the redirect query string might carry.
   */
  resolvePaymentOutcome: async (
    reference: string
  ): Promise<"PAID" | "FAILED" | "UNKNOWN"> => {
    const booking = await BookingRepository.findByPaymentReference(reference);
    if (!booking) return "UNKNOWN";
    if (booking.paymentStatus === "PAID") return "PAID";
    if (booking.paymentStatus === "FAILED") return "FAILED";
    return "UNKNOWN";
  },

  /**
   * Release escrow after consultation ends
   * Sends 85% to expert MTN MoMo
   * Booking:       CONFIRMED/ACTIVE → COMPLETED
   */
  releaseEscrow: async (bookingId: string) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        expert: true,     // ExpertProfile — has momoNumber
        service: true,
        payment: true,
        citizen: true,    // User — for audit
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
      logger.info("Booking marked COMPLETED without escrow payout (booking-first or non-payment)", { bookingId });
      return;
    }

    if (!booking.expert.momoNumber) {
      throw new ValidationError(
        "Expert has no MoMo number registered. Cannot release payout."
      );
    }

    if (!booking.payment) {
      throw new ValidationError(
        "No payment record found for this booking."
      );
    }

    const expertPayoutAmount = Number(booking.expertPayout);
    const platformFeeAmount = Number(booking.platformFee);

    // 1. Send payout to expert MoMo account (MTN or Airtel)
    const payout = await AzamPayService.sendExpertPayout({
      bookingId,
      momoNumber: booking.expert.momoNumber,
      amount: expertPayoutAmount,
      expertName: booking.expert.displayName ?? "Legal Expert",
    });

    await prisma.$transaction(async (tx) => {
      // 2. Update Payment record
      await PaymentRepository.updateByBookingId(bookingId, {
        providerPayoutRef: payout.reference,
        payoutSentAt: new Date(),
      }, tx);

      // 3. Update Booking
      await BookingRepository.update(bookingId, {
        status: "COMPLETED",
        completedAt: booking.completedAt || new Date(),
        escrowReleasedAt: new Date(),
      }, tx);

      // 4. Update EscrowLedger status
      await EscrowLedgerRepository.updateStatus(
        bookingId,
        "DISBURSED_TO_EXPERT",
        new Date(),
        tx
      );
    });

    // 4. Audit log
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
      },
    });

    logger.info("Escrow released successfully", {
      bookingId,
      expertPayoutAmount,
      platformFeeAmount,
      payoutReference: payout.reference,
    });

    return payout;
  },
};