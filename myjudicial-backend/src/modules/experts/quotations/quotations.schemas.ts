import { z } from "zod";
import { QuotationStatus } from "../../../generated/prisma/client.js";

export const createQuotationSchema = z.object({
  clientName: z.string().min(1).max(200).trim(),
  clientEmail: z.email().optional(),
  clientPhone: z.string().max(20).optional(),
  title: z.string().min(2).max(200).trim(),
  description: z.string().max(2000).optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("RWF"),
  validUntil: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateQuotationSchema = createQuotationSchema.partial();

export const updateQuotationStatusSchema = z.object({
  status: z.nativeEnum(QuotationStatus),
});

export type CreateQuotationDto = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationDto = z.infer<typeof updateQuotationSchema>;
export type UpdateQuotationStatusDto = z.infer<typeof updateQuotationStatusSchema>;
