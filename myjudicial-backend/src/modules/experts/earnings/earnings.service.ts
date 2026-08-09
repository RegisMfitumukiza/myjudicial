import { prisma } from "../../../infrastructure/database/prisma.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { AdminSettingService } from "../../settings/admin-setting.service.js";


async function getCommission(): Promise<number> {
  const pct = await AdminSettingService.get("platformFeePercent");
  return pct / 100;
}

export const EarningsService = {
  getEarnings: async (userId: string) => {
    const profile = await ProfileRepository.findByUserId(userId);

    // Return empty defaults for users who haven't created their expert profile yet.
    // Throwing NotFoundError here causes every new expert's dashboard to flood the
    // server logs with 404s before onboarding is complete.
    if (!profile) {
      return {
        currency: "RWF",
        grossRevenue: 0,
        platformFees: 0,
        netRevenue: 0,
        pendingEscrowBalance: 0,
        completedPayouts: 0,
        recentTransactions: [],
      };
    }

    const expertId = profile.id;
    const commission = await getCommission();


    // All completed bookings with their service fees
    const completedBookings = await prisma.booking.findMany({
      where: { expertId, status: "COMPLETED" },
      select: {
        id: true,
        createdAt: true,
        completedAt: true,
        service: { select: { flatFee: true, currency: true, name: true } },
      },
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
      select: {
        id: true,
        scheduledStart: true,
        service: { select: { flatFee: true, currency: true } },
      },
    });

    const pendingEscrowBalance = pendingBookings.reduce(
      (sum, b) => sum + Number(b.service.flatFee) * (1 - commission),
      0
    );

    return {
      currency: profile.currency ?? "RWF",
      grossRevenue: Number(grossRevenue.toFixed(2)),
      platformFees: Number(platformFees.toFixed(2)),
      netRevenue: Number(netRevenue.toFixed(2)),
      pendingEscrowBalance: Number(pendingEscrowBalance.toFixed(2)),
      completedPayouts: completedBookings.length,
      recentTransactions: completedBookings.slice(0, 10).map((b) => ({
        bookingId: b.id,
        serviceName: b.service.name,
        amount: Number((Number(b.service.flatFee) * (1 - commission)).toFixed(2)),
        currency: b.service.currency,
        completedAt: b.completedAt,
      })),
    };
  },
};
