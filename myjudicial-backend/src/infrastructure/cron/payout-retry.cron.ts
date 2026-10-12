import cron from "node-cron";
import { prisma } from "../database/prisma.js";
import { logger } from "../../shared/utils/logger.js";
import { EscrowService } from "../../modules/payments/escrow.service.js";
import { PaymentStatus } from "../../generated/prisma/client.js";

const MAX_AUTO_RETRIES = 3;
const MIN_AGE_MINUTES = 5;

/**
 * Tier 1 Automated Payout Retry Cron — runs every 15 minutes.
 *
 * Scans for completed consultations whose expert payout has not been sent yet
 * (e.g. due to temporary network timeouts or MNO gateway hiccups).
 * Automatically retries up to 3 times with a 5-minute initial delay.
 * If 3 automatic attempts fail (e.g. invalid wallet, permanent carrier rejection),
 * the item remains in the Dead-Letter Queue ("Failed Settlements") for human review.
 */
export const startPayoutRetryCron = (): void => {
  cron.schedule("*/15 * * * *", async () => {
    const cutoff = new Date(Date.now() - MIN_AGE_MINUTES * 60 * 1000);

    logger.info("Payout retry cron: checking for stalled expert payouts", {
      cutoff: cutoff.toISOString(),
    });

    try {
      // Find completed bookings with paid client payments but missing expert payout
      const stalledPayments = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.PAID,
          payoutSentAt: null,
          booking: {
            status: "COMPLETED",
            completedAt: { lte: cutoff },
            expert: {
              momoNumber: { not: null },
            },
          },
        },
        include: {
          booking: {
            include: {
              expert: {
                select: {
                  id: true,
                  displayName: true,
                  momoNumber: true,
                },
              },
            },
          },
        },
        take: 10,
        orderBy: { updatedAt: "asc" },
      });

      if (stalledPayments.length === 0) {
        logger.info("Payout retry cron: no stalled payouts eligible for retry");
        return;
      }

      logger.info(`Payout retry cron: found ${stalledPayments.length} candidate(s)`);

      for (const payment of stalledPayments) {
        const bookingId = payment.bookingId;
        const expert = payment.booking.expert;

        if (!expert?.momoNumber) {
          continue; // Needs manual intervention from advocate
        }

        // Count previous automatic retry attempts from audit log in last 24h
        const recentAttempts = await prisma.auditLog.count({
          where: {
            action: "PAYMENT",
            resource: "PAYMENT",
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            description: { contains: "Automatic payout retry" },
            metadata: {
              path: ["bookingId"],
              equals: bookingId,
            },
          },
        });

        if (recentAttempts >= MAX_AUTO_RETRIES) {
          logger.warn("Payout retry cron: max automatic retries reached, awaiting admin intervention", {
            bookingId,
            recentAttempts,
            max: MAX_AUTO_RETRIES,
          });
          continue;
        }

        try {
          logger.info("Payout retry cron: attempting automated disbursement", {
            bookingId,
            attempt: recentAttempts + 1,
            momoNumber: expert.momoNumber,
            amount: Number(payment.expertPayout),
          });

          await EscrowService.releaseEscrow(bookingId);

          await prisma.auditLog.create({
            data: {
              actorId: "system_cron",
              action: "PAYMENT",
              resource: "PAYMENT",
              resourceId: payment.id,
              description: `Automatic payout retry succeeded (attempt ${recentAttempts + 1}/${MAX_AUTO_RETRIES})`,
              metadata: {
                bookingId,
                attempt: recentAttempts + 1,
                disbursedAmount: Number(payment.expertPayout),
              } as any,
            },
          });

          logger.info("Payout retry cron: disbursement successfully completed", { bookingId });
        } catch (err: any) {
          logger.error("Payout retry cron: automated disbursement failed", {
            bookingId,
            attempt: recentAttempts + 1,
            error: err?.message || err,
          });

          await prisma.auditLog.create({
            data: {
              actorId: "system_cron",
              action: "PAYMENT",
              resource: "PAYMENT",
              resourceId: payment.id,
              description: `Automatic payout retry failed: ${err?.message || "Unknown error"} (attempt ${recentAttempts + 1}/${MAX_AUTO_RETRIES})`,
              metadata: {
                bookingId,
                attempt: recentAttempts + 1,
                error: err?.message || String(err),
              } as any,
            },
          });
        }
      }
    } catch (err) {
      logger.error("Payout retry cron: query execution failed", { err });
    }
  });

  logger.info("Payout retry cron scheduled — runs every 15 minutes");
};
