import { z } from "zod";

export const extendCredentialsSchema = z.object({
  body: z.object({
    newExpiryDate: z.string().datetime("Invalid date format. Use ISO 8601 datetime."),
    reason: z.string().min(10, "Reason must be at least 10 characters"),
  }),
});

export type ExtendCredentialsDto = z.infer<typeof extendCredentialsSchema>["body"];
