import cron from "node-cron";
import { prisma } from "../database/prisma.js";
import { logger } from "../../shared/utils/logger.js";
import {
  sendBookingReminderEmail,
} from "../email/email.service.js";
import { NotificationRepository } from "../../modules/notifications/notification.repository.js";

/**
 * Booking Reminder Cron — runs every 5 minutes.
 *
 * Finds CONFIRMED bookings whose scheduledStart is within the next 60-65 minutes
 * that have NOT yet had a reminder sent (reminderSent = false), sends reminder
 * emails and in-app notifications to both citizen and expert, and marks the
 * booking as reminded.
 */
export const startBookingReminderCron = (): void => {
  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();
    const in60min = new Date(now.getTime() + 60 * 60 * 1000);
    const in65min = new Date(now.getTime() + 65 * 60 * 1000);

    logger.info("Booking reminder cron: checking for upcoming consultations", {
      window: { from: in60min.toISOString(), to: in65min.toISOString() },
    });

    let bookings: any[];
    try {
      bookings = await prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          reminderSent: false,
          scheduledStart: {
            gte: in60min,
            lte: in65min,
          },
        },
        include: {
          citizen: { select: { id: true, firstName: true, email: true, preferredLanguage: true } },
          expert: {
            select: {
              displayName: true,
              userId: true,
              user: { select: { id: true, email: true, preferredLanguage: true } },
            },
          },
          service: { select: { name: true } },
        },
      });
    } catch (err) {
      logger.error("Booking reminder cron: DB query failed", { err });
      return;
    }

    for (const booking of bookings) {
      const joinUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/bookings/${booking.id}/join`;
      const scheduledAt = new Date(booking.scheduledStart).toLocaleString("en-RW", {
        timeZone: "Africa/Kigali",
      });
      const expertName = booking.expert?.displayName ?? "Expert";
      const citizenLanguage = (booking.citizen?.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
      const expertLanguage = (booking.expert?.user?.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';

      const notifications: Promise<any>[] = [];

      // Remind citizen
      if (booking.citizen?.email) {
        notifications.push(
          sendBookingReminderEmail(booking.citizen.email, {
            recipientName: booking.citizen.firstName ?? "User",
            expertName,
            scheduledAt,
            bookingId: booking.id,
            joinUrl,
          }, citizenLanguage).catch((e) => { logger.error("Reminder email to citizen failed", { bookingId: booking.id, e }); })
        );

        // In-app notification for citizen
        notifications.push(
          NotificationRepository.create({
            userId: booking.citizen.id,
            event: "BOOKING_REMINDER",
            recipient: booking.citizen.email,
            subject: "Upcoming consultation reminder",
            body: `Your consultation with ${expertName} is scheduled at ${scheduledAt}. Join: ${joinUrl}`,
          }).catch((e) => { logger.error("Reminder in-app to citizen failed", { bookingId: booking.id, e }); })
        );
      }

      // Remind expert
      if (booking.expert?.user?.email) {
        notifications.push(
          sendBookingReminderEmail(booking.expert.user.email, {
            recipientName: expertName,
            expertName,
            scheduledAt,
            bookingId: booking.id,
            joinUrl,
          }, expertLanguage).catch((e) => { logger.error("Reminder email to expert failed", { bookingId: booking.id, e }); })
        );

        // In-app notification for expert
        notifications.push(
          NotificationRepository.create({
            userId: booking.expert.userId,
            event: "BOOKING_REMINDER",
            recipient: booking.expert.user.email,
            subject: "Upcoming consultation reminder",
            body: `Your consultation is scheduled at ${scheduledAt}. Join: ${joinUrl}`,
          }).catch((e) => { logger.error("Reminder in-app to expert failed", { bookingId: booking.id, e }); })
        );
      }

      await Promise.allSettled(notifications);

      // Mark reminder sent — do not block on failure
      try {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true },
        });
        logger.info("Booking reminder sent and marked", { bookingId: booking.id });
      } catch (err) {
        logger.error("Failed to mark reminderSent on booking", { bookingId: booking.id, err });
      }
    }

    if (bookings.length === 0) {
      logger.info("Booking reminder cron: no upcoming consultations in window");
    }
  });

  logger.info("Booking reminder cron scheduled — runs every 5 minutes");
};
