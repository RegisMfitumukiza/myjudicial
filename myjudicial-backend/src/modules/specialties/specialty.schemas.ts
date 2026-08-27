import { z } from "zod";

export const createSpecialtySchema = z.object({
  slug: z.string().trim().min(1).max(50).regex(/^[a-z0-9_-]+$/, "Slug must be lowercase alphanumeric with hyphens or underscores"),
  label: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(50).optional(),
  group: z.string().trim().max(50).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateSpecialtySchema = z.object({
  slug: z.string().trim().min(1).max(50).regex(/^[a-z0-9_-]+$/).optional(),
  label: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(50).optional(),
  group: z.string().trim().max(50).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const listSpecialtiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  isActive: z.coerce.boolean().optional(),
  group: z.string().optional(),
  search: z.string().optional(),
});

export type CreateSpecialtyDto = z.infer<typeof createSpecialtySchema>;
export type UpdateSpecialtyDto = z.infer<typeof updateSpecialtySchema>;
export type ListSpecialtiesQuery = z.infer<typeof listSpecialtiesQuerySchema>;
