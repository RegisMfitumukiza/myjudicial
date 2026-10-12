import { z } from "zod";
import { UserStatus } from "../../generated/prisma/client.js";

export const updateStatusSchema = z.object({
  body: z.object({
    status: z
      .enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING", "DELETED"])
      .transform((val) => (val === "INACTIVE" ? UserStatus.SUSPENDED : (val as UserStatus))),
    reason: z.string().optional(),
  }),
});

export const deleteUserSchema = z.object({
  body: z.object({
    reason: z.string().min(10, "Reason must be at least 10 characters"),
  }),
});

export type UpdateStatusDto = z.infer<typeof updateStatusSchema>["body"];
export type DeleteUserDto = z.infer<typeof deleteUserSchema>["body"];
