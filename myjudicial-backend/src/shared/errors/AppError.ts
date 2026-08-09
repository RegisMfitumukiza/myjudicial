/**
 * Base application error. All domain-specific errors extend this.
 * Carries an HTTP status code and an optional structured errors array
 * for Zod-style field-level validation messages.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly errors?: string[];

  constructor(message: string, statusCode = 500, errors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 401 — token missing, expired, or invalid */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

/** 403 — authenticated but not permitted */
export class AuthorizationError extends AppError {
  constructor(message = "You are not authorized to perform this action") {
    super(message, 403);
  }
}

/** 400 — request body / params failed validation */
export class ValidationError extends AppError {
  constructor(message: string, errors?: string[]) {
    super(message, 400, errors);
  }
}

/** 404 — resource does not exist */
export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}

/** 409 — unique constraint / duplicate resource */
export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}

/** 429 — caller exceeded rate limit */
export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(message, 429);
  }
}

/** 503 — downstream service (Supabase, Azam Pay, OCI) unavailable */
export class ServiceUnavailableError extends AppError {
  constructor(service = "Service") {
    super(`${service} is currently unavailable`, 503);
  }
}

// ─── Storage-Specific Errors ────────────────────────────────────────────────────

/**
 * 422 — file upload processing failed (invalid content, OCI write error).
 * Distinct from ValidationError (schema) — this is post-validation I/O failure.
 */
export class FileUploadError extends AppError {
  constructor(message = "File upload failed") {
    super(message, 422);
  }
}

/**
 * 403 — caller is not the owner and has no active share grant.
 * Provides a safe, non-leaking message that does not reveal file existence.
 */
export class FileAccessDeniedError extends AppError {
  constructor(message = "You do not have permission to access this file") {
    super(message, 403);
  }
}

/** 404 — file record does not exist or has been soft-deleted */
export class FileNotFoundError extends AppError {
  constructor() {
    super("File not found", 404);
  }
}

/**
 * 503 — OCI Object Storage or presigned URL generation failed.
 * Wraps provider errors without leaking internals to the client.
 */
export class StorageProviderError extends AppError {
  constructor(message = "Storage service unavailable. Please try again later.") {
    super(message, 503);
  }
}
