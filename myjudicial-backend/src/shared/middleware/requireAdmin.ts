/**
 * Require Admin Middleware
 * 
 * Ensures the authenticated user has ADMIN role
 */

import type { Request, Response, NextFunction } from "express";
import { AuthenticationError, AuthorizationError } from "../errors/AppError.js";

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const user = req.user;

  if (!user) {
    throw new AuthenticationError("Authentication required");
  }

  if (user.role !== "ADMIN") {
    throw new AuthorizationError("Admin access required");
  }

  next();
}
