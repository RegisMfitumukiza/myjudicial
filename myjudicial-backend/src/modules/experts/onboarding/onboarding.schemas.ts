import { z } from "zod";

export const completeStepSchema = z.object({
  step: z.enum([
    "profile",
    "services", 
    "availability",
    "verification",
    "compliance"
  ]).describe("Onboarding step to complete"),
  data: z.record(z.string(), z.any()).optional().describe("Optional step-specific data")
});

export const skipStepSchema = z.object({
  step: z.enum([
    "profile",
    "services", 
    "availability",
    "verification",
    "compliance"
  ]).describe("Onboarding step to skip"),
  reason: z.string().min(5).max(500).optional().describe("Reason for skipping")
});

export const updateProgressSchema = z.object({
  currentStep: z.enum([
    "profile",
    "services", 
    "availability",
    "verification",
    "compliance",
    "complete"
  ]).describe("Current step in onboarding"),
  completed: z.boolean().default(false).describe("Whether onboarding is complete")
});

export const saveDraftSchema = z.object({
  currentStep: z.number().int().min(1).max(7).describe("Current step number (1-7)"),
  formData: z.record(z.string(), z.any()).optional().default({}).describe("Form field draft values"),
  completionPercentage: z.number().min(0).max(100).optional().describe("Calculated completion percentage"),
});

export type CompleteStepDto = z.infer<typeof completeStepSchema>;
export type SkipStepDto = z.infer<typeof skipStepSchema>;
export type UpdateProgressDto = z.infer<typeof updateProgressSchema>;
export type SaveDraftDto = z.infer<typeof saveDraftSchema>;