import { z } from "zod";
import { AuditAction, AuditResource } from "../../generated/prisma/client.js";

/**
 * Query params for listing audit logs
 */
export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.nativeEnum(AuditAction).optional(),
  resource: z.nativeEnum(AuditResource).optional(),
  actorId: z.string().uuid().optional(),
  resourceId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "action", "resource", "actorId"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

/**
 * Query params for export
 */
export const exportAuditLogsQuerySchema = z.object({
  action: z.nativeEnum(AuditAction).optional(),
  resource: z.nativeEnum(AuditResource).optional(),
  actorId: z.string().uuid().optional(),
  resourceId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  format: z.enum(["csv", "json"]).default("csv"),
});

export type ExportAuditLogsQuery = z.infer<typeof exportAuditLogsQuerySchema>;

/**
 * Params for getting a single audit log
 */
export const getAuditLogParamsSchema = z.object({
  id: z.string().uuid(),
});

export type GetAuditLogParams = z.infer<typeof getAuditLogParamsSchema>;
