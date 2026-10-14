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

export const setCredentialDatesSchema = z.object({
  body: z.object({
    certificateName: z.string().min(2).max(200).trim(),
    issuer: z.string().min(2).max(200).trim(),
    issueDate: z.string().date(),
    expiryDate: z.string().date(),
    auditNote: z.string().min(3).max(500).trim().optional(),
  }),
});
export type SetCredentialDatesDto = z.infer<typeof setCredentialDatesSchema>['body'];
