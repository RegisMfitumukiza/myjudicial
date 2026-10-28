import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  AzamPayService,
  buildAzamReferenceId,
  sanitizeAzamReferenceId,
  formatAzamAccountNumber,
  resolveCheckoutProvider,
  resolveDisbursementInstitution,
  interpretV2Outcome,
  VALID_DISBURSEMENT_INSTITUTIONS,
} from "../src/modules/payments/azam.service.js";
import { normalizeAndClassifyAzamWebhook } from "../src/modules/payments/escrow.service.js";

describe("AzamPay Rwanda API v2 Specification Compliance", () => {
  it("generates referenceIds matching ^[a-zA-Z0-9\\-_.]+$ and <= 30 characters (§3.3)", () => {
    const bmRef = buildAzamReferenceId("BM", 30);
    const poRef = buildAzamReferenceId("PO", 30);
    const rfRef = buildAzamReferenceId("RF", 30);

    const regex = /^[a-zA-Z0-9\-_.]+$/;
    assert.ok(bmRef.startsWith("BM-"));
    assert.ok(poRef.startsWith("PO-"));
    assert.ok(rfRef.startsWith("RF-"));

    assert.ok(bmRef.length <= 30, `Expected <= 30 chars, got ${bmRef.length}`);
    assert.ok(poRef.length <= 30, `Expected <= 30 chars, got ${poRef.length}`);
    assert.ok(rfRef.length <= 30, `Expected <= 30 chars, got ${rfRef.length}`);

    assert.match(bmRef, regex);
    assert.match(poRef, regex);
    assert.match(rfRef, regex);

    const sanitized = sanitizeAzamReferenceId("PO-2026/04/17#bad ref!123456789012345", 30);
    assert.ok(sanitized.length <= 30);
    assert.match(sanitized, regex);
  });

  it("normalizes Rwandan phone numbers and resolves Checkout & Disbursement institutions (§2 & §3.3)", () => {
    assert.equal(formatAzamAccountNumber("+250 788 123 456"), "250788123456");
    assert.equal(formatAzamAccountNumber("0788123456"), "0788123456");
    assert.equal(formatAzamAccountNumber("788123456"), "250788123456");

    // Checkout providers: MTN (078/079) & AIRTEL (072/073)
    assert.equal(resolveCheckoutProvider("0788123456"), "MTN");
    assert.equal(resolveCheckoutProvider("250791234567"), "MTN");
    assert.equal(resolveCheckoutProvider("0722123456"), "AIRTEL");
    assert.equal(resolveCheckoutProvider("250733123456"), "AIRTEL");

    // Disbursement institutions: all 14 supported Rwandan institutions (§3.3)
    const allInstitutions = [
      "MTN",
      "AIRTEL",
      "BK",
      "EQUITY",
      "GTBANK",
      "I&M",
      "BOA",
      "BPR",
      "ECOBANK",
      "ACCESS",
      "COGEBANQUE",
      "BRD",
      "AB BANK",
      "UNGUKA",
    ];

    for (const inst of allInstitutions) {
      assert.ok(VALID_DISBURSEMENT_INSTITUTIONS.has(inst), `Missing institution ${inst}`);
      assert.equal(resolveDisbursementInstitution("212128000516", inst), inst);
    }
  });

  it("interprets v2 envelope outcomes accurately across ACSC, PDNG, RJCT and transactionStatus (§0 & §2.2)", () => {
    // Settled (ACSC / success)
    assert.equal(
      interpretV2Outcome({
        success: true,
        transactionStatus: "success",
        statusCode: 200,
        data: { providerStatusCode: "ACSC" },
      }),
      "SUCCESS"
    );

    // MTN async initiation: success=true, statusCode=200, but transactionStatus="pending" & providerStatusCode="PDNG"
    assert.equal(
      interpretV2Outcome({
        success: true,
        transactionStatus: "pending",
        statusCode: 200,
        data: { providerStatusCode: "PDNG" },
      }),
      "PENDING"
    );

    // Rejected by MNO (RJCT / failure)
    assert.equal(
      interpretV2Outcome({
        success: false,
        transactionStatus: "failure",
        statusCode: 400,
        data: { providerStatusCode: "RJCT" },
      }),
      "FAILURE"
    );
  });

  it("classifies unified webhook callbacks into PAYMENT (BM-), PAYOUT (PO-), and REFUND (RF-)", async () => {
    // 1. Collection callback (v2 nested envelope)
    const collectionWebhook = await normalizeAndClassifyAzamWebhook({
      success: true,
      transactionStatus: "success",
      statusCode: 200,
      message: "Payment collected successfully",
      data: {
        pgReferenceId: "019d9af1-cb33-7b66-8589-6765de936544",
        referenceId: "BM-1776420944-a1b2c3d4",
        fspReferenceId: "FT26107ABCDE",
        externalReferenceId: "booking-uuid-123",
        provider: "MTN",
        providerStatusCode: "ACSC",
        amount: 15000,
      },
    });

    assert.equal(collectionWebhook.category, "PAYMENT");
    assert.equal(collectionWebhook.outcome, "SUCCESS");
    assert.equal(collectionWebhook.referenceId, "BM-1776420944-a1b2c3d4");
    assert.equal(collectionWebhook.pgReferenceId, "019d9af1-cb33-7b66-8589-6765de936544");
    assert.equal(collectionWebhook.fspReferenceId, "FT26107ABCDE");
    assert.equal(collectionWebhook.externalReferenceId, "booking-uuid-123");

    // 2. Expert Payout callback (PO- prefix)
    const payoutWebhook = await normalizeAndClassifyAzamWebhook({
      success: true,
      transactionStatus: "success",
      statusCode: 200,
      message: "Transfer completed",
      data: {
        pgReferenceId: "019d9af8-1b7e-7be4-b42a-ffdd0ec00e0f",
        referenceId: "PO-1776421293-x9y8z7w6",
        fspReferenceId: "GTB26107XYZ",
        externalReferenceId: "booking-uuid-123",
        destination: {
          institution: "MTN",
          accountNumber: "250788123456",
        },
        transferDetails: {
          type: "Payout",
          amount: 12750,
        },
      },
    });

    assert.equal(payoutWebhook.category, "PAYOUT");
    assert.equal(payoutWebhook.outcome, "SUCCESS");
    assert.equal(payoutWebhook.referenceId, "PO-1776421293-x9y8z7w6");
    assert.equal(payoutWebhook.fspReferenceId, "GTB26107XYZ");

    // 3. Citizen Refund callback (RF- prefix)
    const refundWebhook = await normalizeAndClassifyAzamWebhook({
      success: false,
      transactionStatus: "failure",
      statusCode: 500,
      message: "Recipient wallet unreachable",
      data: {
        pgReferenceId: "019d9af9-0000-7be4-b42a-ffdd0ec00e0f",
        referenceId: "RF-1776421500-r1r2r3r4",
        externalReferenceId: "booking-uuid-123",
      },
    });

    assert.equal(refundWebhook.category, "REFUND");
    assert.equal(refundWebhook.outcome, "FAILURE");
    assert.equal(refundWebhook.referenceId, "RF-1776421500-r1r2r3r4");
  });
});

describe("AzamPayService Live HTTP v2 Protocol & Error Handling (§1, §2, §3, §4)", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    AzamPayService.clearTokenCache();
    process.env.AZAMPAY_APP_NAME = "myjudicial-rw-test";
    process.env.AZAMPAY_CLIENT_ID = "019d61d7-f9b7-72f1-be76-6f0f0bdcb29e";
    process.env.AZAMPAY_CLIENT_SECRET = "test-secret-xyz";
    process.env.AZAMPAY_API_KEY = "test-api-key-123";
    delete process.env.AZAMPAY_SIMULATE_SANDBOX;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
    AzamPayService.clearTokenCache();
  });

  it("does NOT retry on HTTP 423 Locked from Authenticator (§1 & §4)", async () => {
    let authCalls = 0;
    globalThis.fetch = (async () => {
      authCalls++;
      return new Response(
        JSON.stringify({
          success: false,
          transactionStatus: "failure",
          statusCode: 423,
          message: "Invalid ClientId or ClientSecret",
        }),
        { status: 423, headers: { "Content-Type": "application/json" } }
      );
    }) as any;

    await assert.rejects(
      () => AzamPayService.authenticate(),
      /AzamPay authentication locked \(423\)/
    );
    assert.equal(authCalls, 1, "Must not auto-retry on 423 Locked");
  });

  it("attaches BOTH Authorization and X-API-KEY headers and auto-retries once on HTTP 401 (§1, §2, §3, §4)", async () => {
    let tokenMintCount = 0;
    let balanceCallCount = 0;
    const capturedHeaders: Record<string, string>[] = [];

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/AppRegistration/GenerateToken")) {
        tokenMintCount++;
        return new Response(
          JSON.stringify({
            success: true,
            statusCode: 200,
            message: "Token generated",
            data: {
              accessToken: {
                token: `jwt-token-${tokenMintCount}`,
                expire: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (url.includes("/api/v2/rw/balance")) {
        balanceCallCount++;
        capturedHeaders.push((init?.headers as Record<string, string>) || {});

        // First call simulates expired token (401), second call succeeds (200)
        if (balanceCallCount === 1) {
          return new Response(
            JSON.stringify({ statusCode: 401, message: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            transactionStatus: "success",
            statusCode: 200,
            message: "Balance retrieved successfully",
            data: {
              balance: 48450998.0,
              currency: "RWF",
              availableAccounts: [
                {
                  accountNumber: "212128000516",
                  currency: "RWF",
                  accountName: "AZAMPAY RWANDA ESCROW",
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    }) as any;

    const balanceRes = await AzamPayService.getDisbursementBalance();
    assert.equal(balanceRes.success, true);
    assert.equal(balanceRes.data?.balance, 48450998.0);
    assert.equal(tokenMintCount, 2, "Should mint initial token and re-mint once after 401");
    assert.equal(balanceCallCount, 2, "Should retry the balance call once after 401");

    // Verify both Authorization and X-API-KEY headers were sent on Disbursement API calls
    assert.equal(capturedHeaders[0]?.Authorization, "Bearer jwt-token-1");
    assert.equal(capturedHeaders[0]?.["X-API-KEY"], "test-api-key-123");
    assert.equal(capturedHeaders[1]?.Authorization, "Bearer jwt-token-2");
    assert.equal(capturedHeaders[1]?.["X-API-KEY"], "test-api-key-123");
  });

  it("handles HTTP 409 Conflict on initializeMnoPayment by querying §2.4 payment status by referenceId", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/AppRegistration/GenerateToken")) {
        return new Response(
          JSON.stringify({
            success: true,
            statusCode: 200,
            data: {
              accessToken: {
                token: "jwt-token-valid",
                expire: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              },
            },
          }),
          { status: 200 }
        );
      }

      if (url.endsWith("/api/v2/rw/payments") && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        // Verify amount is sent as a numeric string per §2.2
        assert.equal(typeof body.amount, "string");
        assert.equal(body.amount, "25000");

        return new Response(
          JSON.stringify({
            success: false,
            transactionStatus: "failure",
            statusCode: 409,
            message: "ReferenceId has already been used.",
          }),
          { status: 409 }
        );
      }

      if (url.includes("/api/v2/rw/payments/references/")) {
        return new Response(
          JSON.stringify({
            success: true,
            transactionStatus: "success",
            statusCode: 200,
            message: "Transaction found",
            data: {
              pgReferenceId: "019d9af1-cb33-7b66-8589-6765de936544",
              referenceId: "BM-DUP-TEST-1",
              providerStatusCode: "ACSC",
            },
          }),
          { status: 200 }
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    }) as any;

    const result = await AzamPayService.initializeMnoPayment({
      bookingId: "booking-123",
      amount: 25000,
      phoneNumber: "0788123456",
      referenceId: "BM-DUP-TEST-1",
    });

    assert.equal(result.transactionId, "BM-DUP-TEST-1");
    assert.equal(result.pgReferenceId, "019d9af1-cb33-7b66-8589-6765de936544");
    assert.equal(result.transactionStatus, "SUCCESS");
    assert.equal(result.providerStatusCode, "ACSC");
  });

  it("formats sendExpertPayout payload per §3.3 (numeric amount, epoch seconds, <=30 char referenceId, X-API-KEY)", async () => {
    let capturedTransferPayload: any = null;
    let capturedTransferHeaders: any = null;

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/AppRegistration/GenerateToken")) {
        return new Response(
          JSON.stringify({
            success: true,
            statusCode: 200,
            data: {
              accessToken: {
                token: "jwt-token-valid",
                expire: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              },
            },
          }),
          { status: 200 }
        );
      }

      if (url.endsWith("/api/v2/rw/transfers") && init?.method === "POST") {
        capturedTransferPayload = JSON.parse(String(init.body));
        capturedTransferHeaders = init.headers;
        return new Response(
          JSON.stringify({
            success: true,
            transactionStatus: "pending",
            statusCode: 200,
            message: "Disbursement transaction has been queued for processing",
            data: {
              pgReferenceId: "019d9af8-1b7e-7be4-b42a-ffdd0ec00e0f",
              referenceId: capturedTransferPayload.referenceId,
            },
          }),
          { status: 200 }
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    }) as any;

    const payout = await AzamPayService.sendExpertPayout({
      bookingId: "booking-456",
      momoNumber: "+250788123456",
      amount: 42500,
      expertName: "Me. Jean-Paul Habimana",
    });

    assert.ok(capturedTransferPayload);
    assert.ok(capturedTransferPayload.referenceId.length <= 30);
    assert.equal(typeof capturedTransferPayload.transferDetails.amount, "number");
    assert.equal(capturedTransferPayload.transferDetails.amount, 42500);
    assert.ok(capturedTransferPayload.transferDetails.dateInEpoch < 10_000_000_000, "dateInEpoch must be in seconds, not milliseconds");
    assert.equal(capturedTransferPayload.destination.institution, "MTN");
    assert.equal(capturedTransferPayload.destination.countryCode, "RW");
    assert.equal(capturedTransferHeaders["X-API-KEY"], "test-api-key-123");

    assert.equal(payout.pgReferenceId, "019d9af8-1b7e-7be4-b42a-ffdd0ec00e0f");
    assert.equal(payout.transactionStatus, "pending");
    assert.equal(payout.status, "PENDING");
  });
});
