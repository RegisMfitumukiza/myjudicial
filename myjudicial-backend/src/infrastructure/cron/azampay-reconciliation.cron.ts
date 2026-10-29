import cron from "node-cron";
import { prisma } from "../database/prisma.js";
import { logger } from "../../shared/utils/logger.js";
import { EscrowService } from "../../modules/payments/escrow.service.js";
import { AdminSettingService } from "../../modules/settings/admin-setting.service.js";
import { PaymentStatus } from "../../generated/prisma/client.js";
import { QueueService } from "../queue/queue.service.js";

/**
 * AzamPay Rwanda v2 Active Status Reconciliation Cron — runs every 2 minutes.
 *
 * Ensures 100% settlement reliability even when upstream MNO / GTBank callbacks are delayed or missed:
 *  1. Pending Collections (`BM-...`):
 *     Queries `GET /api/v2/rw/payments/references/{referenceId}` (§2.4) for `PENDING` bookings
 *     that have an active `paymentReferenceId`. Locks escrow & confirms the booking on `"success"` (`ACSC`),
 *     or marks `paymentStatus = "FAILED"` on `"failure"` (`RJCT`).
 *  2. In-Flight Expert Disbursements (`PO-...`):
 *     Queries `GET /api/v2/rw/transfers/references/{referenceId}` (§3.5) for recent payouts
 *     initiated within the last 2 hours that have not yet logged final settlement confirmation.
 *     If the asynchronous two-step GTBank/Hangfire job failed, reverts `payoutSentAt = null` and
 *     `EscrowLedger.status = "HELD_IN_ESCROW"` so `payout-retry.cron.ts` can retry with a fresh `referenceId`.
 */
export const startAzamPayReconciliationCron = (): void => {
  cron.schedule("*/2 * * * *", async () => {
    await QueueService.withDistributedLock("cron:azampay-reconciliation", 110, async () => {
      try {
      const paymentMode = await AdminSettingService.get("paymentMode");
      if (paymentMode === "BOOKING_FIRST") {
        return;
      }

      // ── 1. Reconcile Pending Booking Collections ────────────────────────────
      const minAgeCutoff = new Date(Date.now() - 10 * 1000); // At least 10s old
      const maxAgeCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // Within last 24h

      const pendingBookings = await prisma.booking.findMany({
        where: {
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentReferenceId: { not: null },
          createdAt: { gte: maxAgeCutoff, lte: minAgeCutoff },
        },
        select: {
          id: true,
          paymentReferenceId: true,
        },
        take: 25,
        orderBy: { createdAt: "asc" },
      });

      if (pendingBookings.length > 0) {
        let paidCount = 0;
        let failedCount = 0;

        for (const b of pendingBookings) {
          const res = await EscrowService.reconcileBookingPayment(b.id);
          if (res.reconciled && res.paymentStatus === "PAID") paidCount++;
          if (res.reconciled && res.paymentStatus === "FAILED") failedCount++;
        }

        if (paidCount > 0 || failedCount > 0) {
          logger.info("AzamPay reconciliation cron: settled pending collections", {
            checked: pendingBookings.length,
            paidCount,
            failedCount,
          });
        }
      }

      // ── 2. Reconcile Recent In-Flight Expert Payout Transfers (`PO-...`) ────
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000); // Allow ~30s for Hangfire Step A + Step B

      const recentPayouts = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.PAID,
          providerPayoutRef: { not: null },
          payoutSentAt: { gte: twoHoursAgo, lte: thirtySecondsAgo },
        },
        select: {
          id: true,
          bookingId: true,
          providerPayoutRef: true,
        },
        take: 15,
        orderBy: { payoutSentAt: "asc" },
      });

      for (const p of recentPayouts) {
        if (!p.providerPayoutRef) continue;

        // Skip if we already recorded final settlement confirmation for this payout reference
        const alreadyConfirmed = await prisma.auditLog.findFirst({
          where: {
            resource: "PAYMENT",
            resourceId: p.id,
            action: "ESCROW_RELEASED",
            description: { contains: p.providerPayoutRef },
          },
          select: { id: true },
        });

        if (alreadyConfirmed) {
          continue;
        }

        await EscrowService.reconcilePayoutTransfer(p.providerPayoutRef);
      }
      } catch (err) {
        logger.error("AzamPay reconciliation cron: cycle failed", { err });
      }
    });
  });

  logger.info("AzamPay reconciliation cron scheduled — runs every 2 minutes");
};
