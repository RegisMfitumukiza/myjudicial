import cron from "node-cron";
import { ComplianceService } from "../../modules/experts/compliance/compliance.service.js";
import { logger } from "../../shared/utils/logger.js";

/**
 * Daily compliance check — runs at 02:00 AM server time.
 * - Suspends experts with expired credentials
 * - Sends 30-day expiry warning emails
 */
export const startComplianceCron = (): void => {
  cron.schedule("0 2 * * *", async () => {
    logger.info("Compliance cron: starting daily check");
    await ComplianceService.runDailyComplianceCheck();
    logger.info("Compliance cron: daily check complete");
  });

  logger.info("Compliance cron scheduled — runs daily at 02:00");
};
