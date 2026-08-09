import { prisma } from "../../infrastructure/database/prisma.js";
import type { AuditAction, AuditResource } from "../../generated/prisma/client.js";
import { logger } from "./logger.js";

type AuditParams = {
  actorId?: string | null;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Write an immutable audit log entry.
 * Failures are swallowed and logged — audit writes must never break the main flow.
 */
export const writeAuditLog = async (params: AuditParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? undefined,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId ?? undefined,
        description: params.description ?? undefined,
        metadata: params.metadata ? (params.metadata as import("../../generated/prisma/client.js").Prisma.InputJsonValue) : undefined,
        ipAddress: params.ipAddress ?? undefined,
        userAgent: params.userAgent ?? undefined,
      },
    });
  } catch (error) {
    logger.error("Failed to write audit log", { params, error });
  }
};
