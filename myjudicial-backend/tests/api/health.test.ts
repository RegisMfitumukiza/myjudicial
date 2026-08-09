import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { app, dbHealthy, dbDown } from "./helpers/app.js";

describe("GET /health", () => {
  it("returns 200 with database connected when the DB responds", async () => {
    dbHealthy();
    const res = await request(app).get("/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
    assert.equal(res.body.database, "connected");
    assert.equal(res.body.service, "myjudicial-api");
    assert.equal(res.body.environment, "test");
    assert.ok(typeof res.body.uptime === "number");
    assert.ok(res.body.timestamp);
  });

  it("returns 503 when the database is unreachable", async () => {
    dbDown();
    const res = await request(app).get("/health");
    assert.equal(res.status, 503);
    assert.equal(res.body.status, "error");
    assert.equal(res.body.database, "disconnected");
  });
});
