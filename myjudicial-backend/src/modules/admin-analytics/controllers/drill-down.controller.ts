/**
 * Drill-Down Controller
 * 
 * Handles drill-down requests for detailed record views
 */

import { Request, Response } from "express";
import { DrillDownService } from "../services/drill-down.service.js";
import { validateBookingDrillDownQuery } from "../schemas/drill-down.schemas.js";
import { logger } from "../../../shared/utils/logger.js";
import { NotFoundError } from "../../../shared/errors/AppError.js";

export const DrillDownController = {
  /**
   * GET /api/v1/admin/analytics/drill-down/bookings
   * Drill down into booking metrics
   */
  async drillDownBookings(req: Request, res: Response): Promise<void> {
    try {
      const query = validateBookingDrillDownQuery(req.query);
      const result = await DrillDownService.drillDownBookings(query);

      res.json({
        success: true,
        data: result,
      });

      logger.info("Booking drill-down executed", {
        adminId: req.user?.id,
        filters: result.filters,
        recordCount: result.records.length,
      });
    } catch (error) {
      logger.error("Error in booking drill-down:", error);
      res.status(500).json({
        success: false,
        error: "Failed to drill down into booking data",
      });
    }
  },

  /**
   * GET /api/v1/admin/analytics/drill-down/bookings/:bookingId
   * Get detailed view of a single booking
   */
  async getBookingDetail(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.bookingId as string;
      const result = await DrillDownService.getBookingDetail(bookingId);

      if (!result) {
        throw new NotFoundError("Booking");
      }

      res.json({
        success: true,
        data: result,
      });

      logger.info("Booking detail retrieved", {
        adminId: req.user?.id,
        bookingId,
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      logger.error("Error retrieving booking detail:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve booking detail",
      });
    }
  },
};
