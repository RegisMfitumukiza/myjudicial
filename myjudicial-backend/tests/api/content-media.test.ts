import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "./helpers/app.js";

describe("Content Media Permanent Delivery", () => {
  test("rejects path traversal keys with 400", async () => {
    const res = await request(app).get("/api/v1/content/media/folder%2F..%2Fsecret.txt");
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  test("returns 404 for missing media files", async () => {
    const res = await request(app).get("/api/v1/content/media/content/images/non-existent-file-999.png");
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
  });
});
