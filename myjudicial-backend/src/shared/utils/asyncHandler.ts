import type { Request, Response, NextFunction } from "express";

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async Express route handler and forwards any rejection to next().
 * Eliminates try/catch boilerplate in controllers.
 */
export const asyncHandler =
  (fn: AsyncController) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
