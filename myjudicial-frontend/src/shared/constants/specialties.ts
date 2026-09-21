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
  CRIMINAL_LAW: "Criminal Law",
  TAX_LAW: "Tax Law",
  IMMIGRATION_LAW: "Immigration Law",
  CORPORATE_LAW: "Corporate Law",
  CONTRACT_LAW: "Contract Law",
  INTELLECTUAL_PROPERTY: "Intellectual Property",
  OTHER: "Other",
};

/**
 * Normalizes any specialty input (SNAKE_CASE, Title Case, hyphenated, or alias)
 * into its canonical uppercase SNAKE_CASE dictionary key.
 */
export function normalizeSpecialtyCode(code: string | null | undefined): string {
  if (!code) return "";
  const cleaned = code
    .trim()
    .toUpperCase()
    .replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, " ")
    .replace(/\s+/g, "_");

  const ALIAS_MAP: Record<string, string> = {
    CRIMINAL_DEFENSE: "CRIMINAL_LAW",
    CRIMINAL_LAW: "CRIMINAL_LAW",
    CRIMINAL: "CRIMINAL_LAW",
    DROIT_PENAL: "CRIMINAL_LAW",
    FAMILY_LAW: "FAMILY_LAW",
    FAMILY: "FAMILY_LAW",
    COMMERCIAL_LAW: "COMMERCIAL_LAW",
    COMMERCIAL: "COMMERCIAL_LAW",
    BUSINESS_LAW: "COMMERCIAL_LAW",
    EMPLOYMENT_LAW: "EMPLOYMENT_LAW",
    EMPLOYMENT: "EMPLOYMENT_LAW",
    LABOR_LAW: "EMPLOYMENT_LAW",
    LABOUR_LAW: "EMPLOYMENT_LAW",
    LAND_LAW: "LAND_LAW",
    LAND_PROPERTY_LAW: "LAND_LAW",
    LAND_PROPERTY: "LAND_LAW",
    PROPERTY_LAW: "LAND_LAW",
    REAL_ESTATE_LAW: "LAND_LAW",
    TAX_LAW: "TAX_LAW",
    TAX_REVENUE_LAW: "TAX_LAW",
    REVENUE_LAW: "TAX_LAW",
    IMMIGRATION_LAW: "IMMIGRATION_LAW",
    IMMIGRATION: "IMMIGRATION_LAW",
    CORPORATE_LAW: "CORPORATE_LAW",
    CORPORATE: "CORPORATE_LAW",
    CONTRACT_LAW: "CONTRACT_LAW",
    CONTRACT: "CONTRACT_LAW",
    CONTRACTS: "CONTRACT_LAW",
    INTELLECTUAL_PROPERTY: "INTELLECTUAL_PROPERTY",
    IP_LAW: "INTELLECTUAL_PROPERTY",
    IP: "INTELLECTUAL_PROPERTY",
    OTHER: "OTHER",
  };

  return ALIAS_MAP[cleaned] || cleaned;
}

/**
 * Returns the localized label for a specialty code or English title,
 * falling back to the canonical English label or formatted key name.
 */
export function getLocalizedSpecialty(
  code: string | null | undefined,
  tSpecialties?: (key: string) => string
): string {
  if (!code) return "";
  const key = normalizeSpecialtyCode(code);

  if (tSpecialties) {
    try {
      const translated = tSpecialties(key);
      if (translated && !translated.startsWith("specialties.") && translated !== key) {
        return translated;
      }
    } catch {
      // Key may not exist in dictionary, continue to fallbacks
    }
  }

  if (CANONICAL_SPECIALTY_LABELS[key]) {
    return CANONICAL_SPECIALTY_LABELS[key];
  }

  // Fallback: convert SNAKE_CASE or snake_case to Title Case
  return code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
