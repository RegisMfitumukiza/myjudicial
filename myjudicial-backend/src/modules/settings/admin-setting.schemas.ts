import { z } from "zod";

export const socialLinksSchema = z.object({
  x: z.string().trim().optional(),
  linkedin: z.string().trim().optional(),
  facebook: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  youtube: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
});

export const updateSettingsSchema = z.object({
  platformName: z.string().min(1).max(100).optional(),
  maintenanceMode: z.boolean().optional(),
  defaultRole: z.enum(["CITIZEN", "EXPERT"]).optional(),
  platformFeePercent: z.number().min(0).max(100).optional(),
  minEscrowDurationSeconds: z.number().int().min(0).optional(),
  paymentMode: z.enum(["BOOKING_FIRST", "PAYMENT_REQUIRED"]).optional(),
  socialLinks: socialLinksSchema.optional(),
});
