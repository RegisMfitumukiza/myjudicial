import { z } from "zod";

export const submitVerificationSchema = z.object({
  barNumber: z.string().optional(),
  certificateName: z.string().optional(),
  issuer: z.string().optional(),
  issueDate: z.string().date("Must be YYYY-MM-DD").optional(),
  // Explicit document type mapping so we don't rely on MIME-type heuristics
  // Each entry maps to the corresponding file in the multipart upload by index
  // e.g. documentTypes[0] = "identity_document", documentTypes[1] = "bar_certificate"
  documentTypes: z.array(
    z.enum(["identity_document", "bar_certificate", "additional"])
  ).optional(),
  // Human-readable labels for additional documents (indexed same as documentTypes)
  // e.g. documentLabels[2] = "LLB Diploma — University of Rwanda 2018"
  documentLabels: z.array(z.string().max(200)).optional(),
});

export type SubmitVerificationDto = z.infer<typeof submitVerificationSchema>;
