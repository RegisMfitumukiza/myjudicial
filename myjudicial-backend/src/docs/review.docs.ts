/**
 * Review module OpenAPI documentation.
 * Uses zod-to-openapi to generate schemas from Zod definitions.
 */
import { z } from "zod";
import { registry } from "./registry.js";

/* ── Reusable field primitives ── */
const uuidField = z.string().uuid().describe("UUID identifier");
const isoDateTimeField = z
  .string()
  .datetime()
  .describe("ISO 8601 datetime string");

/* ── Request body schemas ── */

const CreateReviewDtoSchema = z
  .object({
    rating: z
      .number()
      .int()
      .min(1, "Rating must be at least 1")
      .max(5, "Rating must be at most 5")
      .describe("Rating from 1 to 5 stars"),
    comment: z
      .string()
      .max(2000, "Comment must be at most 2000 characters")
      .optional()
      .describe("Optional review comment"),
  })
  .openapi("CreateReviewDto");

const UpdateReviewDtoSchema = z
  .object({
    rating: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe("Updated rating from 1 to 5 stars"),
    comment: z
      .string()
      .max(2000)
      .optional()
      .describe("Updated review comment"),
  })
  .openapi("UpdateReviewDto");

/* ── Response schemas ── */

const CitizenNestedSchema = z
  .object({
    id: uuidField,
    firstName: z.string(),
    lastName: z.string(),
  })
  .openapi("ReviewCitizenNested");

const ExpertNestedSchema = z
  .object({
    id: uuidField,
    displayName: z.string(),
  })
  .openapi("ReviewExpertNested");

const BookingNestedSchema = z
  .object({
    id: uuidField,
    scheduledStart: isoDateTimeField,
  })
  .openapi("ReviewBookingNested");

const ReviewResponseSchema = z
  .object({
    id: uuidField,
    bookingId: uuidField,
    citizenId: uuidField,
    expertId: uuidField,
    rating: z.number().int().min(1).max(5).describe("Rating from 1 to 5"),
    comment: z.string().nullable().describe("Review comment"),
    createdAt: isoDateTimeField,
    citizen: CitizenNestedSchema,
    expert: ExpertNestedSchema,
    booking: BookingNestedSchema,
  })
  .openapi("ReviewResponse");

const ReviewListResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.array(ReviewResponseSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
    }),
  })
  .openapi("ReviewListResponse");

const RatingDistributionSchema = z
  .object({
    "5": z.number().describe("Count of 5-star reviews"),
    "4": z.number().describe("Count of 4-star reviews"),
    "3": z.number().describe("Count of 3-star reviews"),
    "2": z.number().describe("Count of 2-star reviews"),
    "1": z.number().describe("Count of 1-star reviews"),
  })
  .openapi("RatingDistribution");

/* ── Query parameter schemas ── */

const ListReviewsQuerySchema = z
  .object({
    page: z.string().default("1").describe("Page number"),
    limit: z.string().default("10").describe("Items per page"),
    sort: z
      .enum(["newest", "oldest", "highest", "lowest"])
      .default("newest")
      .describe("Sort order"),
  })
  .openapi("ListReviewsQuery");

/* ── Error responses ── */

const ErrorResponseSchema = z
  .object({
    error: z.string(),
    details: z.array(z.string()).optional(),
  })
  .openapi("ErrorResponse");

/* ── Register endpoints ── */

/**
 * POST /api/v1/bookings/:bookingId/review
 */
registry.registerPath({
  method: "post",
  path: "/bookings/{bookingId}/review",
  summary: "Create a review for a completed booking",
  description:
    "Citizens can review experts after completing a consultation. Only one review per booking is allowed.",
  tags: ["Reviews"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      bookingId: uuidField.describe("The booking ID to review"),
    }).openapi("CreateReviewParams"),
    body: {
      content: {
        "application/json": {
          schema: CreateReviewDtoSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Review created successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: ReviewResponseSchema,
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Validation error or business rule violation",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - authentication required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Booking not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    409: {
      description: "Review already exists for this booking",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /api/v1/reviews/:id
 */
registry.registerPath({
  method: "get",
  path: "/reviews/{id}",
  summary: "Get a single review by ID",
  description: "Retrieve details of a specific review.",
  tags: ["Reviews"],
  request: {
    params: z.object({
      id: uuidField.describe("The review ID"),
    }).openapi("GetReviewParams"),
  },
  responses: {
    200: {
      description: "Review found",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: ReviewResponseSchema,
          }),
        },
      },
    },
    404: {
      description: "Review not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /api/v1/experts/:expertId/reviews
 */
registry.registerPath({
  method: "get",
  path: "/experts/{expertId}/reviews",
  summary: "List all reviews for an expert",
  description:
    "Public endpoint to retrieve all reviews for a specific expert with pagination and sorting.",
  tags: ["Reviews", "Experts"],
  request: {
    params: z.object({
      expertId: uuidField.describe("The expert profile ID"),
    }).openapi("ListExpertReviewsParams"),
    query: ListReviewsQuerySchema,
  },
  responses: {
    200: {
      description: "Reviews retrieved successfully",
      content: {
        "application/json": {
          schema: ReviewListResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /api/v1/experts/:expertId/reviews/distribution
 */
registry.registerPath({
  method: "get",
  path: "/experts/{expertId}/reviews/distribution",
  summary: "Get rating distribution for an expert",
  description: "Retrieve the count of reviews for each rating level (1-5 stars).",
  tags: ["Reviews", "Experts"],
  request: {
    params: z.object({
      expertId: uuidField.describe("The expert profile ID"),
    }).openapi("GetRatingDistributionParams"),
  },
  responses: {
    200: {
      description: "Rating distribution retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: RatingDistributionSchema,
          }),
        },
      },
    },
  },
});

/**
 * GET /api/v1/reviews/my-reviews
 */
registry.registerPath({
  method: "get",
  path: "/reviews/my-reviews",
  summary: "List reviews created by the authenticated user",
  description: "Retrieve all reviews submitted by the current citizen.",
  tags: ["Reviews"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().default("1"),
      limit: z.string().default("10"),
    }).openapi("MyReviewsQuery"),
  },
  responses: {
    200: {
      description: "User's reviews retrieved successfully",
      content: {
        "application/json": {
          schema: ReviewListResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - authentication required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * PATCH /api/v1/reviews/:id
 */
registry.registerPath({
  method: "patch",
  path: "/reviews/{id}",
  summary: "Update an existing review",
  description:
    "Update a review within 7 days of creation. Only the review owner can edit their review.",
  tags: ["Reviews"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: uuidField.describe("The review ID"),
    }).openapi("UpdateReviewParams"),
    body: {
      content: {
        "application/json": {
          schema: UpdateReviewDtoSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Review updated successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: ReviewResponseSchema,
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Validation error or edit window expired",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - authentication required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - not the review owner",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Review not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * DELETE /api/v1/reviews/:id
 */
registry.registerPath({
  method: "delete",
  path: "/reviews/{id}",
  summary: "Delete a review",
  description:
    "Delete a review within 7 days of creation. Only the review owner can delete their review.",
  tags: ["Reviews"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: uuidField.describe("The review ID"),
    }).openapi("DeleteReviewParams"),
  },
  responses: {
    200: {
      description: "Review deleted successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Edit window expired",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - authentication required",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - not the review owner",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Review not found",
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /api/v1/reviews
 */
registry.registerPath({
  method: "get",
  path: "/reviews",
  summary: "List all reviews platform-wide",
  description: "Public endpoint to retrieve all reviews with pagination, sorting, and optional status filter.",
  tags: ["Reviews"],
  request: {
    query: z.object({
      page: z.string().default("1").describe("Page number"),
      limit: z.string().default("10").describe("Items per page"),
      sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest").describe("Sort order"),
      status: z.enum(["PUBLISHED", "PENDING", "HIDDEN", "FLAGGED", "REMOVED"]).optional().describe("Filter by status"),
    }).openapi("ListAllReviewsQuery"),
  },
  responses: {
    200: {
      description: "Reviews retrieved successfully",
      content: {
        "application/json": {
          schema: ReviewListResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /api/v1/experts/{expertId}/reviews/search
 */
registry.registerPath({
  method: "get",
  path: "/experts/{expertId}/reviews/search",
  summary: "Search expert reviews by keyword",
  description: "Search through an expert's reviews by keyword in the comment field.",
  tags: ["Reviews", "Experts"],
  request: {
    params: z.object({
      expertId: uuidField.describe("The expert profile ID"),
    }).openapi("SearchExpertReviewsParams"),
    query: z.object({
      keyword: z.string().min(1).describe("Search keyword"),
      page: z.string().default("1").describe("Page number"),
      limit: z.string().default("10").describe("Items per page"),
    }).openapi("SearchExpertReviewsQuery"),
  },
  responses: {
    200: {
      description: "Search results retrieved successfully",
      content: {
        "application/json": {
          schema: ReviewListResponseSchema,
        },
      },
    },
  },
});

/**
 * GET /api/v1/reviews/top-rated
 */
registry.registerPath({
  method: "get",
  path: "/reviews/top-rated",
  summary: "Get top-rated experts",
  description: "Returns experts sorted by average rating, filtered by a minimum review count threshold.",
  tags: ["Reviews", "Experts"],
  request: {
    query: z.object({
      minReviews: z.string().default("5").describe("Minimum number of reviews required"),
      limit: z.string().default("10").describe("Number of experts to return"),
    }).openapi("TopRatedExpertsQuery"),
  },
  responses: {
    200: {
      description: "Top-rated experts retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.array(z.object({
              id: z.string(),
              displayName: z.string(),
              averageRating: z.number().nullable(),
              reviewCount: z.number(),
              primarySpecialty: z.string(),
              city: z.string().nullable(),
            })),
          }),
        },
      },
    },
  },
});

/**
 * GET /api/v1/experts/{expertId}/reviews/summary
 */
registry.registerPath({
  method: "get",
  path: "/experts/{expertId}/reviews/summary",
  summary: "Get combined review summary for an expert",
  description: "Returns average rating, total review count, and rating distribution in one call.",
  tags: ["Reviews", "Experts"],
  request: {
    params: z.object({
      expertId: uuidField.describe("The expert profile ID"),
    }).openapi("GetReviewSummaryParams"),
  },
  responses: {
    200: {
      description: "Review summary retrieved successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              averageRating: z.number().nullable(),
              totalReviews: z.number(),
              distribution: z.object({
                "5": z.number(),
                "4": z.number(),
                "3": z.number(),
                "2": z.number(),
                "1": z.number(),
              }),
            }),
          }),
        },
      },
    },
  },
});
