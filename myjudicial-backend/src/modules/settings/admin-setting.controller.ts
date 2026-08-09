import type { Request, Response, NextFunction } from "express";
import { AdminSettingService } from "./admin-setting.service.js";
import { updateSettingsSchema } from "./admin-setting.schemas.js";

export const AdminSettingController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AdminSettingService.getAll();
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const body = updateSettingsSchema.parse(req.body);
      const adminId = req.user!.id;
      const ipAddress = req.ip;
      const result = await AdminSettingService.update(body, adminId, ipAddress);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },
};
