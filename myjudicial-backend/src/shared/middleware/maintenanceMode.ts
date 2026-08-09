import type { Request, Response, NextFunction } from "express";
import { AdminSettingService } from "../../modules/settings/admin-setting.service.js";
import { logger } from "../../shared/utils/logger.js";

export async function maintenanceMode(req: Request, res: Response, next: NextFunction): Promise<void> {
  let enabled: boolean;
  try {
    enabled = await AdminSettingService.get("maintenanceMode");
  } catch (error) {
    logger.error("Maintenance mode check failed; proceeding as normal", { error });
    return next();
  }

  if (!enabled) return next();

  const role = (req as any).user?.role;
  if (role === "ADMIN") return next();

  res.status(503).json({ success: false, error: "Platform is under maintenance. Please try again later." });
}
