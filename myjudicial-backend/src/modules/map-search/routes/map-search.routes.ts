import { Router } from "express";
import { MapSearchController } from "../controllers/map-search.controller.js";
import { nearbySearchSchema, locationSearchSchema } from "../schemas/map-search.schemas.js";
import { validate } from "../../../shared/middleware/validate.js";
import { validateCoordinates } from "../middleware/validate-coordinates.js";
import { validateRadius } from "../middleware/validate-radius.js";
import { asyncHandler } from "../../../shared/utils/asyncHandler.js";

const router = Router();

// ── Health ────────────────────────────────────────────────────────────────────
router.get("/health", (_req, res) => {
  res.status(200).json({ success: true, module: "map-search" });
});

// ── POST /nearby ──────────────────────────────────────────────────────────────
/**
 * Search experts near the client's current GPS location.
 * Clients may call this anonymously.
 * Pipeline: Zod body validation → coordinate check → radius check → service
 */
router.post(
  "/nearby",
  validate(nearbySearchSchema),
  validateCoordinates,
  validateRadius,
  asyncHandler(MapSearchController.searchNearby)
);

// ── POST /location ────────────────────────────────────────────────────────────
/**
 * Search experts near a point selected on the map.
 * Identical pipeline to /nearby — separate endpoint for semantic clarity
 * and future geocoding support.
 */
router.post(
  "/location",
  validate(locationSearchSchema),
  validateCoordinates,
  validateRadius,
  asyncHandler(MapSearchController.searchByLocation)
);

// ── GET /experts/:id ──────────────────────────────────────────────────────────
/**
 * Get a single expert's full public profile.
 * Includes active services so the client can proceed to booking.
 * Authentication is NOT required — experts are publicly discoverable.
 */
router.get(
  "/experts/:id",
  asyncHandler(MapSearchController.getExpertDetail)
);

export default router;
