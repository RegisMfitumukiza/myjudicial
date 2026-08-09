import { z } from "zod";

/**
 * Create a new review for a completed booking
 */
export const createReviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  title: z
    .string()
    .max(100, "Title must be at most 100 characters")
    .optional(),
  comment: z
    .string()
    .max(2000, "Comment must be at most 2000 characters")
    .optional(),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;

/**
 * Update an existing review (within edit window)
 */
export const updateReviewSchema = z
  .object({
    rating: z
      .number()
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(5, "Rating must be at most 5")
      .optional(),
    title: z
      .string()
      .max(100, "Title must be at most 100 characters")
      .optional(),
    comment: z
      .string()
      .max(2000, "Comment must be at most 2000 characters")
      .optional(),
  })
  .refine((data) => data.rating !== undefined || data.title !== undefined || data.comment !== undefined, {
    message: "At least one field (rating, title, or comment) must be provided",
  });

export type UpdateReviewDto = z.infer<typeof updateReviewSchema>;

/**
 * List reviews query parameters
 */
export const listReviewsSchema = z.object({
  page: z.string().default("1"),
  limit: z.string().default("10"),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
});

export type ListReviewsQuery = z.infer<typeof listReviewsSchema>;

/**
 * My reviews query parameters
 */
export const listMyReviewsSchema = z.object({
  page: z.string().default("1"),
  limit: z.string().default("10"),
});

export type ListMyReviewsQuery = z.infer<typeof listMyReviewsSchema>;


/**
 * Report a review
 */
export const reportReviewSchema = z.object({
  reason: z.enum(["SPAM", "HARASSMENT", "OFFENSIVE_LANGUAGE", "FAKE_REVIEW", "OTHER"]),
  details: z.string().max(500, "Details must be at most 500 characters").optional(),
});

export type ReportReviewDto = z.infer<typeof reportReviewSchema>;

/**
 * Admin moderate review
 */
export const moderateReviewSchema = z.object({
  action: z.enum(["hide", "restore", "remove"]),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500).optional(),
});

export type ModerateReviewDto = z.infer<typeof moderateReviewSchema>;

/**
 * React to review (helpful/unhelpful)
 */
export const reactToReviewSchema = z.object({
  isHelpful: z.boolean(),
});

export type ReactToReviewDto = z.infer<typeof reactToReviewSchema>;

/**
 * Expert reply to review
 */
export const expertReplySchema = z.object({
  reply: z.string().min(1, "Reply cannot be empty").max(1000, "Reply must be at most 1000 characters"),
});

export type ExpertReplyDto = z.infer<typeof expertReplySchema>;

/**
 * Update expert reply
 */
export const updateExpertReplySchema = z.object({
  reply: z.string().min(1, "Reply cannot be empty").max(1000, "Reply must be at most 1000 characters"),
});

export type UpdateExpertReplyDto = z.infer<typeof updateExpertReplySchema>;

/**
 * List all reviews (platform-wide)
 */
export const listAllReviewsSchema = z.object({
  page: z.string().default("1"),
  limit: z.string().default("10"),
  sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
  status: z.enum(["PUBLISHED", "PENDING", "HIDDEN", "FLAGGED", "REMOVED"]).optional(),
});

export type ListAllReviewsQuery = z.infer<typeof listAllReviewsSchema>;

/**
 * Search reviews by keyword
 */
export const searchReviewsSchema = z.object({
  keyword: z.string().min(1, "Keyword is required").max(100, "Keyword too long"),
  page: z.string().default("1"),
  limit: z.string().default("10"),
});

export type SearchReviewsQuery = z.infer<typeof searchReviewsSchema>;

/**
 * Top rated experts query
 */
export const topRatedExpertsSchema = z.object({
  minReviews: z.string().default("5"),
  limit: z.string().default("10"),
});

export type TopRatedExpertsQuery = z.infer<typeof topRatedExpertsSchema>;

/**
 * List flagged reviews (admin)
 */
export const listFlaggedReviewsSchema = z.object({
  page: z.string().default("1"),
  limit: z.string().default("10"),
  status: z.enum(["PENDING", "PUBLISHED", "HIDDEN", "FLAGGED", "REMOVED"]).optional(),
});

export type ListFlaggedReviewsQuery = z.infer<typeof listFlaggedReviewsSchema>;
