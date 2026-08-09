import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError, ValidationError, ConflictError, NotFoundError } from "../errors/index.js";
import { logger } from "../utils/logger.js";
import { getErrorMessage, getAvailableErrorCodes } from "../utils/i18n-messages.js";

type ErrorResponse = {
  success: false;
  message: string;
  errors?: string[];
};

export const globalErrorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const userLanguage = req.language || 'en';

  if (process.env.NODE_ENV !== "test") {
    logger.error("Request error", {
      path: req.originalUrl,
      method: req.method,
      language: userLanguage,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  // Operational errors — safe to expose message to client
  if (error instanceof AppError) {
    const errorCode = error.message;
    const availableCodes = getAvailableErrorCodes();
    
    // If the error message matches a known translation key, translate it.
    // Otherwise, use the original message (for backwards compatibility).
    const translatedMessage = availableCodes.includes(errorCode as any)
      ? getErrorMessage(errorCode as any, userLanguage)
      : errorCode;
      
    const body: ErrorResponse = { success: false, message: translatedMessage };
    if (error.errors?.length) body.errors = error.errors;
    res.status(error.statusCode).json(body);
    return;
  }

  // Zod validation errors bubbled up without going through validate middleware
  if (error instanceof ZodError) {
    const errors = error.issues.map((i) => i.message);
    res.status(400).json({
      success: false,
      message: getErrorMessage('VALIDATION_ERROR', userLanguage),
      errors,
    } satisfies ErrorResponse);
    return;
  }

  // Prisma known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let mapped: AppError;
    switch (error.code) {
      case "P2002":
        mapped = new ConflictError("A record with that value already exists");
        break;
      case "P2025":
        mapped = new NotFoundError("Record");
        break;
      case "P2003":
        mapped = new ValidationError(getErrorMessage('VALIDATION_ERROR', userLanguage));
        break;
      case "P1001": // Can't reach database server
      case "P1002": // Connection timed out
      case "P1003": // Database does not exist
        mapped = new AppError(getErrorMessage('SERVICE_UNAVAILABLE', userLanguage), 503);
        break;
      default:
        mapped = new AppError(getErrorMessage('DATABASE_ERROR', userLanguage), 400);
    }
    res.status(mapped.statusCode).json({ success: false, message: mapped.message });
    return;
  }

  // Unknown / programmer errors — never expose internals in production
  const message =
    process.env.NODE_ENV === "production"
      ? getErrorMessage('SERVER_ERROR', userLanguage)
      : (error instanceof Error ? error.message : "Unknown error");

  res.status(500).json({ success: false, message } satisfies ErrorResponse);
};
