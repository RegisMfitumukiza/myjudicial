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
