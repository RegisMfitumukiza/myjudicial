import type { Request, Response, NextFunction } from "express";
import { AdminAuditService } from "./admin-audit.service.js";
import {
  listAuditLogsQuerySchema,
  exportAuditLogsQuerySchema,
  getAuditLogParamsSchema,
} from "./admin-audit.schemas.js";

export const AdminAuditController = {
  /**
   * GET /api/v1/admin/audit-logs/stats
   * Get audit log statistics
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminAuditService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/audit-logs
   * List audit logs with filters and pagination
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const rawQuery = (req as any).validatedQuery ?? req.query;
      const query = listAuditLogsQuerySchema.parse(rawQuery);

      const result = await AdminAuditService.list({
        page: query.page,
        limit: query.limit,
        filters: {
          action: query.action,
          resource: query.resource,
          actorId: query.actorId,
          resourceId: query.resourceId,
          fromDate: query.fromDate,
          toDate: query.toDate,
          search: query.search,
        },
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/audit-logs/:id
   * Get single audit log by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getAuditLogParamsSchema.parse(req.params);
      const log = await AdminAuditService.getById(id);
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/audit-logs/export
   * Export audit logs as CSV or JSON
   */
  async export(req: Request, res: Response, next: NextFunction) {
    try {
      const rawQuery = (req as any).validatedQuery ?? req.query;
      const query = exportAuditLogsQuerySchema.parse(rawQuery);

      const logs = await AdminAuditService.export({
        action: query.action,
        resource: query.resource,
        actorId: query.actorId,
        resourceId: query.resourceId,
        fromDate: query.fromDate,
        toDate: query.toDate,
        search: query.search,
      });

      if (query.format === "csv") {
        const escapeCsv = (val: unknown): string => {
          if (val === null || val === undefined) return '""';
          if (typeof val === "object") {
            try {
              return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
            } catch {
              return '""';
            }
          }
          return `"${String(val).replace(/"/g, '""')}"`;
        };

        const headers = [
          "ID",
          "Timestamp",
          "Action",
          "Resource",
          "Resource ID",
          "Actor ID",
          "Actor Name",
          "Actor Email",
          "Actor Role",
          "Description",
          "IP Address",
          "User Agent",
          "Metadata",
        ];

        const csvRows = [
          headers.map(escapeCsv).join(","),
          ...logs.map((log) =>
            [
              log.id,
              log.createdAt,
              log.action,
              log.resource,
              log.resourceId || "",
              log.actorId || "",
              log.actorName || "System",
              log.actorEmail || "",
              log.actorRole || "",
              log.description || "",
              log.ipAddress || "",
              log.userAgent || "",
              log.metadata || "",
            ]
              .map(escapeCsv)
              .join(",")
          ),
        ];

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=audit-logs-${Date.now()}.csv`
        );
        res.send(csvRows.join("\n"));
      } else {
        // JSON format
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=audit-logs-${Date.now()}.json`
        );
        res.json({
          success: true,
          meta: {
            totalExported: logs.length,
            exportedAt: new Date().toISOString(),
            filters: {
              action: query.action,
              resource: query.resource,
              search: query.search,
              fromDate: query.fromDate,
              toDate: query.toDate,
            },
          },
          data: logs,
        });
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/audit-logs/actor/:actorId
   * Get logs for a specific user
   */
  async getByActorId(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.params.actorId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await AdminAuditService.getByActorId(actorId, { page, limit });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/admin/audit-logs/resource/:resourceId
   * Get logs for a specific resource
   */
  async getByResourceId(req: Request, res: Response, next: NextFunction) {
    try {
      const resourceId = req.params.resourceId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await AdminAuditService.getByResourceId(resourceId, {
        page,
        limit,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
