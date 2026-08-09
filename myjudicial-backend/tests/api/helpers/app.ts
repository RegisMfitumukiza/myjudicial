/* Shared helper: loads the real Express app with external services mocked so
 * API tests run offline and deterministically.
 *
 * - prisma.$queryRaw (used by GET /health) is stubbed.
 * - AdminSettingService.get (used by maintenanceMode) is stubbed.
 * No real DB/Redis/Supabase connection is ever attempted.
 */
import "./env.js";

import { after } from "node:test";

const { prisma } = await import("../../../src/infrastructure/database/prisma.js");
const { AdminSettingService } = await import("../../../src/modules/settings/admin-setting.service.js");
const { logger } = await import("../../../src/shared/utils/logger.js");

export const dbHealthy = (): void => {
  (prisma as any).$queryRaw = async () => [{ ok: 1 }];
};

export const dbDown = (): void => {
  (prisma as any).$queryRaw = async () => {
    throw new Error("connection refused");
  };
};

export const setMaintenance = (enabled: boolean): void => {
  AdminSettingService.get = async () => enabled;
};

dbHealthy();
setMaintenance(false);

const { default: app } = await import("../../../src/app.js");

export { app };

// Winston file transports keep the event loop alive; close them so the
// test runner's child process can exit naturally after the suite.
after(() => {
  logger.close();
});
