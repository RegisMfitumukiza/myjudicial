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
    // If schema defines a top-level 'body' field and req.body does not have a 'body' field,
    // evaluate schema against { body: req.body, query: req.query, params: req.params }
    let target: any = req.body;
    let isWrappedBody = false;

    if (
      schema instanceof z.ZodObject &&
      "body" in schema.shape &&
      (!req.body || typeof req.body !== "object" || !("body" in req.body))
    ) {
      target = { body: req.body, query: req.query, params: req.params };
      isWrappedBody = true;
    }

    const result = schema.safeParse(target);

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

    req.body = isWrappedBody ? (result.data as any).body : result.data;
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
