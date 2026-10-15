import { z } from "zod";
import { AuditAction, AuditResource } from "../../generated/prisma/client.js";

/**
 * Robust date query parameter preprocessor:
 * - Empty string, null, "null", "undefined", or undefined -> undefined
 * - Accepts ISO strings, date strings, epoch numbers, or Date instances
 * - Rejects / defaults invalid dates to undefined rather than throwing 400 validation error
 */
export const dateQueryParamSchema = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null || val === "null" || val === "undefined") {
    return undefined;
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? undefined : val;
  }
  if (typeof val === "string" || typeof val === "number") {
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}, z.date().optional());

/**
 * Robust audit action preprocessor:
 * - Empty string, "ALL", "all", null, undefined -> undefined
 * - Case-insensitive match against AuditAction enum
 */
export const auditActionQuerySchema = z.preprocess((val) => {
  if (!val || val === "" || val === "ALL" || val === "all") return undefined;
  if (typeof val === "string") {
    const upper = val.toUpperCase().trim();
    if (upper === "ALL" || upper === "") return undefined;
    if (Object.values(AuditAction).includes(upper as AuditAction)) {
      return upper as AuditAction;
    }
  }
  return undefined;
}, z.nativeEnum(AuditAction).optional());

/**
 * Robust audit resource preprocessor:
 * - Empty string, "ALL", "all", null, undefined -> undefined
 * - Case-insensitive match against AuditResource enum
 */
export const auditResourceQuerySchema = z.preprocess((val) => {
  if (!val || val === "" || val === "ALL" || val === "all") return undefined;
  if (typeof val === "string") {
    const upper = val.toUpperCase().trim();
    if (upper === "ALL" || upper === "") return undefined;
    if (Object.values(AuditResource).includes(upper as AuditResource)) {
      return upper as AuditResource;
    }
  }
  return undefined;
}, z.nativeEnum(AuditResource).optional());

/**
 * Query params for listing audit logs
 */
export const listAuditLogsQuerySchema = z.object({
  page: z.preprocess((val) => {
    const n = Number(val);
    return !isNaN(n) && n >= 1 ? Math.floor(n) : 1;
  }, z.number().int().min(1).default(1)),
  limit: z.preprocess((val) => {
    const n = Number(val);
    return !isNaN(n) && n >= 1 ? Math.min(Math.floor(n), 1000) : 20;
  }, z.number().int().min(1).max(1000).default(20)),
  action: auditActionQuerySchema,
  resource: auditResourceQuerySchema,
  actorId: z.preprocess((val) => {
    if (typeof val !== "string" || !val.trim() || val === "ALL") return undefined;
    return val.trim();
  }, z.string().uuid().optional()),
  resourceId: z.preprocess((val) => {
    if (typeof val !== "string" || !val.trim() || val === "ALL") return undefined;
    return val.trim();
  }, z.string().optional()),
  fromDate: dateQueryParamSchema,
  toDate: dateQueryParamSchema,
  search: z.preprocess((val) => {
    if (typeof val !== "string" || !val.trim()) return undefined;
    return val.trim();
  }, z.string().optional()),
  sortBy: z.preprocess((val) => {
    if (!val || typeof val !== "string") return "createdAt";
    const valid = ["createdAt", "action", "resource", "actorId"];
    return valid.includes(val) ? val : "createdAt";
  }, z.enum(["createdAt", "action", "resource", "actorId"]).default("createdAt")),
  sortOrder: z.preprocess((val) => {
    if (!val || typeof val !== "string") return "desc";
    const lower = val.toLowerCase().trim();
    return lower === "asc" ? "asc" : "desc";
  }, z.enum(["asc", "desc"]).default("desc")),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

/**
 * Query params for export
 */
export const exportAuditLogsQuerySchema = z.object({
  action: auditActionQuerySchema,
  resource: auditResourceQuerySchema,
  actorId: z.preprocess((val) => {
    if (typeof val !== "string" || !val.trim() || val === "ALL") return undefined;
    return val.trim();
  }, z.string().uuid().optional()),
  resourceId: z.preprocess((val) => {
    if (typeof val !== "string" || !val.trim() || val === "ALL") return undefined;
    return val.trim();
  }, z.string().optional()),
  fromDate: dateQueryParamSchema,
  toDate: dateQueryParamSchema,
  search: z.preprocess((val) => {
    if (typeof val !== "string" || !val.trim()) return undefined;
    return val.trim();
  }, z.string().optional()),
  format: z.preprocess((val) => {
    if (typeof val === "string" && val.toLowerCase().trim() === "json") return "json";
    return "csv";
  }, z.enum(["csv", "json"]).default("csv")),
});

export type ExportAuditLogsQuery = z.infer<typeof exportAuditLogsQuerySchema>;

/**
 * Params for getting a single audit log
 */
export const getAuditLogParamsSchema = z.object({
  id: z.string().uuid(),
});

export type GetAuditLogParams = z.infer<typeof getAuditLogParamsSchema>;
