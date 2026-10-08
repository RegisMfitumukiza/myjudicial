import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { app } from "./helpers/app.js";

describe("Legal Consent & Regulatory Status API", () => {
  it("GET /api/v1/content/legal/status returns 200 with legal documents status", async () => {
    const res = await request(app).get("/api/v1/content/legal/status?locale=en");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.documents);
    assert.ok(res.body.data.documents.TERMS);
    assert.ok(res.body.data.documents.PRIVACY);
    assert.ok(res.body.data.documents.COOKIES);
    assert.equal(typeof res.body.data.documents.TERMS.isFinalized, "boolean");
    assert.equal(res.body.data.documents.TERMS.version, "1.0");
  });

  it("POST /api/v1/content/legal/consent rejects unauthenticated requests (401)", async () => {
    const res = await request(app)
      .post("/api/v1/content/legal/consent")
      .send({
        documentType: "TERMS",
        version: "1.0",
        context: "REGISTRATION",
      });
    assert.equal(res.status, 401);
  });
});
