import { z, registry } from "./registry.js";

const uuidField = z.string().uuid();

const ErrorResponse = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.string()).optional(),
});

const success = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.literal(true), message: z.string(), data: dataSchema });

const errResponses = {
  400: { description: "Validation error", content: { "application/json": { schema: ErrorResponse } } },
  401: { description: "Unauthenticated", content: { "application/json": { schema: ErrorResponse } } },
  403: { description: "Not an admin", content: { "application/json": { schema: ErrorResponse } } },
  404: { description: "Not found", content: { "application/json": { schema: ErrorResponse } } },
};

const ExpertSummary = z.object({
  id: uuidField,
  displayName: z.string(),
  barNumber: z.string().nullable(),
  primarySpecialty: z.string(),
  city: z.string().nullable(),
  status: z.string(),
  user: z.object({
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
  }),
}).openapi("AdminExpertSummary");

const VerificationRecord = z.object({
  id: uuidField,
  expertId: uuidField,
  status: z.enum(["PENDING","APPROVED","REJECTED","EXPIRED"]),
  identityDocumentObjectKey: z.string().nullable(),
  barCertificateObjectKey: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  reviewedById: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  createdAt: z.string(),
  expert: ExpertSummary,
}).openapi("VerificationRecord");

registry.register("VerificationRecord", VerificationRecord);
registry.register("AdminExpertSummary", ExpertSummary);

registry.registerPath({
  method: "get",
  path: "/admin-verification/queue",
  tags: ["Admin — Verification"],
  summary: "List pending verification requests",
  description: "Returns all expert profiles awaiting admin review, oldest first. Requires ADMIN role.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional().describe("Page number (default: 1)"),
      limit: z.string().optional().describe("Items per page (default: 10, max: 50)"),
    }).openapi("ListVerificationRequestsQuery"),
  },
  responses: {
    200: {
      description: "Paginated verification queue",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.array(VerificationRecord),
            meta: z.object({
              page: z.number(), limit: z.number(), total: z.number(),
              totalPages: z.number(), hasNext: z.boolean(), hasPrev: z.boolean(),
            }),
          }),
        },
      },
    },
    ...errResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/admin-verification/{id}",
  tags: ["Admin — Verification"],
  summary: "Get a single verification request",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: uuidField }).openapi("GetVerificationRequestParams") },
  responses: {
    200: { description: "Verification request", content: { "application/json": { schema: success(VerificationRecord) } } },
    ...errResponses,
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin-verification/{id}/approve",
  tags: ["Admin — Verification"],
  summary: "Approve an expert profile",
  description: "Sets expert status to VERIFIED. Sends approval email to the expert. Requires ADMIN role.",
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: uuidField }).openapi("ApproveExpertParams") },
  responses: {
    200: { description: "Expert approved", content: { "application/json": { schema: success(VerificationRecord) } } },
    ...errResponses,
    400: { description: "Already approved/rejected", content: { "application/json": { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin-verification/{id}/reject",
  tags: ["Admin — Verification"],
  summary: "Reject an expert profile",
  description: "Sets expert status to REJECTED. Sends rejection email with reason. Requires ADMIN role.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: uuidField }).openapi("RejectExpertParams"),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            reason: z.string().min(10).max(500).describe("Reason for rejection shown to the expert"),
          }).openapi("RejectExpertBody"),
        },
      },
    },
  },
  responses: {
    200: { description: "Expert rejected", content: { "application/json": { schema: success(VerificationRecord) } } },
    ...errResponses,
    400: { description: "Already approved/rejected or invalid reason", content: { "application/json": { schema: ErrorResponse } } },
  },
});
