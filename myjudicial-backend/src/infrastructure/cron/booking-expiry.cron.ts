import cron from "node-cron";
import { prisma } from "../database/prisma.js";
import { logger } from "../../shared/utils/logger.js";
import { AdminSettingService } from "../../modules/settings/admin-setting.service.js";
import { EscrowService } from "../../modules/payments/escrow.service.js";

const EXPIRY_MINUTES = 30;

/**
 * Booking Expiry Cron — runs every 5 minutes.
 *
 * Finds PENDING bookings whose payment has not been confirmed within
 * EXPIRY_MINUTES of creation.
 *
 * IMPORTANT: Before expiring any booking that has a `paymentReferenceId`,
 * actively queries AzamPay v2 (`EscrowService.reconcileBookingPayment`) to verify
 * whether the citizen actually paid while a webhook was delayed. Only bookings
 * that remain unpaid after live reconciliation are marked CANCELLED.
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
    let recoveredCount = 0;
    try {
      const staleCandidates = await prisma.booking.findMany({
        where: {
          status: "PENDING",
          paymentStatus: { in: ["PENDING", "FAILED"] },
          createdAt: { lt: cutoff },
        },
        select: {
          id: true,
          paymentStatus: true,
          paymentReferenceId: true,
        },
        take: 50,
      });

      for (const candidate of staleCandidates) {
        if (candidate.paymentStatus === "PENDING" && candidate.paymentReferenceId) {
          const reconciled = await EscrowService.reconcileBookingPayment(candidate.id);
          if (reconciled.paymentStatus === "PAID") {
            recoveredCount++;
            continue;
          }
        }

        const res = await prisma.booking.updateMany({
          where: {
            id: candidate.id,
            status: "PENDING",
            paymentStatus: { in: ["PENDING", "FAILED"] },
          },
          data: {
            status: "CANCELLED",
            cancellationReason: `Payment not received within ${EXPIRY_MINUTES} minutes — booking expired`,
          },
        });
        expiredCount += res.count;
      }
    } catch (err) {
      logger.error("Booking expiry cron: DB update failed", { err });
      return;
    }

    if (expiredCount > 0 || recoveredCount > 0) {
      logger.info("Booking expiry cron: processed stale PENDING bookings", {
        expiredCount,
        recoveredCount,
      });
    } else {
      logger.info("Booking expiry cron: no expired bookings found");
    }
  });

  logger.info(`Booking expiry cron scheduled — runs every 5 minutes (expiry threshold: ${EXPIRY_MINUTES} min)`);
};
