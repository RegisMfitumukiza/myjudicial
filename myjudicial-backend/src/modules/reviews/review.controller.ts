import { Request, Response, NextFunction } from "express";
import { ReviewService } from "./review.service.js";
import type { ReviewStatus } from "../../generated/prisma/client.js";
import type {
  CreateReviewDto,
  UpdateReviewDto,
  ListReviewsQuery,
  ListMyReviewsQuery,
  ListAllReviewsQuery,
  SearchReviewsQuery,
  TopRatedExpertsQuery,
  ExpertReplyDto,
  UpdateExpertReplyDto,
  ReactToReviewDto,
  ReportReviewDto,
} from "./review.schemas.js";

export const ReviewController = {
  /**
   * POST /api/v1/bookings/:bookingId/review
   * Create a new review for a completed booking
   */
  createReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookingId = req.params.bookingId as string;
      const citizenId = req.user?.id;
      const dto: CreateReviewDto = req.body;

      if (!citizenId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const review = await ReviewService.createReview(bookingId, citizenId, dto);

      res.status(201).json({
        success: true,
        data: review,
        message: "Review submitted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/reviews/:id
   * Get a single review by ID
   */
  getReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewId = req.params.id as string;

      const review = await ReviewService.getReviewById(reviewId);

      res.status(200).json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/experts/:expertId/reviews
   * List all reviews for an expert with pagination and sorting
   */
  listExpertReviews: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expertId = req.params.expertId as string;
      const query = (req.validatedQuery ?? req.query) as unknown as ListReviewsQuery;

      const page = parseInt(query.page || "1") || 1;
      const limit = parseInt(query.limit || "10") || 10;
      const sort = query.sort || "newest";

      const result = await ReviewService.listExpertReviews({
        expertId,
        page,
        limit,
        sort,
      });

      res.status(200).json({
        success: true,
        data: result.reviews,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/reviews/my-reviews
   * List reviews created by the authenticated citizen
   */
  listMyReviews: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const citizenId = req.user?.id;
      const query = (req.validatedQuery ?? req.query) as unknown as ListMyReviewsQuery;

      if (!citizenId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const page = parseInt(query.page || "1") || 1;
      const limit = parseInt(query.limit || "10") || 10;

      const result = await ReviewService.listMyReviews({
        citizenId,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result.reviews,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/reviews/:id
   * Update an existing review (within edit window)
   */
  updateReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewId = req.params.id as string;
      const citizenId = req.user?.id;
      const dto: UpdateReviewDto = req.body;

      if (!citizenId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const review = await ReviewService.updateReview(reviewId, citizenId, dto);

      res.status(200).json({
        success: true,
        data: review,
        message: "Review updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/reviews/:id
   * Delete a review (within edit window)
   */
  deleteReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewId = req.params.id as string;
      const citizenId = req.user?.id;

      if (!citizenId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await ReviewService.deleteReview(reviewId, citizenId);

      res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/experts/:expertId/reviews/distribution
   * Get rating distribution for an expert
   */
  getExpertRatingDistribution: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const expertId = req.params.expertId as string;

      const distribution = await ReviewService.getExpertRatingDistribution(expertId);

      res.status(200).json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/experts/:expertId/reviews/summary
   * Get combined review summary stats for an expert
   */
  getExpertReviewSummary: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const expertId = req.params.expertId as string;

      const stats = await ReviewService.getExpertSummaryStats(expertId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/reviews
   * List all reviews platform-wide
   */
  listAllReviews: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = (req.validatedQuery ?? req.query) as unknown as ListAllReviewsQuery;

      const page = parseInt(query.page || "1") || 1;
      const limit = parseInt(query.limit || "10") || 10;
      const sort = query.sort || "newest";
      const status = query.status;

      const result = await ReviewService.listAllReviews({ page, limit, sort, status: status as ReviewStatus | undefined });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/experts/:expertId/reviews/search
   * Search expert reviews by keyword
   */
  searchReviews: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const expertId = req.params.expertId as string;
      const query = (req.validatedQuery ?? req.query) as unknown as SearchReviewsQuery;

      const keyword = query.keyword;
      const page = parseInt(query.page || "1") || 1;
      const limit = parseInt(query.limit || "10") || 10;

      const result = await ReviewService.searchReviews(expertId, keyword, page, limit);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/reviews/top-rated
   * Get top-rated experts
   */
  getTopRatedExperts: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = (req.validatedQuery ?? req.query) as unknown as TopRatedExpertsQuery;

      const minReviews = parseInt(query.minReviews || "5") || 5;
      const limit = parseInt(query.limit || "10") || 10;

      const experts = await ReviewService.getTopRatedExperts(minReviews, limit);

      res.status(200).json({
        success: true,
        data: experts,
      });
    } catch (error) {
      next(error);
    }
  },

  // ═══════════════════════════════════════════
  //  EXPERT REPLIES
  // ═══════════════════════════════════════════

  replyToReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewId = req.params.reviewId as string;
      const expertId = req.user?.expertProfileId;
      const dto: ExpertReplyDto = req.body;

      if (!expertId) {
        res.status(403).json({ error: "Expert profile required" });
        return;
      }

      const reply = await ReviewService.replyToReview(reviewId, expertId, dto);

      res.status(201).json({
        success: true,
        data: reply,
        message: "Reply posted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  updateReply: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewId = req.params.reviewId as string;
      const expertId = req.user?.expertProfileId;
      const dto: UpdateExpertReplyDto = req.body;

      if (!expertId) {
        res.status(403).json({ error: "Expert profile required" });
        return;
      }

      const reply = await ReviewService.updateReply(reviewId, expertId, dto);

      res.status(200).json({
        success: true,
        data: reply,
        message: "Reply updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  deleteReply: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewId = req.params.reviewId as string;
      const expertId = req.user?.expertProfileId;

      if (!expertId) {
        res.status(403).json({ error: "Expert profile required" });
        return;
      }

      await ReviewService.deleteReply(reviewId, expertId);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },

  // ═══════════════════════════════════════════
  //  REVIEW REACTIONS
  // ═══════════════════════════════════════════

  reactToReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewId = req.params.reviewId as string;
      const userId = req.user?.id;
      const dto: ReactToReviewDto = req.body;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await ReviewService.reactToReview(reviewId, userId, dto);

      res.status(200).json({
        success: true,
        message: dto.isHelpful ? "Marked as helpful" : "Marked as unhelpful",
      });
    } catch (error) {
      next(error);
    }
  },

  removeReaction: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewId = req.params.reviewId as string;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      await ReviewService.removeReaction(reviewId, userId);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },

  // ═══════════════════════════════════════════
  //  REVIEW REPORTS
  // ═══════════════════════════════════════════

  reportReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reviewId = req.params.reviewId as string;
      const reporterId = req.user?.id;
      const dto: ReportReviewDto = req.body;

      if (!reporterId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const report = await ReviewService.reportReview(reviewId, reporterId, dto);

      res.status(201).json({
        success: true,
        data: report,
        message: "Report submitted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};
