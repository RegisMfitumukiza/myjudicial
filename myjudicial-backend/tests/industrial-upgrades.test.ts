import "./api/helpers/env.js";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizePgConnectionString } from "../src/infrastructure/database/prisma.js";
import { inspectBufferForMalware } from "../src/infrastructure/storage/oci-object-storage.service.js";
import { normalizeRwandaPhone, SmsService } from "../src/infrastructure/sms/sms.service.js";
import { QueueService } from "../src/infrastructure/queue/queue.service.js";
import { redis } from "../src/infrastructure/redis/redis.client.js";

describe("Industrial-Grade Platform Upgrades", () => {
  describe("1. Database Connection String Sanitizer (PgBouncer / Pooler Safe)", () => {
    it("strips pgbouncer=true cleanly when it is the only query parameter", () => {
      const raw = "postgresql://user:pass@db.example.com:6543/myjudicial?pgbouncer=true";
      const sanitized = sanitizePgConnectionString(raw);
      assert.equal(sanitized, "postgresql://user:pass@db.example.com:6543/myjudicial");
    });

    it("preserves subsequent query parameters without corrupting the ? separator", () => {
      const raw =
        "postgresql://user:pass@db.example.com:6543/myjudicial?pgbouncer=true&connection_limit=20&sslmode=require";
      const sanitized = sanitizePgConnectionString(raw);
      assert.equal(
        sanitized,
        "postgresql://user:pass@db.example.com:6543/myjudicial?sslmode=require"
      );
    });

    it("preserves preceding query parameters when stripping prisma-specific flags", () => {
      const raw =
        "postgresql://user:pass@db.example.com:5432/myjudicial?schema=public&pgbouncer=true&pool_timeout=15";
      const sanitized = sanitizePgConnectionString(raw);
      assert.equal(
        sanitized,
        "postgresql://user:pass@db.example.com:5432/myjudicial?schema=public"
      );
    });
  });

  describe("2. Multi-Engine Malware & Payload Integrity Scanner", () => {
    it("allows clean PDF and PNG buffers", () => {
      const cleanPdf = Buffer.from("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF", "utf8");
      assert.deepEqual(inspectBufferForMalware(cleanPdf), { clean: true, engine: "signature" });

      const cleanPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      assert.deepEqual(inspectBufferForMalware(cleanPng), { clean: true, engine: "signature" });
    });

    it("detects and blocks EICAR standard anti-malware test file", () => {
      const eicarParts = [
        "X5O!P%@AP[4\\PZX54(P^)7CC)7}$",
        "EICAR-STANDARD-ANTIVIRUS-",
        "TEST-FILE!$H+H*",
      ];
      const eicar = Buffer.from(eicarParts.join(""), "utf8");
      const res = inspectBufferForMalware(eicar);
      assert.equal(res.clean, false);
      assert.ok(res.threat?.includes("EICAR"));
    });

    it("detects and blocks disguised Linux ELF binaries", () => {
      const elfBinary = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]);
      const res = inspectBufferForMalware(elfBinary);
      assert.equal(res.clean, false);
      assert.ok(res.threat?.includes("ELF"));
    });

    it("detects and blocks disguised Windows PE/MZ executables", () => {
      const peBuffer = Buffer.alloc(128, 0);
      peBuffer[0] = 0x4d; // 'M'
      peBuffer[1] = 0x5a; // 'Z'
      peBuffer.writeUInt32LE(0x40, 0x3c); // e_lfanew pointer at 0x3c -> 0x40
      peBuffer[0x40] = 0x50; // 'P'
      peBuffer[0x41] = 0x45; // 'E'
      peBuffer[0x42] = 0x00;
      peBuffer[0x43] = 0x00;

      const res = inspectBufferForMalware(peBuffer);
      assert.equal(res.clean, false);
      assert.ok(res.threat?.includes("PE"));
    });

    it("detects and blocks embedded PHP webshells inside uploaded files", () => {
      const phpTag = ["<?", "php system($_GET['cmd']); ?>"].join("");
      const fakeImageWithWebshell = Buffer.from(`\xFF\xD8\xFF\xE0 JFIF ${phpTag}`, "utf8");
      const res = inspectBufferForMalware(fakeImageWithWebshell);
      assert.equal(res.clean, false);
      assert.ok(res.threat?.includes("WebShell"));
    });
  });

  describe("3. Rwandan SMS Gateway & E.164 Phone Normalization", () => {
    it("normalizes local Rwandan mobile numbers (078/079/072/073) to E.164 (+2507...)", () => {
      assert.equal(normalizeRwandaPhone("0788123456"), "+250788123456");
      assert.equal(normalizeRwandaPhone("0791234567"), "+250791234567");
      assert.equal(normalizeRwandaPhone("0722123456"), "+250722123456");
      assert.equal(normalizeRwandaPhone("0733123456"), "+250733123456");
    });

    it("normalizes international format numbers with spaces or dashes", () => {
      assert.equal(normalizeRwandaPhone("+250 788 123 456"), "+250788123456");
      assert.equal(normalizeRwandaPhone("250-788-123-456"), "+250788123456");
    });

    it("returns null for invalid phone numbers", () => {
      assert.equal(normalizeRwandaPhone("12345"), null);
      assert.equal(normalizeRwandaPhone("invalid-phone"), null);
    });

    it("gracefully skips SMS dispatch when no SMS provider env vars are configured", async () => {
      const savedProvider = process.env.SMS_PROVIDER;
      const savedPindo = process.env.PINDO_API_TOKEN;
      const savedAtKey = process.env.AT_API_KEY;
      const savedTwilio = process.env.TWILIO_ACCOUNT_SID;
      const savedWebhook = process.env.SMS_WEBHOOK_URL;

      delete process.env.SMS_PROVIDER;
      delete process.env.PINDO_API_TOKEN;
      delete process.env.AT_API_KEY;
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.SMS_WEBHOOK_URL;

      try {
        const res = await SmsService.sendOtpSms("0788123456", "482910", "rw");
        assert.equal(res.sent, false);
        assert.equal(res.provider, "unconfigured");
      } finally {
        if (savedProvider !== undefined) process.env.SMS_PROVIDER = savedProvider;
        if (savedPindo !== undefined) process.env.PINDO_API_TOKEN = savedPindo;
        if (savedAtKey !== undefined) process.env.AT_API_KEY = savedAtKey;
        if (savedTwilio !== undefined) process.env.TWILIO_ACCOUNT_SID = savedTwilio;
        if (savedWebhook !== undefined) process.env.SMS_WEBHOOK_URL = savedWebhook;
      }
    });
  });

  describe("4. Distributed Lock & Background Queue Service", () => {
    it("executes withDistributedLock callback when lock is acquired and releases lock afterwards", async () => {
      const origSet = redis.set;
      const origEval = redis.eval;
      const origIsOpen = Object.getOwnPropertyDescriptor(redis, "isOpen");
      let setCalled = 0;
      let evalCalled = 0;
      Object.defineProperty(redis, "isOpen", { value: true, configurable: true });
      (redis as any).set = async () => {
        setCalled++;
        return "OK";
      };
      (redis as any).eval = async () => {
        evalCalled++;
        return 1;
      };

      try {
        let executed = false;
        const result = await QueueService.withDistributedLock("test-cron", 60, async () => {
          executed = true;
          return "done";
        });

        assert.equal(executed, true);
        assert.deepEqual(result, { executed: true, result: "done" });
        assert.equal(setCalled, 1);
        assert.equal(evalCalled, 1);
      } finally {
        (redis as any).set = origSet;
        (redis as any).eval = origEval;
        if (origIsOpen) {
          Object.defineProperty(redis, "isOpen", origIsOpen);
        } else {
          delete (redis as any).isOpen;
        }
      }
    });

    it("skips execution when another instance already holds the distributed lock", async () => {
      const origSet = redis.set;
      const origIsOpen = Object.getOwnPropertyDescriptor(redis, "isOpen");
      Object.defineProperty(redis, "isOpen", { value: true, configurable: true });
      (redis as any).set = async () => null;

      try {
        let executed = false;
        const result = await QueueService.withDistributedLock("test-cron-locked", 60, async () => {
          executed = true;
          return "should-not-run";
        });

        assert.equal(executed, false);
        assert.deepEqual(result, { executed: false });
      } finally {
        (redis as any).set = origSet;
        if (origIsOpen) {
          Object.defineProperty(redis, "isOpen", origIsOpen);
        } else {
          delete (redis as any).isOpen;
        }
      }
    });
  });
});
