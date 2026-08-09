import type { Request, Response, NextFunction } from "express";
import { MapSearchService } from "../services/map-search.service.js";
import { sendSuccess, sendPaginated } from "../../../shared/utils/response.js";
import type { NearbySearchDto } from "../schemas/map-search.schemas.js";

export const MapSearchController = {
  /**
   * POST /api/v1/map-search/nearby
   * Search experts near the client's current GPS location.
   */
  searchNearby: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as NearbySearchDto;
      const { experts, pagination } = await MapSearchService.searchNearby(dto);
      sendPaginated(res, experts, pagination, "Nearby experts retrieved");
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/map-search/location
   * Search experts near a point selected on the map.
   * Architecturally separate from /nearby to allow geocoding integration later.
   */
  searchByLocation: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as NearbySearchDto;
      const { experts, pagination } = await MapSearchService.searchByLocation(dto);
      sendPaginated(res, experts, pagination, "Experts at location retrieved");
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/map-search/experts/:id
   * Get a single expert's full public profile for the booking flow.
   */
  getExpertDetail: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const detail = await MapSearchService.getExpertDetail(id as string);
      sendSuccess(res, detail, "Expert detail retrieved");
    } catch (err) {
      next(err);
    }
  },
};
