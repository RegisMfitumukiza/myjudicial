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
 *
 * When a locale is provided, translates "All rights reserved" into the locale's
 * standard legal phrasing ("Tous droits réservés." for fr, "Uburenganzira bwose bwubahirizwa." for rw).
 */
export function formatCopyright(
  notice?: string | null,
  fallback?: string,
  locale?: string
): string {
  const currentYear = new Date().getFullYear();
  const rawNotice = notice?.trim() || "";
  const normalizedRaw = rawNotice.toLowerCase();
  const isDefaultNotice =
    !rawNotice ||
    normalizedRaw.includes("myjudicial ltd. all rights reserved") ||
    normalizedRaw.includes("myjudicial, inc. all rights reserved") ||
    normalizedRaw.includes("myjudicial inc. all rights reserved");

  // If the admin notice is just the English default and a localized fallback is given, prefer fallback
  const text = (!rawNotice || (isDefaultNotice && fallback && locale && locale !== "en"))
    ? (fallback || "").trim()
    : rawNotice;

  const defaultEntity =
    locale === "fr"
      ? "MyJudicial Ltd. Tous droits réservés."
      : locale === "rw"
      ? "MyJudicial Ltd. Uburenganzira bwose bwubahirizwa."
      : "MyJudicial Ltd. All rights reserved.";

  if (!text) return `© ${currentYear} ${defaultEntity}`;

  // Extract intentional start year if specified as a range e.g. 2022-2026 or 2022–
  let yearPrefix = String(currentYear);
  const rangeMatch = text.match(/(?:^|\b)(\d{4})\s*[-–—]\s*(?:\d{4})?/);
  if (rangeMatch && parseInt(rangeMatch[1], 10) < currentYear) {
    yearPrefix = `${rangeMatch[1]}–${currentYear}`;
  }

  // Strip all leading copyright symbols ('©', '(c)', '&copy;', standalone 'c', '\u00A9'),
  // separator bullets/pipes/hyphens, and any leading 4-digit years or year ranges.
  const tokenRegex = /^(?:\s*(?:©|\(c\)|&copy;|\bc\b|\u00A9)\s*|\s*\d{4}(?:\s*[-–—]\s*\d{4})?\s*|\s*[·•\-\|]\s*)+/gi;
  let cleaned = text.replace(tokenRegex, "").trim();

  // If locale is French or Kinyarwanda, ensure the rights reserved statement is localized
  if (locale === "fr") {
    cleaned = cleaned.replace(/All rights reserved\.?/gi, "Tous droits réservés.");
  } else if (locale === "rw") {
    cleaned = cleaned.replace(/All rights reserved\.?/gi, "Uburenganzira bwose bwubahirizwa.");
  }

  const entity = cleaned || defaultEntity;
  return `© ${yearPrefix} ${entity}`;
}

/**
 * Standard operating hours localizer.
 * Translates standard operating hours ("Monday – Friday: 8:00 AM – 6:00 PM CAT")
 * into authentic French and Kinyarwanda strings, or adapts custom day names.
 */
export function formatWorkingHours(
  rawHours?: string | null,
  locale: string = "en",
  fallback?: string
): string {
  const DEFAULT_HOURS_MAP: Record<string, string> = {
    fr: "Lundi – Vendredi : 08h00 – 18h00 (CAT)",
    rw: "Kuwa Mbere – Kuwa Gatanu: 8:00 – 18:00 (CAT)",
    en: "Monday – Friday: 8:00 AM – 6:00 PM CAT",
  };

  const trimmed = rawHours?.trim() || "";

  // Standard platform default hours check
  const isDefaultHours =
    !trimmed ||
    /^(?:Monday\s*[-–—]\s*Friday:\s*8:00\s*AM\s*[-–—]\s*6:00\s*PM\s*\(?CAT\)?)$/i.test(trimmed);

  if (isDefaultHours) {
    if (fallback && fallback.trim().length > 0) return fallback;
    return DEFAULT_HOURS_MAP[locale] || DEFAULT_HOURS_MAP.en;
  }

  // If already custom hours, return raw for English
  if (locale === "en" || !locale) return trimmed;

  // Localize day tokens for French / Kinyarwanda
  if (locale === "fr") {
    return trimmed
      .replace(/\bMonday\b/gi, "Lundi")
      .replace(/\bTuesday\b/gi, "Mardi")
      .replace(/\bWednesday\b/gi, "Mercredi")
      .replace(/\bThursday\b/gi, "Jeudi")
      .replace(/\bFriday\b/gi, "Vendredi")
      .replace(/\bSaturday\b/gi, "Samedi")
      .replace(/\bSunday\b/gi, "Dimanche")
      .replace(/\bMon\b/gi, "Lun")
      .replace(/\bTue\b/gi, "Mar")
      .replace(/\bWed\b/gi, "Mer")
      .replace(/\bThu\b/gi, "Jeu")
      .replace(/\bFri\b/gi, "Ven")
      .replace(/\bSat\b/gi, "Sam")
      .replace(/\bSun\b/gi, "Dim");
  }

  if (locale === "rw") {
    return trimmed
      .replace(/\bMonday\b/gi, "Kuwa Mbere")
      .replace(/\bTuesday\b/gi, "Kuwa Kabiri")
      .replace(/\bWednesday\b/gi, "Kuwa Gatatu")
      .replace(/\bThursday\b/gi, "Kuwa Kane")
      .replace(/\bFriday\b/gi, "Kuwa Gatanu")
      .replace(/\bSaturday\b/gi, "Kuwa Gatandatu")
      .replace(/\bSunday\b/gi, "Ku Cyumweru");
  }

  return trimmed;
}

