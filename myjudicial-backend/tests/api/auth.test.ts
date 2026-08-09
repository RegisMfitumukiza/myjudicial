import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { app } from "./helpers/app.js";
import { requireRole, requireVerifiedExpert } from "../../src/shared/middleware/authenticate.js";
import { AuthenticationError, AuthorizationError } from "../../src/shared/errors/index.js";

describe("Authentication middleware wiring", () => {
  it("rejects requests to a protected route without a token (401)", async () => {
    const res = await request(app).post("/api/v1/ai/analyze").send({ caseDescription: "x" });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it("rejects requests with a malformed Authorization header (401)", async () => {
    const res = await request(app)
      .post("/api/v1/ai/analyze")
      .set("Authorization", "Token abc")
      .send({ caseDescription: "x" });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });
});

type Middleware = (req: any, res: any, next: (err?: unknown) => void) => void;

const run = (mw: Middleware, req: Record<string, unknown>): Promise<unknown> =>
  new Promise((resolve) => {
    mw(req as never, {} as never, (err?: unknown) => resolve(err));
  });

describe("requireRole", () => {
  it("allows a user with a matching role", async () => {
    const err = await run(requireRole("ADMIN"), { user: { role: "ADMIN" } });
    assert.equal(err, undefined);
  });

  it("rejects a user with the wrong role (403 AuthorizationError)", async () => {
    const err = await run(requireRole("ADMIN"), { user: { role: "CITIZEN" } });
    assert.ok(err instanceof AuthorizationError);
    assert.equal((err as AuthorizationError).statusCode, 403);
  });

  it("rejects a missing user (401 AuthenticationError)", async () => {
    const err = await run(requireRole("ADMIN"), {});
    assert.ok(err instanceof AuthenticationError);
    assert.equal((err as AuthenticationError).statusCode, 401);
  });
});

describe("requireVerifiedExpert", () => {
  it("allows a verified expert", async () => {
    const err = await run(requireVerifiedExpert, {
      user: { role: "EXPERT", expertStatus: "VERIFIED" },
    });
    assert.equal(err, undefined);
  });

  it("rejects an unverified expert (403)", async () => {
    const err = await run(requireVerifiedExpert, {
      user: { role: "EXPERT", expertStatus: "PENDING" },
    });
    assert.ok(err instanceof AuthorizationError);
    assert.equal((err as AuthorizationError).statusCode, 403);
  });

  it("rejects a non-expert user (403)", async () => {
    const err = await run(requireVerifiedExpert, {
      user: { role: "CITIZEN", expertStatus: null },
    });
    assert.ok(err instanceof AuthorizationError);
  });
});
