import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { app } from "./helpers/app.js";
import { apiLimiter } from "../../src/shared/middleware/rateLimiting.js";
import { ipKeyGenerator } from "express-rate-limit";

describe("Global API rate limiting", () => {
  const target = "/api/v1";
  // apiLimiter max is 2000 when NODE_ENV !== "production" (unless overridden by env).
  const LIMIT = Number(process.env.API_RATE_LIMIT_MAX) || (process.env.NODE_ENV === "production" ? 1000 : 2000);

  it("allows requests under the limit and blocks once it is exceeded (429)", async () => {
    let got429 = false;

    for (let i = 0; i < LIMIT + 1; i++) {
      const res = await request(app).get(target);
      if (res.status === 429) {
        got429 = true;
        assert.equal(res.body.success, false);
        break;
      }
      assert.equal(res.status, 200, `expected 200 on request ${i}, got ${res.status}`);
    }

    assert.ok(got429, "expected a 429 response after exceeding the rate limit");
  });

  after(() => {
    // Reset the shared in-memory limiter so it cannot leak into other tests.
    for (const ip of ["127.0.0.1", "::ffff:127.0.0.1"]) {
      try {
        apiLimiter.resetKey(ipKeyGenerator(ip));
      } catch {
        // key may not exist; ignore
      }
    }
  });
});
