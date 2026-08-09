import { prisma } from "../../infrastructure/database/prisma.js";
import type { Prisma, ReviewStatus } from "../../generated/prisma/client.js";

export const ReviewRepository = {
  /**
   * Create a new review
   */
  create: async (data: {
    bookingId: string;
    citizenId: string;
    expertId: string;
    rating: number;
    title?: string;
    comment?: string;
    status?: ReviewStatus;
  }) => {
    return prisma.review.create({
      data: {
        bookingId: data.bookingId,
        citizenId: data.citizenId,
        expertId: data.expertId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        status: data.status ?? "PUBLISHED",
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        expert: {
          select: {
            id: true,
            displayName: true,
          },
        },
        booking: {
          select: {
            id: true,
            scheduledStart: true,
          },
        },
      },
    });
  },

  /**
   * Find review by ID
   */
  findById: async (id: string) => {
    return prisma.review.findUnique({
      where: { id },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        expert: {
          select: {
            id: true,
            displayName: true,
          },
        },
        booking: {
          select: {
            id: true,
            scheduledStart: true,
          },
        },
      },
    });
  },

  /**
   * Find review by booking ID
   */
  findByBookingId: async (bookingId: string) => {
    return prisma.review.findUnique({
      where: { bookingId },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  /**
   * List reviews for an expert with pagination
   */
  listByExpertId: async (filters: {
    expertId: string;
    page: number;
    limit: number;
    sort?: "newest" | "oldest" | "highest" | "lowest";
    status?: ReviewStatus;
    isDeleted?: boolean;
  }) => {
    const skip = (filters.page - 1) * filters.limit;

    // Determine sort order
    let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: "desc" }; // default: newest

    if (filters.sort === "oldest") {
      orderBy = { createdAt: "asc" };
    } else if (filters.sort === "highest") {
      orderBy = { rating: "desc" };
    } else if (filters.sort === "lowest") {
      orderBy = { rating: "asc" };
    }

    const where: Prisma.ReviewWhereInput = {
      expertId: filters.expertId,
      ...(filters.isDeleted !== undefined ? { isDeleted: filters.isDeleted } : { isDeleted: false }),
      ...(filters.status ? { status: filters.status } : { status: "PUBLISHED" as ReviewStatus }),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy,
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          booking: {
            select: {
              id: true,
              scheduledStart: true,
            },
          },
          expertReply: {
            select: {
              id: true,
              reply: true,
              createdAt: true,
              updatedAt: true,
              editedAt: true,
              expert: { select: { id: true, displayName: true } },
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    };
  },

  /**
   * List reviews by citizen (my reviews)
   */
  listByCitizenId: async (filters: { citizenId: string; page: number; limit: number }) => {
    const skip = (filters.page - 1) * filters.limit;
    const where = { citizenId: filters.citizenId };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: "desc" },
        include: {
          expert: {
            select: {
              id: true,
              displayName: true,
            },
          },
          booking: {
            select: {
              id: true,
              scheduledStart: true,
              service: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    };
  },

  /**
   * Update a review
   */
  update: async (
    id: string,
    data: {
      rating?: number;
      title?: string;
      comment?: string;
    }
  ) => {
    return prisma.review.update({
      where: { id },
      data: {
        ...data,
        editedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        citizen: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        expert: {
          select: {
            id: true,
            displayName: true,
          },
        },
        booking: {
          select: {
            id: true,
            scheduledStart: true,
          },
        },
      },
    });
  },

  /**
   * Delete a review (soft delete)
   */
  delete: async (id: string) => {
    return prisma.review.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  },

  /**
   * Update expert rating statistics (denormalized fields)
   * This should be called after any review create/update/delete
   */
  updateExpertRatingStats: async (expertId: string, tx?: any) => {
    const db = tx || prisma;

    const stats = await db.review.aggregate({
      where: { expertId, isDeleted: false, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { id: true },
    });

    await db.expertProfile.update({
      where: { id: expertId },
      data: {
        averageRating: stats._avg.rating ?? null,
        reviewCount: stats._count.id,
      },
    });
  },

  /**
   * Get rating distribution for an expert
   */
  getRatingDistribution: async (expertId: string) => {
    const reviews = await prisma.review.findMany({
      where: { expertId, isDeleted: false, status: "PUBLISHED" },
      select: { rating: true },
    });

    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((review) => {
      const rating = review.rating as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    return distribution;
  },

  /**
   * Count total reviews for an expert
   */
  countByExpertId: async (expertId: string): Promise<number> => {
    return prisma.review.count({
      where: { expertId, isDeleted: false, status: "PUBLISHED" },
    });
  },

  /**
   * Get combined summary stats for an expert (avg rating, total count, distribution)
   */
  getExpertSummaryStats: async (expertId: string) => {
    const [aggregation, distribution] = await Promise.all([
      prisma.review.aggregate({
        where: { expertId, isDeleted: false, status: "PUBLISHED" },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.review.findMany({
        where: { expertId, isDeleted: false, status: "PUBLISHED" },
        select: { rating: true },
      }),
    ]);

    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach((r) => {
      const rating = r.rating as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) dist[rating]++;
    });

    return {
      averageRating: aggregation._avg.rating,
      totalReviews: aggregation._count.id,
      distribution: dist,
    };
  },

  /**
   * Find reviews by rating range
   */
  findByRatingRange: async (
    expertId: string,
    minRating: number,
    maxRating: number,
    page: number,
    limit: number
  ) => {
    const skip = (page - 1) * limit;
    const where: Prisma.ReviewWhereInput = {
      expertId,
      rating: { gte: minRating, lte: maxRating },
      isDeleted: false,
      status: "PUBLISHED",
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          citizen: { select: { id: true, firstName: true, lastName: true } },
          booking: { select: { id: true, scheduledStart: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  /**
   * Search reviews by keyword in comment
   */
  searchByKeyword: async (
    expertId: string,
    keyword: string,
    page: number,
    limit: number
  ) => {
    const skip = (page - 1) * limit;
    const where: Prisma.ReviewWhereInput = {
      expertId,
      comment: { contains: keyword, mode: "insensitive" },
      isDeleted: false,
      status: "PUBLISHED",
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          citizen: { select: { id: true, firstName: true, lastName: true } },
          booking: { select: { id: true, scheduledStart: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  /**
   * Get most recent reviews for an expert
   */
  getRecentByExpert: async (expertId: string, limit: number) => {
    return prisma.review.findMany({
      where: { expertId, isDeleted: false, status: "PUBLISHED" },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        citizen: { select: { id: true, firstName: true, lastName: true } },
        booking: { select: { id: true, scheduledStart: true } },
      },
    });
  },

  /**
   * Paginated list of all reviews platform-wide
   */
  findAllPaginated: async (filters: {
    page: number;
    limit: number;
    sort?: "newest" | "oldest" | "highest" | "lowest";
    status?: ReviewStatus;
    isDeleted?: boolean;
  }) => {
    const skip = (filters.page - 1) * filters.limit;

    let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: "desc" };
    if (filters.sort === "oldest") orderBy = { createdAt: "asc" };
    else if (filters.sort === "highest") orderBy = { rating: "desc" };
    else if (filters.sort === "lowest") orderBy = { rating: "asc" };

    const where: Prisma.ReviewWhereInput = {
      ...(filters.isDeleted !== undefined ? { isDeleted: filters.isDeleted } : { isDeleted: false }),
      ...(filters.status ? { status: filters.status } : undefined),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy,
        include: {
          citizen: { select: { id: true, firstName: true, lastName: true } },
          expert: { select: { id: true, displayName: true } },
          booking: { select: { id: true, scheduledStart: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    };
  },

  /**
   * Get top-rated experts based on average rating with minimum review threshold
   */
  getTopRatedExperts: async (minReviews: number, limit: number) => {
    const experts = await prisma.expertProfile.findMany({
      where: {
        reviewCount: { gte: minReviews },
        status: "VERIFIED",
      },
      orderBy: [{ averageRating: "desc" }, { reviewCount: "desc" }],
      take: limit,
      select: {
        id: true,
        displayName: true,
        averageRating: true,
        reviewCount: true,
        primarySpecialty: true,
        city: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return experts;
  },

  // ═══════════════════════════════════════════
  //  EXPERT REPLIES
  // ═══════════════════════════════════════════

  findExpertReplyByReviewId: async (reviewId: string) => {
    return prisma.expertReply.findUnique({
      where: { reviewId },
      include: {
        expert: { select: { id: true, displayName: true } },
      },
    });
  },

  createExpertReply: async (data: {
    reviewId: string;
    expertId: string;
    reply: string;
  }) => {
    return prisma.expertReply.create({
      data: {
        reviewId: data.reviewId,
        expertId: data.expertId,
        reply: data.reply,
      },
      include: {
        expert: { select: { id: true, displayName: true } },
      },
    });
  },

  updateExpertReply: async (replyId: string, reply: string) => {
    return prisma.expertReply.update({
      where: { id: replyId },
      data: { reply, editedAt: new Date() },
      include: {
        expert: { select: { id: true, displayName: true } },
      },
    });
  },

  deleteExpertReply: async (replyId: string) => {
    return prisma.expertReply.delete({ where: { id: replyId } });
  },

  // ═══════════════════════════════════════════
  //  REVIEW REACTIONS (HELPFUL/UNHELPFUL)
  // ═══════════════════════════════════════════

  findReaction: async (reviewId: string, userId: string) => {
    return prisma.reviewReaction.findUnique({
      where: { reviewId_userId: { reviewId, userId } },
    });
  },

  upsertReaction: async (reviewId: string, userId: string, isHelpful: boolean) => {
    return prisma.reviewReaction.upsert({
      where: { reviewId_userId: { reviewId, userId } },
      create: { reviewId, userId, isHelpful },
      update: { isHelpful },
    });
  },

  deleteReaction: async (reviewId: string, userId: string) => {
    return prisma.reviewReaction.deleteMany({
      where: { reviewId, userId },
    });
  },

  updateReviewReactionCounts: async (reviewId: string, tx?: any) => {
    const db = tx || prisma;
    const [helpful, unhelpful] = await Promise.all([
      db.reviewReaction.count({ where: { reviewId, isHelpful: true } }),
      db.reviewReaction.count({ where: { reviewId, isHelpful: false } }),
    ]);
    return db.review.update({
      where: { id: reviewId },
      data: { helpfulCount: helpful, unhelpfulCount: unhelpful },
    });
  },

  // ═══════════════════════════════════════════
  //  REVIEW REPORTS
  // ═══════════════════════════════════════════

  createReport: async (data: {
    reviewId: string;
    reportedBy: string;
    reason: string;
    details?: string;
  }) => {
    return prisma.reviewReport.create({
      data: {
        reviewId: data.reviewId,
        reportedBy: data.reportedBy,
        reason: data.reason as any,
        details: data.details,
      },
    });
  },

  findExistingReport: async (reviewId: string, reportedBy: string) => {
    return prisma.reviewReport.findFirst({
      where: { reviewId, reportedBy, resolved: false },
    });
  },

  findReportById: async (id: string) => {
    return prisma.reviewReport.findUnique({ where: { id } });
  },
};
