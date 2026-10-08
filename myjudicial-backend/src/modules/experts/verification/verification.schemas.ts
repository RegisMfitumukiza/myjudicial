import { z } from "zod";

const baseSubmitVerificationSchema = z.object({
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

export const submitVerificationSchema = z.preprocess((raw: any) => {
  if (!raw || typeof raw !== "object") return raw;
  const out = { ...raw };

  // Normalize issueDate to YYYY-MM-DD or remove if blank
  if (typeof out.issueDate === "string") {
    const trimmed = out.issueDate.trim();
    if (!trimmed) {
      delete out.issueDate;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      out.issueDate = trimmed;
    } else {
      const mdy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (mdy) {
        const [, p1, p2, year] = mdy;
        if (Number(p1) > 12) {
          out.issueDate = `${year}-${p2.padStart(2, "0")}-${p1.padStart(2, "0")}`;
        } else {
          out.issueDate = `${year}-${p1.padStart(2, "0")}-${p2.padStart(2, "0")}`;
        }
      } else {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          out.issueDate = d.toISOString().split("T")[0];
        }
      }
    }
  }

  // Normalize documentTypes from documentTypes or multipart documentTypes[]
  const docTypesRaw = out.documentTypes ?? out["documentTypes[]"];
  if (docTypesRaw !== undefined && docTypesRaw !== null && docTypesRaw !== "") {
    out.documentTypes = Array.isArray(docTypesRaw) ? docTypesRaw : [docTypesRaw];
  }

  // Normalize documentLabels from documentLabels or multipart documentLabels[]
  const docLabelsRaw = out.documentLabels ?? out["documentLabels[]"];
  if (docLabelsRaw !== undefined && docLabelsRaw !== null && docLabelsRaw !== "") {
    out.documentLabels = Array.isArray(docLabelsRaw) ? docLabelsRaw : [docLabelsRaw];
  }

  return out;
}, baseSubmitVerificationSchema);

export type SubmitVerificationDto = z.infer<typeof baseSubmitVerificationSchema>;
