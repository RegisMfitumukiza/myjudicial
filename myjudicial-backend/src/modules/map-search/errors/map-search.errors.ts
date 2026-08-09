import { AppError } from "../../../shared/errors/AppError.js";

/** 400 — lat/lon values are outside valid WGS-84 range */
export class LocationValidationError extends AppError {
  constructor(message = "Invalid coordinates. Latitude must be -90 to 90, longitude -180 to 180.") {
    super(message, 400);
  }
}

/** 400 — radius is outside the allowed search range */
export class SearchRadiusError extends AppError {
  constructor(message = "Search radius must be between 1 km and 50 km.") {
    super(message, 400);
  }
}

/** 404 — expert does not exist or is not publicly visible */
export class ExpertNotFoundError extends AppError {
  constructor() {
    super("Expert not found or not available for search.", 404);
  }
}
