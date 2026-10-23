import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts an unknown error (Axios error, API error, Error, string) into a
 * safe, user-facing message. Raw technical messages are never shown to
 * end users — only the provided fallback (or a generic default).
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const generic = fallback || "Something went wrong. Please try again."
  if (!error) return generic

  // Axios-style errors carry a response payload; prefer a server-provided
  // human-readable message when present.
  const axiosError = error as { response?: { data?: { message?: unknown } } }
  const serverMessage = axiosError?.response?.data?.message
  if (typeof serverMessage === "string" && serverMessage.trim().length > 0) {
    return serverMessage
  }

  // Fetch / apiFetch Error instance
  if (error instanceof Error && error.message && error.message.trim().length > 0 && error.message !== "Request failed.") {
    return error.message
  }

  const anyError = error as any
  if (typeof anyError?.message === "string" && anyError.message.trim().length > 0 && anyError.message !== "Request failed.") {
    return anyError.message
  }

  // Never surface raw exception text (stack traces, JSON, network jargon).
  return generic
}

/**
 * Formats an amount of Rwandan Francs for concise dashboard display.
 * - < 1000 → exact full value (e.g. "RWF 845")
 * - >= 1000 → compact thousands (e.g. "RWF 1.2k", "RWF 15.0k")
 * - 0 / missing → "RWF 0" (never a confusing "RWF 0.0k")
 */
export function formatRWF(amount?: number | null): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0
  if (value < 1000) {
    return `RWF ${Math.round(value).toLocaleString()}`
  }
  return `RWF ${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
}

/**
 * Formats a copyright notice into a clean, normalized, single-copyright statement:
 * "© [year] [entity / rights statement]"
 *
 * Prevents duplicated copyright symbols or years (e.g. "© 2026 © 2026 ...")
 * whether the input comes from database settings, code defaults, or translations.
 * Automatically keeps the current year up to date while preserving intentional
 * historic start year ranges (e.g. "2024–2026").
 */
export function formatCopyright(notice?: string | null, fallback?: string): string {
  const currentYear = new Date().getFullYear();
  const text = (notice && notice.trim().length > 0 ? notice : fallback || "").trim();
  if (!text) return `© ${currentYear} MyJudicial Ltd. All rights reserved.`;

  // Extract intentional start year if specified as a range e.g. 2022-2026 or 2022–
  let yearPrefix = String(currentYear);
  const rangeMatch = text.match(/(?:^|\b)(\d{4})\s*[-–—]\s*(?:\d{4})?/);
  if (rangeMatch && parseInt(rangeMatch[1], 10) < currentYear) {
    yearPrefix = `${rangeMatch[1]}–${currentYear}`;
  }

  // Strip all leading copyright symbols ('©', '(c)', '&copy;', standalone 'c', '\u00A9'),
  // separator bullets/pipes/hyphens, and any leading 4-digit years or year ranges.
  const tokenRegex = /^(?:\s*(?:©|\(c\)|&copy;|\bc\b|\u00A9)\s*|\s*\d{4}(?:\s*[-–—]\s*\d{4})?\s*|\s*[·•\-\|]\s*)+/gi;
  const cleaned = text.replace(tokenRegex, "").trim();

  const entity = cleaned || "MyJudicial Ltd. All rights reserved.";
  return `© ${yearPrefix} ${entity}`;
}

