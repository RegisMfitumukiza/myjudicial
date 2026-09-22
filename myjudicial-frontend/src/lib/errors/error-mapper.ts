/**
 * Maps backend error codes to next-intl i18n keys.
 *
 * When the backend returns `{ code: "BOOKING_UNAVAILABLE", message: "..." }`,
 * the frontend can look up the appropriate i18n key and use its OWN locale
 * string rather than relying on the pre-translated backend message.
 *
 * All keys point to the `errors.api.*` namespace added to en/fr/rw.json.
 */
const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  // Authentication
  INVALID_CREDENTIALS: "errors.api.invalidCredentials",
  UNAUTHORIZED: "errors.api.unauthorized",
  TOKEN_EXPIRED: "errors.api.sessionExpired",
  OTP_INVALID: "errors.api.otpInvalid",
  OTP_EXPIRED: "errors.api.otpExpired",
  OTP_ATTEMPTS_EXCEEDED: "errors.api.otpAttemptsExceeded",
  PHONE_IN_USE: "errors.api.phoneInUse",

  // Booking
  BOOKING_UNAVAILABLE: "errors.api.bookingUnavailable",
  BOOKING_NOT_FOUND: "errors.api.bookingNotFound",
  BOOKING_ALREADY_CANCELLED: "errors.api.bookingAlreadyCancelled",
  CANNOT_CANCEL_BOOKING: "errors.api.cannotCancelBooking",

  // Payment
  INSUFFICIENT_FUNDS: "errors.api.insufficientFunds",
  PAYMENT_FAILED: "errors.api.paymentFailed",
  PAYMENT_ALREADY_PROCESSED: "errors.api.paymentAlreadyProcessed",

  // Expert / Profile
  EXPERT_NOT_FOUND: "errors.api.expertNotFound",
  EXPERT_NOT_VERIFIED: "errors.api.expertNotVerified",
  EXPERT_SUSPENDED: "errors.api.expertSuspended",
  PROFILE_INCOMPLETE: "errors.api.profileIncomplete",

  // Validation
  VALIDATION_ERROR: "errors.api.validationError",
  REQUIRED_FIELD_MISSING: "errors.api.validationError",
  INVALID_EMAIL: "errors.api.validationError",
  INVALID_PHONE: "errors.api.validationError",

  // System
  SERVER_ERROR: "errors.api.serverError",
  DATABASE_ERROR: "errors.api.serverError",
  NETWORK_ERROR: "errors.api.networkError",
  SERVICE_UNAVAILABLE: "errors.api.serviceUnavailable",
  RATE_LIMIT_EXCEEDED: "errors.api.rateLimitExceeded",

  // Documents
  FILE_TOO_LARGE: "errors.api.fileTooLarge",
  INVALID_FILE_TYPE: "errors.api.invalidFileType",
  DOCUMENT_NOT_FOUND: "errors.api.documentNotFound",
};

/**
 * Returns the next-intl i18n key for a backend error code, or `null` if unknown.
 *
 * @example
 * const key = getErrorI18nKey("BOOKING_UNAVAILABLE");
 * // Returns: "errors.api.bookingUnavailable"
 */
export function getErrorI18nKey(code: string | undefined | null): string | null {
  if (!code) return null;
  return ERROR_CODE_TO_I18N_KEY[code] ?? null;
}
