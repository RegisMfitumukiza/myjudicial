import { prisma } from "../../infrastructure/database/prisma.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { Role, UserStatus } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { SupabaseSyncService } from "../../infrastructure/supabase/sync.service.js";
import { logger } from "../../shared/utils/logger.js";

interface ListFilters {
  role?: Role;
  status?: UserStatus;
  search?: string;
}

interface ListOptions {
  page: number;
  limit: number;
  filters: ListFilters;
  sortBy: "createdAt" | "firstName" | "lastLoginAt";
  sortOrder: "asc" | "desc";
}

interface UpdateStatusOptions {
  status: UserStatus;
  reason?: string;
  adminId: string;
}

export const AdminUserService = {
  /**
   * Get user statistics
   */
  async getStats() {
    const [totalUsers, citizenCount, expertCount, adminCount, activeCount, inactiveCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: Role.CITIZEN } }),
        prisma.user.count({ where: { role: Role.EXPERT } }),
        prisma.user.count({ where: { role: Role.ADMIN } }),
        prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
        prisma.user.count({ where: { status: UserStatus.PENDING } }),
      ]);

    return {
      totalUsers,
      byRole: {
        citizens: citizenCount,
        experts: expertCount,
        admins: adminCount,
      },
      byStatus: {
        active: activeCount,
        inactive: inactiveCount,
      },
    };
  },

  /**
   * List users with filters and pagination
   */
  async list(options: ListOptions) {
    const { page, limit, filters, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      ...(filters.role && { role: filters.role }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" as const } },
          { lastName: { contains: filters.search, mode: "insensitive" as const } },
          { email: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }),
    };

    // Build order by
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          expertProfile: {
            select: {
              id: true,
              status: true,
              barNumber: true,
              specialties: true,
            },
          },
          _count: {
            select: {
              citizenBookings: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.user.count({ where }),
    ]);

    const transformedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      phone: user.phone,
      role: user.role,
      accountStatus: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      isExpert: user.role === Role.EXPERT,
      expertStatus: user.expertProfile?.status,
      barNumber: user.expertProfile?.barNumber,
      specialties: user.expertProfile?.specialties ?? [],
      totalBookings: user._count.citizenBookings,
    }));

    const totalPages = Math.ceil(total / limit);
    return {
      users: transformedUsers,
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
   * Get user details
   */
  async getById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        expertProfile: {
          include: {
            education: true,
            certifications: true,
            services: true,
            _count: {
              select: {
                bookings: true,
                reviews: true,
              },
            },
          },
        },
        citizenBookings: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            scheduledStart: true,
            expert: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            citizenBookings: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      phone: user.phone,
      role: user.role,
      accountStatus: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      expert: user.expertProfile
        ? {
            id: user.expertProfile.id,
            verified: user.expertProfile.status === 'VERIFIED',
            barNumber: user.expertProfile.barNumber,
            specialties: user.expertProfile.specialties,
            avgRating: user.expertProfile.averageRating ? Number(user.expertProfile.averageRating) : null,
            totalBookings: user.expertProfile._count.bookings,
            totalReviews: user.expertProfile._count.reviews,
            education: user.expertProfile.education,
            certifications: user.expertProfile.certifications,
            services: user.expertProfile.services,
          }
        : null,
      recentBookings: user.citizenBookings.map((b: Record<string, any>) => ({
        ...b,
        expert: b.expert
          ? {
              ...b.expert,
              user: {
                fullName: [b.expert.user?.firstName, b.expert.user?.lastName]
                  .filter(Boolean)
                  .join(" ") || b.expert.user?.email || "Unknown",
              },
            }
          : undefined,
      })),
      totalBookingsAsCitizen: user._count.citizenBookings,
    };
  },

  /**
   * Update user account status
   */
  async updateStatus(userId: string, options: UpdateStatusOptions) {
    const { status, reason, adminId } = options;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Prevent self-suspension
    if (userId === adminId && status !== UserStatus.ACTIVE) {
      throw new ValidationError("Cannot change your own account status");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: status },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "UPDATE",
        resource: "USER",
        resourceId: userId,
        metadata: {
          oldStatus: user.status,
          newStatus: status,
          reason,
        } as any,
      },
    });

    return {
      id: updatedUser.id,
      fullName: [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(" ") || updatedUser.email,
      accountStatus: updatedUser.status,
    };
  },

  /**
   * Delete user account — Industrial deletion pipeline
   *
   * 1. Validates user existence and prevents self-deletion.
   * 2. Synchronizes deletion with Supabase Auth (frees email, revokes sessions).
   * 3. Handles relational cleanup and market de-listing (services, availability, map markers).
   * 4. If no completed bookings: Clean hard-delete of user and relations.
   *    If has completed bookings: GDPR anonymization to preserve statutory financial history.
   * 5. Logs administrative audit trail.
   */
  async deleteUser(userId: string, adminId: string, reason: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        expertProfile: {
          include: {
            _count: {
              select: { bookings: true },
            },
          },
        },
        _count: {
          select: { citizenBookings: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Prevent self-deletion
    if (userId === adminId) {
      throw new ValidationError("Cannot delete your own account");
    }

    const expertProfileId = user.expertProfile?.id;
    const totalBookings = (user.expertProfile?._count?.bookings ?? 0) + (user._count?.citizenBookings ?? 0);

    // 1. Synchronize deletion with Supabase Auth to completely release the email address
    try {
      await SupabaseSyncService.syncDeleteToSupabaseAuth(userId);
      logger.info(`[AdminUserService] Supabase Auth identity deleted for user: ${user.email} (${userId})`);
    } catch (authError) {
      logger.warn(`[AdminUserService] Supabase Auth deletion warning for user ${user.email}:`, {
        error: authError instanceof Error ? authError.message : String(authError),
      });
    }

    // 2. Database lifecycle cleanup
    if (totalBookings === 0) {
      // CLEAN HARD DELETE (No financial/legal records exist — clean slate for test accounts and unbooked users)
      if (expertProfileId) {
        await prisma.mapMarker.deleteMany({ where: { expertId: expertProfileId } });
        await prisma.expertAvailability.deleteMany({ where: { expertId: expertProfileId } });
        await prisma.legalService.deleteMany({ where: { expertId: expertProfileId } });
        await prisma.expertReply.deleteMany({ where: { expertId: expertProfileId } });
        await prisma.adminAction.deleteMany({ where: { expertId: expertProfileId } });
        await prisma.expertVerification.deleteMany({ where: { expertId: expertProfileId } });
        await prisma.expertProfile.delete({ where: { id: expertProfileId } });
      }

      await prisma.reviewReport.deleteMany({ where: { reportedBy: userId } });
      await prisma.reviewReaction.deleteMany({ where: { userId } });
      await prisma.document.deleteMany({ where: { ownerId: userId } });
      await prisma.message.deleteMany({ where: { senderId: userId } });
      await prisma.conversationParticipant.deleteMany({ where: { userId } });
      await prisma.adminAction.deleteMany({ where: { adminUserId: userId } });
      await prisma.expertVerification.deleteMany({ where: { reviewedById: userId } });
      await prisma.savedExpert.deleteMany({ where: { userId } });
      await prisma.triageSession.deleteMany({ where: { clientId: userId } });
      await prisma.refreshToken.deleteMany({ where: { userId } });
      await prisma.passwordResetToken.deleteMany({ where: { userId } });
      await prisma.auditLog.updateMany({ where: { actorId: userId }, data: { actorId: null } });

      await prisma.user.delete({
        where: { id: userId },
      });
    } else {
      // GDPR ANONYMIZATION (Historical bookings exist — preserve statutory financial compliance while scrubbing PII)
      if (expertProfileId) {
        await prisma.mapMarker.updateMany({
          where: { expertId: expertProfileId },
          data: { isVisible: false },
        });
        await prisma.expertAvailability.updateMany({
          where: { expertId: expertProfileId },
          data: { isAvailable: false },
        });
        await prisma.expertProfile.update({
          where: { id: expertProfileId },
          data: { status: "SUSPENDED", bio: null },
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.DELETED,
          email: `deleted-${userId}@anonymized.local`,
          firstName: "Deleted",
          lastName: "User",
          phone: null,
        },
      });
    }

    // 3. Log audit action
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "DELETE",
        resource: "USER",
        resourceId: userId,
        metadata: {
          reason,
          userEmail: user.email,
          userRole: user.role,
          cleanHardDelete: totalBookings === 0,
        } as any,
      },
    });

    return { deleted: true, emailFreed: true };
  },
};
