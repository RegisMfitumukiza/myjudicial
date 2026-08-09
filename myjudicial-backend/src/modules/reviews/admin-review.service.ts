import { prisma } from "../../infrastructure/database/prisma.js";
import { NotFoundError, ValidationError } from "../../shared/errors/index.js";
import { writeAuditLog } from "../../shared/utils/audit.js";
import { ReviewStatus, ReviewReportReason } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";

interface ListFilters {
  status?: ReviewStatus;
  isFlagged?: boolean;
  minRating?: number;
  maxRating?: number;
  search?: string;
  expertId?: string;
  citizenId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface ListOptions {
  page: number;
  limit: number;
  filters: ListFilters;
  sortBy: "newest" | "oldest" | "highest" | "lowest";
}

interface ModerateOptions {
  status: ReviewStatus;
  moderationNote?: string;
  adminId: string;
}

export const AdminReviewService = {
  async getStats() {
    const [
      totalReviews,
      publishedCount,
      pendingCount,
      hiddenCount,
      flaggedCount,
      removedCount,
      reportsPending,
      avgRating,
    ] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { status: ReviewStatus.PUBLISHED } }),
      prisma.review.count({ where: { status: ReviewStatus.PENDING } }),
      prisma.review.count({ where: { status: ReviewStatus.HIDDEN } }),
      prisma.review.count({ where: { status: ReviewStatus.FLAGGED } }),
      prisma.review.count({ where: { status: ReviewStatus.REMOVED } }),
      prisma.reviewReport.count({ where: { resolved: false } }),
      prisma.review.aggregate({
        _avg: { rating: true },
      }),
    ]);

    return {
      totalReviews,
      byStatus: {
        published: publishedCount,
        pending: pendingCount,
        hidden: hiddenCount,
        flagged: flaggedCount,
        removed: removedCount,
      },
      averageRating: avgRating._avg.rating ? Number(avgRating._avg.rating.toFixed(2)) : null,
      pendingReports: reportsPending,
    };
  },

  async list(options: ListOptions) {
    const { page, limit, filters, sortBy } = options;
    const skip = (page - 1) * limit;

    let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: "desc" };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    else if (sortBy === "highest") orderBy = { rating: "desc" };
    else if (sortBy === "lowest") orderBy = { rating: "asc" };

    const where: Prisma.ReviewWhereInput = {
      ...(filters.status && { status: filters.status }),
      ...(filters.isFlagged !== undefined && { isFlagged: filters.isFlagged }),
      ...(filters.minRating !== undefined || filters.maxRating !== undefined
        ? {
            rating: {
              ...(filters.minRating !== undefined ? { gte: filters.minRating } : {}),
              ...(filters.maxRating !== undefined ? { lte: filters.maxRating } : {}),
            },
          }
        : {}),
      ...(filters.expertId && { expertId: filters.expertId }),
      ...(filters.citizenId && { citizenId: filters.citizenId }),
      ...(filters.search && {
        OR: [
          { comment: { contains: filters.search, mode: "insensitive" as const } },
          { title: { contains: filters.search, mode: "insensitive" as const } },
        ],
      }),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          citizen: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          expert: {
            select: { id: true, displayName: true, barNumber: true },
          },
          booking: {
            select: { id: true, scheduledStart: true },
          },
          _count: {
            select: { reports: true, reactions: true },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  },

  async getById(reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        citizen: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        expert: {
          select: { id: true, displayName: true, barNumber: true, status: true },
        },
        booking: {
          select: { id: true, scheduledStart: true, status: true, platformFee: true },
        },
        reports: {
          include: {
            reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        reactions: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    return review;
  },

  async moderate(reviewId: string, options: ModerateOptions) {
    const { status, moderationNote, adminId } = options;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    const previousStatus = review.status;

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        status,
        moderatedAt: new Date(),
        moderatedBy: adminId,
        moderationReason: moderationNote ?? null,
      },
      include: {
        citizen: { select: { id: true, firstName: true, lastName: true } },
        expert: { select: { id: true, displayName: true } },
      },
    });

    // Recalculate expert stats if status changed to/from PUBLISHED
    if (
      (previousStatus === ReviewStatus.PUBLISHED && status !== ReviewStatus.PUBLISHED) ||
      (previousStatus !== ReviewStatus.PUBLISHED && status === ReviewStatus.PUBLISHED)
    ) {
      await this.recalculateExpertStats(review.expertId);
    }

    await writeAuditLog({
      actorId: adminId,
      action: "UPDATE",
      resource: "REVIEW",
      resourceId: reviewId,
      description: `Review status changed from ${previousStatus} to ${status}${
        moderationNote ? `: ${moderationNote}` : ""
      }`,
      metadata: { previousStatus, newStatus: status, moderationNote },
    });

    return updatedReview;
  },

  async deleteReview(reviewId: string, adminId: string, reason?: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: ReviewStatus.REMOVED,
      },
    });

    await this.recalculateExpertStats(review.expertId);

    await writeAuditLog({
      actorId: adminId,
      action: "DELETE",
      resource: "REVIEW",
      resourceId: reviewId,
      description: `Review deleted by admin${reason ? `: ${reason}` : ""}`,
      metadata: { reason, expertId: review.expertId },
    });

    return { deleted: true };
  },

  async listReports(filters: { page: number; limit: number; resolved?: boolean; reason?: ReviewReportReason }) {
    const { page, limit, resolved, reason } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewReportWhereInput = {
      ...(resolved !== undefined && { resolved }),
      ...(reason && { reason }),
    };

    const [reports, total] = await Promise.all([
      prisma.reviewReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          review: {
            select: {
              id: true,
              rating: true,
              title: true,
              comment: true,
              status: true,
              citizen: { select: { id: true, firstName: true, lastName: true } },
              expert: { select: { id: true, displayName: true } },
            },
          },
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.reviewReport.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  },

  async resolveReport(reportId: string, adminId: string) {
    const report = await prisma.reviewReport.findUnique({
      where: { id: reportId },
      include: { review: { select: { id: true } } },
    });

    if (!report) {
      throw new NotFoundError("Report not found");
    }

    if (report.resolved) {
      throw new ValidationError("Report is already resolved");
    }

    const updatedReport = await prisma.reviewReport.update({
      where: { id: reportId },
      data: {
        resolved: true,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    await writeAuditLog({
      actorId: adminId,
      action: "UPDATE",
      resource: "REVIEW",
      resourceId: report.review.id,
      description: `Report ${reportId} resolved`,
      metadata: { reportId, reason: report.reason },
    });

    return updatedReport;
  },

  async recalculateExpertStats(expertId: string) {
    const stats = await prisma.review.aggregate({
      where: { expertId, isDeleted: false, status: ReviewStatus.PUBLISHED },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.expertProfile.update({
      where: { id: expertId },
      data: {
        averageRating: stats._avg.rating ?? null,
        reviewCount: stats._count.id,
      },
    });
  },
};
