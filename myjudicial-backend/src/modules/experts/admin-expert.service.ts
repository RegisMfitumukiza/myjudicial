import { getErrorMessage } from "../../shared/utils/i18n-messages.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { UserStatus, Role, LegalSpecialty } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { getSignedDownloadUrl } from "../../infrastructure/storage/oci-object-storage.service.js";


interface ListFilters {
  status?: UserStatus;
  specialty?: LegalSpecialty;
  search?: string;
  verified?: boolean;
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
}

interface ListOptions {
  page: number;
  limit: number;
  filters: ListFilters;
  sortBy: "createdAt" | "fullName" | "totalBookings" | "avgRating";
  sortOrder: "asc" | "desc";
}

interface SuspendOptions {
  reason: string;
  suspendUntil?: string;
  notifyExpert: boolean;
  adminId: string;
}

interface UpdateStatusOptions {
  status: UserStatus;
  reason?: string;
  adminId: string;
}

export const AdminExpertService = {
  /**
   * List all experts with filters and pagination
   */
  async list(options: ListOptions) {
    const { page, limit, filters, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    // Build expertProfile relation filter
    const expertProfileFilter: Prisma.ExpertProfileWhereInput = {};

    if (filters.verified !== undefined) {
      expertProfileFilter.status = filters.verified ? "VERIFIED" : { not: "VERIFIED" };
    }

    if (filters.specialty) {
      expertProfileFilter.specialties = { has: filters.specialty };
    }

    if (filters.verificationStatus) {
      expertProfileFilter.verifications = {
        some: {
          status: filters.verificationStatus
        }
      };
    }

    // Build where clause
    const where: Prisma.UserWhereInput = {
      role: Role.EXPERT,
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" as const } },
          { lastName: { contains: filters.search, mode: "insensitive" as const } },
          { email: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }),
      ...(Object.keys(expertProfileFilter).length > 0 && {
        expertProfile: expertProfileFilter
      }),
    };

    // Build order by clause
    let orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy === "fullName") {
      orderBy = { firstName: sortOrder };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === "totalBookings") {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === "avgRating") {
      orderBy = { expertProfile: { averageRating: sortOrder } };
    }

    // Execute query
    const [experts, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          expertProfile: {
            include: {
              _count: {
                select: {
                  bookings: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.user.count({ where }),
    ]);

    // Fetch latest verification for each expert on this page
    // NOTE: ExpertVerification.expertId references ExpertProfile.id, NOT User.id
    const profileIds = experts.map((u) => u.expertProfile?.id).filter(Boolean) as string[];
    
    // Build verification query with optional status filter
    const verificationWhere: Prisma.ExpertVerificationWhereInput = {
      expertId: { in: profileIds },
      ...(filters.verificationStatus && { status: filters.verificationStatus }),
    };
    
    const latestVerifications = profileIds.length > 0
      ? await prisma.expertVerification.findMany({
          where: verificationWhere,
          orderBy: { createdAt: "desc" },
        })
      : [];
    // Map by expertProfile.id (which is ExpertVerification.expertId)
    const verificationMap = new Map<string, typeof latestVerifications[0]>();
    for (const v of latestVerifications) {
      if (!verificationMap.has(v.expertId)) {
        verificationMap.set(v.expertId, v);
      }
    }

    // Transform results with resolved secure download URLs
    const transformedExperts = await Promise.all(
      experts.map(async (user) => {
        const expert = user.expertProfile;
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
        const verification = expert ? verificationMap.get(expert.id) : undefined;

        let barCertificateUrl: string | null = null;
        let identityDocumentUrl: string | null = null;

        if (verification?.barCertificateObjectKey) {
          try {
            const signed = await getSignedDownloadUrl(verification.barCertificateObjectKey);
            barCertificateUrl = signed.url;
          } catch (err) {
            // ignore
          }
        }
        if (verification?.identityDocumentObjectKey) {
          try {
            const signed = await getSignedDownloadUrl(verification.identityDocumentObjectKey);
            identityDocumentUrl = signed.url;
          } catch (err) {
            // ignore
          }
        }

        return {
          id: user.id,
          fullName,
          email: user.email,
          accountStatus: user.status,
          createdAt: user.createdAt,
          verified: expert?.status === 'VERIFIED',
          expertStatus: expert?.status ?? null,
          barNumber: expert?.barNumber,
          specialties: expert?.specialties ?? [],
          avgRating: expert?.averageRating ? Number(expert.averageRating) : null,
          totalBookings: expert?._count?.bookings ?? 0,
          credentialsExpiry: expert?.credentialsExpiry,
          yearsOfExperience: expert?.yearsExperience,
          profileImage: expert?.profileImageObjectKey,
          officeAddress: expert?.officeAddress,
          latitude: expert?.latitude ? Number(expert.latitude) : null,
          longitude: expert?.longitude ? Number(expert.longitude) : null,
          verificationId: verification?.id ?? null,
          verificationStatus: verification?.status ?? null,
          rejectionReason: verification?.rejectionReason ?? null,
          barCertificateUrl,
          identityDocumentUrl,
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
   * Helper to find an expert user by either User.id OR ExpertProfile.id
   */
  async resolveExpertUser(idOrProfileId: string) {
    let user = await prisma.user.findFirst({
      where: { id: idOrProfileId, role: Role.EXPERT },
      include: { expertProfile: true },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { expertProfile: { id: idOrProfileId } },
        include: { expertProfile: true },
      });
    }

    return user;
  },

  /**
   * Get detailed expert information
   */
  async getById(expertId: string) {
    const detailInclude = {
      expertProfile: {
        include: {
          education: true,
          certifications: true,
          services: true,
          bookings: {
            take: 10,
            orderBy: { createdAt: "desc" as const },
            select: {
              id: true,
              status: true,
              scheduledStart: true,
              createdAt: true,
              citizen: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      },
    };

    let user = await prisma.user.findFirst({
      where: { id: expertId, role: Role.EXPERT },
      include: detailInclude,
    });

    // Fallback: Check if expertId is the ExpertProfile.id (e.g. linked from verifications or compliance queues)
    if (!user) {
      user = await prisma.user.findFirst({
        where: { expertProfile: { id: expertId } },
        include: detailInclude,
      });
    }

    if (!user || !user.expertProfile) {
      throw new NotFoundError("Expert");
    }

    const expert = user.expertProfile;
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

    // Fetch the latest verification to return submitted credentials & rejection reason.
    // NOTE: ExpertVerification.expertId references ExpertProfile.id, NOT User.id.
    const verification = await prisma.expertVerification.findFirst({
      where: { expertId: expert.id },
      orderBy: { createdAt: "desc" },
    });

    let barCertificateUrl: string | null = null;
    let identityDocumentUrl: string | null = null;

    if (verification?.barCertificateObjectKey) {
      try {
        const signed = await getSignedDownloadUrl(verification.barCertificateObjectKey);
        barCertificateUrl = signed.url;
      } catch (err) {
        // ignore
      }
    }
    if (verification?.identityDocumentObjectKey) {
      try {
        const signed = await getSignedDownloadUrl(verification.identityDocumentObjectKey);
        identityDocumentUrl = signed.url;
      } catch (err) {
        // ignore
      }
    }

    return {
      id: user.id,
      fullName,
      email: user.email,
      phone: user.phone,
      accountStatus: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      verified: expert.status === 'VERIFIED',
      expertStatus: expert.status,
      expertProfileId: expert.id,
      displayName: expert.displayName,
      firmName: expert.firmName,
      primarySpecialty: expert.primarySpecialty,
      barNumber: expert.barNumber,
      specialties: expert.specialties,
      languages: expert.languages,
      bio: expert.bio,
      city: expert.city,
      country: expert.country,
      avgRating: expert.averageRating ? Number(expert.averageRating) : null,
      totalBookings: expert._count.bookings,
      totalReviews: expert._count.reviews,
      baseConsultationFee: expert.baseConsultationFee ? Number(expert.baseConsultationFee) : null,
      currency: expert.currency,
      credentialsExpiry: expert.credentialsExpiry,
      yearsOfExperience: expert.yearsExperience,
      // Profile image
      profileImageObjectKey: expert.profileImageObjectKey,
      officeAddress: expert.officeAddress,
      latitude: expert.latitude ? Number(expert.latitude) : null,
      longitude: expert.longitude ? Number(expert.longitude) : null,
      education: expert.education,
      certifications: expert.certifications,
      services: expert.services,
      // Verification data (all fields for the detail page document checklist)
      verificationId: verification?.id ?? null,
      verificationStatus: verification?.status ?? null,
      rejectionReason: verification?.rejectionReason ?? null,
      identityDocumentObjectKey: verification?.identityDocumentObjectKey ?? null,
      barCertificateObjectKey: verification?.barCertificateObjectKey ?? null,
      additionalDocumentKeys: verification?.additionalDocumentKeys ?? [],
      // Pre-signed URLs (convenience for immediate display)
      barCertificateUrl,
      identityDocumentUrl,
      recentBookings: expert.bookings.map((booking: any) => ({
        ...booking,
        citizen: {
          ...booking.citizen,
          fullName: [booking.citizen.firstName, booking.citizen.lastName].filter(Boolean).join(" ") || booking.citizen.email,
        },
      })),
    };
  },

  /**
   * Suspend expert account
   */
  async suspend(expertId: string, options: SuspendOptions) {
    const { reason, suspendUntil, notifyExpert, adminId } = options;

    // Verify expert exists by User.id or ExpertProfile.id
    const user = await this.resolveExpertUser(expertId);

    if (!user || !user.expertProfile) {
      throw new NotFoundError("Expert");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ValidationError(getErrorMessage('VALIDATION_ERROR'));
    }

    const userId = user.id;

    // Update expert status
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.SUSPENDED,
        },
      }),
      // Hide map marker
      prisma.mapMarker.updateMany({
        where: { expertId: userId },
        data: { isVisible: false },
      }),
      // Log action
      prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: "UPDATE",
          resource: "EXPERT",
          resourceId: userId,
          metadata: {
            reason,
            suspendUntil,
          } as any,
        },
      }),
    ]);

    // TODO: Send notification if notifyExpert is true
    // This would integrate with Brevo notification system

    return {
      id: updatedUser.id,
      fullName: [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(" ") || updatedUser.email,
      accountStatus: updatedUser.status,
    };
  },

  /**
   * Activate suspended expert
   */
  async activate(expertId: string, adminId: string) {
    const user = await this.resolveExpertUser(expertId);

    if (!user || !user.expertProfile) {
      throw new NotFoundError("Expert");
    }

    if (user.status !== UserStatus.SUSPENDED) {
      throw new ValidationError("Expert is not suspended");
    }

    // Check if credentials are still valid
    const expert = user.expertProfile;
    if (expert.credentialsExpiry && expert.credentialsExpiry < new Date()) {
      throw new ValidationError("Cannot activate expert with expired credentials");
    }

    const userId = user.id;

    // Update expert status
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.ACTIVE,
        },
      }),
      // Show map marker
      prisma.mapMarker.updateMany({
        where: { expertId: userId },
        data: { isVisible: true },
      }),
      // Log action
      prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: "UPDATE",
          resource: "EXPERT",
          resourceId: userId,
          metadata: {} as any,
        },
      }),
    ]);

    return {
      id: updatedUser.id,
      fullName: [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(" ") || updatedUser.email,
      accountStatus: updatedUser.status,
    };
  },

  /**
   * Update expert status
   */
  async updateStatus(expertId: string, options: UpdateStatusOptions) {
    const { status, reason, adminId } = options;

    const user = await this.resolveExpertUser(expertId);

    if (!user) {
      throw new NotFoundError("Expert");
    }

    const userId = user.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: status },
    });

    // Log action
    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "UPDATE",
        resource: "EXPERT",
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
   * Reset a REJECTED expert back to DRAFT so they can resubmit verification.
   * Also marks their latest verification record as EXPIRED to remove it from the queue.
   */
  async resetToResubmit(expertId: string, adminId: string) {
    const user = await this.resolveExpertUser(expertId);

    if (!user || !user.expertProfile) {
      throw new NotFoundError("Expert");
    }

    if (user.expertProfile.status !== "REJECTED") {
      throw new ValidationError(
        `Cannot reset expert with status: ${user.expertProfile.status}. Only REJECTED experts can be reset.`
      );
    }

    const profileId = user.expertProfile.id;
    const userId = user.id;

    await prisma.$transaction(async (tx) => {
      // Reset profile status to DRAFT
      await tx.expertProfile.update({
        where: { id: profileId },
        data: { status: "DRAFT" },
      });

      // Mark the most recent REJECTED verification as EXPIRED so it's removed from queue
      const latestVerification = await tx.expertVerification.findFirst({
        where: { expertId: profileId, status: "REJECTED" },
        orderBy: { createdAt: "desc" },
      });
      if (latestVerification) {
        await tx.expertVerification.update({
          where: { id: latestVerification.id },
          data: { status: "EXPIRED" },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: "UPDATE",
          resource: "EXPERT",
          resourceId: userId,
          metadata: { action: "reset_to_resubmit", previousStatus: "REJECTED" } as any,
        },
      });
    });

    return {
      id: userId,
      expertStatus: "DRAFT",
      message: "Expert profile reset to DRAFT. Expert can now resubmit verification documents.",
    };
  },

  /**
   * Get expert's bookings
   */
  async getExpertBookings(expertId: string, options: { page: number; limit: number }) {
    const user = await this.resolveExpertUser(expertId);
    if (!user || !user.expertProfile) {
      throw new NotFoundError("Expert");
    }
    const profileId = user.expertProfile.id;

    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { expertId: profileId },
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.count({ where: { expertId: profileId } }),
    ]);

    const transformedBookings = bookings.map((booking) => ({
      ...booking,
      citizen: {
        ...booking.citizen,
        fullName: [booking.citizen.firstName, booking.citizen.lastName].filter(Boolean).join(" ") || booking.citizen.email,
      },
    }));

    const totalPages = Math.ceil(total / limit);
    return {
      bookings: transformedBookings,
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
};
