import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { antiBotGuard } from "../src/shared/middleware/antiBot.js";

const mockReq = (body: Record<string, unknown> = {}): Request =>
  ({
    body,
    ip: "127.0.0.1",
    path: "/content/careers/apply",
    get: () => "TestAgent/1.0",
  } as unknown as Request);

const mockRes = () => {
  const res: Partial<Response> & { statusCode?: number; jsonData?: unknown } = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res as Response;
  };
  res.json = (data: unknown) => {
    res.jsonData = data;
    return res as Response;
  };
  return res as Response & { statusCode?: number; jsonData?: unknown };
};

describe("antiBotGuard middleware", () => {
  it("allows legitimate requests with no honeypot and normal submission time", () => {
    let nextCalled = false;
    const req = mockReq({
      fullName: "Alice Smith",
      email: "alice@example.com",
      _form_render_ts: Date.now() - 5000, // 5 seconds ago
    });
    const res = mockRes();

    antiBotGuard(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, undefined);
  });

  it("intercepts bots triggering the website_url honeypot with a synthetic 200", () => {
    let nextCalled = false;
    const req = mockReq({
      fullName: "Spam Bot",
      email: "bot@spam.com",
      website_url: "https://spam-link.ru", // bot filled hidden honeypot
    });
    const res = mockRes();

    antiBotGuard(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.jsonData, {
      success: true,
      message: "Application submitted successfully",
    });
  });

  it("intercepts headless bots submitting faster than 1500ms (speed trap)", () => {
    let nextCalled = false;
    const req = mockReq({
      fullName: "Fast Script Bot",
      email: "script@bot.com",
      _form_render_ts: Date.now() - 200, // submitted in 200ms
    });
    const res = mockRes();

    antiBotGuard(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.jsonData, {
      success: true,
      message: "Application submitted successfully",
    });
  });
});
