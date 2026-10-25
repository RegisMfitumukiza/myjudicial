import { getErrorMessage } from "../../shared/utils/i18n-messages.js";
import { BookingRepository } from "./booking.repository.js";

import { logger } from "../../shared/utils/logger.js";
import { writeAuditLog } from "../../shared/utils/audit.js";
import { NotFoundError, ValidationError, ConflictError, AuthorizationError } from "../../shared/errors/index.js";
import {
  sendBookingCancelledEmail,
  sendRefundConfirmationEmail,
  sendNewBookingRequestEmail,
  sendBookingSummaryEmail,
  sendRescheduleRequestEmail,
  sendRescheduleAcceptedEmail,
  sendRescheduleDeclinedEmail,
  sendConsultationDeliveredEmail,
  sendConsultationIssueReportedEmail,
} from "../../infrastructure/email/email.service.js";
import type { CreateBookingDto, UpdateBookingDto } from "./booking.schemas.js";
import { BookingStatus, DayOfWeek, Prisma } from "../../generated/prisma/client.js";
import { AzamPayService } from "../payments/azam.service.js";
import { AvailabilityRepository } from "../experts/availability/availability.repository.js";
import { ServicesRepository } from "../experts/services/services.repository.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { PaymentRepository } from "../payments/payment.repository.js";
import { EscrowLedgerRepository } from "../payments/escrow.repository.js";
import { resolveExpertPayoutPhone } from "../payments/payout.helper.js";

async function resolveExpertIdForUser(userId: string, role: string): Promise<string | null> {
  if (role !== "EXPERT") return null;
  const profile = await prisma.expertProfile.findUnique({ where: { userId }, select: { id: true } });
  return profile?.id ?? null;
}
import { EscrowService } from "../payments/escrow.service.js";
import { AdminSettingService } from "../settings/admin-setting.service.js";
import { LiveKitService } from "../../infrastructure/livekit/livekit.service.js";
import { NotificationRepository } from "../notifications/notification.repository.js";
import { ScheduleSettingsRepository } from "../experts/schedule-settings/schedule-settings.repository.js";
import { OverridesRepository } from "../experts/availability-overrides/overrides.repository.js";
import type { TimeBlock } from "../experts/availability/time-blocks.types.js";
import { resolveStorageUrl } from "../../infrastructure/storage/oci-object-storage.service.js";


// Fallback buffer time if settings not configured (Phase 1 compatibility)
// TODO: Remove after all experts have settings configured
const FALLBACK_BUFFER_MINUTES = 15;

const BOOKING_STATE_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ACTIVE", "CANCELLED", "REFUNDED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const validateBookingTransition = (from: BookingStatus, to: BookingStatus): boolean => {
  return BOOKING_STATE_TRANSITIONS[from]?.includes(to) ?? false;
};

const DAY_OF_WEEK_MAPPING: Record<number, DayOfWeek> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

/**
 * Compute the UTC offset in minutes for a given IANA timezone at a point in
 * time.  Uses `Intl.DateTimeFormat` so DST is handled correctly.
 *
 * Positive value = timezone is ahead of UTC (e.g. Africa/Kigali → +180).
 */
function getTimezoneOffsetMinutes(timezone: string, date: Date): number {
  const getParts = (tz: string) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);

  const pick = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);

  const utc = getParts("UTC");
  const tz = getParts(timezone);

  const utcMs = Date.UTC(
    pick(utc, "year"), pick(utc, "month") - 1, pick(utc, "day"),
    pick(utc, "hour"), pick(utc, "minute"), pick(utc, "second"),
  );
  const tzMs = Date.UTC(
    pick(tz, "year"), pick(tz, "month") - 1, pick(tz, "day"),
    pick(tz, "hour"), pick(tz, "minute"), pick(tz, "second"),
  );

  return Math.round((tzMs - utcMs) / 60_000);
}

/**
 * Apply a schedule HH:MM string as a UTC timestamp, correctly offset by the
 * expert's timezone.  "16:40" in Africa/Kigali (UTC+3) → 13:40 UTC.
 */
function scheduleTimeToUTC(date: Date, hhmm: string, offsetMinutes: number): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setUTCHours(h, m || 0, 0, 0);
  d.setUTCMinutes(d.getUTCMinutes() - offsetMinutes);
  return d;
}

/**
 * Server-side guard mirroring what getAvailableSlots already offers the
 * frontend as slot buttons — without this, a request built directly against
 * the API (bypassing the slot picker) could book a time the expert never
 * made available, or a day they've marked unavailable entirely.
 */
async function assertWithinAvailability(expertId: string, scheduledStart: Date, scheduledEnd: Date): Promise<void> {
  const schedules = await AvailabilityRepository.findByExpertId(expertId);
  
  if (schedules.length === 0) {
    throw new ValidationError("Expert has not set up their availability schedule.");
  }
  
  // Check presence status - experts marked OFFLINE or ON_LEAVE cannot receive new bookings
  const presenceStatus = schedules[0].presenceStatus;
  if (presenceStatus === 'OFFLINE' || presenceStatus === 'ON_LEAVE') {
    throw new ValidationError(
      presenceStatus === 'ON_LEAVE'
        ? "Expert is currently on leave and not accepting new bookings. Please choose another expert or try again later."
        : "Expert is currently offline. Please try again later or choose another expert."
    );
  }
  
  // Resolve expert timezone for local-time → UTC conversion
  const settings = await ScheduleSettingsRepository.findOrCreateDefault(expertId);
  const expertTimezone = settings.timezone || "Africa/Kigali";
  const offsetMin = getTimezoneOffsetMinutes(expertTimezone, scheduledStart);
  
  // Convert UTC scheduledStart to expert's local calendar day at midnight UTC
  const localStartMs = scheduledStart.getTime() + offsetMin * 60_000;
  const localStartDate = new Date(localStartMs);
  const localMidnightUTC = new Date(Date.UTC(
    localStartDate.getUTCFullYear(),
    localStartDate.getUTCMonth(),
    localStartDate.getUTCDate(),
    0, 0, 0, 0
  ));
  
  // Check date-specific overrides
  const override = await OverridesRepository.findByDate(expertId, localMidnightUTC);
  
  if (override) {
    if (override.overrideType === "CLOSED") {
      throw new ValidationError("The expert is not available on this date.");
    }
    if (override.overrideType === "CUSTOM_HOURS" && override.startTime && override.endTime) {
      const windowStart = scheduleTimeToUTC(localMidnightUTC, override.startTime, offsetMin);
      const windowEnd = scheduleTimeToUTC(localMidnightUTC, override.endTime, offsetMin);
      if (scheduledStart < windowStart || scheduledEnd > windowEnd) {
        throw new ValidationError("The expert is not available at the selected time.");
      }
      return;
    }
  }
  
  const dayOfWeek = DAY_OF_WEEK_MAPPING[localStartDate.getUTCDay()];
  const daySchedule = schedules.find((s) => s.dayOfWeek === dayOfWeek && s.isAvailable);

  if (!daySchedule) {
    throw new ValidationError("The expert is not available at the selected time.");
  }

  // Support both time blocks (Phase 4) and legacy single-range schedule
  if (daySchedule.usesTimeBlocks && daySchedule.timeBlocks && Array.isArray(daySchedule.timeBlocks)) {
    const blocks = daySchedule.timeBlocks as unknown as TimeBlock[];
    const withinAnyBlock = blocks.some((block) => {
      const blockStart = scheduleTimeToUTC(localMidnightUTC, block.start, offsetMin);
      const blockEnd = scheduleTimeToUTC(localMidnightUTC, block.end, offsetMin);
      return scheduledStart >= blockStart && scheduledEnd <= blockEnd;
    });
    if (!withinAnyBlock) {
      throw new ValidationError("The expert is not available at the selected time.");
    }
  } else {
    const windowStart = scheduleTimeToUTC(localMidnightUTC, daySchedule.startTime, offsetMin);
    const windowEnd = scheduleTimeToUTC(localMidnightUTC, daySchedule.endTime, offsetMin);
    if (scheduledStart < windowStart || scheduledEnd > windowEnd) {
      throw new ValidationError("The expert is not available at the selected time.");
    }
  }
}

export const BookingService = {
  /**
   * List all bookings for a user with pagination
   */
  listBookings: async (filters: { userId: string; role?: string; expertProfileId?: string | null; page: number; limit: number; status?: BookingStatus }) => {
    const isExpert = filters.role === "EXPERT" && filters.expertProfileId;
    const result = await BookingRepository.list({
      citizenId: isExpert ? undefined : filters.userId,
      expertId: isExpert ? filters.expertProfileId! : undefined,
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
    });

    return {
      bookings: result.data,
      pagination: result.pagination,
    };
  },

  /**
   * Get a single booking by ID
   */
  getBookingById: async (bookingId: string, userId: string) => {
    const booking = await BookingRepository.findById(bookingId);

    if (!booking) {
      return null;
    }

    // Verify user owns this booking (citizen or expert)
    // booking.citizenId is the User ID; booking.expertId is the ExpertProfile ID,
    // so we must compare against the expert's User ID via the nested relation.
    const isOwner =
      booking.citizenId === userId ||
      (booking as any).expert?.user?.id === userId;
    if (!isOwner) {
      throw new AuthorizationError(getErrorMessage('UNAUTHORIZED'));
    }

    return booking;
  },

  /**
   * Create a new booking and initialize Azam Pay MoMo payment
   */
  createBooking: async (dto: CreateBookingDto & { citizenId: string }) => {
    // 1. Validate expert exists and is verified
    const expert = await BookingRepository.findExpertProfileForBooking(dto.expertId);

    if (!expert) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));

    if (expert.status !== "VERIFIED") {
      throw new ValidationError(getErrorMessage('EXPERT_NOT_VERIFIED'));
    }

    // 2. Validate service exists and belongs to expert
    const service = expert.services.find((s) => s.id === dto.serviceId);
    if (!service) throw new NotFoundError("Service not found for this expert");
    if (!service.isActive) {
      throw new ValidationError(getErrorMessage('SERVICE_UNAVAILABLE'));
    }

    // 3. Parse and validate scheduled times
    const scheduledStart = new Date(dto.scheduledStart);
    const scheduledEnd = new Date(dto.scheduledEnd);

    if (scheduledStart <= new Date()) {
      throw new ValidationError("Booking time must be in the future");
    }

    if (scheduledEnd <= scheduledStart) {
      throw new ValidationError("End time must be after start time");
    }

    // 3b. Confirm the requested time actually falls within the expert's
    // declared weekly availability (defense in depth — the slot picker
    // already only offers valid times, but this closes the gap for any
    // request built directly against the API).
    await assertWithinAvailability(dto.expertId, scheduledStart, scheduledEnd);

    // 4. Fetch citizen details for notifications (must happen before transaction)
    const citizen = await BookingRepository.findCitizenForBooking(dto.citizenId);
    if (!citizen) throw new NotFoundError("Citizen not found");

    // 4b. Resolve payment mode. In booking-first mode no Mobile Money is
    // collected at booking time — the booking is a request awaiting the
    // expert's response and carries paymentStatus NOT_REQUIRED.
    const paymentMode = await AdminSettingService.get("paymentMode");
    const paymentRequired = paymentMode === "PAYMENT_REQUIRED";

    if (paymentRequired && !citizen.phone && !dto.paymentPhoneNumber) {
      throw new ValidationError("Phone number is required for Mobile Money payment");
    }

    if (!citizen.phone && dto.paymentPhoneNumber) {
      await prisma.user.update({
        where: { id: dto.citizenId },
        data: { phone: dto.paymentPhoneNumber },
      });
      citizen.phone = dto.paymentPhoneNumber;
    }

    // 5 & 6. Transactional conflict check and booking creation (C3 fix)
    let booking: any;
    try {
      booking = await prisma.$transaction(async (tx) => {
        // Advisory lock on the expert to prevent concurrent overlapping bookings
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${dto.expertId}))`;

        const existingBookings = await BookingRepository.getByDateRange(
          dto.expertId,
          scheduledStart,
          scheduledEnd,
          tx
        );

        if (existingBookings.length > 0) {
          throw new ConflictError(getErrorMessage('BOOKING_UNAVAILABLE'));
        }

        return await BookingRepository.create({
          citizenId: dto.citizenId,
          expertId: dto.expertId,
          serviceId: dto.serviceId,
          scheduledStart,
          scheduledEnd,
          citizenNotes: dto.citizenNotes,
          paymentStatus: paymentRequired ? "PENDING" : "NOT_REQUIRED",
        }, tx);
      }, {
        timeout: 15000
      });
    } catch (err: any) {
      if (err instanceof ConflictError) throw err;
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError(getErrorMessage('BOOKING_UNAVAILABLE'));
      }
      throw err;
    }

    logger.info("Booking created", {
      bookingId: booking.id,
      citizenId: dto.citizenId,
      paymentMode,
    });

    // 7. In payment-required mode, push the MNO checkout and persist the
    // provider transaction reference so the payment webhook can resolve this
    // booking. Skipped entirely in booking-first mode.
    let transactionId: string | null = null;

    if (paymentRequired) {
      try {
        const citizenName = [citizen.firstName, citizen.lastName].filter(Boolean).join(" ") || "Client";
        const amount = Number(service.flatFee);
        if (!amount || amount <= 0) {
          throw new ValidationError("Service fee is invalid");
        }

        const result = await AzamPayService.initializeMnoPayment({
          bookingId: booking.id,
          amount,
          currency: service.currency || "RWF",
          mno: dto.paymentMNO || "MTN",
          phoneNumber: dto.paymentPhoneNumber || citizen.phone || "",
          citizenEmail: citizen.email,
          citizenName,
        });
        transactionId = result.transactionId;
      } catch (err) {
        // If payment initialization fails (e.g. invalid credentials), cancel the stuck booking
        await BookingRepository.update(booking.id, { 
          status: "CANCELLED", 
          cancellationReason: "Payment system unavailable" 
        });
        throw err;
      }

      logger.info("Payment initialized via Azam Pay", {
        bookingId: booking.id,
        amount: service.flatFee,
        transactionId,
      });
    }

    // 7b. Persist the provider transaction reference so the payment webhook
    // (which looks bookings up by paymentReferenceId) can find this booking.
    const updatedBooking = transactionId
      ? await BookingRepository.update(booking.id, {
          paymentReferenceId: transactionId,
        })
      : booking;

    // 8. Audit log
    await writeAuditLog({
      actorId: dto.citizenId,
      action: "BOOK",
      resource: "BOOKING",
      resourceId: booking.id,
      description: `Citizen created booking for expert ${dto.expertId}`,
      metadata: { amount: service.flatFee, currency: service.currency },
    });

    // 9. Fire-and-forget: notify expert of new booking request
    const scheduledDate = scheduledStart.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const scheduledTime = scheduledStart.toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit",
    });
    if (expert.user?.email) {
      const expertLanguage = (expert.user?.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
      sendNewBookingRequestEmail(expert.user.email, {
        expertName: expert.displayName ?? "Expert",
        clientName: `${citizen.firstName} ${citizen.lastName}`,
        serviceName: service.name,
        scheduledAt: `${scheduledDate} at ${scheduledTime}`,
        bookingId: booking.id,
        paymentRequired,
      }, expertLanguage).catch((e) => logger.error("New booking request email to expert failed", { e }));
    }

    // In-app notification for the expert on new booking request
    if (expert.user?.id) {
      NotificationRepository.create({
        userId: expert.user.id,
        event: "BOOKING_CONFIRMED",
        recipient: expert.user.email ?? "",
        subject: "New Booking Request",
        body: `${citizen.firstName} ${citizen.lastName} has requested a ${service.name} consultation on ${scheduledDate} at ${scheduledTime}.`,
      }).catch((e) => logger.error("Failed to write new-booking-request notification for expert", { e }));
    }

    // 10. Fire-and-forget: send booking summary to citizen
    if (citizen.email) {
      const citizenLanguage = (citizen.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
      sendBookingSummaryEmail(citizen.email, {
        recipientName: citizen.firstName ?? "User",
        expertName: expert.displayName ?? "Expert",
        serviceName: service.name,
        scheduledAt: `${scheduledDate} at ${scheduledTime}`,
        bookingId: booking.id,
        amount: paymentRequired ? `${service.currency ?? "RWF"} ${Number(service.flatFee).toLocaleString()}` : undefined,
        paymentRequired,
      }, citizenLanguage).catch((e) => logger.error("Booking summary email to citizen failed", { e }));
    }

    return {
      booking: updatedBooking,
      payment: {
        paymentLink: null,
        txRef: transactionId ?? "",
        amount: service.flatFee,
        currency: service.currency || "RWF",
      },
    };
  },

  /**
   * Update a booking
   */
  updateBooking: async (bookingId: string, userId: string, dto: UpdateBookingDto) => {
    const booking = await BookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
    }

    // Verify authorization
    const isAuthorized =
      booking.citizenId === userId ||
      (booking as any).expert?.user?.id === userId;
    if (!isAuthorized) {
      throw new AuthorizationError(getErrorMessage('UNAUTHORIZED'));
    }

    // Build update data
    const updateData: any = {};
    if (dto.status) {
      // In booking-first mode status changes must go through the dedicated
      // flows (expert accept, cancel, admin complete) so their side effects
      // (LiveKit room, emails, conversation) always run.
      const paymentMode = await AdminSettingService.get("paymentMode");
      if (paymentMode === "BOOKING_FIRST") {
        throw new ValidationError(
          "Booking status must be changed via accept, cancel or admin completion flows"
        );
      }
      if (!validateBookingTransition(booking.status as BookingStatus, dto.status as BookingStatus)) {
        throw new ValidationError(`Invalid state transition from ${booking.status} to ${dto.status}`);
      }
      updateData.status = dto.status as BookingStatus;
    }
    if (dto.scheduledStart) updateData.scheduledStart = new Date(dto.scheduledStart);
    if (dto.scheduledEnd) updateData.scheduledEnd = new Date(dto.scheduledEnd);
    if (dto.citizenNotes !== undefined) updateData.citizenNotes = dto.citizenNotes;

    const updated = await BookingRepository.update(bookingId, updateData);

    logger.info("Booking updated", { bookingId });
    return updated;
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (bookingId: string, userId: string, reason?: string) => {
    const booking = await BookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
    }

    const isSystem = userId === "SYSTEM";
    const isCitizen = booking.citizenId === userId;
    const isExpert = (booking as any).expert?.user?.id === userId;

    if (!isCitizen && !isExpert && !isSystem) {
      throw new AuthorizationError("Unauthorized to cancel this booking");
    }

    if (!isSystem && !["PENDING", "CONFIRMED"].includes(booking.status)) {
      throw new ValidationError(`Cannot cancel booking in ${booking.status} state`);
    }

    if (isExpert && !reason) {
      throw new ValidationError("Expert must provide a cancellation reason");
    }

    let cancelled;
    const cancellationReason = reason || (isSystem ? "Cancelled by system (short duration)" : isCitizen ? "Cancelled by client" : "Cancelled by expert");

    let refundPercentage = 0;
    let expertCompensationAmount = 0;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${bookingId}))`;
      
      const freshBooking = await BookingRepository.findById(bookingId, tx);
      if (!freshBooking || !["PENDING", "CONFIRMED", "ACTIVE"].includes(freshBooking.status)) {
         throw new ValidationError(getErrorMessage('CANNOT_CANCEL_BOOKING'));
      }

      if (freshBooking.paymentStatus === "PAID") {
        if (isSystem || isExpert) {
          refundPercentage = 100;
        } else {
          const nowMs = Date.now();
          const createdAtMs = new Date(freshBooking.createdAt).getTime();
          const msSinceCreated = nowMs - createdAtMs;
          const ONE_HOUR_MS = 60 * 60 * 1000;
          const hoursUntilStart = (freshBooking.scheduledStart.getTime() - nowMs) / (1000 * 60 * 60);

          if (msSinceCreated <= ONE_HOUR_MS) {
            // Buyer's remorse grace period (within 60 mins of booking, e.g. next-day booking mistakes)
            refundPercentage = 100;
          } else if (hoursUntilStart > 24) {
            // Advance cancellation (>24h)
            refundPercentage = 100;
          } else if (hoursUntilStart > 0) {
            // Late cancellation (<=24h) -> 50% refund to client, 50% compensation to expert
            refundPercentage = 50;
            expertCompensationAmount = Math.round(Number(freshBooking.expertPayout ?? 0) * 0.5);
          } else {
            throw new ValidationError("Cannot cancel after booking has started");
          }
        }
      }

      const targetStatus = refundPercentage > 0 ? "REFUNDED" : "CANCELLED";

      cancelled = await BookingRepository.update(bookingId, {
        status: targetStatus,
        cancellationReason,
      }, tx);

      if (refundPercentage > 0) {
        const payment = await PaymentRepository.findByBookingId(bookingId, tx);
        if (payment && payment.providerTransactionId) {
          const refundAmount = Number(payment.amount) * (refundPercentage / 100);
          // H3 pattern: it is generally risky to do external API calls inside a transaction,
          // but for cancellations where refund percentage is calculated in the same atomic block,
          // we are keeping it here to ensure consistency unless we build a full async saga.
          await AzamPayService.initiateRefund(payment.providerTransactionId, refundAmount, {
            citizenPhone: (freshBooking as any).citizen?.phone,
            currency: payment.currency,
            reason: cancellationReason,
          });

          // Disburse late cancellation compensation to expert if applicable
          if (expertCompensationAmount > 0 && (freshBooking as any).expert) {
            const resolvedPayout = resolveExpertPayoutPhone((freshBooking as any).expert);
            if (resolvedPayout) {
              await AzamPayService.sendExpertPayout({
                bookingId,
                momoNumber: resolvedPayout.phone,
                amount: expertCompensationAmount,
                expertName: (freshBooking as any).expert?.displayName ?? "Legal Expert",
              }).catch((err) => {
                logger.error("Failed to disburse late cancellation compensation to expert", { bookingId, err });
              });
            }
          }

          await PaymentRepository.updateByBookingId(bookingId, {
            status: "REFUNDED",
          }, tx);

          if ((freshBooking as any).escrowLedger) {
            await EscrowLedgerRepository.updateStatus(bookingId, "REFUNDED", new Date(), tx);
          }
        }
      }
    });

    logger.info("Booking cancelled", { bookingId, refundPercentage });

    // Fire-and-forget: notify the other party via email
    try {
      const full = await BookingRepository.findFullBookingById(bookingId);
      if (full) {
        const cancelledByLabel = isExpert ? "Expert" : isSystem ? "System" : "Client";
        const refunded = refundPercentage > 0;
        const citizenLanguage = (full.citizen?.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
        const expertLanguage = (full.expert?.user?.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';

        // Notify citizen
        if (full.citizen?.email) {
          sendBookingCancelledEmail(full.citizen.email, {
            recipientName: full.citizen.firstName ?? "User",
            cancelledBy: cancelledByLabel,
            reason: cancellationReason,
            refunded,
            bookingId,
          }, citizenLanguage).catch((e) => logger.error("Cancellation email to citizen failed", { e }));

          NotificationRepository.create({
            userId: full.citizenId,
            event: "BOOKING_CANCELLED",
            recipient: full.citizen.email,
            subject: "Booking cancelled",
            body: `Your booking was cancelled by ${cancelledByLabel.toLowerCase()}. ${cancellationReason}`,
          }).catch((e) => logger.error("Failed to write booking-cancelled notification", { e }));

          if (refunded) {
            const payment = await PaymentRepository.findByBookingId(bookingId);
            if (payment) {
              const refundAmount = Number(payment.amount) * (refundPercentage / 100);
              sendRefundConfirmationEmail(full.citizen.email, {
                recipientName: full.citizen.firstName ?? "User",
                amount: refundAmount,
                percentage: refundPercentage,
                bookingId,
              }, citizenLanguage).catch((e) => logger.error("Refund email to citizen failed", { e }));

              NotificationRepository.create({
                userId: full.citizenId,
                event: "REFUND_PROCESSED",
                recipient: full.citizen.email,
                subject: "Refund processed",
                body: `A refund of ${refundAmount} ${payment.currency} (${refundPercentage}%) has been processed for your booking.`,
              }).catch((e) => logger.error("Failed to write refund-processed notification", { e }));
            }
          }
        }

        // Notify expert (if cancellation was by citizen)
        if (isCitizen && full.expert?.user?.email) {
          sendBookingCancelledEmail(full.expert.user.email, {
            recipientName: full.expert.displayName ?? "Expert",
            cancelledBy: "Client",
            reason: cancellationReason,
            refunded,
            bookingId,
          }, expertLanguage).catch((e) => logger.error("Cancellation email to expert failed", { e }));

          // In-app notification for the expert when client cancels
          if (full.expert.user.id) {
            const compensationNote = expertCompensationAmount > 0
              ? ` Late cancellation compensation of ${expertCompensationAmount} RWF has been disbursed to your Mobile Money.`
              : "";
            NotificationRepository.create({
              userId: full.expert.user.id,
              event: "BOOKING_CANCELLED",
              recipient: full.expert.user.email,
              subject: "Booking Cancelled by Client",
              body: `${full.citizen.firstName} ${full.citizen.lastName} has cancelled the ${full.service?.name ?? "consultation"} booking.${refunded ? " A refund has been issued." : ""}${compensationNote}`,
            }).catch((e) => logger.error("Failed to write booking-cancelled notification for expert", { e }));
          }
        }
      }
    } catch (emailErr) {
      logger.error("Error sending cancellation notification", { bookingId, emailErr });
    }

    return cancelled;
  },

  /**
   * Admin manual override: confirm a booking whose Mobile Money payment was
   * verified out-of-band (e.g. provider webhook missed/delayed). Reuses the
   * same escrow-locking path as the real payment webhook so every confirmed
   * booking ends up with a consistent Payment/EscrowLedger record — this is
   * not a separate confirmation mechanism.
   */
  confirmBooking: async (bookingId: string, paymentReference: string) => {
    const booking = await BookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
    }

    if (booking.paymentStatus === "PAID") {
      throw new ConflictError("Booking is already confirmed and paid");
    }

    const paymentMode = await AdminSettingService.get("paymentMode");
    if (paymentMode === "PAYMENT_REQUIRED") {
      await EscrowService.lockFunds(bookingId, paymentReference, paymentReference);
    } else {
      // Booking-first mode: admin force-confirm without payment/escrow.
      await EscrowService.confirmBookingForExpert(bookingId);
    }

    logger.info("Booking manually confirmed by admin", { bookingId, paymentReference });
    return BookingRepository.findById(bookingId);
  },

  /**
   * Expert accepts a booking request (booking-first flow).
   *
   * PENDING → CONFIRMED without any payment. Reuses the same confirmation
   * path as the payment webhook (LiveKit room, notifications, confirmation
   * emails, conversation) so every confirmed booking is consistent — but no
   * Payment / escrow records are created (paymentStatus stays NOT_REQUIRED).
   *
   * Only the assigned expert may accept, and only in booking-first mode.
   */
  acceptBooking: async (bookingId: string, userId: string) => {
    const booking = await BookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
    }

    const isExpert = (booking as any).expert?.user?.id === userId;
    if (!isExpert) {
      throw new AuthorizationError("Only the assigned expert can accept this booking request");
    }

    if (booking.status !== "PENDING") {
      throw new ValidationError(
        `Only pending booking requests can be accepted. Current status: ${booking.status}`
      );
    }

    const paymentMode = await AdminSettingService.get("paymentMode");
    if (paymentMode === "PAYMENT_REQUIRED") {
      throw new ValidationError("This booking is awaiting payment and cannot be accepted yet");
    }

    await EscrowService.confirmBookingForExpert(bookingId);

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "BOOKING",
      resourceId: bookingId,
      description: `Expert accepted booking request (booking-first)`,
      metadata: { bookingId },
    });

    logger.info("Booking request accepted by expert", { bookingId, expertId: userId });

    return BookingRepository.findById(bookingId);
  },

  /**
   * Get available time slots for an expert on a given date
   */
  getAvailableSlots: async (expertId: string, dateString: string, serviceId?: string) => {
    const expert = await BookingRepository.findExpertProfileStatus(expertId);

    if (!expert) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    if (expert.status !== "VERIFIED") {
      throw new ValidationError("Expert is not available");
    }

    // Get expert's schedule settings
    const settings = await ScheduleSettingsRepository.findOrCreateDefault(expertId);

    // Slot length matches the service being booked (falls back to a 30-minute
    // default when no serviceId is supplied, e.g. before the client has
    // picked a service yet).
    let slotDuration = 30;
    if (serviceId) {
      const service = await ServicesRepository.findById(serviceId);
      if (!service || service.expertId !== expertId) {
        throw new NotFoundError("Service not found for this expert");
      }
      slotDuration = service.durationMin;
    }

    // Parse date — schedule HH:MM strings are in the expert's local timezone
    // and converted to UTC via getTimezoneOffsetMinutes before slot generation.
    const date = new Date(dateString);
    date.setUTCHours(0, 0, 0, 0);

    // **Phase 3: Check for date-specific overrides**
    const override = await OverridesRepository.findByDate(expertId, date);
    
    if (override) {
      // Handle different override types
      if (override.overrideType === "CLOSED") {
        return []; // Day is completely blocked
      }
      
      if (override.overrideType === "REDUCED_CAPACITY") {
        // Will be handled below when checking daily limit
        // Store override for later use
      }
      
      // CUSTOM_HOURS will be handled below by replacing schedule times
    }

    // Check if date is within booking window.
    // Compare at day granularity — per-slot advance-notice filtering
    // (below) handles the time-level check within each day.
    const now = new Date();
    const earliestBookableDate = new Date(now);
    earliestBookableDate.setHours(earliestBookableDate.getHours() + settings.advanceNoticeHours);
    earliestBookableDate.setUTCHours(0, 0, 0, 0);

    const latestBookableDate = new Date(now);
    latestBookableDate.setDate(latestBookableDate.getDate() + settings.maxDaysInAdvance);

    if (date < earliestBookableDate || date > latestBookableDate) {
      return []; // Outside booking window
    }

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const targetDay = DAY_OF_WEEK_MAPPING[date.getUTCDay()];

    // Fetch availability
    const schedules = await AvailabilityRepository.findByExpertId(expertId);
    
    if (schedules.length === 0) {
      return []; // No availability configured
    }
    
    // Respect presence status if enabled in settings
    if (settings.respectPresenceStatus) {
      const presenceStatus = schedules[0].presenceStatus;
      if (presenceStatus === 'OFFLINE' || presenceStatus === 'ON_LEAVE') {
        return []; // Expert is not accepting bookings right now
      }
    }
    
    // Check if there is an active custom hours override for this specific date
    const hasCustomHoursOverride = Boolean(
      override && override.overrideType === "CUSTOM_HOURS" && override.startTime && override.endTime
    );

    const daySchedule = schedules.find((s) => s.dayOfWeek === targetDay);

    // If day is not available in regular weekly schedule AND no custom hours override exists, return no slots
    if (!hasCustomHoursOverride && (!daySchedule || !daySchedule.isAvailable)) {
      return []; // No availability set for this day
    }

    // Get booked slots
    const bookedSlots = await BookingRepository.getByDateRange(expertId, date, endOfDay);

    // **Phase 3: Check daily booking limit (including override capacity)**
    let effectiveDailyLimit = settings.maxBookingsPerDay;
    
    if (override && override.overrideType === "REDUCED_CAPACITY" && override.maxBookings) {
      effectiveDailyLimit = override.maxBookings;
    }
    
    if (effectiveDailyLimit && bookedSlots.length >= effectiveDailyLimit) {
      return []; // Daily limit reached (or reduced capacity limit)
    }

    const bufferMinutes = settings.bufferTimeMinutes || FALLBACK_BUFFER_MINUTES;

    // Resolve expert timezone so schedule HH:MM (local) is converted to UTC
    const expertTimezone = settings.timezone || "Africa/Kigali";
    const offsetMin = getTimezoneOffsetMinutes(expertTimezone, date);

    // **Phase 4: Support time blocks and overrides**
    let timeBlocks: TimeBlock[] = [];
    
    if (hasCustomHoursOverride) {
      // Date override takes precedence over regular schedule
      timeBlocks = [{ start: override!.startTime!, end: override!.endTime! }];
    } else if (daySchedule?.usesTimeBlocks && daySchedule.timeBlocks) {
      // Time blocks format
      timeBlocks = daySchedule.timeBlocks as unknown as TimeBlock[];
    } else if (daySchedule) {
      // Legacy single time block
      timeBlocks = [{ start: daySchedule.startTime, end: daySchedule.endTime }];
    }

    // Generate slots for each time block
    const slots = [];
    
    for (const block of timeBlocks) {
      const currentSlotStart = scheduleTimeToUTC(date, block.start, offsetMin);
      const blockEnd = scheduleTimeToUTC(date, block.end, offsetMin);

      while (currentSlotStart < blockEnd) {
        const currentSlotEnd = new Date(currentSlotStart);
        currentSlotEnd.setUTCMinutes(currentSlotEnd.getUTCMinutes() + slotDuration);

        if (currentSlotEnd > blockEnd) {
          break; // Do not exceed block end
        }

        // Check if slot is available (including buffer time after bookings)
        const isBooked = bookedSlots.some((booking: { scheduledStart: Date; scheduledEnd: Date }) => {
          const bookStart = new Date(booking.scheduledStart);
          const bookEnd = new Date(booking.scheduledEnd);
          
          // Add buffer time to the end of existing bookings
          const bookEndWithBuffer = new Date(bookEnd);
          bookEndWithBuffer.setUTCMinutes(bookEndWithBuffer.getUTCMinutes() + bufferMinutes);
          
          return currentSlotStart < bookEndWithBuffer && currentSlotEnd > bookStart;
        });

        // Check advance notice requirement
        const slotStartTime = currentSlotStart.getTime();
        const advanceNoticeMs = settings.advanceNoticeHours * 60 * 60 * 1000;
        const canBook = slotStartTime > (Date.now() + advanceNoticeMs);

        if (!isBooked && canBook) {
          slots.push({
            start: currentSlotStart.toISOString(),
            end: currentSlotEnd.toISOString(),
          });
        }

        // Advance by slot duration + buffer time
        currentSlotStart.setUTCMinutes(currentSlotStart.getUTCMinutes() + slotDuration + bufferMinutes);
      }
    }

    return slots;
  },

  /**
   * Generate LiveKit token for joining a consultation room
   */
  generateLiveKitToken: async (bookingId: string, userId: string) => {
    const booking = await BookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
    }

    // Verify user is a participant (citizen or expert)
    const isParticipant =
      booking.citizenId === userId ||
      (booking as any).expert?.user?.id === userId;
    if (!isParticipant) {
      throw new AuthorizationError(getErrorMessage('UNAUTHORIZED'));
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "ACTIVE") {
      throw new ValidationError("Booking is not ready for consultation");
    }

    const isVideoMeeting = !booking.service?.deliveryMode || booking.service.deliveryMode === "VIDEO";
    if (!isVideoMeeting) {
      throw new ValidationError("Video consultation room is not available for this delivery mode");
    }

    const isExpert = (booking as any).expert?.user?.id === userId;

    // Resolve display name from the booking record
    const displayName = isExpert
      ? (booking.expert as any)?.displayName ?? "Expert"
      : `${(booking.citizen as any)?.firstName ?? ""} ${(booking.citizen as any)?.lastName ?? ""}`.trim() || "Client";

    const durationMin = booking.service?.durationMin ?? 30;
    // Ensure the room exists (idempotent — LiveKit ignores duplicate create calls)
    await LiveKitService.createRoom(bookingId, durationMin);

    const token = await LiveKitService.generateToken(
      bookingId,
      userId,
      displayName,
      isExpert
    );

    logger.info("LiveKit token generated", { bookingId, userId, isExpert });
    return token;
  },

  /**
   * Admin: List all bookings with pagination and filters
   */
  listAllBookings: async (filters: {
    expertId?: string;
    citizenId?: string;
    status?: BookingStatus;
    dateFrom?: string;
    dateTo?: string;
    page: number;
    limit: number;
  }) => {
    const result = await BookingRepository.list({
      citizenId: filters.citizenId,
      expertId: filters.expertId,
      status: filters.status,
      dateFrom: filters.dateFrom
        ? filters.dateFrom.length <= 10
          ? new Date(`${filters.dateFrom}T00:00:00.000Z`)
          : new Date(filters.dateFrom)
        : undefined,
      dateTo: filters.dateTo
        ? filters.dateTo.length <= 10
          ? new Date(`${filters.dateTo}T23:59:59.999Z`)
          : new Date(filters.dateTo)
        : undefined,
      page: filters.page,
      limit: filters.limit,
    });

    const transformedBookings = await Promise.all(
      result.data.map(async (b: any) => {
        const citizenAvatarUrl = await resolveStorageUrl(b.citizen?.avatarObjectKey);
        const expertAvatarUrl = await resolveStorageUrl(b.expert?.profileImageObjectKey);
        return {
          ...b,
          citizen: b.citizen ? { ...b.citizen, avatarUrl: citizenAvatarUrl } : b.citizen,
          expert: b.expert ? { ...b.expert, profileImageUrl: expertAvatarUrl } : b.expert,
        };
      })
    );

    return {
      bookings: transformedBookings,
      pagination: result.pagination,
    };
  },

  /**
   * Admin: Manually complete booking
   */
  adminCompleteBooking: async (bookingId: string, adminUserId: string) => {
    const booking = await BookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
    }

    if (!["ACTIVE", "CONFIRMED"].includes(booking.status)) {
      throw new ValidationError(`Cannot complete booking in ${booking.status} state`);
    }

    // Booking-first mode has no escrow to release — just mark completed.
    const paymentMode = await AdminSettingService.get("paymentMode");
    if (paymentMode === "PAYMENT_REQUIRED") {
      // Trigger normal completion flow (release escrow & payout)
      await EscrowService.releaseEscrow(bookingId);
    } else {
      await BookingRepository.update(bookingId, {
        status: "COMPLETED",
        completedAt: new Date(),
      });
    }

    // Create adminAction log
    await prisma.adminAction.create({
      data: {
        adminUserId,
        action: "MANUAL_BOOKING_COMPLETION",
        reason: "Admin manually completed booking",
        metadata: { bookingId },
      },
    });

    logger.info("Admin manually completed booking", { bookingId, adminUserId });
    return BookingRepository.findById(bookingId);
  },

  /**
   * Admin: Manually refund booking
   */
  adminRefundBooking: async (
    bookingId: string,
    adminUserId: string,
    reason: string,
    percentage: number
  ) => {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
    }

    // No money is held in booking-first mode, so refunds are not applicable.
    const paymentMode = await AdminSettingService.get("paymentMode");
    if (paymentMode === "BOOKING_FIRST") {
      throw new ValidationError("Refunds are unavailable while payments are disabled");
    }

    let refundAmount = 0;
    let refundCurrency = "RWF";

    // H3: Fetch payment before transaction
    const payment = await PaymentRepository.findByBookingId(bookingId);
    
    if (payment && payment.providerTransactionId) {
      refundAmount = Number(payment.amount) * (percentage / 100);
      refundCurrency = payment.currency;
      
      // External API call outside transaction
      await AzamPayService.initiateRefund(payment.providerTransactionId, refundAmount, {
        citizenPhone: (booking as any).citizen?.phone,
        currency: payment.currency,
        reason,
      });
    }

    // Now update database records in a quick transaction
    await prisma.$transaction(async (tx) => {
      await BookingRepository.update(bookingId, {
        status: "REFUNDED",
        cancellationReason: reason,
      }, tx);

      if (payment && payment.providerTransactionId) {
        await PaymentRepository.updateByBookingId(bookingId, {
          status: "REFUNDED",
        }, tx);

        await EscrowLedgerRepository.updateStatus(bookingId, "REFUNDED", new Date(), tx);
      }
    });

    if (refundAmount > 0 && booking.citizen?.email) {
      const citizenLang = (booking.citizen.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
      sendRefundConfirmationEmail(booking.citizen.email, {
        recipientName: booking.citizen.firstName ?? "User",
        amount: refundAmount,
        percentage,
        bookingId,
      }, citizenLang).catch((e) => logger.error("Failed to send refund confirmation email to citizen", { e }));

      NotificationRepository.create({
        userId: booking.citizenId,
        event: "REFUND_PROCESSED",
        recipient: booking.citizen.email,
        subject: "Refund processed",
        body: `A full refund of ${refundAmount} ${refundCurrency} has been processed for your booking by an administrator. Reason: ${reason}`,
      }).catch((e) => logger.error("Failed to write refund-processed notification", { e }));
    }

    // Notify Expert of Admin Refund
    if (booking.expert?.user?.email) {
      const expertLang = (booking.expert.user.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
      NotificationRepository.create({
        userId: booking.expert.user.id,
        event: "BOOKING_CANCELLED",
        recipient: booking.expert.user.email,
        subject: "Booking Refunded by Administrator",
        body: `Booking ${bookingId} was refunded to the client by an administrator. Reason: ${reason}`,
      }).catch((e) => logger.error("Failed to write refund notification to expert", { e }));

      sendBookingCancelledEmail(booking.expert.user.email, {
        recipientName: booking.expert.displayName ?? "Expert",
        cancelledBy: "Administrator (Refunded)",
        reason,
        refunded: true,
        bookingId,
      }, expertLang).catch((e) => logger.error("Failed to send cancellation email to expert", { e }));
    }

    // Create adminAction log
    await prisma.adminAction.create({
      data: {
        adminUserId,
        action: "MANUAL_REFUND",
        reason,
        metadata: { bookingId, percentage },
      },
    });

    logger.info("Admin manually refunded booking", { bookingId, adminUserId, percentage });
  },

  /**
   * Admin: Get booking stats
   */
  getBookingStats: async (dateFrom?: string, dateTo?: string) => {
    const from = dateFrom
      ? dateFrom.length <= 10
        ? new Date(`${dateFrom}T00:00:00.000Z`)
        : new Date(dateFrom)
      : undefined;
    const to = dateTo
      ? dateTo.length <= 10
        ? new Date(`${dateTo}T23:59:59.999Z`)
        : new Date(dateTo)
      : undefined;
    return BookingRepository.getStats(from, to);
  },

  /**
   * Retry payment for a booking that failed or expired.
   * Re-initializes the MNO checkout push to the citizen's phone.
   */
  retryPayment: async (
    bookingId: string,
    userId: string,
    dto: { paymentMNO?: string; paymentPhoneNumber?: string }
  ) => {
    const booking = await BookingRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));
    }

    // Only the citizen who owns this booking can retry payment
    if (booking.citizenId !== userId) {
      throw new AuthorizationError("Unauthorized to retry payment for this booking");
    }

    // Booking-first mode has no payment to retry.
    const paymentMode = await AdminSettingService.get("paymentMode");
    if (paymentMode === "BOOKING_FIRST") {
      throw new ValidationError("Payment is not required for this booking");
    }

    // H2: Can only retry PENDING bookings
    if (booking.status !== "PENDING") {
      throw new ValidationError(
        `Cannot retry payment for booking in ${booking.status} state. Only PENDING bookings can be retried.`
      );
    }

    if (booking.paymentStatus === "PAID") {
      throw new ValidationError("Payment already completed for this booking");
    }

    // Get citizen details for payment
    const citizen = await BookingRepository.findCitizenForBooking(userId);
    if (!citizen) throw new NotFoundError("Citizen not found");

    if (!citizen.phone && !dto.paymentPhoneNumber) {
      throw new ValidationError("Phone number is required for Mobile Money payment");
    }

    if (!citizen.phone && dto.paymentPhoneNumber) {
      await prisma.user.update({
        where: { id: userId },
        data: { phone: dto.paymentPhoneNumber },
      });
      citizen.phone = dto.paymentPhoneNumber;
    }

    // Get the service for the amount
    const service = await ServicesRepository.findById(booking.serviceId);
    if (!service) throw new NotFoundError("Service not found");

    // Re-initialize Azam Pay MNO payment
    const citizenName = [citizen.firstName, citizen.lastName].filter(Boolean).join(" ") || "Client";
    const amount = Number(service.flatFee);
    if (!amount || amount <= 0) {
      throw new ValidationError("Service fee is invalid");
    }

    const { transactionId } = await AzamPayService.initializeMnoPayment({
      bookingId: booking.id,
      amount,
      currency: service.currency || "RWF",
      mno: dto.paymentMNO || "MTN",
      phoneNumber: dto.paymentPhoneNumber || citizen.phone || "",
      citizenEmail: citizen.email,
      citizenName,
    });

    // Update booking with new payment reference and reset status
    const updatedBooking = await BookingRepository.update(booking.id, {
      paymentReferenceId: transactionId,
      status: "PENDING",
      paymentStatus: "PENDING",
      cancellationReason: undefined,
    });

    logger.info("Payment retried for booking", {
      bookingId: booking.id,
      transactionId,
    });

    await writeAuditLog({
      actorId: userId,
      action: "PAYMENT",
      resource: "BOOKING",
      resourceId: booking.id,
      description: `Payment retry initiated for booking`,
      metadata: { transactionId },
    });

    return {
      booking: updatedBooking,
      payment: {
        paymentLink: null,
        txRef: transactionId,
        amount: Number(service.flatFee),
        currency: service.currency || "RWF",
      },
    };
  },

  /**
   * Reschedule a booking to a new time slot.
   * Only works for PENDING or CONFIRMED bookings before scheduledStart.
   */
  rescheduleBooking: async (
    bookingId: string,
    userId: string,
    role: string,
    dto: { scheduledStart: string; scheduledEnd: string; reason?: string }
  ) => {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));

    // Only PENDING, CONFIRMED, or ACTIVE can be rescheduled
    if (!["PENDING", "CONFIRMED", "ACTIVE"].includes(booking.status)) {
      throw new ValidationError(`Cannot reschedule a ${booking.status.toLowerCase()} booking`);
    }

    // Authorization: citizen who owns the booking, expert who owns the booking, or admin
    const expertUserId = await resolveExpertIdForUser(userId, role);
    const isCitizen = role === "CITIZEN" && booking.citizenId === userId;
    const isExpert = role === "EXPERT" && booking.expertId === expertUserId;
    const isAdmin = role === "ADMIN";
    if (!isCitizen && !isExpert && !isAdmin) {
      throw new AuthorizationError("Not authorized to reschedule this booking");
    }

    // If there's already a pending reschedule request, only allow the OTHER party to approve/decline it
    if (booking.pendingRescheduleStart && !isAdmin) {
      if (booking.pendingRescheduleRequestedBy === userId) {
        throw new ValidationError("You already have a pending reschedule request. Wait for the other party to respond.");
      }
    }

    const newStart = new Date(dto.scheduledStart);
    const newEnd = new Date(dto.scheduledEnd);

    if (newStart <= new Date()) {
      throw new ValidationError("New time must be in the future");
    }
    if (newEnd <= newStart) {
      throw new ValidationError("End time must be after start time");
    }

    // Check availability for the expert at the new time
    const existingBookings = await BookingRepository.getByDateRange(
      booking.expertId,
      newStart,
      newEnd
    );

    // Exclude the current booking from conflict check
    const conflicts = existingBookings.filter((b: { id: string }) => b.id !== bookingId);
    if (conflicts.length > 0) {
      throw new ConflictError("Expert is not available at the new time");
    }

    // Store as pending reschedule request (not applied yet)
    const updatedBooking = await BookingRepository.update(bookingId, {
      pendingRescheduleStart: newStart,
      pendingRescheduleEnd: newEnd,
      pendingRescheduleReason: dto.reason ?? null,
      pendingRescheduleRequestedBy: userId,
    });

    // Audit log
    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "BOOKING",
      resourceId: bookingId,
      description: `Reschedule requested from ${booking.scheduledStart} to ${newStart}${dto.reason ? `: ${dto.reason}` : ""}`,
      metadata: { oldStart: booking.scheduledStart, newStart, reason: dto.reason, action: "REQUESTED" },
    });

    // Notify the other party
    const full = await BookingRepository.findFullBookingById(bookingId);
    if (full) {
      const rescheduledBy = isExpert ? "Expert" : isCitizen ? "Client" : "Admin";
      const recipientEmail = isExpert ? full.citizen?.email : full.expert?.user?.email;
      const recipientName = isExpert ? full.citizen?.firstName : full.expert?.displayName;
      const recipientLanguage = (isExpert
        ? (full.citizen?.preferredLanguage as 'en' | 'fr' | 'rw')
        : (full.expert?.user?.preferredLanguage as 'en' | 'fr' | 'rw')) || 'en';

      if (recipientEmail) {
        const newDateStr = newStart.toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
        const newTimeStr = newStart.toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit",
        });
        const currentDateStr = new Date(booking.scheduledStart).toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
        const currentTimeStr = new Date(booking.scheduledStart).toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit",
        });

        sendRescheduleRequestEmail(recipientEmail, {
          recipientName: recipientName || "",
          serviceName: full.service?.name ?? "Consultation",
          currentDate: currentDateStr,
          currentTime: currentTimeStr,
          newDate: newDateStr,
          newTime: newTimeStr,
          reason: dto.reason,
          rescheduledBy,
          bookingId,
        }, recipientLanguage).catch((e) => logger.error("Reschedule request notification email failed", { e }));
      }
    }

    logger.info("Reschedule requested", { bookingId, oldStart: booking.scheduledStart, newStart, requestedBy: userId });

    return { booking: updatedBooking };
  },

  approveReschedule: async (
    bookingId: string,
    userId: string,
    role: string,
  ) => {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));

    if (!booking.pendingRescheduleStart) {
      throw new ValidationError("No pending reschedule request for this booking");
    }

    // Authorization: only the OTHER party (not the requester) can approve
    const expertUserId = await resolveExpertIdForUser(userId, role);
    const isCitizen = role === "CITIZEN" && booking.citizenId === userId;
    const isExpert = role === "EXPERT" && booking.expertId === expertUserId;
    const isAdmin = role === "ADMIN";
    if (!isCitizen && !isExpert && !isAdmin) {
      throw new AuthorizationError("Not authorized to approve this reschedule");
    }

    if (!isAdmin && booking.pendingRescheduleRequestedBy === userId) {
      throw new ValidationError("You cannot approve your own reschedule request");
    }

    const newStart = booking.pendingRescheduleStart;
    const newEnd = booking.pendingRescheduleEnd!;

    // Final conflict check (slot may have been taken since request)
    const existingBookings = await BookingRepository.getByDateRange(
      booking.expertId,
      newStart,
      newEnd
    );
    const conflicts = existingBookings.filter((b: { id: string }) => b.id !== bookingId);
    if (conflicts.length > 0) {
      throw new ConflictError("Expert is no longer available at the requested time. The requester should submit a new request.");
    }

    // Refresh LiveKit room if video consultation
    const isVideoMeeting = !booking.service?.deliveryMode || booking.service.deliveryMode === "VIDEO";
    let meetingRoomId = booking.meetingRoomId;
    let meetingJoinUrl = booking.meetingJoinUrl;
    if (isVideoMeeting) {
      try {
        const durationMin = booking.service?.durationMin ?? 30;
        meetingRoomId = await LiveKitService.createRoom(bookingId, durationMin);
        meetingJoinUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/bookings/${bookingId}/join`;
      } catch (err) {
        logger.error("Failed to refresh LiveKit room on reschedule approval", { bookingId, err });
      }
    }

    // Apply the reschedule with fresh clean session state (Escrow stays safely locked)
    const updatedBooking = await BookingRepository.update(bookingId, {
      status: "CONFIRMED",
      scheduledStart: newStart,
      scheduledEnd: newEnd,
      meetingRoomId,
      meetingJoinUrl,
      actualStartTime: null,
      actualEndTime: null,
      actualDurationMin: null,
      deliveredAt: null,
      deliverySummary: null,
      autoReleaseAt: null,
      issueReportedAt: null,
      issueReason: null,
      pendingRescheduleStart: null,
      pendingRescheduleEnd: null,
      pendingRescheduleReason: null,
      pendingRescheduleRequestedBy: null,
    });

    // Audit log
    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "BOOKING",
      resourceId: bookingId,
      description: `Reschedule approved: moved to ${newStart}`,
      metadata: { newStart, approvedBy: userId },
    });

    // Notify requester
    const full = await BookingRepository.findFullBookingById(bookingId);
    if (full) {
      const approvedBy = isExpert ? "Expert" : isCitizen ? "Client" : "Admin";
      const requesterEmail = isExpert
        ? full.citizen?.email
        : full.expert?.user?.email;
      const requesterLanguage = (isExpert
        ? (full.citizen?.preferredLanguage as 'en' | 'fr' | 'rw')
        : (full.expert?.user?.preferredLanguage as 'en' | 'fr' | 'rw')) || 'en';

      if (requesterEmail) {
        const newDateStr = newStart.toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        });
        const newTimeStr = newStart.toLocaleTimeString("en-GB", {
          hour: "2-digit", minute: "2-digit",
        });

        sendRescheduleAcceptedEmail(requesterEmail, {
          recipientName: "",
          serviceName: full.service?.name ?? "Consultation",
          newDate: newDateStr,
          newTime: newTimeStr,
          approvedBy,
          bookingId,
        }, requesterLanguage).catch((e) => logger.error("Reschedule approval email failed", { e }));
      }
    }

    logger.info("Reschedule approved", { bookingId, newStart, approvedBy: userId });

    return { booking: updatedBooking };
  },

  declineReschedule: async (
    bookingId: string,
    userId: string,
    role: string,
    reason?: string,
  ) => {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError(getErrorMessage('BOOKING_NOT_FOUND'));

    if (!booking.pendingRescheduleStart) {
      throw new ValidationError("No pending reschedule request for this booking");
    }

    // Authorization: only the OTHER party can decline
    const expertUserId = await resolveExpertIdForUser(userId, role);
    const isCitizen = role === "CITIZEN" && booking.citizenId === userId;
    const isExpert = role === "EXPERT" && booking.expertId === expertUserId;
    const isAdmin = role === "ADMIN";
    if (!isCitizen && !isExpert && !isAdmin) {
      throw new AuthorizationError("Not authorized to decline this reschedule");
    }

    if (!isAdmin && booking.pendingRescheduleRequestedBy === userId) {
      throw new ValidationError("You cannot decline your own reschedule request");
    }

    // Clear the pending reschedule
    const updatedBooking = await BookingRepository.update(bookingId, {
      pendingRescheduleStart: null,
      pendingRescheduleEnd: null,
      pendingRescheduleReason: null,
      pendingRescheduleRequestedBy: null,
    });

    // Audit log
    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "BOOKING",
      resourceId: bookingId,
      description: `Reschedule declined${reason ? `: ${reason}` : ""}`,
      metadata: { declinedBy: userId, reason },
    });

    // Notify requester
    const full = await BookingRepository.findFullBookingById(bookingId);
    if (full) {
      const declinedBy = isExpert ? "Expert" : isCitizen ? "Client" : "Admin";
      const requesterEmail = isExpert
        ? full.citizen?.email
        : full.expert?.user?.email;
      const requesterLanguage = (isExpert
        ? (full.citizen?.preferredLanguage as 'en' | 'fr' | 'rw')
        : (full.expert?.user?.preferredLanguage as 'en' | 'fr' | 'rw')) || 'en';

      if (requesterEmail) {
        sendRescheduleDeclinedEmail(requesterEmail, {
          recipientName: "",
          serviceName: full.service?.name ?? "Consultation",
          declinedBy,
          reason,
        }, requesterLanguage).catch((e) => logger.error("Reschedule decline email failed", { e }));
      }
    }

    logger.info("Reschedule declined", { bookingId, declinedBy: userId, reason });

    return { booking: updatedBooking };
  },

  /**
   * Expert marks consultation delivered (for PHONE, IN_PERSON, CHAT or completed VIDEO).
   * Initiates 24-hour client confirmation countdown before escrow auto-releases.
   */
  markConsultationDelivered: async (
    bookingId: string,
    userId: string,
    role: string,
    dto: { deliverySummary?: string }
  ) => {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError(getErrorMessage("BOOKING_NOT_FOUND"));

    const expertUserId = await resolveExpertIdForUser(userId, role);
    const isExpert = role === "EXPERT" && booking.expertId === expertUserId;
    const isAdmin = role === "ADMIN";
    if (!isExpert && !isAdmin) {
      throw new AuthorizationError("Only the assigned expert or an admin can mark consultation delivered");
    }

    if (!["CONFIRMED", "ACTIVE"].includes(booking.status)) {
      throw new ValidationError(`Cannot mark consultation delivered in ${booking.status} state`);
    }

    const now = new Date();

    // Guard: Live consultation cannot be marked delivered before scheduled appointment start time
    const isLiveSession = (booking.service as any)?.deliveryMode !== "EMAIL";
    if (isLiveSession && now < booking.scheduledStart) {
      throw new ValidationError("You cannot mark a consultation delivered before its scheduled start time.");
    }

    // Anti-Bypass Guard (Gap 1): Cannot mark delivered while an active client dispute is pending admin review
    if (booking.issueReportedAt) {
      throw new ValidationError("Cannot mark consultation delivered while a client dispute is under active review by administration.");
    }

    // 24 hours from now
    const autoReleaseAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const updated = await BookingRepository.update(bookingId, {
      status: "ACTIVE",
      deliveredAt: now,
      deliverySummary: dto.deliverySummary ?? null,
      autoReleaseAt,
    });

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "BOOKING",
      resourceId: bookingId,
      description: `Expert marked consultation delivered. Auto-release scheduled for ${autoReleaseAt.toISOString()}`,
      metadata: { deliverySummary: dto.deliverySummary, autoReleaseAt },
    });

    // In-app notification to Citizen
    try {
      await NotificationRepository.create({
        userId: booking.citizenId,
        event: "BOOKING_CONFIRMED",
        recipient: booking.citizen.email,
        subject: "Consultation marked as completed by your expert",
        body: `Your expert marked your consultation for ${booking.service?.name} as completed. Please confirm to release payment, or report an issue within 24 hours.`,
      });
    } catch (err) {
      logger.error("Failed to notify citizen of delivery", { bookingId, err });
    }

    // Fire-and-forget: Urgent email to citizen alerting of 24h auto-release countdown
    if (booking.citizen?.email) {
      const citizenLang = ((booking.citizen as any).preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
      const expertName = booking.expert?.displayName ?? "Expert";
      sendConsultationDeliveredEmail(booking.citizen.email, {
        recipientName: booking.citizen.firstName ?? "Client",
        expertName,
        serviceName: booking.service?.name ?? "Consultation",
        bookingId,
        deliverySummary: dto.deliverySummary ?? null,
      }, citizenLang).catch((err) => logger.error("Failed to send consultation delivered email to citizen", { bookingId, err }));
    }

    logger.info("Consultation marked delivered by expert", { bookingId, autoReleaseAt });
    return BookingRepository.findById(bookingId);
  },

  /**
   * Citizen confirms consultation completion.
   * Completes booking and releases escrow to expert MoMo wallet.
   */
  confirmConsultationCompletion: async (
    bookingId: string,
    userId: string,
    role: string
  ) => {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError(getErrorMessage("BOOKING_NOT_FOUND"));

    const isCitizen = role === "CITIZEN" && booking.citizenId === userId;
    const isAdmin = role === "ADMIN";
    if (!isCitizen && !isAdmin) {
      throw new AuthorizationError("Only the client or an admin can confirm consultation completion");
    }

    if (!["CONFIRMED", "ACTIVE"].includes(booking.status)) {
      throw new ValidationError(`Cannot confirm completion in ${booking.status} state`);
    }

    const now = new Date();
    const paymentMode = await AdminSettingService.get("paymentMode");

    if (paymentMode === "PAYMENT_REQUIRED") {
      await EscrowService.releaseEscrow(bookingId);
    } else {
      await BookingRepository.update(bookingId, {
        status: "COMPLETED",
        completedAt: now,
      });
    }

    await BookingRepository.update(bookingId, {
      autoReleaseAt: null,
      issueReportedAt: null,
      issueReason: null,
    });

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "BOOKING",
      resourceId: bookingId,
      description: "Citizen confirmed consultation completion. Escrow released.",
    });

    // Notify Expert
    const full = await BookingRepository.findFullBookingById(bookingId);
    if (full?.expert?.user?.email) {
      try {
        await NotificationRepository.create({
          userId: full.expert.user.id ?? "",
          event: "PAYMENT_SUCCESS",
          recipient: full.expert.user.email,
          subject: "Consultation confirmed & payment released",
          body: `Client confirmed completion for ${full.service?.name}. Payout is processing to your Mobile Money wallet.`,
        });
      } catch (err) {
        logger.error("Failed to notify expert of client confirmation", { bookingId, err });
      }
    }

    logger.info("Consultation confirmed by citizen", { bookingId, userId });
    return BookingRepository.findById(bookingId);
  },

  /**
   * Citizen reports an issue (e.g. expert did not call, call dropped).
   * Pauses auto-release timer and flags booking for mutual reschedule.
   */
  reportConsultationIssue: async (
    bookingId: string,
    userId: string,
    role: string,
    dto: { reason: string }
  ) => {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError(getErrorMessage("BOOKING_NOT_FOUND"));

    const isCitizen = role === "CITIZEN" && booking.citizenId === userId;
    const isAdmin = role === "ADMIN";
    if (!isCitizen && !isAdmin) {
      throw new AuthorizationError("Only the client or an admin can report an issue");
    }

    if (!["CONFIRMED", "ACTIVE"].includes(booking.status)) {
      throw new ValidationError(`Cannot report issue in ${booking.status} state`);
    }

    const now = new Date();
    const updated = await BookingRepository.update(bookingId, {
      issueReportedAt: now,
      issueReason: dto.reason,
      autoReleaseAt: null, // Freeze 24h auto-release!
    });

    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "BOOKING",
      resourceId: bookingId,
      description: `Citizen reported consultation issue: ${dto.reason}. Auto-release paused.`,
      metadata: { reason: dto.reason },
    });

    // Notify Expert
    const full = await BookingRepository.findFullBookingById(bookingId);
    const clientFullName = `${full?.citizen?.firstName ?? "Client"} ${full?.citizen?.lastName ?? ""}`.trim();
    const serviceName = full?.service?.name ?? "Consultation";

    if (full?.expert?.user?.email) {
      try {
        await NotificationRepository.create({
          userId: full.expert.user.id ?? "",
          event: "BOOKING_CANCELLED",
          recipient: full.expert.user.email,
          subject: "Client reported an issue regarding your consultation",
          body: `Client reported: "${dto.reason}". You can discuss via messages or propose a free reschedule.`,
        });
      } catch (err) {
        logger.error("Failed to notify expert of issue report", { bookingId, err });
      }

      // Email notification to expert
      const expertLanguage = (full.expert.user.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
      sendConsultationIssueReportedEmail(full.expert.user.email, {
        recipientName: full.expert.displayName ?? "Expert",
        clientName: clientFullName,
        serviceName,
        bookingId,
        reason: dto.reason,
        isAdminNotification: false,
      }, expertLanguage).catch((err) => logger.error("Failed to send issue report email to expert", { bookingId, err }));
    }

    // Email notification to Platform Support Desk / Admin
    const supportEmail = process.env.SUPPORT_EMAIL || "support@myjudicial.com";
    sendConsultationIssueReportedEmail(supportEmail, {
      recipientName: "MyJudicial Support Desk",
      clientName: clientFullName,
      serviceName,
      bookingId,
      reason: dto.reason,
      isAdminNotification: true,
    }, 'en').catch((err) => logger.error("Failed to send issue report email to admin", { bookingId, err }));

    logger.info("Consultation issue reported by citizen", { bookingId, reason: dto.reason });
    return BookingRepository.findById(bookingId);
  },
};
