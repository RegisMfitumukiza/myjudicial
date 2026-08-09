import { z } from "zod";

export const createCertificationSchema = z.object({
  certificateName: z.string().min(2).max(200).trim(),
  issuer: z.string().min(2).max(200).trim(),
  issueDate: z.string().date("Issue date must be a valid date (YYYY-MM-DD)"),
  expiryDate: z.string().date("Expiry date must be a valid date (YYYY-MM-DD)").optional(),
});

export const updateCertificationSchema = createCertificationSchema.partial();

export type CreateCertificationDto = z.infer<typeof createCertificationSchema>;
export type UpdateCertificationDto = z.infer<typeof updateCertificationSchema>;
