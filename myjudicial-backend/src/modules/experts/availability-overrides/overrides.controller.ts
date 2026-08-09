import type { Request, Response, NextFunction } from "express";
import { OverridesService } from "./overrides.service.js";
import { sendSuccess } from "../../../shared/utils/response.js";

export const OverridesController = {
  /**
   * GET /api/v1/experts/availability/overrides
   * List expert's overrides (with optional month/date range filter)
   */
  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { month, fromDate, toDate } = req.query;

      const overrides = await OverridesService.listOverrides(req.user!.id, {
        month: month as string | undefined,
        fromDate: fromDate as string | undefined,
        toDate: toDate as string | undefined,
      });

      sendSuccess(res, overrides, "Overrides retrieved successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/experts/availability/overrides
   * Create new override
   */
  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await OverridesService.createOverride(req.user!.id, req.body);

      sendSuccess(
        res,
        result,
        result.warning ? result.warning : "Override created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/experts/availability/overrides/:id
   * Update existing override
   */
  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const override = await OverridesService.updateOverride(req.user!.id, id, req.body);

      sendSuccess(res, override, "Override updated successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/experts/availability/overrides/:id
   * Delete override
   */
  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      await OverridesService.deleteOverride(req.user!.id, id);

      sendSuccess(res, null, "Override deleted successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/experts/availability/overrides/bulk
   * Bulk create overrides (vacation mode)
   */
  bulkCreate: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await OverridesService.bulkCreateOverrides(req.user!.id, req.body);

      sendSuccess(
        res,
        result,
        result.warning ? result.warning : `${result.count} overrides created successfully`,
        201
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/experts/availability/overrides/range
   * Delete overrides in date range
   */
  deleteRange: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fromDate, toDate } = req.query;

      if (!fromDate || !toDate) {
        return next(new Error("fromDate and toDate are required"));
      }

      await OverridesService.deleteRange(
        req.user!.id,
        fromDate as string,
        toDate as string
      );

      sendSuccess(res, null, "Overrides deleted successfully");
    } catch (error) {
      next(error);
    }
  },
};
