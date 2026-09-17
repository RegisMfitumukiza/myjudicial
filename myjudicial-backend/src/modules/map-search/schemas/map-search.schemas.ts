import { z } from "zod";
import { LegalSpecialty } from "../../../generated/prisma/client.js";

// ─── Enums ─────────────────────────────────────────────────────────────────

export const AvailabilityFilterEnum = z.enum([
  "ONLINE",
  "AVAILABLE_TODAY",
  "AVAILABLE_NOW",
]);

export const SortOptionEnum = z.enum([
  "NEAREST",
  "RECOMMENDED",
  "HIGHEST_RATED",
  "MOST_EXPERIENCED",
  "MOST_REVIEWED",
  "AVAILABLE_NOW",
]);

// ─── Filter sub-schema ──────────────────────────────────────────────────────

export const mapSearchFiltersSchema = z.object({
  specialties: z
    .array(z.nativeEnum(LegalSpecialty))
    .optional()
    .describe("Filter by one or more practice areas"),

  languages: z
    .array(z.string().min(1).max(50))
    .optional()
    .describe("Filter by spoken languages"),

  availability: AvailabilityFilterEnum.optional().describe(
    "Filter by current presence status"
  ),

  minRating: z
    .number()
    .min(0)
    .max(5)
    .optional()
    .describe("Minimum average rating (0–5)"),

  minYearsExperience: z
    .number()
    .int()
    .min(0)
    .max(60)
    .optional()
    .describe("Minimum years of experience"),

  includeOnLeave: z
    .boolean()
    .default(false)
    .describe("Include experts currently on leave"),

  instantConsult: z
    .boolean()
    .optional()
    .describe("Only experts with instant consultation services"),
});

// ─── Main search payload ────────────────────────────────────────────────────

const baseSearchSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude must be ≥ -90")
    .max(90, "Latitude must be ≤ 90"),

  longitude: z
    .number()
    .min(-180, "Longitude must be ≥ -180")
    .max(180, "Longitude must be ≤ 180"),

  radiusKm: z
    .number()
    .min(1, "Radius must be at least 1 km")
    .max(50, "Radius must not exceed 50 km")
    .default(10),

  sort: SortOptionEnum.default("NEAREST"),

  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),

  search: z.string().max(100).optional().describe("Full-text search by name"),

  filters: mapSearchFiltersSchema.default({ includeOnLeave: false }),
});

/** POST /map-search/nearby — search by current GPS location */
export const nearbySearchSchema = baseSearchSchema;

/** POST /map-search/location — search by a selected point on the map */
export const locationSearchSchema = baseSearchSchema;

// ─── Types ──────────────────────────────────────────────────────────────────

export type NearbySearchDto = z.infer<typeof nearbySearchSchema>;
export type LocationSearchDto = z.infer<typeof locationSearchSchema>;
export type MapSearchFiltersDto = z.infer<typeof mapSearchFiltersSchema>;
export type SortOption = z.infer<typeof SortOptionEnum>;
export type AvailabilityFilter = z.infer<typeof AvailabilityFilterEnum>;
