/**
 * Centralized Legal Specialty localization mappings and helper.
 * Provides canonical English fallbacks and translation key resolution.
 */

export const LEGAL_SPECIALTIES = [
  "FAMILY_LAW",
  "COMMERCIAL_LAW",
  "EMPLOYMENT_LAW",
  "LAND_LAW",
  "CRIMINAL_LAW",
  "TAX_LAW",
  "IMMIGRATION_LAW",
  "CORPORATE_LAW",
  "CONTRACT_LAW",
  "INTELLECTUAL_PROPERTY",
  "OTHER",
] as const;

export type LegalSpecialtyCode = (typeof LEGAL_SPECIALTIES)[number];

const CANONICAL_SPECIALTY_LABELS: Record<string, string> = {
  FAMILY_LAW: "Family Law",
  COMMERCIAL_LAW: "Commercial Law",
  EMPLOYMENT_LAW: "Employment Law",
  LAND_LAW: "Land & Property Law",
  CRIMINAL_LAW: "Criminal Defense",
  TAX_LAW: "Tax & Revenue Law",
  IMMIGRATION_LAW: "Immigration Law",
  CORPORATE_LAW: "Corporate Law",
  CONTRACT_LAW: "Contract Law",
  INTELLECTUAL_PROPERTY: "Intellectual Property",
  OTHER: "Other",
};

/**
 * Returns the localized label for a specialty code, falling back to
 * the canonical English label or formatted key name.
 */
export function getLocalizedSpecialty(
  code: string | null | undefined,
  tSpecialties?: (key: string) => string
): string {
  if (!code) return "";
  const upper = code.toUpperCase();

  if (tSpecialties) {
    try {
      const translated = tSpecialties(upper);
      if (translated && !translated.startsWith("specialties.")) {
        return translated;
      }
    } catch {
      // Key may not exist in dictionary, continue to fallbacks
    }
  }

  if (CANONICAL_SPECIALTY_LABELS[upper]) {
    return CANONICAL_SPECIALTY_LABELS[upper];
  }

  // Fallback: convert SNAKE_CASE or snake_case to Title Case
  return code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
