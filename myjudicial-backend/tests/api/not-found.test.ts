import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { app } from "./helpers/app.js";

describe("404 handling", () => {
  it("returns a JSON 404 for an unknown /api/v1 route", async () => {
    const res = await request(app).get("/api/v1/does-not-exist");
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Route GET /api/v1/does-not-exist not found");
  });

  it("returns a JSON 404 for an unknown top-level route", async () => {
    const res = await request(app).get("/nope");
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  it("returns a JSON 404 for an unknown method on a known path", async () => {
    const res = await request(app).put("/api/v1/users");
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});
