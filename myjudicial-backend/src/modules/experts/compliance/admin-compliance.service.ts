import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/index.js";
import { UserStatus, Role } from "../../../generated/prisma/client.js";
import { resolveStorageUrl } from "../../../infrastructure/storage/oci-object-storage.service.js";


interface PaginationOptions {
  page: number;
  limit: number;
}

interface ExpiringOptions extends PaginationOptions {
  daysThreshold: number;
}

export const AdminComplianceService = {
  /**
   * Get compliance overview statistics
   */
  async getOverview() {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const [
      totalExperts,
      verifiedExperts,
      expiringCount,
      expiredCount,
      suspendedCount,
      noExpirySetCount,
    ] = await Promise.all([
      // Total experts
      prisma.user.count({
        where: { role: Role.EXPERT },
      }),
      // Verified experts (use status = VERIFIED instead of verified field)
      prisma.expertProfile.count({
        where: { status: 'VERIFIED' },
      }),
      // Expiring within 30 days
      prisma.expertProfile.count({
        where: {
          credentialsExpiry: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
          user: {
            status: UserStatus.ACTIVE,
          },
        },
      }),
      // Expired
      prisma.expertProfile.count({
        where: {
          credentialsExpiry: {
            lt: now,
          },
        },
      }),
      // Suspended for compliance
      prisma.user.count({
        where: {
          role: Role.EXPERT,
          status: UserStatus.SUSPENDED,
        },
      }),
      // No expiry date set (for verified experts)
      prisma.expertProfile.count({
        where: {
          credentialsExpiry: null,
          status: 'VERIFIED',
        },
      }),
    ]);

    return {
      totalExperts,
      verifiedExperts,
      expiringCount,
      expiredCount,
      suspendedCount,
      noExpirySetCount,
      complianceRate: totalExperts > 0
        ? ((totalExperts - expiredCount - suspendedCount) / totalExperts) * 100
        : 100,
    };
  },

  /**
   * Get experts with expiring credentials
   */
  async getExpiringCredentials(options: ExpiringOptions) {
    const { page, limit, daysThreshold } = options;
    const skip = (page - 1) * limit;

    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + daysThreshold);

    const where = {
      credentialsExpiry: {
        gte: now,
        lte: thresholdDate,
      },
      user: {
        status: UserStatus.ACTIVE,
      },
    };

    const [experts, total] = await Promise.all([
      prisma.expertProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarObjectKey: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { credentialsExpiry: "asc" },
      }),
      prisma.expertProfile.count({ where }),
    ]);

    const transformedExperts = await Promise.all(
      experts.map(async (expert) => {
        const photoKey = expert.profileImageObjectKey || expert.user.avatarObjectKey;
        const profileImageUrl = await resolveStorageUrl(photoKey);

        return {
          id: expert.user.id,
          expertId: expert.id,
          fullName: [expert.user.firstName, expert.user.lastName].filter(Boolean).join(" ") || expert.user.email,
          email: expert.user.email,
          phone: expert.user.phone,
          profileImageUrl,
          barNumber: expert.barNumber,
          credentialsExpiry: expert.credentialsExpiry,
          daysUntilExpiry: expert.credentialsExpiry
            ? Math.floor(
                (expert.credentialsExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              )
            : null,
          specialties: expert.specialties,
          officeAddress: expert.officeAddress,
        };
      })
    );

    const totalPages = Math.ceil(total / limit);
    return {
      experts: transformedExperts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Get experts with expired credentials
   */
  async getExpiredCredentials(options: PaginationOptions) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const now = new Date();

    const where = {
      credentialsExpiry: {
        lt: now,
      },
    };

    const [experts, total] = await Promise.all([
      prisma.expertProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              status: true,
              avatarObjectKey: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { credentialsExpiry: "asc" },
      }),
      prisma.expertProfile.count({ where }),
    ]);

    const transformedExperts = await Promise.all(
      experts.map(async (expert) => {
        const photoKey = expert.profileImageObjectKey || expert.user.avatarObjectKey;
        const profileImageUrl = await resolveStorageUrl(photoKey);

        return {
          id: expert.user.id,
          expertId: expert.id,
          fullName: [expert.user.firstName, expert.user.lastName].filter(Boolean).join(" ") || expert.user.email,
          email: expert.user.email,
          phone: expert.user.phone,
          profileImageUrl,
          accountStatus: expert.user.status,
          barNumber: expert.barNumber,
          credentialsExpiry: expert.credentialsExpiry,
          daysOverdue: expert.credentialsExpiry
            ? Math.floor(
                (now.getTime() - expert.credentialsExpiry.getTime()) / (1000 * 60 * 60 * 24)
              )
            : null,
          specialties: expert.specialties,
          officeAddress: expert.officeAddress,
        };
      })
    );

    const totalPages2 = Math.ceil(total / limit);
    return {
      experts: transformedExperts,
      pagination: {
        page,
        limit,
        total,
        totalPages: totalPages2,
        hasNext: page < totalPages2,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Get suspended experts
   */
  async getSuspendedExperts(options: PaginationOptions) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const where = {
      role: Role.EXPERT,
      status: UserStatus.SUSPENDED,
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          expertProfile: {
            select: {
              id: true,
              barNumber: true,
              credentialsExpiry: true,
              specialties: true,
              officeAddress: true,
              profileImageObjectKey: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const transformedExperts = await Promise.all(
      users.map(async (user) => {
        const photoKey = user.avatarObjectKey || user.expertProfile?.profileImageObjectKey;
        const profileImageUrl = await resolveStorageUrl(photoKey);

        return {
          id: user.id,
          expertId: user.expertProfile?.id,
          fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
          email: user.email,
          phone: user.phone,
          profileImageUrl,
          accountStatus: user.status,
          barNumber: user.expertProfile?.barNumber,
          credentialsExpiry: user.expertProfile?.credentialsExpiry,
          specialties: user.expertProfile?.specialties ?? [],
          officeAddress: user.expertProfile?.officeAddress,
          suspendedAt: user.updatedAt,
        };
      })
    );

    const totalPages3 = Math.ceil(total / limit);
    return {
      experts: transformedExperts,
      pagination: {
        page,
        limit,
        total,
        totalPages: totalPages3,
        hasNext: page < totalPages3,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Send compliance warning email
   */
  async sendComplianceWarning(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, role: Role.EXPERT },
      include: { expertProfile: true },
    });

    if (!user || !user.expertProfile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    // TODO: Integrate with email service (Brevo/Listmonk)
    // For now, just log the action

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "UPDATE",
        resource: "EXPERT",
        resourceId: userId,
        metadata: {
          expertEmail: user.email,
          credentialsExpiry: user.expertProfile.credentialsExpiry,
        } as any,
      },
    });

    return { sent: true };
  },

  /**
   * Extend credentials expiry date
   */
  async extendCredentials(
    userId: string,
    options: { newExpiryDate: string; reason: string; adminId: string }
  ) {
    const { newExpiryDate, reason, adminId } = options;

    const user = await prisma.user.findUnique({
      where: { id: userId, role: Role.EXPERT },
      include: { expertProfile: true },
    });

    if (!user || !user.expertProfile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    const newDate = new Date(newExpiryDate);
    if (newDate <= new Date()) {
      throw new ValidationError("New expiry date must be in the future");
    }

    // Update expiry date
    const updatedExpert = await prisma.expertProfile.update({
      where: { id: user.expertProfile.id },
      data: {
        credentialsExpiry: newDate,
      },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "UPDATE",
        resource: "EXPERT",
        resourceId: userId,
        metadata: {
          oldExpiry: user.expertProfile.credentialsExpiry,
          newExpiry: newDate,
          reason,
        } as any,
      },
    });

    return {
      id: updatedExpert.id,
      credentialsExpiry: updatedExpert.credentialsExpiry,
    };
  },
};
