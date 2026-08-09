import { z } from "zod";
import { ReviewStatus, ReviewReportReason } from "../../generated/prisma/client.js";

export const moderateReviewSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ReviewStatus),
    moderationNote: z.string().max(1000).optional(),
  }),
});

export type ModerateReviewDto = z.infer<typeof moderateReviewSchema>["body"];

export const deleteReviewSchema = z.object({
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

export type DeleteReviewDto = z.infer<typeof deleteReviewSchema>["body"];

export const listReportsSchema = z.object({
  query: z.object({
    page: z.string().default("1"),
    limit: z.string().default("20"),
    resolved: z.enum(["true", "false"]).optional(),
    reason: z.nativeEnum(ReviewReportReason).optional(),
  }),
});

export type ListReportsQuery = z.infer<typeof listReportsSchema>["query"];
