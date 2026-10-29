import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { apiLimiter } from "../../shared/middleware/rateLimiting.js";
import { validate, validateQuery } from "../../shared/middleware/validate.js";
import { asyncHandler } from "../../shared/utils/asyncHandler.js";
import { GeocodingService } from "../../infrastructure/geocoding/geocoding.service.js";
import { z } from "zod";

const router = Router();

// Validation schemas
const addressSuggestionsSchema = z.object({
  query: z.string().min(2).max(200)
});

const validateAddressSchema = z.object({
  address: z.string().min(3).max(300)
});

const placeDetailsSchema = z.object({
  placeId: z.string().min(3).max(300)
});

const reverseGeocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

// GET /geocoding/suggestions?query=kigali
router.get(
  "/suggestions",
  apiLimiter,
  validateQuery(addressSuggestionsSchema),
  asyncHandler(async (req, res) => {
    const { query } = req.query as { query: string };
    
    const suggestions = await GeocodingService.getAddressSuggestions(query);
    
    res.json({
      success: true,
      data: suggestions
    });
  })
);

// POST /geocoding/validate
router.post(
  "/validate",
  apiLimiter,
  validate(validateAddressSchema),
  asyncHandler(async (req, res) => {
    const { address } = req.body;
    
    const result = await GeocodingService.validateAddress(address);
    
    res.json({
      success: true,
      data: result
    });
  })
);

// POST /geocoding/place-details
router.post(
  "/place-details",
  apiLimiter,
  validate(placeDetailsSchema),
  asyncHandler(async (req, res) => {
    const { placeId } = req.body;
    
    const result = await GeocodingService.getPlaceDetails(placeId);
    
    res.json({
      success: true,
      data: result
    });
  })
);

// GET /geocoding/rwanda-locations - Get Rwanda districts/sectors
router.get(
  "/rwanda-locations",
  asyncHandler(async (req, res) => {
    const locations = GeocodingService.getRwandaLocations();

    res.json({
      success: true,
      data: locations
    });
  })
);

// GET /geocoding/landmarks - Get known landmarks (no auth needed)
router.get(
  "/landmarks",
  asyncHandler(async (req, res) => {
    const landmarks = GeocodingService.getLandmarks();

    res.json({
      success: true,
      data: landmarks
    });
  })
);

// POST /geocoding/reverse-geocode - Reverse geocode coordinates to address
router.post(
  "/reverse-geocode",
  apiLimiter,
  validate(reverseGeocodeSchema),
  asyncHandler(async (req, res) => {
    const { lat, lng } = req.body;

    const result = await GeocodingService.reverseGeocode(lat, lng);

    res.json({
      success: true,
      data: result
    });
  })
);

export default router;