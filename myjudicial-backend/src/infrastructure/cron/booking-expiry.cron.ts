import cron from "node-cron";
import { prisma } from "../database/prisma.js";
import { logger } from "../../shared/utils/logger.js";
import { AdminSettingService } from "../../modules/settings/admin-setting.service.js";

const EXPIRY_MINUTES = 30;

/**
 * Booking Expiry Cron — runs every 5 minutes.
 *
 * Finds PENDING bookings whose payment has not been confirmed within
 * EXPIRY_MINUTES of creation, marks them as CANCELLED, and frees the
 * reserved time slots so other clients can book them.
 *
 * Only applies in payment-required mode. In booking-first mode PENDING means
 * "awaiting the expert's response" (not "awaiting payment"), so the sweep is
 * skipped entirely.
 */
export const startBookingExpiryCron = (): void => {
  cron.schedule("*/5 * * * *", async () => {
    const paymentMode = await AdminSettingService.get("paymentMode");
    if (paymentMode === "BOOKING_FIRST") {
      logger.info("Booking expiry cron: skipped (booking-first mode — PENDING means awaiting expert response)");
      return;
    }

    const cutoff = new Date(Date.now() - EXPIRY_MINUTES * 60 * 1000);

    logger.info("Booking expiry cron: checking for expired PENDING bookings", {
      cutoff: cutoff.toISOString(),
    });

    let expiredCount = 0;
    try {
      const result = await prisma.booking.updateMany({
        where: {
          status: "PENDING",
          paymentStatus: "PENDING",
          createdAt: { lt: cutoff },
        },
        data: {
          status: "CANCELLED",
          cancellationReason: `Payment not received within ${EXPIRY_MINUTES} minutes — booking expired`,
        },
      });
      expiredCount = result.count;
    } catch (err) {
      logger.error("Booking expiry cron: DB update failed", { err });
      return;
    }

    if (expiredCount > 0) {
      logger.info("Booking expiry cron: expired stale PENDING bookings", {
        count: expiredCount,
      });
    } else {
      logger.info("Booking expiry cron: no expired bookings found");
    }
  });

  logger.info(`Booking expiry cron scheduled — runs every 5 minutes (expiry threshold: ${EXPIRY_MINUTES} min)`);
};
