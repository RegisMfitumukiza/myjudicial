import cron from "node-cron";
import { prisma } from "../database/prisma.js";
import { logger } from "../../shared/utils/logger.js";
import { EscrowService } from "../../modules/payments/escrow.service.js";
import { BookingRepository } from "../../modules/bookings/booking.repository.js";
import { NotificationRepository } from "../../modules/notifications/notification.repository.js";
import { writeAuditLog } from "../../shared/utils/audit.js";
import { AdminSettingService } from "../../modules/settings/admin-setting.service.js";

/**
 * Consultation Auto-Release Cron — runs every 10 minutes.
 *
 * Checks for consultations marked as delivered by the expert whose 24-hour
 * review period has elapsed without any client dispute or issue report.
 * Automatically completes the booking and releases escrow payout to the
 * expert's Mobile Money wallet.
 */
export const startConsultationAutoReleaseCron = (): void => {
  cron.schedule("*/10 * * * *", async () => {
    const now = new Date();

    try {
      const matureDeliveries = await prisma.booking.findMany({
        where: {
          status: { in: ["CONFIRMED", "ACTIVE"] },
          deliveredAt: { not: null },
          autoReleaseAt: { lte: now },
          issueReportedAt: null,
        },
        include: {
          service: true,
          expert: { include: { user: { select: { id: true, email: true } } } },
          citizen: { select: { id: true, email: true, firstName: true } },
          payment: true,
        },
      });

      if (matureDeliveries.length === 0) {
        return;
      }

      logger.info("Consultation auto-release cron: processing mature deliveries", {
        count: matureDeliveries.length,
      });

      const paymentMode = await AdminSettingService.get("paymentMode");

      for (const booking of matureDeliveries) {
        try {
          if (paymentMode === "PAYMENT_REQUIRED" && booking.payment) {
            await EscrowService.releaseEscrow(booking.id);
          } else {
            await BookingRepository.update(booking.id, {
              status: "COMPLETED",
              completedAt: now,
            });
          }

          await BookingRepository.update(booking.id, {
            autoReleaseAt: null,
          });

          await writeAuditLog({
            actorId: "SYSTEM",
            action: "UPDATE",
            resource: "BOOKING",
            resourceId: booking.id,
            description: "24-hour review window elapsed without dispute. Consultation auto-completed and escrow released.",
          });

          // In-app notification to Citizen
          try {
            await NotificationRepository.create({
              userId: booking.citizenId,
              event: "BOOKING_CONFIRMED",
              recipient: booking.citizen.email,
              subject: "Consultation finalized",
              body: `Your consultation for ${booking.service?.name} has been concluded. Thank you for using MyJudicial.`,
            });
          } catch (notifyErr) {
            logger.error("Failed to notify citizen of auto-release", { bookingId: booking.id, notifyErr });
          }

          // In-app notification to Expert
          if (booking.expert?.user?.email) {
            try {
              await NotificationRepository.create({
                userId: booking.expert.user.id,
                event: "PAYMENT_SUCCESS",
                recipient: booking.expert.user.email,
                subject: "Consultation payout released",
                body: `24-hour confirmation window elapsed for ${booking.service?.name}. Payout is processing to your Mobile Money wallet.`,
              });
            } catch (notifyErr) {
              logger.error("Failed to notify expert of auto-release", { bookingId: booking.id, notifyErr });
            }
          }

          logger.info("Consultation auto-released successfully", { bookingId: booking.id });
        } catch (releaseErr) {
          logger.error("Failed to auto-release consultation", { bookingId: booking.id, releaseErr });
        }
      }
    } catch (queryErr) {
      logger.error("Consultation auto-release cron: query failed", { queryErr });
    }
  });

  logger.info("Consultation auto-release cron scheduled — runs every 10 minutes (24h review window)");
};
