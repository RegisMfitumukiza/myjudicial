import { z } from "zod";

const legalSpecialties = [
  "FAMILY_LAW", "COMMERCIAL_LAW", "EMPLOYMENT_LAW", "LAND_LAW",
  "CRIMINAL_LAW", "TAX_LAW", "IMMIGRATION_LAW", "CORPORATE_LAW",
  "CONTRACT_LAW", "INTELLECTUAL_PROPERTY", "OTHER",
] as const;

const languages = z.array(
  z.string().min(2).max(10)
).min(1, "At least one language is required");

/** POST /experts/profile — create initial profile */
export const createProfileSchema = z.object({
  displayName: z.string().min(2).max(100).trim(),
  bio: z.string().max(1000).optional(),
  firmName: z.string().max(100).optional(),
  barNumber: z.string().min(3).max(50),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  primarySpecialty: z.enum(legalSpecialties),
  specialties: z.array(z.enum(legalSpecialties)).default([]),
  languages,
  officeAddress: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).default("Rwanda"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  // Enhanced location fields
  placeId: z.string().optional(), // Google Places ID for reference
  formattedAddress: z.string().max(400).optional(), // Standardized address from geocoding
  locationMethod: z.enum(["manual", "gps", "autocomplete", "map"]).optional(), // How location was set
  locationAccuracy: z.number().optional(), // GPS accuracy in meters
  baseConsultationFee: z.number().positive().optional(),
  currency: z.string().length(3).default("RWF"),
});

/** PATCH /experts/profile — partial update */
export const updateProfileSchema = createProfileSchema.partial();

export type CreateProfileDto = z.infer<typeof createProfileSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
