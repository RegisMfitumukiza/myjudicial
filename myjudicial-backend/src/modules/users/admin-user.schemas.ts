import { z } from "zod";
import { UserStatus } from "../../generated/prisma/client.js";

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(UserStatus),
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
