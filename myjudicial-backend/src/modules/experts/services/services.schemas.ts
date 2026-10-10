import { z } from "zod";

export const SERVICE_CATEGORIES = [
  "consultation",
  "document_review",
  "contract_drafting",
  "court_representation",
  "legal_advice",
  "mediation",
  "other",
] as const;

export const DELIVERY_MODES = ["VIDEO", "PHONE", "IN_PERSON", "EMAIL"] as const;

export const createServiceSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  description: z.string().max(1000).optional(),
  category: z.string().min(2).max(100).trim().optional(),
  deliveryMode: z.enum(DELIVERY_MODES).default("VIDEO"),
  durationMin: z.number().int().min(15).max(480),
  flatFee: z.number().positive(),
  currency: z.string().length(3).default("RWF"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceDto = z.infer<typeof createServiceSchema>;
export type UpdateServiceDto = z.infer<typeof updateServiceSchema>;
