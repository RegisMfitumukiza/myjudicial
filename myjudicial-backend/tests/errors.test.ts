import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  FileUploadError,
  FileAccessDeniedError,
  FileNotFoundError,
  StorageProviderError,
} from "../src/shared/errors/AppError.js";

describe("AppError base class", () => {
  it("sets message, status, and flags", () => {
    const err = new AppError("boom", 500);
    assert.equal(err.message, "boom");
    assert.equal(err.statusCode, 500);
    assert.equal(err.isOperational, true);
    assert.equal(err.name, "AppError");
    assert.ok(err instanceof Error);
  });

  it("defaults to 500", () => {
    assert.equal(new AppError("x").statusCode, 500);
  });

  it("stores structured errors", () => {
    const err = new AppError("invalid", 400, ["field is required"]);
    assert.deepEqual(err.errors, ["field is required"]);
  });
});

describe("Domain error classes", () => {
  it("AuthenticationError is 401", () => {
    const err = new AuthenticationError();
    assert.equal(err.statusCode, 401);
    assert.ok(err instanceof AppError);
  });

  it("AuthorizationError is 403", () => {
    assert.equal(new AuthorizationError().statusCode, 403);
  });

  it("ValidationError is 400", () => {
    assert.equal(new ValidationError("bad").statusCode, 400);
  });

  it("NotFoundError is 404 and includes resource", () => {
    const err = new NotFoundError("Booking");
    assert.equal(err.statusCode, 404);
    assert.equal(err.message, "Booking not found");
  });

  it("ConflictError is 409", () => {
    assert.equal(new ConflictError().statusCode, 409);
  });

  it("RateLimitError is 429", () => {
    assert.equal(new RateLimitError().statusCode, 429);
  });

  it("ServiceUnavailableError is 503 and includes service", () => {
    const err = new ServiceUnavailableError("Supabase");
    assert.equal(err.statusCode, 503);
    assert.equal(err.message, "Supabase is currently unavailable");
  });
});

describe("Storage/file error classes", () => {
  it("FileUploadError is 422", () => {
    assert.equal(new FileUploadError().statusCode, 422);
  });

  it("FileAccessDeniedError is 403", () => {
    assert.equal(new FileAccessDeniedError().statusCode, 403);
  });

  it("FileNotFoundError is 404", () => {
    assert.equal(new FileNotFoundError().statusCode, 404);
    assert.equal(new FileNotFoundError().message, "File not found");
  });

  it("StorageProviderError is 503", () => {
    assert.equal(new StorageProviderError().statusCode, 503);
  });
});
