import { z } from "zod";
import { UserStatus } from "../../generated/prisma/client.js";

export const listClientsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z
    .enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING", "DELETED", "ALL"])
    .optional(),
  activity: z
    .enum(["ALL", "HAS_BOOKINGS", "NO_BOOKINGS", "REPEAT_CLIENTS"])
    .optional(),
  sortBy: z
    .enum(["createdAt", "name", "totalBookings", "totalSpent", "lastLoginAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const updateClientStatusSchema = z.object({
  body: z.object({
    status: z
      .enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING", "DELETED"])
      .transform((val) => (val === "INACTIVE" ? UserStatus.SUSPENDED : (val as UserStatus))),
    reason: z.string().optional(),
  }),
});

export type ListClientsQuery = z.infer<typeof listClientsSchema>;
export type UpdateClientStatusDto = z.infer<typeof updateClientStatusSchema>["body"];
