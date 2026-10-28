import type { Request, Response } from "express";
import { WebhookReceiver } from "livekit-server-sdk";
import { logger } from "../../shared/utils/logger.js";
import { EscrowService } from "../../modules/payments/escrow.service.js";
import { BookingRepository } from "../../modules/bookings/booking.repository.js";
import { BookingService } from "../../modules/bookings/booking.service.js";
import { EscrowLedgerRepository } from "../../modules/payments/escrow.repository.js";
import { AdminSettingService } from "../../modules/settings/admin-setting.service.js";
import { NotificationRepository } from "../../modules/notifications/notification.repository.js";
import { prisma } from "../database/prisma.js";
import { writeAuditLog } from "../../shared/utils/audit.js";

const getLiveKitWebhookReceiver = (): WebhookReceiver => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set");
  }

  return new WebhookReceiver(apiKey, apiSecret);
};

export const LiveKitWebhookController = {
  /**
   * POST /api/v1/livekit/webhook
   * LiveKit server sends event notifications here.
   *
   * Handled events:
   * - room_started: mark booking as ACTIVE, record actualStartTime
   * - room_finished: record actualEndTime/duration, trigger escrow release or refund
   * - participant_joined: track first join for no-show detection
   * - participant_left: track departures
   */
  handleWebhook: async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers["authorization"] as string | undefined;

    let event: Awaited<ReturnType<WebhookReceiver["receive"]>>;

    try {
      const receiver = getLiveKitWebhookReceiver();
      const body =
        typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body);
      event = await receiver.receive(body, authHeader);
    } catch (err: any) {
      logger.warn("LiveKit webhook auth/parse failed", { error: err?.message });
      res.status(401).json({ error: "Unauthorized or invalid webhook payload" });
      return;
    }

    logger.info("LiveKit webhook received", {
      event: event.event,
      room: event.room?.name,
    });

    // ── room_started: consultation began ─────────────────────────────────────
    if (event.event === "room_started" && event.room?.name) {
      const roomName = event.room.name;

      if (!roomName.startsWith("consultation_")) {
        res.status(200).json({ received: true });
        return;
      }

      const bookingId = roomName.replace("consultation_", "");

      try {
        const booking = await BookingRepository.findById(bookingId);

        if (!booking) {
          logger.warn("LiveKit room_started: booking not found", { bookingId });
          res.status(200).json({ received: true });
          return;
        }

        if (booking.status === "CONFIRMED") {
          await BookingRepository.update(bookingId, {
            status: "ACTIVE",
            actualStartTime: new Date(),
          });
          logger.info("Booking marked ACTIVE with actualStartTime", { bookingId });

          // Update Escrow_Ledger to HELD_IN_ESCROW
          await EscrowLedgerRepository.updateStatus(bookingId, "HELD_IN_ESCROW");
          logger.info("EscrowLedger updated to HELD_IN_ESCROW", { bookingId });

          await writeAuditLog({
            actorId: booking.citizenId,
            action: "UPDATE",
            resource: "BOOKING",
            resourceId: bookingId,
            description: "Consultation started — booking set to ACTIVE, escrow set to HELD_IN_ESCROW",
          });
        } else if (booking.status === "ACTIVE" && !booking.actualStartTime) {
          // Room restarted — backfill actualStartTime if missing
          await BookingRepository.update(bookingId, { actualStartTime: new Date() });
          logger.info("Backfilled actualStartTime on room restart", { bookingId });
        }
      } catch (err) {
        logger.error("Error handling room_started event", { bookingId, err });
      }
    }

    // ── room_finished: consultation ended ────────────────────────────────────
    if (event.event === "room_finished" && event.room?.name) {
      const roomName = event.room.name;

      if (!roomName.startsWith("consultation_")) {
        res.status(200).json({ received: true });
        return;
      }

      const bookingId = roomName.replace("consultation_", "");

      try {
        const booking = await BookingRepository.findById(bookingId);

        if (!booking) {
          logger.warn("LiveKit room_finished: booking not found", { bookingId });
          res.status(200).json({ received: true });
          return;
        }

        if (booking.status === "ACTIVE" || booking.status === "CONFIRMED") {
          if (booking.actualEndTime) {
            logger.info("LiveKit room_finished skipped — booking already finalized", { bookingId });
            res.status(200).json({ received: true });
            return;
          }

          const now = new Date();
          const roomStartedAt = event.room.creationTime
            ? new Date(Number(event.room.creationTime) * 1000)
            : booking.actualStartTime ?? now;
          const durationSec = Math.floor((now.getTime() - roomStartedAt.getTime()) / 1000);
          const durationMin = Math.max(1, Math.ceil(durationSec / 60));

          // Record actual end time and duration
          await BookingRepository.update(bookingId, {
            actualEndTime: now,
            actualDurationMin: durationMin,
          });
          logger.info("Recorded actualEndTime and duration", {
            bookingId,
            durationSec,
            durationMin,
          });

          const minEscrowSec = await AdminSettingService.get("minEscrowDurationSeconds");

          // NOTE [Consultation Lifecycle & Escrow Settlement Policy (OD-02: Unified Delivery Confirmation)]:
          // In accordance with OD-02, video consultations require explicit delivery confirmation
          // across all consultation modes. When a video room concludes with duration >= minEscrowSec,
          // escrow funds are NOT instantly captured or released. Instead, the session transitions to
          // "Awaiting Delivery" where the expert must record consultation notes (via markConsultationDelivered).
          // This initiates the standard 24-hour client review and dispute protection window before auto-release.
          if (durationSec >= minEscrowSec) {
            logger.info("Video consultation finished with valid duration; awaiting expert delivery confirmation", {
              bookingId,
              durationSec,
              minEscrowSec,
            });

            // In-app notification to Expert to submit delivery notes
            const expertUserId = (booking.expert as any)?.user?.id;
            const expertEmail = (booking.expert as any)?.user?.email;
            if (expertUserId) {
              try {
                await NotificationRepository.create({
                  userId: expertUserId,
                  event: "BOOKING_CONFIRMED",
                  recipient: expertEmail || "",
                  subject: "Video consultation completed — please record delivery",
                  body: `Your video consultation for ${booking.service?.name} has concluded (${durationMin} min). Please submit your delivery notes on the dashboard to initiate the 24-hour review window and release escrow funds.`,
                });
              } catch (notifErr) {
                logger.error("Failed to notify expert of session completion", { bookingId, notifErr });
              }
            }

            await writeAuditLog({
              actorId: booking.citizenId,
              action: "UPDATE",
              resource: "BOOKING",
              resourceId: bookingId,
              description: `Video room concluded (${durationSec}s). Escrow securely retained in custody. Awaiting expert delivery confirmation and 24h review window.`,
              metadata: { durationSec, durationMin, minEscrowSec },
            });
          } else {
            // Shorter than configured minimum -> Call interrupted or dropped early.
            // Do NOT cancel the booking immediately; keep escrow locked and allow reconnection or mutual reschedule.
            logger.info("Consultation ended with short duration; flagging for reconnect or reschedule", {
              bookingId,
              durationSec,
              minEscrowSec,
            });
            await BookingRepository.update(bookingId, {
              issueReason: `Consultation disconnected early (${durationSec}s vs min ${minEscrowSec}s required). Reconnect or reschedule available.`,
              actualEndTime: null, // Allow room restart/reconnection
            });
            await writeAuditLog({
              actorId: booking.citizenId,
              action: "UPDATE",
              resource: "BOOKING",
              resourceId: bookingId,
              description: `Video room ended early (${durationSec}s). Escrow retained; booking available for reconnect or free reschedule.`,
            });
          }
        }
      } catch (err) {
        logger.error("Error handling room_finished event", { bookingId, err });
        // Do not retry — always 200 to LiveKit
      }
    }

    // ── participant_joined: track for no-show detection ──────────────────────
    if (event.event === "participant_joined" && event.room?.name) {
      const roomName = event.room.name;
      if (roomName.startsWith("consultation_")) {
        const bookingId = roomName.replace("consultation_", "");
        logger.info("Participant joined consultation room", {
          bookingId,
          participant: event.participant?.identity,
        });
      }
    }

    // ── participant_left: track departures ───────────────────────────────────
    if (event.event === "participant_left" && event.room?.name) {
      const roomName = event.room.name;
      if (roomName.startsWith("consultation_")) {
        const bookingId = roomName.replace("consultation_", "");
        logger.info("Participant left consultation room", {
          bookingId,
          participant: event.participant?.identity,
        });
      }
    }

    res.status(200).json({ received: true });
  },
};
