import { ReviewRepository } from "./review.repository.js";
import { BookingRepository } from "../bookings/booking.repository.js";
import { logger } from "../../shared/utils/logger.js";
import { writeAuditLog } from "../../shared/utils/audit.js";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  AuthorizationError,
} from "../../shared/errors/index.js";
import { sendReviewNotificationEmail } from "../../infrastructure/email/email.service.js";
import { NotificationRepository } from "../notifications/notification.repository.js";
import type { CreateReviewDto, UpdateReviewDto, ExpertReplyDto, UpdateExpertReplyDto, ReactToReviewDto, ReportReviewDto } from "./review.schemas.js";
import type { ReviewStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

// Edit window duration in days
const EDIT_WINDOW_DAYS = 7;

/**
 * Check if a review can still be edited based on creation date
 */
const canEditReview = (createdAt: Date): boolean => {
  const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceCreation <= EDIT_WINDOW_DAYS;
};

export const ReviewService = {
  /**
   * Create a new review for a completed booking
   */
  createReview: async (bookingId: string, citizenId: string, dto: CreateReviewDto) => {
    // 1. Fetch booking with relations
    const booking = await BookingRepository.findById(bookingId);

    // 2. Validate booking exists
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // 3. Validate ownership - only the citizen who made the booking can review
    if (booking.citizenId !== citizenId) {
      throw new AuthorizationError("Cannot review booking you did not participate in");
    }

    // 4. Validate booking is completed
    if (booking.status !== "COMPLETED") {
      throw new ValidationError(
        "Can only review completed bookings. Current status: " + booking.status
      );
    }

    // 5. Validate payment was successful or not required (booking-first mode)
    if (booking.paymentStatus !== "PAID" && booking.paymentStatus !== "NOT_REQUIRED") {
      throw new ValidationError("Can only review bookings with successful or non-required payments");
    }

    // 6. Validate no existing review
    const existingReview = await ReviewRepository.findByBookingId(bookingId);
    if (existingReview) {
      throw new ConflictError("Review already exists for this booking");
    }

    // 7. Validate rating range (schema should catch this, but double-check)
    if (dto.rating < 1 || dto.rating > 5) {
      throw new ValidationError("Rating must be between 1 and 5");
    }

    // 8. Validate comment is not empty if provided
    if (dto.comment !== undefined && dto.comment.trim().length === 0) {
      throw new ValidationError("Comment cannot be empty");
    }

    // 9. Create review and update expert stats in a transaction
    let review;
    await prisma.$transaction(async (tx) => {
      // Create the review
      review = await ReviewRepository.create({
        bookingId,
        citizenId,
        expertId: booking.expertId,
        rating: dto.rating,
        title: dto.title?.trim() || undefined,
        comment: dto.comment?.trim(),
      });

      // Update expert aggregated stats
      await ReviewRepository.updateExpertRatingStats(booking.expertId, tx);
    });

    logger.info("Review created", {
      reviewId: review!.id,
      bookingId,
      expertId: booking.expertId,
      rating: dto.rating,
    });

    // 10. Send notification email to expert (fire-and-forget)
    try {
      const expert = booking.expert as any;
      const citizen = booking.citizen as any;
      const expertLanguage = (expert?.user?.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';

      if (expert?.user?.email) {
        await sendReviewNotificationEmail(expert.user.email, {
          expertName: expert.displayName || "Expert",
          citizenName: `${citizen?.firstName || ""} ${citizen?.lastName?.[0] || ""}`.trim(),
          rating: dto.rating,
          comment: dto.comment?.substring(0, 200) || "", // Truncate for email
          reviewId: review!.id,
        }, expertLanguage);
      }

      // In-app notification for expert
      if (expert?.userId && expert?.user?.email) {
        await NotificationRepository.create({
          userId: expert.userId,
          event: "REVIEW_RECEIVED",
          recipient: expert.user.email,
          subject: "New review received",
          body: `${citizen?.firstName || "A client"} left you a ${dto.rating}-star review${dto.title ? `: "${dto.title}"` : ""}.`,
        });
      }
    } catch (emailError) {
      logger.error("Failed to send review notification email", {
        reviewId: review!.id,
        error: emailError,
      });
      // Don't fail the request if email fails
    }

    // 11. Write audit log
    await writeAuditLog({
      actorId: citizenId,
      action: "CREATE",
      resource: "REVIEW",
      resourceId: review!.id,
      description: `Created review for booking ${bookingId}`,
      metadata: { rating: dto.rating, expertId: booking.expertId },
    });

    return review!;
  },

  /**
   * Get a single review by ID
   */
  getReviewById: async (reviewId: string) => {
    const review = await ReviewRepository.findById(reviewId);

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    return review;
  },

  /**
   * List reviews for an expert with pagination and sorting
   */
  listExpertReviews: async (filters: {
    expertId: string;
    page: number;
    limit: number;
    sort?: "newest" | "oldest" | "highest" | "lowest";
  }) => {
    const result = await ReviewRepository.listByExpertId(filters);

    return {
      reviews: result.data,
      pagination: result.pagination,
    };
  },

  /**
   * List reviews by the authenticated citizen
   */
  listMyReviews: async (filters: { citizenId: string; page: number; limit: number }) => {
    const result = await ReviewRepository.listByCitizenId(filters);

    return {
      reviews: result.data,
      pagination: result.pagination,
    };
  },

  /**
   * Update an existing review (within edit window)
   */
  updateReview: async (reviewId: string, citizenId: string, dto: UpdateReviewDto) => {
    // 1. Fetch review
    const review = await ReviewRepository.findById(reviewId);

    // 2. Validate review exists
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    // 3. Validate ownership
    if (review.citizenId !== citizenId) {
      throw new AuthorizationError("Cannot edit someone else's review");
    }

    // 4. Validate edit window
    if (!canEditReview(review.createdAt)) {
      throw new ValidationError(
        `Review can only be edited within ${EDIT_WINDOW_DAYS} days of creation`
      );
    }

    // 5. Validate at least one field is being updated
    if (dto.rating === undefined && dto.comment === undefined) {
      throw new ValidationError("At least one field (rating or comment) must be provided");
    }

    // 6. Validate rating range if provided
    if (dto.rating !== undefined && (dto.rating < 1 || dto.rating > 5)) {
      throw new ValidationError("Rating must be between 1 and 5");
    }

    // 7. Validate comment is not empty if provided
    if (dto.comment !== undefined && dto.comment.trim().length === 0) {
      throw new ValidationError("Comment cannot be empty");
    }

    // 8. Update review and recalculate expert stats in a transaction
    let updatedReview;
    await prisma.$transaction(async (tx) => {
      // Update the review
      updatedReview = await ReviewRepository.update(reviewId, {
        rating: dto.rating,
        comment: dto.comment?.trim(),
      });

      // Recalculate expert stats only if rating changed
      if (dto.rating !== undefined) {
        await ReviewRepository.updateExpertRatingStats(review.expertId, tx);
      }
    });

    logger.info("Review updated", {
      reviewId,
      expertId: review.expertId,
      changes: dto,
    });

    // 9. Write audit log
    await writeAuditLog({
      actorId: citizenId,
      action: "UPDATE",
      resource: "REVIEW",
      resourceId: reviewId,
      description: `Updated review`,
      metadata: dto,
    });

    return updatedReview!;
  },

  /**
   * Delete a review (within edit window)
   */
  deleteReview: async (reviewId: string, citizenId: string) => {
    // 1. Fetch review
    const review = await ReviewRepository.findById(reviewId);

    // 2. Validate review exists
    if (!review) {
      throw new NotFoundError("Review not found");
    }

    // 3. Validate ownership
    if (review.citizenId !== citizenId) {
      throw new AuthorizationError("Cannot delete someone else's review");
    }

    // 4. Validate edit window
    if (!canEditReview(review.createdAt)) {
      throw new ValidationError(
        `Review can only be deleted within ${EDIT_WINDOW_DAYS} days of creation`
      );
    }

    // 5. Delete review and recalculate expert stats in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the review
      await ReviewRepository.delete(reviewId);

      // Recalculate expert stats
      await ReviewRepository.updateExpertRatingStats(review.expertId, tx);
    });

    logger.info("Review deleted", {
      reviewId,
      expertId: review.expertId,
    });

    // 6. Write audit log
    await writeAuditLog({
      actorId: citizenId,
      action: "DELETE",
      resource: "REVIEW",
      resourceId: reviewId,
      description: `Deleted review for booking ${review.bookingId}`,
    });
  },

  /**
   * Get rating distribution for an expert
   */
  getExpertRatingDistribution: async (expertId: string) => {
    return ReviewRepository.getRatingDistribution(expertId);
  },

  /**
   * Get combined summary stats for an expert profile
   */
  getExpertSummaryStats: async (expertId: string) => {
    return ReviewRepository.getExpertSummaryStats(expertId);
  },

  /**
   * List all reviews platform-wide with pagination and sorting
   */
  listAllReviews: async (filters: {
    page: number;
    limit: number;
    sort?: "newest" | "oldest" | "highest" | "lowest";
    status?: ReviewStatus;
  }) => {
    return ReviewRepository.findAllPaginated(filters);
  },

  /**
   * Search reviews by keyword in comment
   */
  searchReviews: async (expertId: string, keyword: string, page: number, limit: number) => {
    return ReviewRepository.searchByKeyword(expertId, keyword, page, limit);
  },

  /**
   * Get top-rated experts
   */
  getTopRatedExperts: async (minReviews: number, limit: number) => {
    return ReviewRepository.getTopRatedExperts(minReviews, limit);
  },

  // ═══════════════════════════════════════════
  //  EXPERT REPLIES
  // ═══════════════════════════════════════════

  replyToReview: async (reviewId: string, expertId: string, dto: ExpertReplyDto) => {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) throw new NotFoundError("Review not found");
    if (review.expertId !== expertId) throw new AuthorizationError("Can only reply to reviews on your profile");

    const existing = await ReviewRepository.findExpertReplyByReviewId(reviewId);
    if (existing) throw new ConflictError("You have already replied to this review");

    const reply = await ReviewRepository.createExpertReply({
      reviewId,
      expertId,
      reply: dto.reply.trim(),
    });

    await writeAuditLog({
      actorId: expertId,
      action: "CREATE",
      resource: "REVIEW",
      resourceId: reply.id,
      description: `Replied to review ${reviewId}`,
    });

    return reply;
  },

  updateReply: async (reviewId: string, expertId: string, dto: UpdateExpertReplyDto) => {
    const reply = await ReviewRepository.findExpertReplyByReviewId(reviewId);
    if (!reply) throw new NotFoundError("Reply not found");
    if (reply.expertId !== expertId) throw new AuthorizationError("Cannot edit someone else's reply");

    const updated = await ReviewRepository.updateExpertReply(reply.id, dto.reply.trim());

    await writeAuditLog({
      actorId: expertId,
      action: "UPDATE",
      resource: "REVIEW",
      resourceId: reply.id,
      description: `Updated reply on review`,
    });

    return updated;
  },

  deleteReply: async (reviewId: string, expertId: string) => {
    const reply = await ReviewRepository.findExpertReplyByReviewId(reviewId);
    if (!reply) throw new NotFoundError("Reply not found");
    if (reply.expertId !== expertId) throw new AuthorizationError("Cannot delete someone else's reply");

    await ReviewRepository.deleteExpertReply(reply.id);

    await writeAuditLog({
      actorId: expertId,
      action: "DELETE",
      resource: "REVIEW",
      resourceId: reply.id,
      description: `Deleted reply on review`,
    });
  },

  // ═══════════════════════════════════════════
  //  REVIEW REACTIONS (HELPFUL/UNHELPFUL)
  // ═══════════════════════════════════════════

  reactToReview: async (reviewId: string, userId: string, dto: ReactToReviewDto) => {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) throw new NotFoundError("Review not found");
    if (review.citizenId === userId) throw new ValidationError("Cannot react to your own review");

    await ReviewRepository.upsertReaction(reviewId, userId, dto.isHelpful);
    await ReviewRepository.updateReviewReactionCounts(reviewId);

    return { success: true };
  },

  removeReaction: async (reviewId: string, userId: string) => {
    await ReviewRepository.deleteReaction(reviewId, userId);
    await ReviewRepository.updateReviewReactionCounts(reviewId);
    return { success: true };
  },

  // ═══════════════════════════════════════════
  //  REVIEW REPORTS
  // ═══════════════════════════════════════════

  reportReview: async (reviewId: string, reporterId: string, dto: ReportReviewDto) => {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) throw new NotFoundError("Review not found");
    if (review.citizenId === reporterId) throw new ValidationError("Cannot report your own review");

    const existing = await ReviewRepository.findExistingReport(reviewId, reporterId);
    if (existing) throw new ConflictError("You have already reported this review");

    const report = await ReviewRepository.createReport({
      reviewId,
      reportedBy: reporterId,
      reason: dto.reason,
      details: dto.details?.trim(),
    });

    await writeAuditLog({
      actorId: reporterId,
      action: "CREATE",
      resource: "REVIEW",
      resourceId: report.id,
      description: `Reported review ${reviewId} for ${dto.reason}`,
    });

    return report;
  },
};
