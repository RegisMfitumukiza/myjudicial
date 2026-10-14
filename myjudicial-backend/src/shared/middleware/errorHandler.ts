import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../../generated/prisma/client.js";
import { AppError, ValidationError, ConflictError, NotFoundError } from "../errors/index.js";
import { logger } from "../utils/logger.js";
import { getErrorMessage, getAvailableErrorCodes } from "../utils/i18n-messages.js";

type ErrorResponse = {
  success: false;
  /** Machine-readable error code for frontend i18n mapping (e.g. "BOOKING_UNAVAILABLE"). */
  code?: string;
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

  const isAppError =
    error instanceof AppError ||
    (Boolean(error) &&
      typeof (error as any).statusCode === "number" &&
      (error as any).isOperational === true);

  // Operational errors — safe to expose message to client
  if (isAppError) {
    const appErr = error as AppError;
    const errorCode = appErr.message;
    const availableCodes = getAvailableErrorCodes();

    // If the error message matches a known translation key, translate it.
    // Otherwise, use the original message (for backwards compatibility).
    const isKnownCode = availableCodes.includes(errorCode as any);
    const translatedMessage = isKnownCode
      ? getErrorMessage(errorCode as any, userLanguage)
      : errorCode;

    // Determine the machine-readable code to forward (for frontend i18n mapping).
    // Prefer explicit error.code, then fall back to the message string if it's a known code.
    const responseCode = appErr.code ?? (isKnownCode ? errorCode : undefined);

    const body: ErrorResponse = { success: false, message: translatedMessage };
    if (responseCode) body.code = responseCode;
    if (appErr.errors?.length) body.errors = appErr.errors;
    res.status(appErr.statusCode).json(body);
    return;
  }

  // Zod validation errors bubbled up without going through validate middleware
  if (error instanceof ZodError) {
    const errors = error.issues.map((i) => i.message);
    res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: getErrorMessage('VALIDATION_ERROR', userLanguage),
      errors,
    } satisfies ErrorResponse);
    return;
  }

  // Prisma known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let mapped: AppError;
    let code: string;
    switch (error.code) {
      case "P2002":
        mapped = new ConflictError("A record with that value already exists");
        code = "CONFLICT";
        break;
      case "P2025":
        mapped = new NotFoundError("Record");
        code = "NOT_FOUND";
        break;
      case "P2003":
        mapped = new ValidationError(getErrorMessage('VALIDATION_ERROR', userLanguage));
        code = "VALIDATION_ERROR";
        break;
      case "P1001": // Can't reach database server
      case "P1002": // Connection timed out
      case "P1003": // Database does not exist
        mapped = new AppError(getErrorMessage('SERVICE_UNAVAILABLE', userLanguage), 503);
        code = "SERVICE_UNAVAILABLE";
        break;
      default:
        mapped = new AppError(getErrorMessage('DATABASE_ERROR', userLanguage), 400);
        code = "DATABASE_ERROR";
    }
    res.status(mapped.statusCode).json({ success: false, code, message: mapped.message });
    return;
  }

  // Unknown / programmer errors — never expose internals in production
  const message =
    process.env.NODE_ENV === "production"
      ? getErrorMessage('SERVER_ERROR', userLanguage)
      : (error instanceof Error ? error.message : "Unknown error");

  res.status(500).json({ success: false, code: "SERVER_ERROR", message } satisfies ErrorResponse);
};
