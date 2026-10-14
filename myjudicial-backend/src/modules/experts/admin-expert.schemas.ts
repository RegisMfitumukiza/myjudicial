import { z } from "zod";
import { UserStatus, LegalSpecialty } from "../../generated/prisma/client.js";

export const listExpertsSchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  status: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : val),
    z.nativeEnum(UserStatus).optional()
  ),
  specialty: z.nativeEnum(LegalSpecialty).optional(),
  search: z.string().optional(),
  verified: z.coerce.boolean().optional(),
  verificationStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]).optional(),
  sortBy: z.enum(["createdAt", "fullName", "totalBookings", "avgRating"]).default("createdAt").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
});

export const suspendExpertSchema = z.object({
  body: z.object({
    reason: z.string().min(10, "Reason must be at least 10 characters"),
    suspendUntil: z.string().datetime().optional(),
    notifyExpert: z.boolean().default(true),
  }),
});

export const updateExpertStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(UserStatus),
    reason: z.string().optional(),
  }),
});

const dateStringSchema = z.string().transform((val, ctx) => {
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Must be a valid date (YYYY-MM-DD)",
  });
  return z.NEVER;
});

export const setCredentialDatesSchema = z.object({
  certificateName: z.string().min(2, "Certificate name must be at least 2 characters").max(200).trim(),
  issuer: z.string().min(2, "Issuing authority must be at least 2 characters").max(200).trim(),
  issueDate: dateStringSchema,
  expiryDate: dateStringSchema,
  auditNote: z.string().max(500).trim().optional().or(z.literal("")),
});
export type SetCredentialDatesDto = z.infer<typeof setCredentialDatesSchema>;
