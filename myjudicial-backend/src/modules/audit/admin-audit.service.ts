import { prisma } from "../../infrastructure/database/prisma.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { AuditAction, AuditResource } from "../../generated/prisma/client.js";
import type { Prisma } from "../../generated/prisma/client.js";

interface ListFilters {
  action?: AuditAction;
  resource?: AuditResource;
  actorId?: string;
  resourceId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

interface ListOptions {
  page: number;
  limit: number;
  filters: ListFilters;
  sortBy: "createdAt" | "action" | "resource" | "actorId";
  sortOrder: "asc" | "desc";
}

interface ExportFilters {
  action?: AuditAction;
  resource?: AuditResource;
  actorId?: string;
  resourceId?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
}

export const AdminAuditService = {
  /**
   * Get audit log statistics
   */
  async getStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalLogs,
      todayLogs,
      weekLogs,
      monthLogs,
      byAction,
      byResource,
      recentCritical,
      oldestLog,
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { createdAt: { gte: today } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: thisMonth } } }),
      // Count by action
      prisma.auditLog.groupBy({
        by: ["action"],
        _count: { action: true },
        orderBy: { _count: { action: "desc" } },
        take: 10,
      }),
      // Count by resource
      prisma.auditLog.groupBy({
        by: ["resource"],
        _count: { resource: true },
        orderBy: { _count: { resource: "desc" } },
        take: 10,
      }),
      // Recent critical actions (DELETE, REJECT, etc.)
      prisma.auditLog.count({
        where: {
          action: { in: [AuditAction.DELETE, AuditAction.REJECT] },
          createdAt: { gte: thisWeek },
        },
      }),
      // Oldest log for retention info
      prisma.auditLog.findFirst({
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
    ]);

    const RETENTION_DAYS = Number(process.env.AUDIT_LOG_RETENTION_DAYS) || 90;

    return {
      totalLogs,
      byPeriod: {
        today: todayLogs,
        thisWeek: weekLogs,
        thisMonth: monthLogs,
      },
      byAction: byAction.map((item) => ({
        action: item.action,
        count: item._count.action,
      })),
      byResource: byResource.map((item) => ({
        resource: item.resource,
        count: item._count.resource,
      })),
      recentCritical,
      retentionDays: RETENTION_DAYS,
      oldestLogDate: oldestLog?.createdAt.toISOString() ?? null,
    };
  },

  /**
   * List audit logs with filters and pagination
   */
  async list(options: ListOptions) {
    const { page, limit, filters, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.action && { action: filters.action }),
      ...(filters.resource && { resource: filters.resource }),
      ...(filters.actorId && { actorId: filters.actorId }),
      ...(filters.resourceId && { resourceId: filters.resourceId }),
      ...(filters.fromDate &&
        filters.toDate && {
          createdAt: {
            gte: filters.fromDate,
            lte: filters.toDate,
          },
        }),
      ...(filters.fromDate &&
        !filters.toDate && {
          createdAt: { gte: filters.fromDate },
        }),
      ...(!filters.fromDate &&
        filters.toDate && {
          createdAt: { lte: filters.toDate },
        }),
      ...(filters.search && {
        OR: [
          { description: { contains: filters.search, mode: "insensitive" as const } },
          { resourceId: { contains: filters.search, mode: "insensitive" as const } },
          { ipAddress: { contains: filters.search, mode: "insensitive" as const } },
          { actor: { firstName: { contains: filters.search, mode: "insensitive" as const } } },
          { actor: { lastName: { contains: filters.search, mode: "insensitive" as const } } },
          { actor: { email: { contains: filters.search, mode: "insensitive" as const } } },
        ],
      }),
    };

    // Build order by
    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const transformedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      description: log.description,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      actor: log.actor
        ? {
            id: log.actor.id,
            fullName: [log.actor.firstName, log.actor.lastName].filter(Boolean).join(" ") || log.actor.email,
            email: log.actor.email,
            role: log.actor.role,
          }
        : null,
    }));

    return {
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get audit log by ID
   */
  async getById(logId: string) {
    const log = await prisma.auditLog.findUnique({
      where: { id: logId },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundError("Audit log not found");
    }

    return {
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      description: log.description,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      actor: log.actor
        ? {
            id: log.actor.id,
            fullName: [log.actor.firstName, log.actor.lastName].filter(Boolean).join(" ") || log.actor.email,
            email: log.actor.email,
            role: log.actor.role,
          }
        : null,
    };
  },

  /**
   * Export audit logs
   */
  async export(filters: ExportFilters) {
    const where: Prisma.AuditLogWhereInput = {
      ...(filters.action && { action: filters.action }),
      ...(filters.resource && { resource: filters.resource }),
      ...(filters.actorId && { actorId: filters.actorId }),
      ...(filters.resourceId && { resourceId: filters.resourceId }),
      ...(filters.fromDate &&
        filters.toDate && {
          createdAt: {
            gte: filters.fromDate,
            lte: filters.toDate,
          },
        }),
      ...(filters.fromDate &&
        !filters.toDate && {
          createdAt: { gte: filters.fromDate },
        }),
      ...(!filters.fromDate &&
        filters.toDate && {
          createdAt: { lte: filters.toDate },
        }),
      ...(filters.search && {
        OR: [
          { description: { contains: filters.search, mode: "insensitive" as const } },
          { resourceId: { contains: filters.search, mode: "insensitive" as const } },
          { ipAddress: { contains: filters.search, mode: "insensitive" as const } },
          { actor: { firstName: { contains: filters.search, mode: "insensitive" as const } } },
          { actor: { lastName: { contains: filters.search, mode: "insensitive" as const } } },
          { actor: { email: { contains: filters.search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10000, // Limit export to 10k records
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      description: log.description,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
      actorId: log.actorId,
      actorName: log.actor ? [log.actor.firstName, log.actor.lastName].filter(Boolean).join(" ") || log.actor.email : null,
      actorEmail: log.actor?.email,
      actorRole: log.actor?.role,
    }));
  },

  /**
   * Get logs for a specific user
   */
  async getByActorId(actorId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { actorId },
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where: { actorId } }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get logs for a specific resource
   */
  async getByResourceId(resourceId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { resourceId },
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where: { resourceId } }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Clean up audit logs older than the specified retention period.
   * Deletes in batches to avoid long-running transactions.
   * @param retentionDays - Number of days to retain logs (default: 90)
   * @returns Number of deleted records
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    let totalDeleted = 0;
    const batchSize = 1000;

    while (true) {
      const batch = await prisma.auditLog.findMany({
        where: { createdAt: { lt: cutoff } },
        take: batchSize,
        select: { id: true },
      });

      if (batch.length === 0) break;

      await prisma.auditLog.deleteMany({
        where: { id: { in: batch.map((r) => r.id) } },
      });

      totalDeleted += batch.length;

      if (batch.length < batchSize) break;
    }

    return totalDeleted;
  },
};