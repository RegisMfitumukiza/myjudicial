import { prisma } from "../../../infrastructure/database/prisma.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { AdminSettingService } from "../../settings/admin-setting.service.js";
import { resolveStorageUrl } from "../../../infrastructure/storage/oci-object-storage.service.js";

async function getCommission(): Promise<number> {
  const pct = await AdminSettingService.get("platformFeePercent");
  return pct / 100;
}

export const EarningsService = {
  getEarnings: async (userId: string) => {
    const profile = await ProfileRepository.findByUserId(userId);

    // Return empty defaults for users who haven't created their expert profile yet.
    if (!profile) {
      return {
        currency: "RWF",
        grossRevenue: 0,
        platformFees: 0,
        netRevenue: 0,
        pendingEscrowBalance: 0,
        completedPayouts: 0,
        recentTransactions: [],
        pendingEscrowHolds: [],
      };
    }

    const expertId = profile.id;
    const commission = await getCommission();

    // All completed bookings with client info and payment records
    const completedBookings = await prisma.booking.findMany({
      where: { expertId, status: "COMPLETED" },
      include: {
        citizen: { select: { firstName: true, lastName: true, avatarObjectKey: true } },
        service: { select: { flatFee: true, currency: true, name: true } },
        payment: { select: { providerPayoutRef: true, payoutSentAt: true, expertPayout: true } },
      },
      orderBy: { completedAt: "desc" },
    });

    const grossRevenue = completedBookings.reduce(
      (sum, b) => sum + Number(b.service.flatFee),
      0
    );
    const platformFees = grossRevenue * commission;
    const netRevenue = grossRevenue - platformFees;

    // Pending bookings (confirmed but not yet completed = money held in escrow)
    const pendingBookings = await prisma.booking.findMany({
      where: { expertId, status: { in: ["CONFIRMED", "ACTIVE"] } },
      include: {
        citizen: { select: { firstName: true, lastName: true, avatarObjectKey: true } },
        service: { select: { flatFee: true, currency: true, name: true } },
        escrowLedger: { select: { status: true, roomId: true, createdAt: true } },
      },
      orderBy: { scheduledStart: "asc" },
    });

    const pendingEscrowBalance = pendingBookings.reduce(
      (sum, b) => sum + Number(b.service.flatFee) * (1 - commission),
      0
    );

    // Resolve avatar URLs in parallel
    const [recentTransactions, pendingEscrowHolds] = await Promise.all([
      Promise.all(
        completedBookings.map(async (b) => {
          const avatarUrl = await resolveStorageUrl(b.citizen?.avatarObjectKey);
          return {
            bookingId: b.id,
            serviceName: b.service.name,
            citizenName: `${b.citizen?.firstName ?? ""} ${b.citizen?.lastName ?? ""}`.trim() || "Client",
            citizenAvatarUrl: avatarUrl,
            amount: b.payment?.expertPayout
              ? Number(b.payment.expertPayout)
              : Number((Number(b.service.flatFee) * (1 - commission)).toFixed(2)),
            currency: b.service.currency,
            completedAt: b.completedAt,
            payoutRef: b.payment?.providerPayoutRef || null,
          };
        })
      ),
      Promise.all(
        pendingBookings.map(async (b) => {
          const avatarUrl = await resolveStorageUrl(b.citizen?.avatarObjectKey);
          return {
            bookingId: b.id,
            serviceName: b.service.name,
            citizenName: `${b.citizen?.firstName ?? ""} ${b.citizen?.lastName ?? ""}`.trim() || "Client",
            citizenAvatarUrl: avatarUrl,
            amount: Number((Number(b.service.flatFee) * (1 - commission)).toFixed(2)),
            currency: b.service.currency,
            scheduledStart: b.scheduledStart,
            status: b.escrowLedger?.status || "LOCKED",
          };
        })
      ),
    ]);

    return {
      currency: profile.currency ?? "RWF",
      grossRevenue: Number(grossRevenue.toFixed(2)),
      platformFees: Number(platformFees.toFixed(2)),
      netRevenue: Number(netRevenue.toFixed(2)),
      pendingEscrowBalance: Number(pendingEscrowBalance.toFixed(2)),
      completedPayouts: completedBookings.length,
      recentTransactions,
      pendingEscrowHolds,
    };
  },
};
