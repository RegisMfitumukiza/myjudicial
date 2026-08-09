import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { app, setMaintenance } from "./helpers/app.js";

describe("Maintenance mode middleware", () => {
  it("serves requests normally when maintenance is disabled", async () => {
    setMaintenance(false);
    const res = await request(app).get("/api/v1");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it("returns 503 while maintenance mode is enabled", async () => {
    setMaintenance(true);
    const res = await request(app).get("/api/v1");
    assert.equal(res.status, 503);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /maintenance/i);
  });

  it("recovers once maintenance mode is disabled again", async () => {
    setMaintenance(false);
    const res = await request(app).get("/api/v1");
    assert.equal(res.status, 200);
  });
});
