import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { app } from "./helpers/app.js";

describe("CORS allowlist", () => {
  it("echoes Access-Control-Allow-Origin for an allowed origin", async () => {
    const res = await request(app).get("/").set("Origin", "http://localhost:3000");
    assert.equal(res.status, 200);
    assert.equal(res.headers["access-control-allow-origin"], "http://localhost:3000");
  });

  it("echoes Access-Control-Allow-Origin for a second allowed origin", async () => {
    const res = await request(app).get("/").set("Origin", "http://localhost:4000");
    assert.equal(res.headers["access-control-allow-origin"], "http://localhost:4000");
  });

  it("never allows a *.vercel.app origin", async () => {
    const res = await request(app).get("/").set("Origin", "https://evil.vercel.app");
    assert.equal(res.headers["access-control-allow-origin"], undefined);
  });

  it("never allows an arbitrary external origin", async () => {
    const res = await request(app).get("/").set("Origin", "https://attacker.example.com");
    assert.equal(res.headers["access-control-allow-origin"], undefined);
  });
});
