import { z } from "zod";

export const createEducationSchema = z.object({
  institution: z.string().min(2).max(200).trim(),
  degree: z.string().min(2).max(100).trim(),
  fieldOfStudy: z.string().max(100).optional(),
  yearCompleted: z.number().int().min(1950).max(new Date().getFullYear()),
});

export const updateEducationSchema = createEducationSchema.partial();

export type CreateEducationDto = z.infer<typeof createEducationSchema>;
export type UpdateEducationDto = z.infer<typeof updateEducationSchema>;
