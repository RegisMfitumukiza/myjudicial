import { prisma } from "../../infrastructure/database/prisma.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { Role, UserStatus, AuditAction, AuditResource, PaymentStatus } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { resolveStorageUrl } from "../../infrastructure/storage/oci-object-storage.service.js";

interface ListFilters {
  search?: string;
  status?: string;
  activity?: "ALL" | "HAS_BOOKINGS" | "NO_BOOKINGS" | "REPEAT_CLIENTS";
}

interface ListOptions {
  page: number;
  limit: number;
  filters: ListFilters;
  sortBy: "createdAt" | "name" | "totalBookings" | "totalSpent" | "lastLoginAt";
  sortOrder: "asc" | "desc";
}

interface UpdateStatusOptions {
  status: UserStatus;
  reason?: string;
  adminId: string;
}

export const AdminClientService = {
  /**
   * Get marketplace client stats
   */
  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalClients,
      activeClients,
      suspendedClients,
      pendingClients,
      totalBookings,
      newThisMonth,
      paidPaymentsAgg,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.CITIZEN } }),
      prisma.user.count({ where: { role: Role.CITIZEN, status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { role: Role.CITIZEN, status: UserStatus.SUSPENDED } }),
      prisma.user.count({ where: { role: Role.CITIZEN, status: UserStatus.PENDING } }),
      prisma.booking.count({ where: { citizen: { role: Role.CITIZEN } } }),
      prisma.user.count({
        where: {
          role: Role.CITIZEN,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          booking: { citizen: { role: Role.CITIZEN } },
        },
        _sum: { amount: true },
      }),
    ]);

    // Active buyers count (citizens who placed at least 1 booking)
    const buyersCount = await prisma.user.count({
      where: {
        role: Role.CITIZEN,
        citizenBookings: { some: {} },
      },
    });

    const totalSpent = Number(paidPaymentsAgg._sum.amount ?? 0);

    return {
      totalClients,
      activeClients,
      suspendedClients,
      pendingClients,
      buyersCount,
      newThisMonth,
      totalBookings,
      totalSpent,
      currency: "RWF",
    };
  },

  /**
   * List clients with filters, search, activity metrics, and pagination
   */
  async list(options: ListOptions) {
    const { page, limit, filters, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    const statusFilter =
      filters.status && filters.status !== "ALL"
        ? filters.status === "INACTIVE"
          ? UserStatus.SUSPENDED
          : (filters.status as UserStatus)
        : undefined;

    // Handle repeat clients activity filter if requested
    let repeatClientIds: string[] | undefined = undefined;
    if (filters.activity === "REPEAT_CLIENTS") {
      const groups = await prisma.booking.groupBy({
        by: ["citizenId"],
        _count: { citizenId: true },
        having: {
          citizenId: {
            _count: { gte: 2 },
          },
        },
      });
      repeatClientIds = groups.map((g) => g.citizenId).filter(Boolean) as string[];
    }

    // Build where clause
    const where: Prisma.UserWhereInput = {
      role: Role.CITIZEN,
      ...(statusFilter && { status: statusFilter }),
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
          { phone: { contains: filters.search, mode: "insensitive" } },
        ],
      }),
      ...(filters.activity === "HAS_BOOKINGS" && {
        citizenBookings: { some: {} },
      }),
      ...(filters.activity === "NO_BOOKINGS" && {
        citizenBookings: { none: {} },
      }),
      ...(filters.activity === "REPEAT_CLIENTS" && {
        id: { in: repeatClientIds ?? [] },
      }),
    };

    // Build order by
    let orderBy: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[] = {
      createdAt: "desc",
    };

    if (sortBy === "createdAt" || sortBy === "lastLoginAt") {
      orderBy = { [sortBy]: sortOrder };
    } else if (sortBy === "name") {
      orderBy = [{ firstName: sortOrder }, { lastName: sortOrder }];
    } else if (sortBy === "totalBookings") {
      orderBy = { citizenBookings: { _count: sortOrder } };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          avatarObjectKey: true,
          createdAt: true,
          lastLoginAt: true,
          preferredLanguage: true,
          _count: {
            select: {
              citizenBookings: true,
              reviews: true,
            },
          },
          citizenBookings: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.user.count({ where }),
    ]);

    const userIds = users.map((u) => u.id);

    // Batch query completed bookings counts for this page
    const [completedGroups, paidBookings] = await Promise.all([
      userIds.length > 0
        ? prisma.booking.groupBy({
            by: ["citizenId"],
            where: {
              citizenId: { in: userIds },
              status: "COMPLETED",
            },
            _count: { id: true },
          })
        : [],
      userIds.length > 0
        ? prisma.booking.findMany({
            where: {
              citizenId: { in: userIds },
              payment: { status: PaymentStatus.PAID },
            },
            select: {
              citizenId: true,
              payment: {
                select: {
                  amount: true,
                  currency: true,
                },
              },
            },
          })
        : [],
    ]);

    const completedMap = new Map<string, number>();
    for (const g of completedGroups) {
      if (g.citizenId) completedMap.set(g.citizenId, g._count.id);
    }

    const spendMap = new Map<string, number>();
    for (const b of paidBookings) {
      if (b.citizenId && b.payment) {
        const cur = spendMap.get(b.citizenId) ?? 0;
        spendMap.set(b.citizenId, cur + Number(b.payment.amount));
      }
    }

    const transformedClients = await Promise.all(
      users.map(async (u) => {
        const avatarUrl = await resolveStorageUrl(u.avatarObjectKey);
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;

        return {
          id: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          fullName,
          phone: u.phone,
          accountStatus: u.status,
          avatarUrl,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
          preferredLanguage: u.preferredLanguage,
          totalBookings: u._count.citizenBookings,
          completedBookings: completedMap.get(u.id) ?? 0,
          totalReviews: u._count.reviews,
          totalSpent: spendMap.get(u.id) ?? 0,
          currency: "RWF",
          lastBookingAt: u.citizenBookings[0]?.createdAt ?? null,
        };
      })
    );

    // If sorting by totalSpent was requested
    if (sortBy === "totalSpent") {
      transformedClients.sort((a, b) =>
        sortOrder === "asc" ? a.totalSpent - b.totalSpent : b.totalSpent - a.totalSpent
      );
    }

    const totalPages = Math.ceil(total / limit);

    return {
      clients: transformedClients,
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
   * Get client by ID with full booking history, spend metrics, and reviews
   */
  async getById(clientId: string) {
    const user = await prisma.user.findFirst({
      where: {
        id: clientId,
        role: Role.CITIZEN,
      },
      include: {
        citizenBookings: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            expert: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatarObjectKey: true,
                    email: true,
                  },
                },
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                durationMin: true,
                flatFee: true,
                currency: true,
              },
            },
            payment: {
              select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                paidAt: true,
                txRef: true,
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            expert: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatarObjectKey: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            citizenBookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("Client not found");
    }

    const avatarUrl = await resolveStorageUrl(user.avatarObjectKey);
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

    // Aggregate lifetime spend
    const paidPaymentsAgg = await prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID,
        booking: { citizenId: clientId },
      },
      _sum: { amount: true },
    });
    const totalSpent = Number(paidPaymentsAgg._sum.amount ?? 0);

    const completedBookings = await prisma.booking.count({
      where: { citizenId: clientId, status: "COMPLETED" },
    });

    const cancelledBookings = await prisma.booking.count({
      where: { citizenId: clientId, status: "CANCELLED" },
    });

    const averageOrderValue =
      user._count.citizenBookings > 0
        ? Math.round(totalSpent / user._count.citizenBookings)
        : 0;

    // Transform bookings with resolved expert avatar URLs
    const recentBookings = await Promise.all(
      user.citizenBookings.map(async (b) => {
        const expertAvatarUrl = b.expert
          ? await resolveStorageUrl(
              b.expert.profileImageObjectKey || b.expert.user?.avatarObjectKey
            )
          : null;
        const expertName = b.expert?.user
          ? [b.expert.user.firstName, b.expert.user.lastName].filter(Boolean).join(" ") ||
            b.expert.user.email
          : "Expert";

        return {
          id: b.id,
          status: b.status,
          paymentStatus: b.paymentStatus,
          scheduledStart: b.scheduledStart,
          scheduledEnd: b.scheduledEnd,
          createdAt: b.createdAt,
          cancellationReason: b.cancellationReason,
          meetingRoomId: b.meetingRoomId,
          expert: {
            id: b.expert?.id ?? b.expertId,
            fullName: expertName,
            avatarUrl: expertAvatarUrl,
            specialties: b.expert?.specialties ?? [],
          },
          service: b.service
            ? {
                id: b.service.id,
                title: b.service.name,
                durationMinutes: b.service.durationMin,
                price: Number(b.service.flatFee),
                currency: b.service.currency,
              }
            : null,
          payment: b.payment
            ? {
                id: b.payment.id,
                amount: Number(b.payment.amount),
                currency: b.payment.currency,
                status: b.payment.status,
                paidAt: b.payment.paidAt,
                txRef: b.payment.txRef,
              }
            : null,
        };
      })
    );

    const recentReviews = user.reviews.map((r) => {
      const expertName = r.expert?.user
        ? [r.expert.user.firstName, r.expert.user.lastName].filter(Boolean).join(" ") ||
          "Expert"
        : "Expert";

      return {
        id: r.id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.createdAt,
        expertName,
      };
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName,
      phone: user.phone,
      accountStatus: user.status,
      avatarUrl,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      metrics: {
        totalBookings: user._count.citizenBookings,
        completedBookings,
        cancelledBookings,
        totalSpent,
        currency: "RWF",
        averageOrderValue,
        reviewsSubmitted: user._count.reviews,
      },
      recentBookings,
      recentReviews,
    };
  },

  /**
   * Update client account status (e.g. SUSPENDED, ACTIVE)
   */
  async updateStatus(clientId: string, options: UpdateStatusOptions) {
    const { status, reason, adminId } = options;

    const user = await prisma.user.findFirst({
      where: {
        id: clientId,
        role: Role.CITIZEN,
      },
    });

    if (!user) {
      throw new NotFoundError("Client not found");
    }

    if (clientId === adminId) {
      throw new ValidationError("Cannot modify your own account status");
    }

    const updatedUser = await prisma.user.update({
      where: { id: clientId },
      data: { status },
    });

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: AuditAction.UPDATE,
        resource: AuditResource.USER,
        resourceId: clientId,
        description: `Admin updated client status from ${user.status} to ${status}`,
        metadata: {
          role: Role.CITIZEN,
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
};
