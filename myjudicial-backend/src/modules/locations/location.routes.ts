import { Router } from "express";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { LocationService } from "./location.service.js";
import { apiLimiter } from "../../shared/middleware/rateLimiting.js";
import { z } from "zod";
import { validateQuery } from "../../shared/middleware/validate.js";

const router = Router();

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

const resolveSchema = z.object({
  term: z.string().min(1).max(100),
});

const districtsQuerySchema = z.object({
  provinceId: z.string().optional(),
});

const sectorsQuerySchema = z.object({
  districtId: z.string().optional(),
});

// Cache header helper for static geographic data (1 day)
const setGeoCache = (res: any) => {
  res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");
};

/**
 * GET /api/v1/locations/provinces
 * Public endpoint to list all provinces in Rwanda.
 */
router.get(
  "/provinces",
  asyncHandler(async (_req, res) => {
    setGeoCache(res);
    const provinces = await LocationService.getProvinces();
    res.json({
      success: true,
      data: provinces,
    });
  })
);

/**
 * GET /api/v1/locations/districts
 * Public endpoint to list districts (optionally filtered by province).
 */
router.get(
  "/districts",
  validateQuery(districtsQuerySchema),
  asyncHandler(async (req, res) => {
    setGeoCache(res);
    const { provinceId } = req.query as { provinceId?: string };
    const districts = await LocationService.getDistricts(provinceId);
    res.json({
      success: true,
      data: districts,
    });
  })
);

/**
 * GET /api/v1/locations/sectors
 * Public endpoint to list sectors (optionally filtered by district).
 */
router.get(
  "/sectors",
  validateQuery(sectorsQuerySchema),
  asyncHandler(async (req, res) => {
    setGeoCache(res);
    const { districtId } = req.query as { districtId?: string };
    const sectors = await LocationService.getSectors(districtId);
    res.json({
      success: true,
      data: sectors,
    });
  })
);

/**
 * GET /api/v1/locations/search
 * Public search for autocomplete across all administrative divisions.
 */
router.get(
  "/search",
  apiLimiter,
  validateQuery(searchSchema),
  asyncHandler(async (req, res) => {
    const { q, limit } = req.query as unknown as { q: string; limit: number };
    const results = await LocationService.search(q, limit);
    res.json({
      success: true,
      data: results,
    });
  })
);

/**
 * GET /api/v1/locations/resolve
 * Public endpoint to resolve a search keyword (e.g. "Kimironko", "Gatsata", "Kanombe", "Huye", "Musanze")
 * to its authoritative coordinates and administrative level.
 */
router.get(
  "/resolve",
  apiLimiter,
  validateQuery(resolveSchema),
  asyncHandler(async (req, res) => {
    const { term } = req.query as { term: string };
    const resolved = await LocationService.resolveLocation(term);
    res.json({
      success: true,
      data: resolved,
    });
  })
);

/**
 * GET /api/v1/locations/:id
 * Retrieve specific division by ID or code.
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    setGeoCache(res);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const resolved = await LocationService.resolveLocation(id);
    if (!resolved) {
      res.status(404).json({
        success: false,
        message: "Administrative location not found",
        data: null,
      });
      return;
    }
    res.json({
      success: true,
      data: resolved,
    });
  })
);

export default router;
