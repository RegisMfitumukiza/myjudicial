import cron from "node-cron";
import { prisma } from "../database/prisma.js";
import { logger } from "../../shared/utils/logger.js";
import { BookingService } from "../../modules/bookings/booking.service.js";

const NO_SHOW_GRACE_MINUTES = 30;

/**
 * Escrow Timeout / No-Show Cron — runs every 10 minutes.
 *
 * Finds CONFIRMED bookings whose scheduledEnd + grace period has passed
 * without the consultation ever starting (no room_started event fired).
 * These are treated as no-shows: the booking is cancelled and the citizen
 * receives a refund (minus platform fee if applicable).
 */
export const startEscrowTimeoutCron = (): void => {
  cron.schedule("*/10 * * * *", async () => {
    const graceMs = NO_SHOW_GRACE_MINUTES * 60 * 1000;
    const cutoff = new Date(Date.now() - graceMs);

    logger.info("Escrow timeout cron: checking for no-show CONFIRMED bookings", {
      cutoff: cutoff.toISOString(),
    });

    let count = 0;
    try {
      // Find CONFIRMED bookings past their scheduled end + grace period
      // that never transitioned to ACTIVE (no room_started event)
      const staleBookings = await prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          scheduledEnd: { lt: cutoff },
        },
        select: { id: true, citizenId: true, expertId: true, scheduledEnd: true },
      });

      for (const booking of staleBookings) {
        try {
          await BookingService.cancelBooking(
            booking.id,
            "SYSTEM",
            `No-show: consultation was not joined within ${NO_SHOW_GRACE_MINUTES} minutes of scheduled end`
          );
          count++;
          logger.info("Escrow timeout cron: cancelled no-show booking", {
            bookingId: booking.id,
            scheduledEnd: booking.scheduledEnd,
          });
        } catch (err) {
          logger.error("Escrow timeout cron: failed to cancel booking", {
            bookingId: booking.id,
            err,
          });
        }
      }
    } catch (err) {
      logger.error("Escrow timeout cron: query failed", { err });
      return;
    }

    if (count > 0) {
      logger.info("Escrow timeout cron: cancelled no-show bookings", { count });
    } else {
      logger.info("Escrow timeout cron: no no-shows found");
    }
  });

  logger.info(`Escrow timeout cron scheduled — runs every 10 minutes (grace: ${NO_SHOW_GRACE_MINUTES} min)`);
};
