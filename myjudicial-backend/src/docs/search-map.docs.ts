import { z, registry } from "./registry.js";

const uuidField = z.string().uuid().describe("UUID identifier");

const LegalSpecialtyEnum = z.enum([
  "FAMILY_LAW","COMMERCIAL_LAW","EMPLOYMENT_LAW","LAND_LAW",
  "CRIMINAL_LAW","TAX_LAW","IMMIGRATION_LAW","CORPORATE_LAW",
  "CONTRACT_LAW","INTELLECTUAL_PROPERTY","OTHER",
]).openapi("SearchSpecialty");

const ErrorResponse = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.string()).optional(),
}).openapi("SearchErrorResponse");

const success = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.literal(true), message: z.string(), data: dataSchema });

const errResponses = {
  400: { description: "Invalid query parameters", content: { "application/json": { schema: ErrorResponse } } },
};

/* ══════════════════════════════════════════
   SEARCH-MAP SCHEMAS
══════════════════════════════════════════ */

const NearbyExpertSchema = z.object({
  id: uuidField,
  userId: uuidField,
  displayName: z.string(),
  bio: z.string().nullable(),
  primarySpecialty: LegalSpecialtyEnum,
  specialties: z.array(LegalSpecialtyEnum),
  city: z.string().nullable(),
  country: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  baseConsultationFee: z.number().nullable(),
  currency: z.string(),
  yearsExperience: z.number().nullable(),
  profileImageObjectKey: z.string().nullable(),
  distanceKm: z.number().describe("Distance from search origin in kilometres"),
  user: z.object({
    firstName: z.string(),
    lastName: z.string(),
    avatarObjectKey: z.string().nullable(),
  }),
}).openapi("NearbyExpert");

registry.register("NearbyExpert", NearbyExpertSchema);

/* ══════════════════════════════════════════
   ROUTES
══════════════════════════════════════════ */

registry.registerPath({
  method: "get",
  path: "/search-map/experts",
  tags: ["Search & Map"],
  summary: "Geospatial expert discovery",
  description:
    "Returns VERIFIED experts within a given radius of the specified coordinates. " +
    "Results are sorted by proximity (nearest first). No authentication required. " +
    "Uses PostGIS `ST_DWithin` under the hood for efficient radius filtering.",
  request: {
    query: z.object({
      latitude: z.coerce.number().min(-90).max(90).describe("Latitude of the search origin"),
      longitude: z.coerce.number().min(-180).max(180).describe("Longitude of the search origin"),
      radiusKm: z.coerce.number().min(1).max(500).optional().describe("Search radius in kilometres (default: 50)"),
      specialty: z.string().optional().describe("Filter by a legal specialty (e.g. FAMILY_LAW)"),
      priceMin: z.coerce.number().min(0).optional().describe("Minimum consultation fee (in expert's currency)"),
      priceMax: z.coerce.number().min(0).optional().describe("Maximum consultation fee (in expert's currency)"),
    }).openapi("NearbyExpertsQuery"),
  },
  responses: {
    200: {
      description: "List of nearby verified experts sorted by distance",
      content: { "application/json": { schema: success(z.array(NearbyExpertSchema)) } },
    },
    ...errResponses,
  },
});
