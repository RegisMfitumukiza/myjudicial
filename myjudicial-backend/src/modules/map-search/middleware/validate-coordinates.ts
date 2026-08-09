import type { Request, Response, NextFunction } from "express";
import { LocationValidationError } from "../errors/map-search.errors.js";

/**
 * Validates that the request body contains valid WGS-84 coordinates.
 * Must run AFTER body-parsing middleware.
 * Throws LocationValidationError (400) on invalid values.
 */
export const validateCoordinates = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { latitude, longitude } = req.body as { latitude?: unknown; longitude?: unknown };

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return next(
      new LocationValidationError(
        `Invalid coordinates: latitude=${latitude}, longitude=${longitude}. ` +
        "Latitude must be -90 to 90; longitude must be -180 to 180."
      )
    );
  }

  next();
};
