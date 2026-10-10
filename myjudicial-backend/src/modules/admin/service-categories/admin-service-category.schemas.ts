import { z } from "zod";

export const listServiceCategoriesQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(["all", "standard", "candidate"]).optional().default("all"),
});

export type ListServiceCategoriesQuery = z.infer<typeof listServiceCategoriesQuerySchema>;

export const promoteServiceCategorySchema = z.object({
  sourceCategory: z.string().min(1).trim(),
  targetCategory: z.string().min(2).max(100).trim(),
  notifyExperts: z.boolean().default(true),
  customMessage: z.string().max(500).optional(),
});

export type PromoteServiceCategoryDto = z.infer<typeof promoteServiceCategorySchema>;

export const mergeServiceCategorySchema = z.object({
  sourceCategory: z.string().min(1).trim(),
  targetCategory: z.string().min(2).max(100).trim(),
  notifyExperts: z.boolean().default(true),
  customMessage: z.string().max(500).optional(),
});

export type MergeServiceCategoryDto = z.infer<typeof mergeServiceCategorySchema>;
