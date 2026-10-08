import { apiFetch } from "@/lib/api/client";
import type { LegalStatusData, RecordConsentPayload } from "./types";

/**
 * Fetch published version information for legal documents (TERMS, PRIVACY, COOKIES)
 * and the calling user's consent status if authenticated.
 */
export async function fetchLegalStatus(locale: string = "en"): Promise<LegalStatusData | null> {
  try {
    const res = await apiFetch<LegalStatusData>(`/content/legal/status?locale=${encodeURIComponent(locale)}`);
    return res ?? null;
  } catch (error) {
    console.warn("[LegalAPI] Failed to fetch legal status", error);
    return null;
  }
}

/**
 * Record user consent to a specific version of a legal document in the immutable ledger.
 */
export async function recordLegalConsent(payload: RecordConsentPayload): Promise<boolean> {
  try {
    await apiFetch("/content/legal/consent", {
      method: "POST",
      body: payload,
    });
    return true;
  } catch (error) {
    console.error("[LegalAPI] Failed to record legal consent", error);
    return false;
  }
}
