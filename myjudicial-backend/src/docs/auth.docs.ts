/**
 * Auth module OpenAPI documentation.
 * Uses zod-to-openapi to generate schemas from Zod definitions.
 * registry.ts must be imported first — it calls extendZodWithOpenApi(z).
 */
import { z, registry } from "./registry.js";

/* ── Reusable field primitives ── */
const emailField = z.string().email().describe("Valid email address");
const uuidField = z.string().uuid().describe("UUID identifier");
const roleField = z.enum(["CITIZEN", "EXPERT"]).describe("Account role");

/* ── Request body schemas ── */
const RegisterDtoSchema = z
  .object({
    email: emailField,
    fullName: z.string().min(2).max(100).describe("Full name of the user"),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{6,14}$/)
      .optional()
      .describe("International phone number e.g. +250788000000"),
    role: roleField,
    preferredLanguage: z
      .enum(["en", "fr", "rw"])
      .default("en")
      .describe("Preferred interface language"),
    termsAccepted: z.boolean().optional().describe("Whether user consented to Terms of Service"),
    termsVersion: z.string().optional().describe("Version of Terms accepted"),
  })
  .openapi("RegisterDto");


const SendOtpDtoSchema = z
  .object({
    email: emailField,
    language: z.enum(["en", "fr", "rw"]).optional().describe("Language for email template"),
  })
  .openapi("SendOtpDto");

const VerifyOtpDtoSchema = z
  .object({
    email: emailField,
    token: z.string().length(6).regex(/^\d{6}$/).describe("6-digit OTP code"),
  })
  .openapi("VerifyOtpDto");

const MagicLinkDtoSchema = z
  .object({ email: emailField })
  .openapi("MagicLinkDto");

const RefreshDtoSchema = z
  .object({ refreshToken: z.string().min(1).describe("Supabase refresh token") })
  .openapi("RefreshDto");

/* ── Response schemas ── */
const ErrorResponseSchema = z
  .object({
    success: z.literal(false),
    message: z.string(),
    errors: z.array(z.string()).optional(),
  })
  .openapi("ErrorResponse");

const AuthTokensSchema = z
  .object({
    accessToken: z.string().describe("Short-lived JWT access token (15 min)"),
    refreshToken: z.string().describe("Long-lived refresh token (7 days)"),
    expiresIn: z.number().describe("Access token TTL in seconds"),
    user: z.object({
      id: uuidField,
      email: emailField,
      firstName: z.string(),
      lastName: z.string(),
    role: z.enum(["CITIZEN", "EXPERT", "ADMIN"]),
    }),
  })
  .openapi("AuthTokens");

const AuthenticatedUserSchema = z
  .object({
    id: uuidField,
    email: emailField,
    phone: z.string().nullable().describe("User's phone number"),
    role: z.enum(["CITIZEN", "EXPERT", "ADMIN"]),
    expertProfileId: uuidField.nullable(),
    expertStatus: z
      .enum(["DRAFT", "PENDING_VERIFICATION", "VERIFIED", "REJECTED", "SUSPENDED"])
      .nullable(),
    preferredLanguage: z.string().describe("Preferred interface language"),
    avatarObjectKey: z.string().nullable().describe("OCI object key for the profile photo, if uploaded"),
    avatarUrl: z.string().nullable().describe("Time-limited signed URL to display the profile photo"),
  })
  .openapi("AuthenticatedUser");

const MessageSchema = z
  .object({ message: z.string() })
  .openapi("MessageResponse");

/* ── Register schemas ── */
registry.register("RegisterDto", RegisterDtoSchema);
registry.register("SendOtpDto", SendOtpDtoSchema);
registry.register("VerifyOtpDto", VerifyOtpDtoSchema);
registry.register("MagicLinkDto", MagicLinkDtoSchema);
registry.register("RefreshDto", RefreshDtoSchema);
registry.register("ErrorResponse", ErrorResponseSchema);
registry.register("AuthTokens", AuthTokensSchema);
registry.register("AuthenticatedUser", AuthenticatedUserSchema);
registry.register("MessageResponse", MessageSchema);

/* ── Helper: standard success wrapper ── */
const success = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.literal(true), message: z.string(), data: dataSchema });

const errorResponses = {
  400: { description: "Validation error", content: { "application/json": { schema: ErrorResponseSchema } } },
  401: { description: "Authentication failed", content: { "application/json": { schema: ErrorResponseSchema } } },
  409: { description: "Conflict", content: { "application/json": { schema: ErrorResponseSchema } } },
  429: { description: "Too many requests", content: { "application/json": { schema: ErrorResponseSchema } } },
};

/* ── Route registrations ── */

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register a new account",
  description:
    "Creates a Supabase Auth identity and a linked PostgreSQL user record. " +
    "A confirmation email is sent. Roles: CITIZEN or EXPERT.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: RegisterDtoSchema } },
    },
  },
  responses: {
    201: {
      description: "Account created successfully",
      content: {
        "application/json": {
          schema: success(
            z.object({
              id: uuidField,
              email: emailField,
              firstName: z.string(),
              lastName: z.string(),
              role: z.enum(["CITIZEN", "EXPERT", "ADMIN"]),
            }).openapi("RegisterUserResponse")
          ),
        },
      },
    },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/admin/login",
  tags: ["Auth"],
  summary: "Admin email + password login",
  description:
    "Dedicated login for admin users only. Uses email and password set in Supabase dashboard. " +
    "Returns 401 if credentials are wrong or if user is not an ADMIN.",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email().describe("Admin email address"),
            password: z.string().min(8).describe("Admin password set in Supabase dashboard"),
          }).openapi("AdminLoginDto"),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Admin login successful",
      content: { "application/json": { schema: success(AuthTokensSchema) } },
    },
    401: { description: "Invalid credentials or not an admin", content: { "application/json": { schema: ErrorResponseSchema } } },
    429: errorResponses[429],
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/otp/send",
  tags: ["Auth"],
  summary: "Send a one-time password",
  description:
    "Sends a 6-digit OTP to the email address via Brevo. " +
    "Always returns 200 to prevent email enumeration attacks.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: SendOtpDtoSchema } },
    },
  },
  responses: {
    200: { description: "OTP dispatched (or silently skipped)", content: { "application/json": { schema: success(MessageSchema) } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/otp/verify",
  tags: ["Auth"],
  summary: "Verify OTP — returns session tokens",
  description: "Verifies the 6-digit OTP. Returns access + refresh tokens on success.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: VerifyOtpDtoSchema } },
    },
  },
  responses: {
    200: { description: "Login successful", content: { "application/json": { schema: success(AuthTokensSchema) } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/magic-link",
  tags: ["Auth"],
  summary: "Send a magic login link",
  description:
    "Sends a one-click login link to the email via Brevo. " +
    "Always returns 200 to prevent email enumeration.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: MagicLinkDtoSchema } },
    },
  },
  responses: {
    200: { description: "Magic link dispatched (or silently skipped)", content: { "application/json": { schema: success(MessageSchema) } } },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh access token",
  description: "Exchanges a valid refresh token for a new access + refresh token pair.",
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: RefreshDtoSchema } },
    },
  },
  responses: {
    200: {
      description: "Tokens refreshed",
      content: {
        "application/json": {
          schema: success(
            z.object({
              accessToken: z.string(),
              refreshToken: z.string(),
              expiresIn: z.number(),
            }).openapi("RefreshTokensResponse")
          ),
        },
      },
    },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Logout — revoke session",
  description:
    "Adds the access token to the Redis revocation list and invalidates all Supabase sessions.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Logged out", content: { "application/json": { schema: success(MessageSchema) } } },
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Get current user",
  description: "Returns the authenticated user's profile from the JWT.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: "Authenticated user", content: { "application/json": { schema: success(AuthenticatedUserSchema) } } },
    401: errorResponses[401],
  },
});

/* ── Session and Notification schemas ── */
const SessionInfoSchema = z
  .object({
    id: z.string().describe("Session UUID"),
    device: z.string().describe("User agent string or device name"),
    browser: z.string().describe("Browser name"),
    ip: z.string().describe("IP address"),
    lastActive: z.string().describe("Last activity timestamp"),
    isCurrent: z.boolean().describe("Whether this is the current session"),
    createdAt: z.string().describe("Session creation timestamp"),
  })
  .openapi("SessionInfo");

const NotificationPreferencesSchema = z
  .object({
    email: z.boolean().describe("Email notifications enabled (Brevo)").default(true),
    push: z.boolean().describe("Push notifications enabled").default(true),
    inApp: z.boolean().describe("In-app notifications enabled").default(true),
  })
  .openapi("NotificationPreferences");

registry.register("SessionInfo", SessionInfoSchema);
registry.register("NotificationPreferences", NotificationPreferencesSchema);

const SessionsListSchema = z.array(SessionInfoSchema).openapi("SessionsList");

/* ── Session Routes ── */
registry.registerPath({
  method: "get",
  path: "/auth/sessions",
  tags: ["Auth"],
  summary: "List active sessions",
  description: "Returns all active Supabase sessions for the authenticated user.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "List of active sessions",
      content: { "application/json": { schema: success(SessionsListSchema) } },
    },
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "delete",
  path: "/auth/sessions/{id}",
  tags: ["Auth"],
  summary: "Revoke a session",
  description: "Revokes (deletes) a specific Supabase session by ID.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }).openapi("SessionIdParams"),
  },
  responses: {
    204: { description: "Session revoked" },
    401: errorResponses[401],
  },
});

/* ── Notification Preference Routes ── */
registry.registerPath({
  method: "get",
  path: "/auth/me/notification-preferences",
  tags: ["Auth"],
  summary: "Get notification preferences",
  description: "Returns the authenticated user's notification preferences. Creates defaults if none exist.",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Notification preferences",
      content: { "application/json": { schema: success(NotificationPreferencesSchema) } },
    },
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: "put",
  path: "/auth/me/notification-preferences",
  tags: ["Auth"],
  summary: "Update notification preferences",
  description: "Updates the authenticated user's notification preferences.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: NotificationPreferencesSchema } },
    },
  },
  responses: {
    200: {
      description: "Notification preferences updated",
      content: { "application/json": { schema: success(NotificationPreferencesSchema) } },
    },
    401: errorResponses[401],
  },
});

const UpdateMeDtoSchema = z
  .object({
    firstName: z.string().min(2).max(100).optional().describe("Updated first name"),
    lastName: z.string().min(2).max(100).optional().describe("Updated last name"),  
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/).optional().describe("Updated phone number in international format e.g. +250788000000"),
    preferredLanguage: z.enum(["en", "fr", "rw"]).optional().describe("Preferred interface language"),
  })
  .openapi("UpdateMeDto");

registry.register("UpdateMeDto", UpdateMeDtoSchema);

const UpdatedUserSchema = z
  .object({
    id: uuidField,
    email: emailField,
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().nullable(),
    role: z.enum(["CITIZEN", "EXPERT", "ADMIN"]),
    preferredLanguage: z.string(),
    status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "DELETED"]),
  })
  .openapi("UpdatedUserResponse");

registry.registerPath({
  method: "patch",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Update current user's account settings",
  description: "Updates the authenticated user's preferred interface language.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: UpdateMeDtoSchema } },
    },
  },
  responses: {
    200: { description: "Account updated", content: { "application/json": { schema: success(UpdatedUserSchema) } } },
    ...errorResponses,
  },
});

const AvatarUploadResponseSchema = z
  .object({
    avatarObjectKey: z.string(),
    avatarUrl: z.string().describe("Time-limited signed URL to display the uploaded photo"),
  })
  .openapi("AvatarUploadResponse");

registry.registerPath({
  method: "put",
  path: "/auth/profile/photo",
  tags: ["Auth"],
  summary: "Upload or replace the current user's profile photo",
  description:
    "Accepts a single image file (multipart/form-data, field name \"photo\", max 5MB). " +
    "Stored in OCI object storage; returns a fresh signed URL for display.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: z.object({ photo: z.string().openapi({ type: "string", format: "binary" }) }),
        },
      },
    },
  },
  responses: {
    200: { description: "Photo updated", content: { "application/json": { schema: success(AvatarUploadResponseSchema) } } },
    ...errorResponses,
  },
});
