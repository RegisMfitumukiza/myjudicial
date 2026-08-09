import { prisma } from "../../../infrastructure/database/prisma.js";

export const ComplianceRepository = {
  findByUserId: async (userId: string) => {
    return prisma.expertProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        status: true,
        credentialsExpiry: true,
        lastComplianceCheck: true,
        verifications: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            status: true,
            rejectionReason: true,
            reviewedAt: true,
            createdAt: true,
          },
        },
      },
    });
  },

  updateCredentialsExpiry: async (expertId: string, expiryDate: Date) => {
    return prisma.expertProfile.update({
      where: { id: expertId },
      data: {
        credentialsExpiry: expiryDate,
        lastComplianceCheck: new Date(),
      },
      select: {
        id: true,
        status: true,
        credentialsExpiry: true,
        lastComplianceCheck: true,
      },
    });
  },

  /** Called by cron job — suspends experts whose credentials have expired */
  suspendExpired: async (): Promise<number> => {
    const expiredProfiles = await prisma.expertProfile.findMany({
      where: {
        credentialsExpiry: { lte: new Date() },
        status: "VERIFIED",
      },
      select: { id: true },
    });

    if (expiredProfiles.length === 0) return 0;

    const ids = expiredProfiles.map((p) => p.id);

    await prisma.$transaction([
      prisma.expertProfile.updateMany({
        where: { id: { in: ids } },
        data: { status: "SUSPENDED" },
      }),
      prisma.mapMarker.updateMany({
        where: { expertId: { in: ids } },
        data: { isVisible: false },
      }),
    ]);

    return ids.length;
  },

  /** Find experts expiring within N days — for warning emails */
  findExpiringWithin: async (days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return prisma.expertProfile.findMany({
      where: {
        credentialsExpiry: { lte: cutoff, gt: new Date() },
        status: "VERIFIED",
      },
      select: {
        id: true,
        userId: true,
        displayName: true,
        credentialsExpiry: true,
        user: { select: { email: true, phone: true, preferredLanguage: true } },
      },
    });
  },
};
