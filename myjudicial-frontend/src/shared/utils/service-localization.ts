/**
 * Centralized Legal Service localization utility.
 * Handles localization for default consultation titles, categories, and system descriptions.
 */

export const CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
  consultation: "categoryConsultation",
  document_review: "categoryDocumentReview",
  contract_drafting: "categoryContractDrafting",
  court_representation: "categoryCourtRepresentation",
  legal_advice: "categoryLegalAdvice",
  mediation: "categoryMediation",
  other: "categoryOther",
};

/**
 * Returns a localized service name for standard consultation services or the custom name.
 */
export function getLocalizedServiceName(
  service: string | { name: string; isDefault?: boolean } | undefined | null,
  t?: (key: string) => string
): string {
  if (!service) return "";
  const name = typeof service === "string" ? service : service.name;
  const isDefault = typeof service === "object" ? service.isDefault : false;
  if (!name) return "";
  const lower = name.trim().toLowerCase();
  if (isDefault || lower === "consultation" || lower === "legal consultation") {
    if (t) {
      try {
        const translated = t("defaultConsultationName");
        if (translated && !translated.startsWith("public.expertProfile.") && !translated.startsWith("services.") && !translated.startsWith("booking.")) {
          return translated;
        }
      } catch {}
      try {
        const translated = t("category.consultation");
        if (translated && !translated.startsWith("booking.")) {
          return translated;
        }
      } catch {}
    }
    return "Consultation";
  }
  return name;
}

/**
 * Returns a localized label for service categories (e.g. document_review -> "Révision de document").
 */
export function getLocalizedServiceCategory(
  category: string | undefined | null,
  t?: (key: string) => string
): string {
  if (!category) return "";
  const key = category.toLowerCase().trim();
  const translationKey = CATEGORY_TRANSLATION_KEYS[key];
  if (translationKey && t) {
    try {
      const translated = t(translationKey);
      if (translated && !translated.startsWith("public.expertProfile.") && !translated.startsWith("services.")) {
        return translated;
      }
    } catch {}
  }
  return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Detects system-generated consultation descriptions and translates them into the active locale.
 */
export function getLocalizedServiceDescription(
  description: string | undefined | null,
  expertName: string,
  t?: (key: string, values?: Record<string, any>) => string
): string {
  if (!description) return "";
  const trimmed = description.trim();

  // Pattern 1: "Legal consultation with [Name]"
  const matchWithName = trimmed.match(/^Legal consultation with\s+(.+)$/i);
  if (matchWithName) {
    const name = expertName || matchWithName[1];
    if (t) {
      try {
        const translated = t("defaultConsultationWithName", { name });
        if (translated && !translated.startsWith("public.expertProfile.") && !translated.startsWith("services.")) {
          return translated;
        }
      } catch {}
    }
    return `Legal consultation with ${name}`;
  }

  // Pattern 2: "Standard legal consultation session."
  if (/^Standard legal consultation session\.?$/i.test(trimmed)) {
    if (t) {
      try {
        const translated = t("defaultConsultationStandard");
        if (translated && !translated.startsWith("public.expertProfile.") && !translated.startsWith("services.")) {
          return translated;
        }
      } catch {}
    }
    return "Standard legal consultation session.";
  }

  // Pattern 3: Custom description entered by advocate
  return description;
}
