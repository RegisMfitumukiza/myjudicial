import { randomUUID } from "crypto";
import { logger } from "../../shared/utils/logger.js";
import { detectMomoProvider } from "./payout.helper.js";

/**
 * AzamPay Rwanda API v2 Integration
 *
 * Strictly aligned with `Rwanda_API_v2_Guide.md`:
 *  1. Authenticator:
 *     - Test: https://authenticator-sandbox.azampay.co.tz
 *     - Prod: https://authenticator.azampay.co.rw
 *     - POST /AppRegistration/GenerateToken (re-mint when remaining TTL < 5 min; do NOT retry on 423)
 *  2. Checkout API v2 (Collections — MTN & Airtel Rwanda):
 *     - Test: https://checkout-test-rw.azampay.co.tz
 *     - Prod: https://checkout.azampay.co.rw
 *     - GET  /api/v2/rw/accounts/{accountNumber}
 *     - POST /api/v2/rw/payments
 *     - GET  /api/v2/rw/payments/{pgReferenceId}?provider=MTN|AIRTEL
 *     - GET  /api/v2/rw/payments/references/{referenceId}
 *  3. Disbursement API v2 (Transfers — Payouts & Refunds across 14 Rwandan institutions):
 *     - Test: https://api-disbursement-test-rw.azampay.co.tz
 *     - Prod: https://api-disbursement.azampay.co.rw
 *     - GET  /api/v2/rw/accounts/{accountNumber}
 *     - GET  /api/v2/rw/balance
 *     - POST /api/v2/rw/transfers
 *     - GET  /api/v2/rw/transfers/{pgReferenceId}
 *     - GET  /api/v2/rw/transfers/references/{referenceId}
 *
 * All Checkout and Disbursement endpoints require BOTH:
 *   - Authorization: Bearer <token>
 *   - X-API-KEY: <apiKey>
 */

export type RwandaCheckoutProvider = "MTN" | "AIRTEL";

export type RwandaDisbursementInstitution =
  | "MTN"
  | "AIRTEL"
  | "BK"
  | "EQUITY"
  | "GTBANK"
  | "I&M"
  | "BOA"
  | "BPR"
  | "ECOBANK"
  | "ACCESS"
  | "COGEBANQUE"
  | "BRD"
  | "AB BANK"
  | "UNGUKA";

export const VALID_DISBURSEMENT_INSTITUTIONS = new Set<string>([
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
]);

export interface AzamPayV2ErrorItem {
  code?: string;
  message?: string;
}

export interface AzamPayV2Envelope<T = any> {
  success: boolean;
  transactionStatus?: "success" | "pending" | "failure" | string;
  statusCode: number;
  message: string;
  error?: AzamPayV2ErrorItem[];
  data?: T;
}

export interface AzamPayAccountLookupData {
  accountNumber: string;
  fullName: string;
  provider?: string;
  currency?: string;
}

export interface AzamPayPaymentStatusData {
  pgReferenceId?: string;
  referenceId?: string;
  fspReferenceId?: string | null;
  externalReferenceId?: string | null;
  accountNumber?: string;
  fullName?: string;
  amount?: number | string;
  currency?: string;
  provider?: string;
  providerStatusCode?: "ACSC" | "PDNG" | "RJCT" | string;
  additionalProperties?: Record<string, any> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AzamPayTransferStatusData {
  pgReferenceId?: string;
  referenceId?: string;
  fspReferenceId?: string | null;
  externalReferenceId?: string | null;
  providerStatusCode?: "ACSC" | "PDNG" | "RJCT" | string;
  createdAt?: string;
  updatedAt?: string;
  source?: {
    countryCode?: string;
    fullName?: string;
    institution?: string;
    accountNumber?: string;
    currency?: string;
  };
  destination?: {
    countryCode?: string;
    fullName?: string;
    institution?: string;
    accountNumber?: string;
    currency?: string;
  };
  transferDetails?: {
    type?: string;
    amount?: number;
    dateInEpoch?: number;
  };
  additionalProperties?: Record<string, any> | null;
  remarks?: string | null;
}

export interface AzamPayBalanceData {
  balance: number;
  currency: string;
  availableAccounts?: Array<{
    accountNumber: string;
    currency: string;
    accountName: string;
  }>;
}

export interface AzamPayCheckoutRequest {
  bookingId: string;
  amount: number;
  currency?: string;
  mno?: string; // "MTN" | "AIRTEL" (case-insensitive)
  phoneNumber: string;
  citizenEmail?: string;
  citizenName?: string;
  referenceId?: string;
}

export interface AzamPayCheckoutResult {
  paymentLink: string | null;
  transactionId: string;
  pgReferenceId?: string;
  transactionStatus?: "SUCCESS" | "PENDING" | "FAILURE";
  providerStatusCode?: string;
}

export interface AzamPayDisbursementRequest {
  bookingId: string;
  momoNumber: string;
  amount: number;
  currency?: string;
  expertName?: string;
  mno?: string; // Institution code from §3.3 (defaults to detected MTN/AIRTEL)
  referenceId?: string;
  remarks?: string;
}

export interface AzamPayDisbursementResult {
  reference: string;
  pgReferenceId?: string;
  fspReferenceId?: string | null;
  status: "SUCCESS" | "PENDING" | "FAILURE" | "SUCCESSFUL";
  transactionStatus: "success" | "pending" | "failure";
}

// ── Environment & Base URLs (§0, §1, §2, §3) ─────────────────────────────────
const isProduction = process.env.NODE_ENV === "production";

const AUTH_BASE_URL =
  process.env.AZAMPAY_AUTH_URL ||
  (isProduction
    ? "https://authenticator.azampay.co.rw"
    : "https://authenticator-sandbox.azampay.co.tz");

const CHECKOUT_BASE_URL =
  process.env.AZAMPAY_BASE_URL ||
  process.env.AZAMPAY_CHECKOUT_URL ||
  (isProduction
    ? "https://checkout.azampay.co.rw"
    : "https://checkout-test-rw.azampay.co.tz");

const DISBURSEMENT_BASE_URL =
  process.env.AZAMPAY_DISBURSEMENT_URL ||
  (isProduction
    ? "https://api-disbursement.azampay.co.rw"
    : "https://api-disbursement-test-rw.azampay.co.tz");

const getCredentials = () => {
  const appName = process.env.AZAMPAY_APP_NAME || "";
  const clientId = process.env.AZAMPAY_CLIENT_ID || "";
  const clientSecret = process.env.AZAMPAY_CLIENT_SECRET || "";
  const apiKey = process.env.AZAMPAY_API_KEY || clientId;

  return { appName, clientId, clientSecret, apiKey };
};

/**
 * Determines whether to use local offline simulation vs live AzamPay v2 HTTP calls.
 * Per `Rwanda_API_v2_Guide.md` §0, both test servers (`checkout-test-rw` and
 * `api-disbursement-test-rw`) are stateful MySQL-backed v2 environments.
 * We call the real AzamPay v2 endpoints whenever credentials are configured,
 * unless `AZAMPAY_SIMULATE_SANDBOX=true` is explicitly set.
 */
const shouldSimulateLocally = (): boolean => {
  if (process.env.AZAMPAY_SIMULATE_SANDBOX === "true") {
    return true;
  }
  const { appName, clientId, clientSecret } = getCredentials();
  const hasCredentials = Boolean(appName && clientId && clientSecret);
  if (!hasCredentials && !isProduction) {
    return true;
  }
  return false;
};

// ── Token cache (§1: refresh when remaining TTL < 5 minutes) ─────────────────
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes per §1 guide
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Sanitizes and enforces referenceId format (`^[a-zA-Z0-9\-_.]+$`) and max length.
 * Checkout max length = 64 (§2.2); Disbursement max length = 30 (§3.3).
 */
export function buildAzamReferenceId(prefix: "BM" | "PO" | "RF", maxLen = 30): string {
  const raw = `${prefix}-${Date.now()}-${randomUUID().replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`;
  return raw.slice(0, maxLen);
}

export function sanitizeAzamReferenceId(ref: string, maxLen = 30): string {
  const cleaned = ref.replace(/[^a-zA-Z0-9\-_.]/g, "-");
  return cleaned.slice(0, maxLen);
}

/**
 * Normalizes a Rwandan phone / account number for AzamPay v2 (`^[0-9]{9,20}$`).
 * Strips leading `+` and non-digits; converts 9-digit `7XXXXXXXX` to `2507XXXXXXXX`.
 */
export function formatAzamAccountNumber(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("7")) {
    return `250${digits}`;
  }
  return digits;
}

/**
 * Resolves Checkout provider (`MTN` or `AIRTEL`) from phone number or explicit MNO string.
 */
export function resolveCheckoutProvider(phoneNumber: string, requestedMno?: string): RwandaCheckoutProvider {
  const detected = detectMomoProvider(phoneNumber);
  if (detected === "MTN" || detected === "AIRTEL") {
    return detected;
  }
  const normalizedMno = (requestedMno || "MTN").trim().toUpperCase();
  if (normalizedMno.includes("AIRTEL")) {
    return "AIRTEL";
  }
  return "MTN";
}

/**
 * Resolves Disbursement institution (`MTN`, `AIRTEL`, or one of the 12 Rwandan banks in §3.3).
 */
export function resolveDisbursementInstitution(
  accountNumber: string,
  requestedInstitution?: string
): RwandaDisbursementInstitution {
  if (requestedInstitution) {
    const upper = requestedInstitution.trim().toUpperCase();
    if (upper.includes("AIRTEL")) return "AIRTEL";
    if (upper.includes("MTN")) return "MTN";
    if (VALID_DISBURSEMENT_INSTITUTIONS.has(upper)) {
      return upper as RwandaDisbursementInstitution;
    }
  }
  const detected = detectMomoProvider(accountNumber);
  if (detected === "AIRTEL") return "AIRTEL";
  return "MTN";
}

/**
 * Interprets the v2 envelope (`transactionStatus` + `data.providerStatusCode`) into a normalized outcome.
 * Per §0 & §2.2:
 *  - `transactionStatus`: `"success" | "pending" | "failure"`
 *  - `providerStatusCode`: `"ACSC"` (settled) | `"PDNG"` (pending) | `"RJCT"` (rejected)
 */
export function interpretV2Outcome(
  envelope?: Partial<AzamPayV2Envelope<any>> | null
): "SUCCESS" | "PENDING" | "FAILURE" {
  if (!envelope) return "PENDING";

  const txStatus = String(
    envelope.transactionStatus ??
      (envelope as any).transactionstatus ??
      envelope.data?.transactionStatus ??
      (envelope as any).status ??
      ""
  )
    .trim()
    .toLowerCase();

  const providerCode = String(
    envelope.data?.providerStatusCode ?? (envelope as any).providerStatusCode ?? ""
  )
    .trim()
    .toUpperCase();

  if (providerCode === "RJCT" || txStatus === "failure" || txStatus === "failed" || txStatus === "rejected") {
    return "FAILURE";
  }

  if (providerCode === "PDNG" || txStatus === "pending" || txStatus === "processing") {
    return "PENDING";
  }

  if (
    providerCode === "ACSC" ||
    txStatus === "success" ||
    txStatus === "successful" ||
    txStatus === "completed"
  ) {
    return "SUCCESS";
  }

  if (envelope.success === false && envelope.statusCode && envelope.statusCode >= 400) {
    return "FAILURE";
  }

  return "PENDING";
}

export const AzamPayService = {
  /**
   * Clear cached bearer token (used on HTTP 401 or in tests).
   */
  clearTokenCache: (): void => {
    cachedToken = null;
  },

  /**
   * §1 Authentication — Obtain a Bearer JWT from the AzamPay Authenticator.
   * Caches token in memory and re-mints when remaining TTL < 5 minutes.
   * Does NOT auto-retry on HTTP 423 (Locked / invalid credentials).
   */
  authenticate: async (forceRefresh = false): Promise<string> => {
    if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt - TOKEN_REFRESH_BUFFER_MS) {
      return cachedToken.token;
    }

    const { appName, clientId, clientSecret } = getCredentials();

    if (!appName || !clientId || !clientSecret) {
      throw new Error(
        "AzamPay credentials incomplete — set AZAMPAY_APP_NAME, AZAMPAY_CLIENT_ID, and AZAMPAY_CLIENT_SECRET"
      );
    }

    const response = await fetch(`${AUTH_BASE_URL}/AppRegistration/GenerateToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appName, clientId, clientSecret }),
    });

    const body = (await response.json().catch(() => null)) as any;

    if (response.status === 423) {
      cachedToken = null;
      const errMsg = body?.message || "Invalid AppName, ClientId, or ClientSecret (HTTP 423 Locked)";
      logger.error("AzamPay authentication rejected with 423 Locked — do not auto-retry", {
        status: response.status,
        statusCode: body?.statusCode,
        message: errMsg,
      });
      throw new Error(`AzamPay authentication locked (423): ${errMsg}`);
    }

    if (!response.ok || !body?.success || !body?.data?.accessToken?.token) {
      cachedToken = null;
      logger.error("AzamPay token request failed", {
        status: response.status,
        body,
      });
      throw new Error(
        `AzamPay authentication failed: ${body?.message || response.statusText}`
      );
    }

    const token: string = body.data.accessToken.token;
    const expireStr: string | undefined = body.data.accessToken.expire;
    const parsedExpire = expireStr ? new Date(expireStr).getTime() : NaN;
    const expiresAt = Number.isFinite(parsedExpire) ? parsedExpire : Date.now() + 55 * 60_000;

    cachedToken = { token, expiresAt };
    logger.info("AzamPay bearer token obtained", {
      expiresAt: new Date(expiresAt).toISOString(),
    });
    return token;
  },

  /**
   * Internal v2 HTTP client that attaches `Authorization: Bearer <token>` and `X-API-KEY: <apiKey>`
   * to every Checkout and Disbursement request, and automatically re-mints the token & retries once
   * if the server returns HTTP 401 (`Unauthorized`).
   */
  requestV2: async <T = any>(
    url: string,
    init: { method: "GET" | "POST"; body?: Record<string, any> }
  ): Promise<{ httpStatus: number; ok: boolean; body: AzamPayV2Envelope<T> | null }> => {
    const { apiKey } = getCredentials();

    const executeFetch = async (token: string) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-API-KEY": apiKey,
      };

      return fetch(url, {
        method: init.method,
        headers,
        ...(init.body ? { body: JSON.stringify(init.body) } : {}),
      });
    };

    let token = await AzamPayService.authenticate(false);
    let response = await executeFetch(token);

    // §4: On 401 Unauthorized, invalidate token cache, re-mint via §1, and retry once
    if (response.status === 401) {
      logger.warn("AzamPay v2 returned 401 Unauthorized — refreshing bearer token and retrying once", {
        url,
      });
      cachedToken = null;
      token = await AzamPayService.authenticate(true);
      response = await executeFetch(token);
    }

    const parsedBody = (await response.json().catch(() => null)) as AzamPayV2Envelope<T> | null;
    return {
      httpStatus: response.status,
      ok: response.ok,
      body: parsedBody,
    };
  },

  /**
   * §2.1 Checkout Account Lookup — `GET /api/v2/rw/accounts/{accountNumber}`
   * Resolves a customer MSISDN to the holder's KYC name and MNO before initiating collection.
   */
  lookupPaymentAccount: async (
    accountNumber: string
  ): Promise<AzamPayV2Envelope<AzamPayAccountLookupData>> => {
    const formatted = formatAzamAccountNumber(accountNumber);

    if (shouldSimulateLocally()) {
      const provider = resolveCheckoutProvider(formatted);
      return {
        success: true,
        transactionStatus: "success",
        statusCode: 200,
        message: "Account details retrieved successfully (simulated)",
        data: {
          accountNumber: formatted,
          fullName: "Simulated Account Holder",
          provider,
          currency: "RWF",
        },
      };
    }

    const url = `${CHECKOUT_BASE_URL}/api/v2/rw/accounts/${encodeURIComponent(formatted)}`;
    const { httpStatus, body } = await AzamPayService.requestV2<AzamPayAccountLookupData>(url, {
      method: "GET",
    });

    if (!body) {
      throw new Error(`AzamPay checkout account lookup failed with HTTP ${httpStatus}`);
    }

    return body;
  },

  /**
   * §2.2 Initiate Payment (Mobile Money Collection) — `POST /api/v2/rw/payments`
   *
   * Triggers a USSD push to the customer's MTN or Airtel wallet.
   * Note per §2.2:
   *  - `amount` MUST be a numeric string (e.g. `"1500"`).
   *  - MTN validates and returns `200 OK` with `transactionStatus: "pending"` (`PDNG`), settling asynchronously.
   *  - Airtel executes synchronously via GTBank and returns `transactionStatus: "success"` (`ACSC`) or `"failure"`.
   *  - HTTP 409 (`Conflict`) means `referenceId` was already used — we query §2.4 to inspect the original tx.
   */
  initializeMnoPayment: async (
    request: AzamPayCheckoutRequest
  ): Promise<AzamPayCheckoutResult> => {
    const referenceId = request.referenceId
      ? sanitizeAzamReferenceId(request.referenceId, 64)
      : buildAzamReferenceId("BM", 30);

    const formattedPhone = formatAzamAccountNumber(request.phoneNumber);
    const provider = resolveCheckoutProvider(formattedPhone, request.mno);
    const currency = (request.currency || "RWF").toUpperCase();
    const fullName = (request.citizenName || "MyJudicial Client").trim().slice(0, 128);

    if (shouldSimulateLocally()) {
      logger.warn("AzamPay Checkout running in local simulation mode", {
        bookingId: request.bookingId,
        referenceId,
        provider,
        amount: request.amount,
      });
      return {
        paymentLink: null,
        transactionId: referenceId,
        pgReferenceId: `SIM-PG-${referenceId}`,
        transactionStatus: "PENDING",
        providerStatusCode: "PDNG",
      };
    }

    const payload = {
      accountNumber: formattedPhone,
      amount: String(Math.round(request.amount)),
      currency,
      fullName,
      provider,
      referenceId,
      externalReferenceId: request.bookingId,
      additionalProperties: {
        bookingId: request.bookingId,
        citizenEmail: request.citizenEmail ?? null,
      },
    };

    try {
      const url = `${CHECKOUT_BASE_URL}/api/v2/rw/payments`;
      const { httpStatus, ok, body } = await AzamPayService.requestV2<AzamPayPaymentStatusData>(url, {
        method: "POST",
        body: payload,
      });

      // §4: On 409 Conflict (duplicate referenceId), query §2.4 to inspect the existing payment
      if (httpStatus === 409) {
        logger.warn("AzamPay payment returned 409 Conflict — querying existing reference status", {
          referenceId,
          bookingId: request.bookingId,
        });
        const existing = await AzamPayService.getPaymentStatusByRef(referenceId);
        const outcome = interpretV2Outcome(existing);
        if (outcome === "FAILURE") {
          throw new Error(existing.message || "Previous payment attempt with this reference failed");
        }
        return {
          paymentLink: null,
          transactionId: referenceId,
          pgReferenceId: existing.data?.pgReferenceId,
          transactionStatus: outcome,
          providerStatusCode: existing.data?.providerStatusCode,
        };
      }

      if (!ok || !body?.success) {
        const errorDetails = body?.error?.map((e) => `${e.code}: ${e.message}`).join("; ");
        logger.error("AzamPay MNO checkout failed", {
          httpStatus,
          body,
          bookingId: request.bookingId,
          referenceId,
          provider,
        });
        throw new Error(
          `Payment initialization failed: ${errorDetails || body?.message || `HTTP ${httpStatus}`}`
        );
      }

      const pgReferenceId = body.data?.pgReferenceId;
      const outcome = interpretV2Outcome(body);

      logger.info("AzamPay MNO checkout initiated", {
        bookingId: request.bookingId,
        referenceId,
        pgReferenceId,
        provider,
        transactionStatus: body.transactionStatus,
        providerStatusCode: body.data?.providerStatusCode,
        amount: request.amount,
      });

      return {
        paymentLink: null,
        transactionId: referenceId,
        pgReferenceId,
        transactionStatus: outcome,
        providerStatusCode: body.data?.providerStatusCode,
      };
    } catch (error) {
      logger.error("Error initializing AzamPay MNO checkout", {
        error,
        bookingId: request.bookingId,
      });
      throw error;
    }
  },

  /**
   * §2.3 Payment Status by pgReferenceId — `GET /api/v2/rw/payments/{pgReferenceId}`
   */
  getPaymentStatusByPgRef: async (
    pgReferenceId: string,
    provider?: RwandaCheckoutProvider
  ): Promise<AzamPayV2Envelope<AzamPayPaymentStatusData>> => {
    if (shouldSimulateLocally()) {
      return {
        success: true,
        transactionStatus: "pending",
        statusCode: 200,
        message: "Simulated payment status",
        data: {
          pgReferenceId,
          providerStatusCode: "PDNG",
        },
      };
    }

    const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
    const url = `${CHECKOUT_BASE_URL}/api/v2/rw/payments/${encodeURIComponent(pgReferenceId)}${query}`;
    const { httpStatus, body } = await AzamPayService.requestV2<AzamPayPaymentStatusData>(url, {
      method: "GET",
    });

    if (!body) {
      throw new Error(`AzamPay payment status lookup failed with HTTP ${httpStatus}`);
    }

    return body;
  },

  /**
   * §2.4 Payment Status by Merchant referenceId — `GET /api/v2/rw/payments/references/{referenceId}`
   */
  getPaymentStatusByRef: async (
    referenceId: string
  ): Promise<AzamPayV2Envelope<AzamPayPaymentStatusData>> => {
    if (shouldSimulateLocally()) {
      return {
        success: true,
        transactionStatus: "pending",
        statusCode: 200,
        message: "Simulated payment status by reference",
        data: {
          referenceId,
          providerStatusCode: "PDNG",
        },
      };
    }

    const url = `${CHECKOUT_BASE_URL}/api/v2/rw/payments/references/${encodeURIComponent(referenceId)}`;
    const { httpStatus, body } = await AzamPayService.requestV2<AzamPayPaymentStatusData>(url, {
      method: "GET",
    });

    if (!body) {
      throw new Error(`AzamPay payment reference lookup failed with HTTP ${httpStatus}`);
    }

    return body;
  },

  /**
   * §3.1 Disbursement Account Lookup — `GET /api/v2/rw/accounts/{accountNumber}`
   * Resolves a recipient MSISDN or bank account before initiating a payout/transfer.
   */
  lookupDisbursementAccount: async (
    accountNumber: string
  ): Promise<AzamPayV2Envelope<AzamPayAccountLookupData>> => {
    const formatted = formatAzamAccountNumber(accountNumber);

    if (shouldSimulateLocally()) {
      return {
        success: true,
        transactionStatus: "success",
        statusCode: 200,
        message: "Disbursement account retrieved (simulated)",
        data: {
          accountNumber: formatted,
          fullName: "Simulated Recipient",
          provider: resolveDisbursementInstitution(formatted),
          currency: "RWF",
        },
      };
    }

    const url = `${DISBURSEMENT_BASE_URL}/api/v2/rw/accounts/${encodeURIComponent(formatted)}`;
    const { httpStatus, body } = await AzamPayService.requestV2<AzamPayAccountLookupData>(url, {
      method: "GET",
    });

    if (!body) {
      throw new Error(`AzamPay disbursement account lookup failed with HTTP ${httpStatus}`);
    }

    return body;
  },

  /**
   * §3.2 Balance Inquiry — `GET /api/v2/rw/balance`
   * Returns the merchant's current disbursement float balance and available RWF/USD accounts.
   */
  getDisbursementBalance: async (): Promise<AzamPayV2Envelope<AzamPayBalanceData>> => {
    if (shouldSimulateLocally()) {
      return {
        success: true,
        transactionStatus: "success",
        statusCode: 200,
        message: "Balance retrieved successfully (simulated)",
        data: {
          balance: 10_000_000,
          currency: "RWF",
          availableAccounts: [
            {
              accountNumber: "212128000516",
              currency: "RWF",
              accountName: "MYJUDICIAL RWANDA ESCROW (SIMULATED)",
            },
          ],
        },
      };
    }

    const url = `${DISBURSEMENT_BASE_URL}/api/v2/rw/balance`;
    const { httpStatus, body } = await AzamPayService.requestV2<AzamPayBalanceData>(url, {
      method: "GET",
    });

    if (!body) {
      throw new Error(`AzamPay balance inquiry failed with HTTP ${httpStatus}`);
    }

    return body;
  },

  /**
   * §3.3 Initiate Transfer (Expert Payout) — `POST /api/v2/rw/transfers`
   *
   * Queues a two-step GTBank disbursement to the expert's Mobile Money wallet or bank account.
   * Constraints per §3.3:
   *  - `referenceId`: max 30 chars, regex `^[a-zA-Z0-9\-_.]+$`
   *  - `transferDetails.amount`: numeric (min 500 RWF, max 10,000,000 RWF)
   *  - `transferDetails.dateInEpoch`: Unix epoch in seconds
   *  - `destination.fullName`: max 100 chars
   */
  sendExpertPayout: async (
    request: AzamPayDisbursementRequest
  ): Promise<AzamPayDisbursementResult> => {
    const externalId = request.referenceId
      ? sanitizeAzamReferenceId(request.referenceId, 30)
      : buildAzamReferenceId("PO", 30);

    const formattedPhone = formatAzamAccountNumber(request.momoNumber);
    const institution = resolveDisbursementInstitution(formattedPhone, request.mno);
    const currency = (request.currency || "RWF").toUpperCase();
    const roundedAmount = Math.round(request.amount);

    if (shouldSimulateLocally()) {
      logger.warn("AzamPay Disbursement running in local simulation mode — simulating payout", {
        bookingId: request.bookingId,
        amount: roundedAmount,
        momoNumber: formattedPhone,
        institution,
        externalId,
      });

      return {
        reference: externalId,
        pgReferenceId: `SIM-TR-${externalId}`,
        fspReferenceId: `SIM-FSP-${externalId}`,
        status: "SUCCESSFUL",
        transactionStatus: "success",
      };
    }

    const payload = {
      referenceId: externalId,
      externalReferenceId: request.bookingId,
      destination: {
        countryCode: "RW",
        fullName: (request.expertName || "Legal Expert").trim().slice(0, 100),
        institution,
        accountNumber: formattedPhone,
        currency,
      },
      transferDetails: {
        type: "Payout",
        amount: roundedAmount,
        dateInEpoch: Math.floor(Date.now() / 1000),
      },
      additionalProperties: {
        bookingId: request.bookingId,
      },
      remarks: (request.remarks || `Consultation payout for booking ${request.bookingId}`).slice(
        0,
        255
      ),
    };

    try {
      const url = `${DISBURSEMENT_BASE_URL}/api/v2/rw/transfers`;
      const { httpStatus, ok, body } = await AzamPayService.requestV2<AzamPayTransferStatusData>(
        url,
        {
          method: "POST",
          body: payload,
        }
      );

      // §4: On 409 Conflict, query existing transfer status by referenceId
      if (httpStatus === 409) {
        logger.warn("AzamPay transfer returned 409 Conflict — querying existing transfer status", {
          externalId,
          bookingId: request.bookingId,
        });
        const existing = await AzamPayService.getTransferStatusByRef(externalId);
        const outcome = interpretV2Outcome(existing);
        if (outcome === "FAILURE") {
          throw new Error(existing.message || "Previous transfer with this referenceId failed");
        }
        return {
          reference: externalId,
          pgReferenceId: existing.data?.pgReferenceId,
          fspReferenceId: existing.data?.fspReferenceId,
          status: outcome === "SUCCESS" ? "SUCCESSFUL" : "PENDING",
          transactionStatus: outcome === "SUCCESS" ? "success" : "pending",
        };
      }

      if (!ok || !body?.success) {
        const errorDetails = body?.error?.map((e) => `${e.code}: ${e.message}`).join("; ");
        logger.error("AzamPay expert payout failed", {
          httpStatus,
          body,
          bookingId: request.bookingId,
          externalId,
          institution,
        });
        throw new Error(
          `Expert payout failed: ${errorDetails || body?.message || `HTTP ${httpStatus}`}`
        );
      }

      const txStatusRaw = (body.transactionStatus || "pending").toLowerCase() as
        | "success"
        | "pending"
        | "failure";
      const pgReferenceId = body.data?.pgReferenceId;

      logger.info("AzamPay expert payout initiated", {
        bookingId: request.bookingId,
        externalId,
        pgReferenceId,
        institution,
        transactionStatus: txStatusRaw,
        amount: roundedAmount,
      });

      return {
        reference: externalId,
        pgReferenceId,
        fspReferenceId: body.data?.fspReferenceId ?? null,
        status: txStatusRaw === "success" ? "SUCCESSFUL" : "PENDING",
        transactionStatus: txStatusRaw,
      };
    } catch (error) {
      logger.error("Error sending AzamPay expert payout", {
        error,
        bookingId: request.bookingId,
      });
      throw error;
    }
  },

  /**
   * §3.3 Initiate Refund — Disburses funds back to the citizen's wallet via `POST /api/v2/rw/transfers`.
   */
  initiateRefund: async (
    providerTransactionId: string,
    amount: number,
    options?: {
      citizenPhone?: string;
      citizenName?: string;
      mno?: string;
      currency?: string;
      reason?: string;
      bookingId?: string;
    }
  ): Promise<{ reference: string; pgReferenceId?: string; status: string }> => {
    const externalId = buildAzamReferenceId("RF", 30);
    const roundedAmount = Math.round(amount);

    if (shouldSimulateLocally() || !options?.citizenPhone) {
      logger.warn("AzamPay Refund running in local simulation mode", {
        providerTransactionId,
        amount: roundedAmount,
        externalId,
        hasCitizenPhone: Boolean(options?.citizenPhone),
      });

      return {
        reference: externalId,
        pgReferenceId: `SIM-RF-${externalId}`,
        status: "SUCCESSFUL",
      };
    }

    const formattedPhone = formatAzamAccountNumber(options.citizenPhone);
    const institution = resolveDisbursementInstitution(formattedPhone, options.mno);
    const currency = (options.currency || "RWF").toUpperCase();

    const payload = {
      referenceId: externalId,
      externalReferenceId: providerTransactionId.slice(0, 64),
      destination: {
        countryCode: "RW",
        fullName: (options.citizenName || "MyJudicial Client").trim().slice(0, 100),
        institution,
        accountNumber: formattedPhone,
        currency,
      },
      transferDetails: {
        type: "Refund",
        amount: roundedAmount,
        dateInEpoch: Math.floor(Date.now() / 1000),
      },
      additionalProperties: {
        originalTransactionId: providerTransactionId,
        bookingId: options.bookingId ?? null,
        reason: options.reason || "Booking cancelled",
      },
      remarks: (options.reason || `Refund for transaction ${providerTransactionId}`).slice(0, 255),
    };

    try {
      const url = `${DISBURSEMENT_BASE_URL}/api/v2/rw/transfers`;
      const { httpStatus, ok, body } = await AzamPayService.requestV2<AzamPayTransferStatusData>(
        url,
        {
          method: "POST",
          body: payload,
        }
      );

      if (!ok || !body?.success) {
        const errorDetails = body?.error?.map((e) => `${e.code}: ${e.message}`).join("; ");
        logger.error("AzamPay refund failed", {
          httpStatus,
          body,
          providerTransactionId,
          externalId,
        });
        throw new Error(
          `Refund failed: ${errorDetails || body?.message || `HTTP ${httpStatus}`}`
        );
      }

      const pgReferenceId = body.data?.pgReferenceId;
      const txStatus = (body.transactionStatus || "pending").toUpperCase();

      logger.info("AzamPay refund initiated", {
        providerTransactionId,
        externalId,
        pgReferenceId,
        amount: roundedAmount,
        transactionStatus: txStatus,
      });

      return {
        reference: externalId,
        pgReferenceId,
        status: txStatus === "SUCCESS" ? "SUCCESSFUL" : txStatus,
      };
    } catch (error) {
      logger.error("Error initiating AzamPay refund", {
        error,
        providerTransactionId,
      });
      throw error;
    }
  },

  /**
   * §3.4 Transfer Status by pgReferenceId — `GET /api/v2/rw/transfers/{pgReferenceId}`
   */
  getTransferStatusByPgRef: async (
    pgReferenceId: string
  ): Promise<AzamPayV2Envelope<AzamPayTransferStatusData>> => {
    if (shouldSimulateLocally()) {
      return {
        success: true,
        transactionStatus: "success",
        statusCode: 200,
        message: "Simulated transfer status",
        data: {
          pgReferenceId,
          fspReferenceId: `SIM-FSP-${pgReferenceId}`,
        },
      };
    }

    const url = `${DISBURSEMENT_BASE_URL}/api/v2/rw/transfers/${encodeURIComponent(pgReferenceId)}`;
    const { httpStatus, body } = await AzamPayService.requestV2<AzamPayTransferStatusData>(url, {
      method: "GET",
    });

    if (!body) {
      throw new Error(`AzamPay transfer status lookup failed with HTTP ${httpStatus}`);
    }

    return body;
  },

  /**
   * §3.5 Transfer Status by Merchant referenceId — `GET /api/v2/rw/transfers/references/{referenceId}`
   */
  getTransferStatusByRef: async (
    referenceId: string
  ): Promise<AzamPayV2Envelope<AzamPayTransferStatusData>> => {
    if (shouldSimulateLocally()) {
      return {
        success: true,
        transactionStatus: "success",
        statusCode: 200,
        message: "Simulated transfer status by reference",
        data: {
          referenceId,
          fspReferenceId: `SIM-FSP-${referenceId}`,
        },
      };
    }

    const url = `${DISBURSEMENT_BASE_URL}/api/v2/rw/transfers/references/${encodeURIComponent(referenceId)}`;
    const { httpStatus, body } = await AzamPayService.requestV2<AzamPayTransferStatusData>(url, {
      method: "GET",
    });

    if (!body) {
      throw new Error(`AzamPay transfer reference lookup failed with HTTP ${httpStatus}`);
    }

    return body;
  },

  /**
   * Unified status check helper by referenceId.
   * Automatically routes `PO-*` and `RF-*` references to the Disbursement v2 API (§3.5)
   * and `BM-*` (or other collection references) to the Checkout v2 API (§2.4).
   */
  checkTransactionStatus: async (
    referenceId: string,
    _bankName?: string
  ): Promise<{
    status: string;
    outcome: "SUCCESS" | "PENDING" | "FAILURE";
    pgReferenceId?: string;
    fspReferenceId?: string | null;
    providerStatusCode?: string;
    message?: string;
    raw?: AzamPayV2Envelope<any>;
  }> => {
    const isTransfer =
      referenceId.startsWith("PO-") ||
      referenceId.startsWith("RF-") ||
      _bankName === "TRANSFER" ||
      _bankName === "DISBURSEMENT";

    if (shouldSimulateLocally()) {
      return {
        status: "SUCCESSFUL",
        outcome: "SUCCESS",
        pgReferenceId: `SIM-${referenceId}`,
        providerStatusCode: "ACSC",
        message: "Simulated transaction status",
      };
    }

    try {
      const envelope = isTransfer
        ? await AzamPayService.getTransferStatusByRef(referenceId)
        : await AzamPayService.getPaymentStatusByRef(referenceId);

      const outcome = interpretV2Outcome(envelope);

      return {
        status: (envelope.transactionStatus || outcome).toUpperCase(),
        outcome,
        pgReferenceId: envelope.data?.pgReferenceId,
        fspReferenceId: envelope.data?.fspReferenceId ?? null,
        providerStatusCode: envelope.data?.providerStatusCode,
        message: envelope.message,
        raw: envelope,
      };
    } catch (error) {
      logger.error("Error checking AzamPay transaction status", {
        error,
        referenceId,
        isTransfer,
      });
      throw error;
    }
  },
};
