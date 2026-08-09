import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ValidationError } from "../errors/index.js";

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * On success, replaces req.body with the parsed (coerced) value.
 * On failure, calls next() with a structured ValidationError.
 */
export const validate =
  <T extends z.ZodTypeAny>(schema: T) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = (result.error as ZodError).issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      
      // Log detailed validation errors for debugging
      console.error("❌ Validation failed:");
      console.error("Request body:", JSON.stringify(req.body, null, 2));
      console.error("Validation errors:", errors);
      
      return next(new ValidationError("Validation failed", errors));
    }

    req.body = result.data;
    next();
  };

/**
 * Validates req.query against a Zod schema.
 * Attaches parsed query to req.body so controllers access it uniformly.
 * Use this for GET endpoints with filter/pagination params.
 */
export const validateQuery =
  <T extends z.ZodTypeAny>(schema: T) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = (result.error as ZodError).issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      return next(new ValidationError("Invalid query parameters", errors));
    }

    req.validatedQuery = result.data as Record<string, unknown>;
    next();
  };
