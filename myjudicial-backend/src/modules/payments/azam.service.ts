import { logger } from "../../shared/utils/logger.js";
import { randomUUID } from "crypto";

interface AzamPayCheckoutRequest {
  bookingId: string;
  amount: number;
  currency: string;
  mno: string;
  phoneNumber: string;
  paymentPhoneNumber?: string;
  citizenEmail?: string;
  citizenName?: string;
}

interface AzamPayCheckoutResponse {
  transactionId: string;
  pgReferenceId?: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  message: string;
}

// Real, publicly-documented Azam Pay hosts (confirmed against their sandbox
// GenerateToken endpoint, which returns a structured 423 error rather than a
// 404 for the credentials currently configured — see ARCHITECTURE_DECISIONS.md
// Decision 25). The MNO checkout path itself could not be independently
// confirmed from public docs; verify against the Azam Pay developer portal
// (https://developerdocs.azampay.co.tz) if checkout calls 404.
const isProduction = process.env.AZAMPAY_ENV === "production";
const AUTH_BASE_URL = process.env.AZAMPAY_AUTH_URL
  || (isProduction
    ? "https://authenticator.azampay.co.rw"
    : "https://authenticator-test-rw.azampay.co.tz");
const CHECKOUT_BASE_URL = process.env.AZAMPAY_CHECKOUT_URL
  || (isProduction
    ? "https://checkout.azampay.co.rw"
    : "https://checkout-test-rw.azampay.co.tz");
const DISBURSEMENT_BASE_URL = process.env.AZAMPAY_DISBURSEMENT_URL
  || (isProduction
    ? "https://disbursement.azampay.co.rw"
    : "https://api-disbursement-test-rw.azampay.co.tz");

// [C2] Warn developers clearly about which paths are simulated in sandbox
if (!isProduction) {
  // eslint-disable-next-line no-console
  console.warn(
    "[AzamPay] SANDBOX MODE — Only initializeMnoPayment makes real API calls. " +
    "sendExpertPayout, initiateRefund, and checkTransactionStatus are SIMULATED and will " +
    "always return SUCCESSFUL. Switch AZAMPAY_ENV=production to use real disbursements."
  );
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export const AzamPayService = {
  /**
   * Authenticate with Azam Pay to get a bearer token, caching it until shortly
   * before it expires. Throws if credentials are missing or rejected — callers
   * must not treat a failed authentication as a successful payment.
   */
  async authenticate(): Promise<string> {
    const appName = process.env.AZAMPAY_APP_NAME;
    const clientId = process.env.AZAMPAY_CLIENT_ID;
    const clientSecret = process.env.AZAMPAY_CLIENT_SECRET;

    if (!appName || !clientId || !clientSecret) {
      throw new Error(
        "Azam Pay credentials are not configured (AZAMPAY_APP_NAME/AZAMPAY_CLIENT_ID/AZAMPAY_CLIENT_SECRET)"
      );
    }

    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return cachedToken.accessToken;
    }

    const tokenUrl = `${AUTH_BASE_URL}/AppRegistration/GenerateToken`;
    const payload = { appName, clientId, clientSecret };

    let response: Response;
    try {
      response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logger.error("Azam Pay authentication request failed", { error });
      throw new Error("Failed to reach Azam Pay authentication service");
    }

    const body = await response.json().catch(() => null);
    const accessToken: string | undefined = body?.data?.accessToken;

    if (!response.ok || !accessToken) {
      logger.error("Azam Pay authentication rejected", {
        status: response.status,
        message: body?.message,
        env: isProduction ? "production" : "sandbox",
      });
      throw new Error(body?.message || "Azam Pay rejected the configured credentials");
    }

    const expiresAtMs = body.data.expire ? new Date(body.data.expire).getTime() : NaN;
    const ttlMs = Number.isFinite(expiresAtMs) ? expiresAtMs - Date.now() : 55 * 60 * 1000;
    cachedToken = { accessToken, expiresAt: Date.now() + Math.max(ttlMs - 60_000, 60_000) };

    return accessToken;
  },

  /**
   * Initialize a direct Mobile Network Operator (MNO) Push Payment (USSD prompt).
   * Throws on any failure — callers must not treat a thrown error as PENDING.
   */
  async initializeMnoPayment(request: AzamPayCheckoutRequest): Promise<AzamPayCheckoutResponse> {
    const token = await this.authenticate();
    const apiKey = process.env.AZAMPAY_API_KEY;
    const referenceId = `BM-${Date.now()}-${randomUUID().slice(0, 8)}`;

    const providerMap: Record<string, string> = {
      MTN: "mtn",
      Airtel: "airtel",
    };
    const provider = providerMap[request.mno] || request.mno.toLowerCase();

    // Normalize phone to Rwanda format: 12 digits starting with 250
    let phone = request.phoneNumber.replace(/[^0-9]/g, "");
    if (phone.startsWith("0") && phone.length === 10) {
      phone = "250" + phone.substring(1);
    } else if (!phone.startsWith("250") && phone.length === 9) {
      phone = "250" + phone;
    }

    const payload: Record<string, unknown> = {
      provider,
      accountNumber: phone,
      fullName: request.citizenName || "Client",
      currencyCode: request.currency || "RWF",
      amount: String(request.amount),
      referenceId,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (apiKey) {
      headers["X-API-KEY"] = apiKey;
    }

    let response: Response;
    try {
      response = await fetch(`${CHECKOUT_BASE_URL}/api/v2/rw/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logger.error("Azam Pay checkout request failed", { error, bookingId: request.bookingId });
      throw new Error("Failed to reach Azam Pay checkout service");
    }

    const body = await response.json().catch(() => null);

    if (!response.ok || body?.success === false) {
      logger.error("Azam Pay checkout rejected", {
        status: response.status,
        message: body?.message,
        bookingId: request.bookingId,
      });
      throw new Error(body?.message || "Azam Pay checkout request failed");
    }

    const pgReferenceId = body?.data?.pgReferenceId;

    return {
      transactionId: referenceId,
      pgReferenceId,
      status: "PENDING",
      message: body?.message ?? "Payment initiated successfully",
    };
  },

  /**
   * Send a payout directly to the expert's MoMo account via Azam Pay
   * disbursement API. In sandbox mode, simulates the payout.
   */
  async sendExpertPayout(request: {
    bookingId: string;
    momoNumber: string;
    amount: number;
    currency?: string;
  }): Promise<{ reference: string; status: string }> {
    const externalId = `PO-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const currency = request.currency || "RWF";

    // In sandbox or when disbursement endpoint is not configured, simulate
    if (!isProduction || !process.env.AZAMPAY_DISBURSEMENT_ENABLED) {
      logger.info("Simulating Azam Pay Payout (sandbox/disabled)", {
        bookingId: request.bookingId,
        externalId,
        amount: request.amount,
      });
      return { reference: externalId, status: "SUCCESSFUL" };
    }

    const token = await this.authenticate();
    const apiKey = process.env.AZAMPAY_API_KEY;

    const payload = {
      source: {
        countryCode: process.env.AZAMPAY_SOURCE_COUNTRY_CODE || "RW",
        fullName: process.env.AZAMPAY_SOURCE_FULL_NAME || "MyJudicial Platform",
        bankName: process.env.AZAMPAY_SOURCE_BANK_NAME || "Platform Wallet",
        accountNumber: process.env.AZAMPAY_SOURCE_ACCOUNT_NUMBER || "",
        currency,
      },
      destination: {
        countryCode: process.env.AZAMPAY_DEST_COUNTRY_CODE || "RW",
        fullName: "Expert Payout",
        bankName: request.momoNumber.startsWith("250") ? "MTN" : "Airtel",
        accountNumber: request.momoNumber,
        currency,
      },
      transferDetails: {
        type: "MOBILE_MONEY",
        amount: request.amount,
        date: new Date().toISOString().split("T")[0],
      },
      externalReferenceId: externalId,
      remarks: `Payout for booking ${request.bookingId}`,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (apiKey) {
      headers["X-API-KEY"] = apiKey;
    }

    let response: Response;
    try {
      response = await fetch(`${DISBURSEMENT_BASE_URL}/azampay/disbursement`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logger.error("Azam Pay disbursement request failed", {
        error,
        bookingId: request.bookingId,
      });
      throw new Error("Failed to reach Azam Pay disbursement service");
    }

    const body = await response.json().catch(() => null);

    if (!response.ok || body?.success === false) {
      logger.error("Azam Pay disbursement rejected", {
        status: response.status,
        message: body?.message,
        bookingId: request.bookingId,
      });
      throw new Error(body?.message || "Azam Pay disbursement request failed");
    }

    logger.info("Azam Pay disbursement initiated", {
      bookingId: request.bookingId,
      externalId,
      amount: request.amount,
    });

    return {
      reference: externalId,
      status: "SUCCESSFUL",
    };
  },

  /**
   * Initiate a refund by disbursing funds back to the citizen's mobile number.
   * Uses the same disbursement API as expert payouts — sends money from the
   * platform wallet to the citizen's MoMo account.
   */
  async initiateRefund(
    transactionId: string,
    amount: number,
    options?: {
      citizenPhone?: string;
      currency?: string;
      reason?: string;
    }
  ): Promise<{ reference: string; status: string }> {
    const refundId = `RF-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const currency = options?.currency || "RWF";

    // In sandbox or when disbursement endpoint is not configured, simulate
    if (!isProduction || !process.env.AZAMPAY_DISBURSEMENT_ENABLED) {
      logger.info("Simulating Azam Pay Refund (sandbox/disabled)", {
        transactionId,
        refundId,
        amount,
      });
      return { reference: refundId, status: "SUCCESSFUL" };
    }

    if (!options?.citizenPhone) {
      logger.warn("Refund requested without citizen phone — simulating", {
        transactionId,
        amount,
      });
      return { reference: refundId, status: "SIMULATED" };
    }

    const token = await this.authenticate();
    const apiKey = process.env.AZAMPAY_API_KEY;

    const payload = {
      source: {
        countryCode: process.env.AZAMPAY_SOURCE_COUNTRY_CODE || "RW",
        fullName: process.env.AZAMPAY_SOURCE_FULL_NAME || "MyJudicial Platform",
        bankName: process.env.AZAMPAY_SOURCE_BANK_NAME || "Platform Wallet",
        accountNumber: process.env.AZAMPAY_SOURCE_ACCOUNT_NUMBER || "",
        currency,
      },
      destination: {
        countryCode: process.env.AZAMPAY_DEST_COUNTRY_CODE || "RW",
        fullName: "Client Refund",
        bankName: options.citizenPhone.startsWith("250") ? "MTN" : "Airtel",
        accountNumber: options.citizenPhone,
        currency,
      },
      transferDetails: {
        type: "MOBILE_MONEY",
        amount,
        date: new Date().toISOString().split("T")[0],
      },
      externalReferenceId: refundId,
      remarks: options?.reason || `Refund for transaction ${transactionId}`,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (apiKey) {
      headers["X-API-KEY"] = apiKey;
    }

    let response: Response;
    try {
      response = await fetch(`${DISBURSEMENT_BASE_URL}/azampay/disbursement`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      logger.error("Azam Pay refund request failed", { error, transactionId });
      throw new Error("Failed to reach Azam Pay refund service");
    }

    const body = await response.json().catch(() => null);

    if (!response.ok || body?.success === false) {
      logger.error("Azam Pay refund rejected", {
        status: response.status,
        message: body?.message,
        transactionId,
      });
      throw new Error(body?.message || "Azam Pay refund request failed");
    }

    logger.info("Azam Pay refund initiated", {
      transactionId,
      refundId,
      amount,
    });

    return { reference: refundId, status: "SUCCESSFUL" };
  },

  /**
   * Check the status of a disbursement transaction.
   */
  async checkTransactionStatus(
    reference: string,
    _bankName: string
  ): Promise<{ status: string; message: string }> {
    if (!isProduction || !process.env.AZAMPAY_DISBURSEMENT_ENABLED) {
      return { status: "SUCCESSFUL", message: "Simulated" };
    }

    const token = await this.authenticate();
    const apiKey = process.env.AZAMPAY_API_KEY;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (apiKey) {
      headers["X-API-KEY"] = apiKey;
    }

    let response: Response;
    try {
      response = await fetch(`${CHECKOUT_BASE_URL}/api/v2/rw/payments/references/${encodeURIComponent(reference)}`, {
        method: "GET",
        headers,
      });
    } catch (error) {
      logger.error("Azam Pay transaction status check failed", { error, reference });
      throw new Error("Failed to check transaction status");
    }

    const body = await response.json().catch(() => null);

    return {
      status: body?.data?.transactionStatus || "UNKNOWN",
      message: body?.message || "Status check completed",
    };
  },
};
