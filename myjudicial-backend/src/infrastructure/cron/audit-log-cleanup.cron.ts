import cron from "node-cron";
import { AdminAuditService } from "../../modules/audit/admin-audit.service.js";
import { logger } from "../../shared/utils/logger.js";

const RETENTION_DAYS = Number(process.env.AUDIT_LOG_RETENTION_DAYS) || 90;

/**
 * Audit log cleanup — runs daily at 04:00 AM.
 *
 * Deletes audit logs older than the configured retention period (default: 90 days).
 * Deletion is performed in batches of 1000 to prevent long-running transactions.
 */
export const startAuditLogCleanupCron = (): void => {
  cron.schedule("0 4 * * *", async () => {
    logger.info("Audit log cleanup: starting", { retentionDays: RETENTION_DAYS });

    try {
      const deletedCount = await AdminAuditService.cleanupOldLogs(RETENTION_DAYS);

      if (deletedCount > 0) {
        logger.info("Audit log cleanup: completed", { deletedCount });
      }
    } catch (error) {
      logger.error("Audit log cleanup: failed", { error });
    }
  });

  logger.info(`Audit log cleanup cron scheduled — runs daily at 04:00 AM (retention: ${RETENTION_DAYS}d)`);
};
