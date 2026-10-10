import { z, registry } from "./registry.js";

/* ── Shared field primitives ── */
const uuidField = z.string().uuid().describe("UUID identifier");

/* ══════════════════════════════════════════
   SEARCH SCHEMAS
══════════════════════════════════════════ */

const ExpertSearchResultSchema = z.object({
  id: uuidField,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional(),
  bio: z.string().optional(),
  hourlyRate: z.number().nullable().describe("Base consultation fee — null if the expert never set one"),
  currency: z.string(),
  yearsExperience: z.number(),
  languages: z.array(z.string()),
  specialties: z.array(z.string()),
  rating: z.number().nullable().describe("Average rating — null if the expert has no reviews yet"),
  reviewCount: z.number(),
  avatarObjectKey: z.string().nullable(),
  avatarUrl: z.string().nullable().describe("Time-limited signed URL to display the photo — null if none uploaded"),
  status: z.string(),
  city: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  distance: z.number().optional(),
  verified: z.boolean(),
}).openapi("ExpertSearchResult");

registry.register("ExpertSearchResult", ExpertSearchResultSchema);

/* ══════════════════════════════════════════
   SHARED RESPONSE SCHEMAS
══════════════════════════════════════════ */

const LegalSpecialtyEnum = z.enum([
  "FAMILY_LAW","COMMERCIAL_LAW","EMPLOYMENT_LAW","LAND_LAW",
  "CRIMINAL_LAW","TAX_LAW","IMMIGRATION_LAW","CORPORATE_LAW",
  "CONTRACT_LAW","INTELLECTUAL_PROPERTY","OTHER",
]).openapi("LegalSpecialty");

const ExpertStatusEnum = z.enum([
  "DRAFT","PENDING_VERIFICATION","VERIFIED","REJECTED","SUSPENDED",
]).openapi("ExpertStatus");

const PresenceStatusEnum = z.enum(["ONLINE","OFFLINE","BUSY","ON_LEAVE"]).openapi("PresenceStatus");
const DayOfWeekEnum = z.enum(["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"]).openapi("DayOfWeek");

const ErrorResponse = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.string()).optional(),
}).openapi("ExpertErrorResponse");

const success = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.literal(true), message: z.string(), data: dataSchema });

const errResponses = {
  400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
  401: { description: "Unauthenticated", content: { "application/json": { schema: ErrorResponse } } },
  403: { description: "Unauthorized", content: { "application/json": { schema: ErrorResponse } } },
  404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
};

/* ══════════════════════════════════════════
   SEARCH ENDPOINT
══════════════════════════════════════════ */

registry.registerPath({
  method: "get",
  path: "/experts",
  tags: ["Expert — Search"],
  summary: "Search and list experts",
  description: "Search verified experts by location, specialty, and other filters. Returns experts within specified radius sorted by distance.",
  request: {
    query: z.object({
      lat: z.coerce.number().min(-90).max(90).optional().describe("Latitude for geospatial search"),
      lng: z.coerce.number().min(-180).max(180).optional().describe("Longitude for geospatial search"),
      radius: z.coerce.number().min(1).max(500).optional().describe("Search radius in kilometers (default: 50)"),
      specialty: z.string().optional().describe("Filter by legal specialty"),
      limit: z.coerce.number().min(1).max(100).optional().describe("Number of results to return (default: 50)"),
      page: z.coerce.number().min(1).optional().describe("Page number for pagination (default: 1)"),
      search: z.string().optional().describe("Text search in expert names and specialties"),
    }).openapi("ExpertSearchQuery"),
  },
  responses: {
    200: {
      description: "List of experts matching search criteria",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.array(ExpertSearchResultSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              pages: z.number(),
            }).optional(),
          }),
        },
      },
    },
    400: { description: "Invalid query parameters", content: { "application/json": { schema: ErrorResponse } } },
  },
});

/* ══════════════════════════════════════════
   PROFILE SCHEMAS
══════════════════════════════════════════ */

const ProfileSchema = z.object({
  id: uuidField,
  userId: uuidField,
  displayName: z.string(),
  bio: z.string().nullable(),
  firmName: z.string().nullable(),
  barNumber: z.string().nullable(),
  yearsExperience: z.number().nullable(),
  status: ExpertStatusEnum,
  primarySpecialty: LegalSpecialtyEnum,
  specialties: z.array(LegalSpecialtyEnum),
  languages: z.array(z.string()),
  officeAddress: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  baseConsultationFee: z.number().nullable(),
  currency: z.string(),
  credentialsExpiry: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi("ExpertProfile");

const CreateProfileBody = z.object({
  displayName: z.string().min(2).max(100),
  bio: z.string().max(1000).optional(),
  firmName: z.string().max(100).optional(),
  barNumber: z.string().min(3).max(50),
  yearsExperience: z.number().int().min(0).max(60).optional(),
  primarySpecialty: LegalSpecialtyEnum,
  specialties: z.array(LegalSpecialtyEnum).optional(),
  languages: z.array(z.string()).min(1),
  officeAddress: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  baseConsultationFee: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
}).openapi("CreateProfileDto");

registry.register("ExpertProfile", ProfileSchema);
registry.register("CreateProfileDto", CreateProfileBody);

registry.registerPath({
  method: "post", path: "/experts/profile", tags: ["Expert — Profile"],
  summary: "Create expert profile",
  description: "Creates the expert's public profile. Status starts as PENDING_VERIFICATION.",
  security: [{ bearerAuth: [] }],
  request: { body: { required: true, content: { "application/json": { schema: CreateProfileBody } } } },
  responses: {
    201: { description: "Profile created", content: { "application/json": { schema: success(ProfileSchema) } } },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get", path: "/experts/profile/me", tags: ["Expert — Profile"],
  summary: "Get own expert profile",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Profile retrieved", content: { "application/json": { schema: success(ProfileSchema.extend({ statusMessage: z.string() }).nullable()) } } },
    ...errResponses,
  },
});

registry.registerPath({
  method: "patch", path: "/experts/profile/me", tags: ["Expert — Profile"],
  summary: "Update own expert profile",
  security: [{ bearerAuth: [] }],
  request: { body: { required: true, content: { "application/json": { schema: CreateProfileBody.partial() } } } },
  responses: {
    200: { description: "Profile updated", content: { "application/json": { schema: success(ProfileSchema) } } },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get", path: "/experts/{id}/profile", tags: ["Expert — Profile"],
  summary: "Get public expert profile",
  description: "Returns profile only if status is VERIFIED.",
  request: { params: z.object({ id: uuidField }).openapi("GetPublicExpertProfileParams") },
  responses: {
    200: { description: "Profile retrieved", content: { "application/json": { schema: success(ProfileSchema) } } },
    404: errResponses[404],
  },
});

/* ══════════════════════════════════════════
   SERVICES (LegalService)
══════════════════════════════════════════ */

const SERVICE_CATEGORIES = [
  "consultation",
  "document_review",
  "contract_drafting",
  "court_representation",
  "legal_advice",
  "mediation",
  "other",
] as const;

const DELIVERY_MODES = ["VIDEO", "PHONE", "IN_PERSON", "EMAIL"] as const;

const LegalServiceSchema = z.object({
  id: uuidField,
  expertId: uuidField,
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  deliveryMode: z.enum(DELIVERY_MODES),
  durationMin: z.number(),
  flatFee: z.number(),
  currency: z.string(),
  isActive: z.boolean(),
  isDefault: z.boolean().describe("True for the default 'Consultation' service auto-created at profile setup."),
  sortOrder: z.number().describe("Display order for the expert's own service list — lower shows first."),
  createdAt: z.string(),
}).openapi("LegalService");

const CreateServiceBody = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  category: z.string().optional(),
  deliveryMode: z.enum(DELIVERY_MODES).optional(),
  durationMin: z.number().int().min(15).max(480),
  flatFee: z.number().positive(),
  currency: z.string().length(3).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
}).openapi("CreateServiceDto");

registry.register("LegalService", LegalServiceSchema);
registry.register("CreateServiceDto", CreateServiceBody);

registry.registerPath({
  method: "get", path: "/experts/services", tags: ["Expert — Services"],
  summary: "List own services", security: [{ bearerAuth: [] }],
  responses: { 200: { description: "Services list", content: { "application/json": { schema: success(z.array(LegalServiceSchema)) } } }, ...errResponses },
});

registry.registerPath({
  method: "post", path: "/experts/services", tags: ["Expert — Services"],
  summary: "Create a bookable service", security: [{ bearerAuth: [] }],
  request: { body: { required: true, content: { "application/json": { schema: CreateServiceBody } } } },
  responses: { 201: { description: "Service created", content: { "application/json": { schema: success(LegalServiceSchema) } } }, ...errResponses },
});

registry.registerPath({
  method: "patch", path: "/experts/services/{id}", tags: ["Expert — Services"],
  summary: "Update a service",
  description: "The default service (isDefault: true) can never be set isActive: false — returns 409.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: uuidField }).openapi("UpdateServiceParams"), body: { required: true, content: { "application/json": { schema: CreateServiceBody.partial() } } } },
  responses: {
    200: { description: "Service updated", content: { "application/json": { schema: success(LegalServiceSchema) } } },
    ...errResponses,
    409: { description: "Cannot deactivate the default service", content: { "application/json": { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: "delete", path: "/experts/services/{id}", tags: ["Expert — Services"],
  summary: "Delete or deactivate a service",
  description: "If bookings exist, the service is deactivated instead of deleted. The default " +
    "service (isDefault: true) can never be deleted, only deactivated — returns 409.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: uuidField }).openapi("DeleteServiceParams") },
  responses: {
    204: { description: "Deleted" },
    ...errResponses,
    409: { description: "Cannot delete the default service — deactivate it instead", content: { "application/json": { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: "get", path: "/experts/{expertId}/services", tags: ["Expert — Services"],
  summary: "Get public services for an expert",
  request: { params: z.object({ expertId: uuidField }).openapi("GetExpertServicesParams") },
  responses: { 200: { description: "Active services", content: { "application/json": { schema: success(z.array(LegalServiceSchema)) } } }, 404: errResponses[404] },
});

registry.registerPath({
  method: "put", path: "/experts/services/reorder", tags: ["Expert — Services"],
  summary: "Reorder own services",
  description: "Sets sortOrder on each listed service to match its position in serviceIds (drag-and-drop reordering).",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: z.object({ serviceIds: z.array(uuidField) }).openapi("ReorderServicesDto") } },
    },
  },
  responses: { 200: { description: "Services reordered", content: { "application/json": { schema: success(z.null()) } } }, ...errResponses },
});

/* ══════════════════════════════════════════
   EDUCATION
══════════════════════════════════════════ */

const EducationSchema = z.object({
  id: uuidField, expertId: uuidField,
  institution: z.string(), degree: z.string(),
  fieldOfStudy: z.string().nullable(), yearCompleted: z.number(),
  createdAt: z.string(),
}).openapi("ExpertEducation");

const CreateEducationBody = z.object({
  institution: z.string().min(2).max(200),
  degree: z.string().min(2).max(100),
  fieldOfStudy: z.string().max(100).optional(),
  yearCompleted: z.number().int().min(1950).max(new Date().getFullYear()),
}).openapi("CreateEducationDto");

registry.register("ExpertEducation", EducationSchema);

registry.registerPath({ method: "get", path: "/experts/education", tags: ["Expert — Education"], summary: "List education records", security: [{ bearerAuth: [] }], responses: { 200: { description: "Records", content: { "application/json": { schema: success(z.array(EducationSchema)) } } }, ...errResponses } });
registry.registerPath({ method: "post", path: "/experts/education", tags: ["Expert — Education"], summary: "Add education record", security: [{ bearerAuth: [] }], request: { body: { required: true, content: { "application/json": { schema: CreateEducationBody } } } }, responses: { 201: { description: "Created", content: { "application/json": { schema: success(EducationSchema) } } }, ...errResponses } });
registry.registerPath({ method: "patch", path: "/experts/education/{id}", tags: ["Expert — Education"], summary: "Update education record", security: [{ bearerAuth: [] }], request: { params: z.object({ id: uuidField }).openapi("UpdateEducationParams"), body: { required: true, content: { "application/json": { schema: CreateEducationBody.partial() } } } }, responses: { 200: { description: "Updated", content: { "application/json": { schema: success(EducationSchema) } } }, ...errResponses } });
registry.registerPath({ method: "delete", path: "/experts/education/{id}", tags: ["Expert — Education"], summary: "Delete education record", security: [{ bearerAuth: [] }], request: { params: z.object({ id: uuidField }).openapi("DeleteEducationParams") }, responses: { 204: { description: "Deleted" }, ...errResponses } });

/* ══════════════════════════════════════════
   CERTIFICATIONS
══════════════════════════════════════════ */

const CertSchema = z.object({
  id: uuidField, expertId: uuidField,
  certificateName: z.string(), issuer: z.string(),
  issueDate: z.string(), expiryDate: z.string().nullable(),
  createdAt: z.string(),
}).openapi("ExpertCertification");

const CreateCertBody = z.object({
  certificateName: z.string().min(2).max(200),
  issuer: z.string().min(2).max(200),
  issueDate: z.string().date(),
  expiryDate: z.string().date().optional(),
}).openapi("CreateCertificationDto");

registry.register("ExpertCertification", CertSchema);

registry.registerPath({ method: "get", path: "/experts/certifications", tags: ["Expert — Certifications"], summary: "List certifications", security: [{ bearerAuth: [] }], responses: { 200: { description: "Certifications", content: { "application/json": { schema: success(z.array(CertSchema)) } } }, ...errResponses } });
registry.registerPath({ method: "post", path: "/experts/certifications", tags: ["Expert — Certifications"], summary: "Add certification", security: [{ bearerAuth: [] }], request: { body: { required: true, content: { "application/json": { schema: CreateCertBody } } } }, responses: { 201: { description: "Created", content: { "application/json": { schema: success(CertSchema) } } }, ...errResponses } });
registry.registerPath({ method: "patch", path: "/experts/certifications/{id}", tags: ["Expert — Certifications"], summary: "Update certification", security: [{ bearerAuth: [] }], request: { params: z.object({ id: uuidField }).openapi("UpdateCertificationParams"), body: { required: true, content: { "application/json": { schema: CreateCertBody.partial() } } } }, responses: { 200: { description: "Updated", content: { "application/json": { schema: success(CertSchema) } } }, ...errResponses } });
registry.registerPath({ method: "delete", path: "/experts/certifications/{id}", tags: ["Expert — Certifications"], summary: "Delete certification", security: [{ bearerAuth: [] }], request: { params: z.object({ id: uuidField }).openapi("DeleteCertificationParams") }, responses: { 204: { description: "Deleted" }, ...errResponses } });

/* ══════════════════════════════════════════
   AVAILABILITY
══════════════════════════════════════════ */

const AvailabilitySlotSchema = z.object({
  id: uuidField, expertId: uuidField,
  presenceStatus: PresenceStatusEnum,
  dayOfWeek: DayOfWeekEnum,
  startTime: z.string().describe("HH:MM"),
  endTime: z.string().describe("HH:MM"),
  isAvailable: z.boolean(),
}).openapi("ExpertAvailability");

const UpsertAvailabilityBody = z.object({
  presenceStatus: PresenceStatusEnum.optional(),
  schedule: z.array(z.object({
    dayOfWeek: DayOfWeekEnum,
    startTime: z.string().describe("HH:MM e.g. 09:00"),
    endTime: z.string().describe("HH:MM e.g. 17:00"),
    isAvailable: z.boolean(),
  })).max(7).optional(),
}).openapi("UpsertAvailabilityDto");

registry.register("ExpertAvailability", AvailabilitySlotSchema);

registry.registerPath({ method: "get", path: "/experts/availability", tags: ["Expert — Availability"], summary: "Get weekly schedule and presence", security: [{ bearerAuth: [] }], responses: { 200: { description: "Availability", content: { "application/json": { schema: success(z.array(AvailabilitySlotSchema)) } } }, ...errResponses } });
registry.registerPath({ method: "patch", path: "/experts/availability", tags: ["Expert — Availability"], summary: "Update schedule and/or presence", security: [{ bearerAuth: [] }], request: { body: { required: true, content: { "application/json": { schema: UpsertAvailabilityBody } } } }, responses: { 200: { description: "Updated", content: { "application/json": { schema: success(z.array(AvailabilitySlotSchema)) } } }, ...errResponses } });
registry.registerPath({ method: "patch", path: "/experts/availability/presence", tags: ["Expert — Availability"], summary: "Update presence status only", security: [{ bearerAuth: [] }], request: { body: { required: true, content: { "application/json": { schema: z.object({ presenceStatus: PresenceStatusEnum }).openapi("UpdatePresenceBody") } } } }, responses: { 200: { description: "Presence updated", content: { "application/json": { schema: success(z.object({ presenceStatus: PresenceStatusEnum }).openapi("UpdatePresenceResponse")) } } }, ...errResponses } });

/* ══════════════════════════════════════════
   SCHEDULE SETTINGS (Phase 2)
══════════════════════════════════════════ */

const ScheduleSettingsSchema = z.object({
  id: uuidField,
  expertId: uuidField,
  timezone: z.string().describe("IANA timezone identifier (e.g., Africa/Kigali)"),
  bufferTimeMinutes: z.number().int().describe("Minutes between appointments"),
  advanceNoticeHours: z.number().int().describe("Minimum hours before booking"),
  maxDaysInAdvance: z.number().int().describe("Maximum days clients can book ahead"),
  maxBookingsPerDay: z.number().int().nullable().describe("Daily booking limit (null = unlimited)"),
  respectPresenceStatus: z.boolean().describe("Whether OFFLINE/ON_LEAVE blocks bookings"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi("ScheduleSettings");

const UpdateScheduleSettingsBody = z.object({
  timezone: z.string().max(50).optional().describe("IANA timezone identifier"),
  bufferTimeMinutes: z.number().int().min(0).max(120).optional().describe("Buffer time (0-120 minutes)"),
  advanceNoticeHours: z.number().int().min(0).max(168).optional().describe("Advance notice (0-168 hours)"),
  maxDaysInAdvance: z.number().int().min(1).max(365).optional().describe("Booking window (1-365 days)"),
  maxBookingsPerDay: z.number().int().min(1).max(50).nullable().optional().describe("Daily limit (null = unlimited)"),
  respectPresenceStatus: z.boolean().optional().describe("Block bookings when offline"),
}).openapi("UpdateScheduleSettingsDto");

registry.register("ScheduleSettings", ScheduleSettingsSchema);

registry.registerPath({ 
  method: "get", 
  path: "/experts/schedule-settings", 
  tags: ["Expert — Schedule Settings"], 
  summary: "Get schedule settings", 
  description: "Returns expert's scheduling preferences. Creates default settings if none exist.",
  security: [{ bearerAuth: [] }], 
  responses: { 
    200: { 
      description: "Schedule settings retrieved", 
      content: { "application/json": { schema: success(ScheduleSettingsSchema) } } 
    }, 
    ...errResponses 
  } 
});

registry.registerPath({ 
  method: "patch", 
  path: "/experts/schedule-settings", 
  tags: ["Expert — Schedule Settings"], 
  summary: "Update schedule settings", 
  description: "Update scheduling preferences. All fields are optional.",
  security: [{ bearerAuth: [] }], 
  request: { 
    body: { 
      required: true, 
      content: { "application/json": { schema: UpdateScheduleSettingsBody } } 
    } 
  }, 
  responses: { 
    200: { 
      description: "Settings updated", 
      content: { "application/json": { schema: success(ScheduleSettingsSchema) } } 
    }, 
    ...errResponses 
  } 
});

/* ══════════════════════════════════════════
   AVAILABILITY OVERRIDES (Phase 3)
══════════════════════════════════════════ */

const OverrideTypeEnum = z.enum(["CLOSED", "CUSTOM_HOURS", "REDUCED_CAPACITY"]).openapi("OverrideType");

const AvailabilityOverrideSchema = z.object({
  id: uuidField,
  expertId: uuidField,
  date: z.string().describe("Date in YYYY-MM-DD format"),
  overrideType: OverrideTypeEnum,
  startTime: z.string().nullable().describe("Custom start time (HH:MM) for CUSTOM_HOURS type"),
  endTime: z.string().nullable().describe("Custom end time (HH:MM) for CUSTOM_HOURS type"),
  maxBookings: z.number().int().nullable().describe("Maximum bookings for REDUCED_CAPACITY type"),
  reason: z.string().nullable().describe("Optional reason/note for the override"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi("AvailabilityOverride");

const CreateOverrideBody = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date in YYYY-MM-DD format"),
  overrideType: OverrideTypeEnum,
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().describe("Start time for CUSTOM_HOURS (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().describe("End time for CUSTOM_HOURS (HH:MM)"),
  maxBookings: z.number().int().min(1).max(50).optional().describe("Max bookings for REDUCED_CAPACITY"),
  reason: z.string().max(500).optional().describe("Optional reason"),
}).openapi("CreateOverrideDto");

const BulkCreateOverridesBody = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overrideType: OverrideTypeEnum,
  reason: z.string().max(500).optional(),
}).openapi("BulkCreateOverridesDto");

registry.register("AvailabilityOverride", AvailabilityOverrideSchema);

registry.registerPath({
  method: "get",
  path: "/experts/availability/overrides",
  tags: ["Expert — Availability Overrides"],
  summary: "List availability overrides",
  description: "Get date-specific overrides. Optionally filter by month or date range.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("Filter by month (YYYY-MM)"),
      fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("From date (YYYY-MM-DD)"),
      toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("To date (YYYY-MM-DD)"),
    }).openapi("ListOverridesQuery"),
  },
  responses: {
    200: {
      description: "Overrides retrieved",
      content: { "application/json": { schema: success(z.array(AvailabilityOverrideSchema)) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/experts/availability/overrides",
  tags: ["Expert — Availability Overrides"],
  summary: "Create availability override",
  description: "Block a date, set custom hours, or reduce capacity for a specific date.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CreateOverrideBody } },
    },
  },
  responses: {
    201: {
      description: "Override created",
      content: {
        "application/json": {
          schema: success(
            z.object({
              override: AvailabilityOverrideSchema,
              warning: z.string().optional().describe("Warning if existing bookings found"),
            })
          ),
        },
      },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "patch",
  path: "/experts/availability/overrides/{id}",
  tags: ["Expert — Availability Overrides"],
  summary: "Update availability override",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            overrideType: OverrideTypeEnum.optional(),
            startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
            endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().optional(),
            maxBookings: z.number().int().nullable().optional(),
            reason: z.string().max(500).nullable().optional(),
          }).openapi("UpdateOverrideDto"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Override updated",
      content: { "application/json": { schema: success(AvailabilityOverrideSchema) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "delete",
  path: "/experts/availability/overrides/{id}",
  tags: ["Expert — Availability Overrides"],
  summary: "Delete availability override",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }),
  },
  responses: {
    200: {
      description: "Override deleted",
      content: { "application/json": { schema: success(z.null()) } },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/experts/availability/overrides/bulk",
  tags: ["Expert — Availability Overrides"],
  summary: "Bulk create overrides (vacation mode)",
  description: "Block multiple consecutive dates at once. Perfect for vacations or holidays.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: BulkCreateOverridesBody } },
    },
  },
  responses: {
    201: {
      description: "Overrides created",
      content: {
        "application/json": {
          schema: success(
            z.object({
              count: z.number().int().describe("Number of overrides created"),
              warning: z.string().optional().describe("Dates with existing bookings"),
            })
          ),
        },
      },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "delete",
  path: "/experts/availability/overrides/range",
  tags: ["Expert — Availability Overrides"],
  summary: "Delete overrides in date range",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }).openapi("DeleteRangeQuery"),
  },
  responses: {
    200: {
      description: "Overrides deleted",
      content: { "application/json": { schema: success(z.null()) } },
    },
    ...errResponses,
  },
});

/* ══════════════════════════════════════════
   COMPLIANCE
══════════════════════════════════════════ */

const ComplianceStatusSchema = z.object({
  status: ExpertStatusEnum,
  credentialsExpiry: z.string().nullable(),
  daysUntilExpiry: z.number().nullable(),
  isExpired: z.boolean(),
  statusMessage: z.string(),
  lastVerification: z.object({
    id: uuidField, status: z.string(),
    rejectionReason: z.string().nullable(),
    reviewedAt: z.string().nullable(),
    createdAt: z.string(),
  }).nullable(),
}).openapi("ComplianceStatus");

registry.register("ComplianceStatus", ComplianceStatusSchema);

registry.registerPath({ method: "get", path: "/experts/compliance", tags: ["Expert — Compliance"], summary: "Get compliance status", description: "Returns credential expiry, days remaining, and last verification result.", security: [{ bearerAuth: [] }], responses: { 200: { description: "Compliance status", content: { "application/json": { schema: success(ComplianceStatusSchema) } } }, ...errResponses } });
registry.registerPath({ method: "patch", path: "/experts/compliance/credentials-expiry", tags: ["Expert — Compliance"], summary: "Update credentials expiry date", description: "Expert updates this when renewing their credentials. Must be a future date.", security: [{ bearerAuth: [] }], request: { body: { required: true, content: { "application/json": { schema: z.object({ credentialsExpiry: z.string().date().describe("YYYY-MM-DD") }).openapi("UpdateCredentialsExpiryBody") } } } }, responses: { 200: { description: "Expiry updated", content: { "application/json": { schema: success(z.object({ id: uuidField, status: ExpertStatusEnum, credentialsExpiry: z.string().nullable() }).openapi("UpdateCredentialsExpiryResponse")) } } }, ...errResponses } });

/* ══════════════════════════════════════════
   STATISTICS
══════════════════════════════════════════ */

const StatsSchema = z.object({
  completedConsultations: z.number(),
  activeConsultations: z.number().optional(),
  pendingBookings: z.number().optional(),
  averageRating: z.number().nullable(),
  reviewCount: z.number(),
}).openapi("ExpertStatistics");

registry.register("ExpertStatistics", StatsSchema);
registry.registerPath({ method: "get", path: "/experts/statistics", tags: ["Expert — Statistics"], summary: "Get own statistics", security: [{ bearerAuth: [] }], responses: { 200: { description: "Statistics", content: { "application/json": { schema: success(StatsSchema) } } }, ...errResponses } });
registry.registerPath({ method: "get", path: "/experts/{expertId}/statistics", tags: ["Expert — Statistics"], summary: "Get public statistics for an expert", request: { params: z.object({ expertId: uuidField }).openapi("GetExpertStatisticsParams") }, responses: { 200: { description: "Public statistics", content: { "application/json": { schema: success(StatsSchema) } } }, 404: errResponses[404] } });

/* ══════════════════════════════════════════
   EARNINGS
══════════════════════════════════════════ */

const EarningsSchema = z.object({
  currency: z.string(),
  grossRevenue: z.number(),
  platformFees: z.number(),
  netRevenue: z.number(),
  pendingEscrowBalance: z.number(),
  completedPayouts: z.number(),
  recentTransactions: z.array(z.object({
    bookingId: uuidField, serviceName: z.string(),
    amount: z.number(), currency: z.string(),
    completedAt: z.string().nullable(),
  })),
}).openapi("ExpertEarnings");

registry.register("ExpertEarnings", EarningsSchema);
registry.registerPath({ method: "get", path: "/experts/earnings", tags: ["Expert — Earnings"], summary: "Get earnings summary", description: "Returns gross revenue, platform fees (15%), net revenue, and pending escrow balance.", security: [{ bearerAuth: [] }], responses: { 200: { description: "Earnings", content: { "application/json": { schema: success(EarningsSchema) } } }, ...errResponses } });

/* ══════════════════════════════════════════
   VERIFICATION SUBMISSION
══════════════════════════════════════════ */

const VerificationSubmissionResponse = z.object({
  id: uuidField,
  expertId: uuidField,
  status: z.literal("PENDING"),
  createdAt: z.string(),
}).openapi("VerificationSubmission");

registry.register("VerificationSubmission", VerificationSubmissionResponse);

registry.registerPath({
  method: "post",
  path: "/experts/verification/submit",
  tags: ["Expert — Verification"],
  summary: "Submit expert verification documents",
  description:
    "Uploads identity documents and bar certificate for admin review. " +
    "Accepts `multipart/form-data`. Image files are treated as headshot; " +
    "PDF/Word files are treated as the bar certificate. " +
    "Sets profile status to `PENDING_VERIFICATION` automatically.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              files: {
                type: "array",
                items: { type: "string", format: "binary" },
                description: "Up to 10 files: images (headshot) and/or PDF/Word (bar certificate)",
              },
              barNumber: { type: "string", description: "Bar registration number" },
              certificateName: { type: "string", description: "Name of the bar certificate" },
              issuer: { type: "string", description: "Issuing body of the certificate" },
              issueDate: { type: "string", format: "date", description: "Issue date in YYYY-MM-DD format" },
            },
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Verification request submitted — awaiting admin review",
      content: { "application/json": { schema: success(VerificationSubmissionResponse) } },
    },
    409: { description: "Already VERIFIED or a PENDING request already exists", content: { "application/json": { schema: ErrorResponse } } },
    ...errResponses,
  },
});


/* ══════════════════════════════════════════
   ADMIN — EXPERT MANAGEMENT
══════════════════════════════════════════ */

const AccountStatusEnum = z.enum([
  "ACTIVE", "INACTIVE", "SUSPENDED_COMPLIANCE", "DELETED"
]).openapi("AccountStatus");

const AdminExpertListItemSchema = z.object({
  id: uuidField,
  fullName: z.string(),
  email: z.string(),
  accountStatus: AccountStatusEnum,
  createdAt: z.string(),
  verified: z.boolean(),
  barNumber: z.string().nullable(),
  specialties: z.array(LegalSpecialtyEnum),
  avgRating: z.number().nullable(),
  totalBookings: z.number(),
  credentialsExpiry: z.string().nullable(),
  yearsOfExperience: z.number().nullable(),
  profileImage: z.string().nullable(),
  officeAddress: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
}).openapi("AdminExpertListItem");

const AdminExpertDetailSchema = AdminExpertListItemSchema.extend({
  phone: z.string().nullable(),
  lastLoginAt: z.string().nullable(),
  languages: z.array(z.string()),
  bio: z.string().nullable(),
  totalReviews: z.number(),
  education: z.array(EducationSchema),
  certifications: z.array(CertSchema),
  services: z.array(LegalServiceSchema),
  recentBookings: z.array(z.object({
    id: uuidField,
    status: z.string(),
    scheduledAt: z.string(),
    totalFeeRwf: z.number(),
    createdAt: z.string(),
    Client: z.object({
      id: uuidField,
      fullName: z.string(),
      email: z.string(),
    }),
  })),
}).openapi("AdminExpertDetail");

registry.register("AdminExpertListItem", AdminExpertListItemSchema);
registry.register("AdminExpertDetail", AdminExpertDetailSchema);

// List experts
registry.registerPath({
  method: "get",
  path: "/admin/experts",
  tags: ["Admin — Expert Management"],
  summary: "List all experts with filters",
  description: "Admin-only endpoint to list and filter all expert accounts.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce.number().int().positive().default(1).optional(),
      limit: z.coerce.number().int().positive().max(100).default(20).optional(),
      status: AccountStatusEnum.optional(),
      specialty: LegalSpecialtyEnum.optional(),
      search: z.string().optional(),
      verified: z.coerce.boolean().optional(),
      sortBy: z.enum(["createdAt", "fullName", "totalBookings", "avgRating"]).default("createdAt").optional(),
      sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
    }).openapi("AdminListExpertsQuery"),
  },
  responses: {
    200: {
      description: "List of experts",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.array(AdminExpertListItemSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
    ...errResponses,
  },
});

// Get expert details
registry.registerPath({
  method: "get",
  path: "/admin/experts/{id}",
  tags: ["Admin — Expert Management"],
  summary: "Get detailed expert information",
  description: "Returns full expert profile including bookings, education, and certifications.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }).openapi("AdminGetExpertParams"),
  },
  responses: {
    200: {
      description: "Expert details",
      content: { "application/json": { schema: success(AdminExpertDetailSchema) } },
    },
    ...errResponses,
  },
});

// Suspend expert
registry.registerPath({
  method: "patch",
  path: "/admin/experts/{id}/suspend",
  tags: ["Admin — Expert Management"],
  summary: "Suspend expert account",
  description: "Suspends expert account and hides their map pin. Prevents new bookings.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }).openapi("AdminSuspendExpertParams"),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            reason: z.string().min(10),
            suspendUntil: z.string().datetime().optional(),
            notifyExpert: z.boolean().default(true),
          }).openapi("SuspendExpertBody"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Expert suspended",
      content: {
        "application/json": {
          schema: success(z.object({
            id: uuidField,
            fullName: z.string(),
            accountStatus: AccountStatusEnum,
          })),
        },
      },
    },
    ...errResponses,
  },
});

// Activate expert
registry.registerPath({
  method: "patch",
  path: "/admin/experts/{id}/activate",
  tags: ["Admin — Expert Management"],
  summary: "Reactivate suspended expert",
  description: "Reactivates suspended expert account and shows their map pin.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }).openapi("AdminActivateExpertParams"),
  },
  responses: {
    200: {
      description: "Expert activated",
      content: {
        "application/json": {
          schema: success(z.object({
            id: uuidField,
            fullName: z.string(),
            accountStatus: AccountStatusEnum,
          })),
        },
      },
    },
    ...errResponses,
  },
});

// Update expert status
registry.registerPath({
  method: "patch",
  path: "/admin/experts/{id}/status",
  tags: ["Admin — Expert Management"],
  summary: "Update expert account status",
  description: "Manually update expert account status (ACTIVE, INACTIVE, SUSPENDED_COMPLIANCE, DELETED).",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }).openapi("AdminUpdateExpertStatusParams"),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            status: AccountStatusEnum,
            reason: z.string().optional(),
          }).openapi("UpdateExpertStatusBody"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Status updated",
      content: {
        "application/json": {
          schema: success(z.object({
            id: uuidField,
            fullName: z.string(),
            accountStatus: AccountStatusEnum,
          })),
        },
      },
    },
    ...errResponses,
  },
});

// Get expert bookings
registry.registerPath({
  method: "get",
  path: "/admin/experts/{id}/bookings",
  tags: ["Admin — Expert Management"],
  summary: "Get expert's booking history",
  description: "Returns all bookings for a specific expert.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }).openapi("AdminGetExpertBookingsParams"),
    query: z.object({
      page: z.coerce.number().int().positive().default(1).optional(),
      limit: z.coerce.number().int().positive().max(100).default(20).optional(),
    }).openapi("AdminGetExpertBookingsQuery"),
  },
  responses: {
    200: {
      description: "Expert bookings",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.array(z.any()), // Reuse booking schema if available
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
    ...errResponses,
  },
});

/* ══════════════════════════════════════════
   ONBOARDING
══════════════════════════════════════════ */

const OnboardingStepEnum = z.enum([
  "PROFILE", "PHOTO", "SERVICES", "AVAILABILITY", "EDUCATION",
  "CERTIFICATIONS", "VERIFICATION",
]).openapi("OnboardingStep");

const OnboardingProgressSchema = z.object({
  completedSteps: z.array(OnboardingStepEnum),
  skippedSteps: z.array(OnboardingStepEnum),
  currentStep: OnboardingStepEnum.nullable(),
  percentComplete: z.number(),
  isComplete: z.boolean(),
  photoStatus: z.object({
    hasPhoto: z.boolean(),
    needsPhoto: z.boolean(),
    urgency: z.enum(["low", "medium", "high"]),
    message: z.string(),
  }),
}).openapi("OnboardingProgress");

registry.registerPath({
  method: "get",
  path: "/experts/onboarding",
  tags: ["Expert — Onboarding"],
  summary: "Get onboarding progress",
  description: "Returns the expert's onboarding checklist, including photo status and completion percentage.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Onboarding progress", content: { "application/json": { schema: success(OnboardingProgressSchema) } } },
    ...errResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/experts/onboarding/complete-step",
  tags: ["Expert — Onboarding"],
  summary: "Mark an onboarding step as complete",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({ step: OnboardingStepEnum }).openapi("CompleteOnboardingStepDto"),
        },
      },
    },
  },
  responses: {
    200: { description: "Step marked complete", content: { "application/json": { schema: success(OnboardingProgressSchema) } } },
    ...errResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/experts/onboarding/skip-step",
  tags: ["Expert — Onboarding"],
  summary: "Skip an optional onboarding step",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({ step: OnboardingStepEnum }).openapi("SkipOnboardingStepDto"),
        },
      },
    },
  },
  responses: {
    200: { description: "Step skipped", content: { "application/json": { schema: success(OnboardingProgressSchema) } } },
    ...errResponses,
  },
});

registry.registerPath({
  method: "patch",
  path: "/experts/onboarding/progress",
  tags: ["Expert — Onboarding"],
  summary: "Update onboarding progress state",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            completedSteps: z.array(OnboardingStepEnum).optional(),
            skippedSteps: z.array(OnboardingStepEnum).optional(),
          }).openapi("UpdateOnboardingProgressDto"),
        },
      },
    },
  },
  responses: {
    200: { description: "Progress updated", content: { "application/json": { schema: success(OnboardingProgressSchema) } } },
    ...errResponses,
  },
});

// Activate expert
registry.registerPath({
  method: "patch",
  path: "/admin/experts/{id}/activate",
  tags: ["Admin — Expert Management"],
  summary: "Reactivate suspended expert",
  description: "Reactivates suspended expert account and shows their map pin.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }).openapi("AdminActivateExpertParams"),
  },
  responses: {
    200: {
      description: "Expert activated",
      content: {
        "application/json": {
          schema: success(z.object({
            id: uuidField,
            fullName: z.string(),
            accountStatus: AccountStatusEnum,
          })),
        },
      },
    },
    ...errResponses,
  },
});

// Update expert status
registry.registerPath({
  method: "patch",
  path: "/admin/experts/{id}/status",
  tags: ["Admin — Expert Management"],
  summary: "Update expert account status",
  description: "Manually update expert account status (ACTIVE, INACTIVE, SUSPENDED_COMPLIANCE, DELETED).",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }).openapi("AdminUpdateExpertStatusParams"),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            status: AccountStatusEnum,
            reason: z.string().optional(),
          }).openapi("UpdateExpertStatusBody"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Status updated",
      content: {
        "application/json": {
          schema: success(z.object({
            id: uuidField,
            fullName: z.string(),
            accountStatus: AccountStatusEnum,
          })),
        },
      },
    },
    ...errResponses,
  },
});

// Get expert bookings
registry.registerPath({
  method: "get",
  path: "/admin/experts/{id}/bookings",
  tags: ["Admin — Expert Management"],
  summary: "Get expert's booking history",
  description: "Returns all bookings for a specific expert.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }).openapi("AdminGetExpertBookingsParams"),
    query: z.object({
      page: z.coerce.number().int().positive().default(1).optional(),
      limit: z.coerce.number().int().positive().max(100).default(20).optional(),
    }).openapi("AdminGetExpertBookingsQuery"),
  },
  responses: {
    200: {
      description: "Expert bookings",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.array(z.any()), // Reuse booking schema if available
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
    },
    ...errResponses,
  },
});


