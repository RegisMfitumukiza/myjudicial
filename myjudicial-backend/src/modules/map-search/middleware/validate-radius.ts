import type { Request, Response, NextFunction } from "express";
import { SearchRadiusError } from "../errors/map-search.errors.js";

const MIN_RADIUS_KM = 1;
const MAX_RADIUS_KM = 50;
const DEFAULT_RADIUS_KM = 10;

/**
 * Validates the radiusKm field in the request body.
 * - Defaults to 10 km if not provided.
 * - Throws SearchRadiusError (400) if outside [1, 50] range.
 * - Coerces the value to a number and writes it back to req.body.
 */
export const validateRadius = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const raw = req.body?.radiusKm;

  // Default if missing
  if (raw === undefined || raw === null || raw === "") {
    req.body.radiusKm = DEFAULT_RADIUS_KM;
    return next();
  }

  const radius = Number(raw);

  if (!Number.isFinite(radius) || radius < MIN_RADIUS_KM || radius > MAX_RADIUS_KM) {
    return next(
      new SearchRadiusError(
        `Search radius must be between ${MIN_RADIUS_KM} km and ${MAX_RADIUS_KM} km. ` +
        `Received: ${raw}`
      )
    );
  }

  req.body.radiusKm = radius;
  next();
};
