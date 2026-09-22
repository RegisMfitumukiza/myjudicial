/**
 * Centralized error handling utilities for MyJudicial frontend.
 *
 * Architecture:
 *   Backend  →  { code: "BOOKING_UNAVAILABLE", message: "<translated>" }
 *   apiFetch →  Error with .code and .message attached
 *   Frontend →  getErrorI18nKey(err.code) → i18n key → useTranslations() → localized string
 *
 * Usage:
 * ```tsx
 * import { getApiErrorMessage } from "@/lib/errors";
 *
 * onError: (err) => toast.error(getApiErrorMessage(err, t, "actionFailed")),
 * ```
 */
export { ERROR_CODES } from "./error-codes";
export type { ErrorCode } from "./error-codes";
export { getErrorI18nKey } from "./error-mapper";

/**
 * Resolves a user-facing error message from an API error.
 *
 * Priority order:
 * 1. If the error has a known backend `code`, look up the frontend i18n key and
 *    call `t()` with just the leaf key (since `t` is already scoped to `errors.api`).
 * 2. Otherwise fall back to `t(fallbackKey)` using the caller's own namespace.
 *
 * @param err       - The error from apiFetch (has `.code` and `.message`)
 * @param t         - The `t` function scoped to the `errors.api` namespace
 * @param fallbackKey - Key within the `errors.api` namespace to use if code is unknown
 *
 * @example
 * // In a component:
 * const t = useTranslations("errors.api");
 * onError: (err) => toast.error(getApiErrorMessage(err, t, "unknown")),
 */
export function getApiErrorMessage(
  err: unknown,
  t: (key: string) => string,
  fallbackKey = "unknown"
): string {
  const code = (err as any)?.code as string | undefined;

  if (code) {
    // Strip the "errors.api." prefix since t is already scoped to that namespace
    const fullKey = `errors.api.${fallbackKey}`; // used only for shape reference
    void fullKey;

    // Map code to the leaf key within the errors.api namespace
    const leafKey = API_ERROR_CODE_TO_LEAF[code];
    if (leafKey) {
      try {
        return t(leafKey);
      } catch {
        // t() can throw if key is missing — fall through to fallback
      }
    }
  }

  return t(fallbackKey);
}

/**
 * Maps backend error codes to leaf keys within the `errors.api` namespace.
 * (These are the same mappings as in error-mapper.ts but without the "errors.api." prefix)
 */
const API_ERROR_CODE_TO_LEAF: Record<string, string> = {
  INVALID_CREDENTIALS: "invalidCredentials",
  UNAUTHORIZED: "unauthorized",
  TOKEN_EXPIRED: "sessionExpired",
  OTP_INVALID: "otpInvalid",
  OTP_EXPIRED: "otpExpired",
  OTP_ATTEMPTS_EXCEEDED: "otpAttemptsExceeded",
  PHONE_IN_USE: "phoneInUse",
  BOOKING_UNAVAILABLE: "bookingUnavailable",
  BOOKING_NOT_FOUND: "bookingNotFound",
  BOOKING_ALREADY_CANCELLED: "bookingAlreadyCancelled",
  CANNOT_CANCEL_BOOKING: "cannotCancelBooking",
  INSUFFICIENT_FUNDS: "insufficientFunds",
  PAYMENT_FAILED: "paymentFailed",
  PAYMENT_ALREADY_PROCESSED: "paymentAlreadyProcessed",
  EXPERT_NOT_FOUND: "expertNotFound",
  EXPERT_NOT_VERIFIED: "expertNotVerified",
  EXPERT_SUSPENDED: "expertSuspended",
  PROFILE_INCOMPLETE: "profileIncomplete",
  VALIDATION_ERROR: "validationError",
  REQUIRED_FIELD_MISSING: "validationError",
  INVALID_EMAIL: "validationError",
  INVALID_PHONE: "validationError",
  SERVER_ERROR: "serverError",
  DATABASE_ERROR: "serverError",
  NETWORK_ERROR: "networkError",
  SERVICE_UNAVAILABLE: "serviceUnavailable",
  RATE_LIMIT_EXCEEDED: "rateLimitExceeded",
  FILE_TOO_LARGE: "fileTooLarge",
  INVALID_FILE_TYPE: "invalidFileType",
  DOCUMENT_NOT_FOUND: "documentNotFound",
};
