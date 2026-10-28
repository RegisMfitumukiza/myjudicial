import "dotenv/config";

import app from "../../app.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { ensureDatabaseSchema } from "../../infrastructure/database/schema-sync.js";
import { connectRedis } from "../../infrastructure/redis/redis.client.js";
import { logger } from "../../shared/utils/logger.js";
import { startComplianceCron } from "../../infrastructure/cron/compliance.cron.js";
import { startBookingReminderCron } from "../../infrastructure/cron/booking-reminder.cron.js";
import { startBookingExpiryCron } from "../../infrastructure/cron/booking-expiry.cron.js";
import { startEscrowTimeoutCron } from "../../infrastructure/cron/escrow-timeout.cron.js";
import { startAuditLogCleanupCron } from "../../infrastructure/cron/audit-log-cleanup.cron.js";
import { startPayoutRetryCron } from "../../infrastructure/cron/payout-retry.cron.js";
import { startConsultationAutoReleaseCron } from "../../infrastructure/cron/consultation-auto-release.cron.js";
import { startAzamPayReconciliationCron } from "../../infrastructure/cron/azampay-reconciliation.cron.js";

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    // Connect to PostgreSQL
    await prisma.$connect();
    logger.info("PostgreSQL connected");

    // Ensure incremental schema migrations are applied
    await ensureDatabaseSchema();

    // Connect to Redis
    await connectRedis();
    logger.info("Redis connected");

    app.listen(PORT, () => {
      logger.info(`MyJudicial API running on http://localhost:${PORT}`);
      logger.info(`API docs: http://localhost:${PORT}/api-docs`);
    });

    // Start background jobs
    startComplianceCron();
    startBookingReminderCron();
    startBookingExpiryCron();
    startEscrowTimeoutCron();
    startAuditLogCleanupCron();
    startPayoutRetryCron();
    startConsultationAutoReleaseCron();
    startAzamPayReconciliationCron();
    logger.info("Background jobs started");
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received — shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received — shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
