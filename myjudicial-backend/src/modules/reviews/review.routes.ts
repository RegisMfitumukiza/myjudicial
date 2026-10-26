import { Router } from "express";
import { ReviewController } from "./review.controller.js";
import { authenticate, requireExpert } from "../../shared/middleware/authenticate.js";
import { validate, validateQuery } from "../../shared/middleware/validate.js";
import {
  createReviewSchema,
  updateReviewSchema,
  listReviewsSchema,
  listMyReviewsSchema,
  listAllReviewsSchema,
  searchReviewsSchema,
  topRatedExpertsSchema,
  expertReplySchema,
  updateExpertReplySchema,
  reactToReviewSchema,
  reportReviewSchema,
} from "./review.schemas.js";

const router = Router();

/**
 * POST /api/v1/bookings/:bookingId/review
 * Create a new review for a completed booking
 * Requires authentication (citizen only)
 */
router.post(
  "/bookings/:bookingId/review",
  authenticate,
  validate(createReviewSchema),
  ReviewController.createReview
);

/**
 * GET /api/v1/reviews/my-reviews
 * List reviews created by the authenticated user
 * Requires authentication
 * IMPORTANT: Must be registered BEFORE /reviews/:id to prevent Express
 * from matching "my-reviews" as the :id parameter.
 */
router.get(
  "/reviews/my-reviews",
  authenticate,
  validateQuery(listMyReviewsSchema),
  ReviewController.listMyReviews
);

/**
 * GET /api/v1/reviews/top-rated
 * Get top-rated experts by average rating
 * Public endpoint
 * IMPORTANT: Must be registered BEFORE /reviews/:id.
 */
router.get(
  "/reviews/top-rated",
  validateQuery(topRatedExpertsSchema),
  ReviewController.getTopRatedExperts
);

/**
 * GET /api/v1/experts/:expertId/reviews
 * List all reviews for an expert
 * Public endpoint with pagination and sorting
 */
router.get(
  "/experts/:expertId/reviews",
  validateQuery(listReviewsSchema),
  ReviewController.listExpertReviews
);

/**
 * GET /api/v1/experts/:expertId/reviews/distribution
 * Get rating distribution for an expert
 * Public endpoint
 */
router.get("/experts/:expertId/reviews/distribution", ReviewController.getExpertRatingDistribution);

/**
 * GET /api/v1/reviews/:id
 * Get a single review by ID
 * Public endpoint (no authentication required)
 * IMPORTANT: Must come AFTER all literal /reviews/* routes.
 */
router.get("/reviews/:id", ReviewController.getReview);

/**
 * PATCH /api/v1/reviews/:id
 * Update an existing review (within edit window)
 * Requires authentication (owner only)
 */
router.patch(
  "/reviews/:id",
  authenticate,
  validate(updateReviewSchema),
  ReviewController.updateReview
);

/**
 * DELETE /api/v1/reviews/:id
 * Delete a review (within edit window)
 * Requires authentication (owner only)
 */
router.delete("/reviews/:id", authenticate, ReviewController.deleteReview);

/**
 * GET /api/v1/reviews
 * List all reviews platform-wide
 * Public endpoint with pagination and sorting
 */
router.get(
  "/reviews",
  validateQuery(listAllReviewsSchema),
  ReviewController.listAllReviews
);

/**
 * GET /api/v1/experts/:expertId/reviews/search
 * Search expert reviews by keyword
 * Public endpoint
 */
router.get(
  "/experts/:expertId/reviews/search",
  validateQuery(searchReviewsSchema),
  ReviewController.searchReviews
);

/**
 * GET /api/v1/experts/:expertId/reviews/summary
 * Get combined review summary stats for an expert
 * Public endpoint
 */
router.get(
  "/experts/:expertId/reviews/summary",
  ReviewController.getExpertReviewSummary
);

// ═══════════════════════════════════════════
//  EXPERT REPLIES
// ═══════════════════════════════════════════

/**
 * POST /api/v1/reviews/:reviewId/reply
 * Expert replies to a review
 * Requires authentication (expert only)
 */
router.post(
  "/reviews/:reviewId/reply",
  authenticate,
  requireExpert,
  validate(expertReplySchema),
  ReviewController.replyToReview
);

/**
 * PATCH /api/v1/reviews/:reviewId/reply
 * Expert edits their reply
 * Requires authentication (expert only, owner of reply)
 */
router.patch(
  "/reviews/:reviewId/reply",
  authenticate,
  requireExpert,
  validate(updateExpertReplySchema),
  ReviewController.updateReply
);

/**
 * DELETE /api/v1/reviews/:reviewId/reply
 * Expert deletes their reply
 * Requires authentication (expert only, owner of reply)
 */
router.delete(
  "/reviews/:reviewId/reply",
  authenticate,
  requireExpert,
  ReviewController.deleteReply
);

// ═══════════════════════════════════════════
//  REVIEW REACTIONS (HELPFUL/UNHELPFUL)
// ═══════════════════════════════════════════

/**
 * POST /api/v1/reviews/:reviewId/react
 * Toggle helpful/unhelpful reaction on a review
 * Requires authentication
 */
router.post(
  "/reviews/:reviewId/react",
  authenticate,
  validate(reactToReviewSchema),
  ReviewController.reactToReview
);

/**
 * DELETE /api/v1/reviews/:reviewId/react
 * Remove reaction from a review
 * Requires authentication
 */
router.delete(
  "/reviews/:reviewId/react",
  authenticate,
  ReviewController.removeReaction
);

// ═══════════════════════════════════════════
//  REVIEW REPORTS
// ═══════════════════════════════════════════

/**
 * POST /api/v1/reviews/:reviewId/report
 * Report a review (spam, harassment, etc.)
 * Requires authentication
 */
router.post(
  "/reviews/:reviewId/report",
  authenticate,
  validate(reportReviewSchema),
  ReviewController.reportReview
);

export default router;
