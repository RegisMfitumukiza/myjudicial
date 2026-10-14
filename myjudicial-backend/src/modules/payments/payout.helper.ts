/**
 * Payout & Mobile Money phone helper for Rwanda.
 * 
 * Handles normalization, provider detection (MTN / Airtel),
 * and priority resolution between dedicated ExpertProfile.momoNumber
 * and fallback User.phone.
 */

export type MomoProvider = "MTN" | "AIRTEL" | "UNKNOWN";

export interface ResolvedPayoutPhone {
  phone: string; // E.164 format: "+2507XXXXXXXX"
  formattedAzam: string; // "2507XXXXXXXX" for AzamPay payload
  isFallback: boolean; // true if resolved from user.phone instead of dedicated momoNumber
  provider: MomoProvider;
}

/**
 * Normalizes a Rwandan phone string to standard E.164 (+2507XXXXXXXX).
 * Validates against Rwandan mobile numbering plan:
 * MTN: 078, 079
 * Airtel: 072, 073
 * 
 * Returns null if the number is not a valid Rwandan mobile.
 */
export function normalizeRwandaMomoPhone(raw?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;

  // Strip all non-digit characters except leading plus
  let cleaned = raw.trim();
  const hasLeadingPlus = cleaned.startsWith("+");
  const digits = cleaned.replace(/\D/g, "");

  // Pattern 1: 07[2389]XXXXXXX (10 digits)
  if (digits.length === 10 && digits.startsWith("07")) {
    const prefix = digits.substring(0, 3);
    if (["078", "079", "072", "073"].includes(prefix)) {
      return `+250${digits.substring(1)}`;
    }
  }

  // Pattern 2: 2507[2389]XXXXXXX (12 digits)
  if (digits.length === 12 && digits.startsWith("2507")) {
    const sub = digits.substring(4, 5);
    const validSubs = ["8", "9", "2", "3"];
    if (validSubs.includes(sub)) {
      return `+${digits}`;
    }
  }

  // Pattern 3: 7[2389]XXXXXXX (9 digits)
  if (digits.length === 9 && digits.startsWith("7")) {
    const sub = digits.charAt(1);
    if (["8", "9", "2", "3"].includes(sub)) {
      return `+250${digits}`;
    }
  }

  return null;
}

/**
 * Detects whether a Rwandan mobile number belongs to MTN or Airtel.
 */
export function detectMomoProvider(phone?: string | null): MomoProvider {
  if (!phone) return "UNKNOWN";
  const digits = phone.replace(/\D/g, "");

  // MTN prefixes: 078, 079, 25078, 25079
  if (/^(250)?7[89]/.test(digits) || /^07[89]/.test(digits)) {
    return "MTN";
  }

  // Airtel prefixes: 072, 073, 25072, 25073
  if (/^(250)?7[23]/.test(digits) || /^07[23]/.test(digits)) {
    return "AIRTEL";
  }

  return "UNKNOWN";
}

/**
 * Resolves the payout phone number for an expert.
 * 
 * Resolution order:
 * 1. Dedicated ExpertProfile.momoNumber (if present and valid Rwandan mobile)
 * 2. Fallback to expert.user.phone (if present and valid Rwandan mobile)
 * 3. Returns null if neither exists or neither is a valid Rwandan mobile.
 */
export function resolveExpertPayoutPhone(expert?: {
  momoNumber?: string | null;
  user?: { phone?: string | null } | null;
} | null): ResolvedPayoutPhone | null {
  if (!expert) return null;

  // 1. Explicit dedicated payout number
  if (expert.momoNumber) {
    const normalized = normalizeRwandaMomoPhone(expert.momoNumber);
    if (normalized) {
      return {
        phone: normalized,
        formattedAzam: normalized.replace("+", ""),
        isFallback: false,
        provider: detectMomoProvider(normalized),
      };
    }
  }

  // 2. Fallback to user contact phone
  if (expert.user?.phone) {
    const normalized = normalizeRwandaMomoPhone(expert.user.phone);
    if (normalized) {
      return {
        phone: normalized,
        formattedAzam: normalized.replace("+", ""),
        isFallback: true,
        provider: detectMomoProvider(normalized),
      };
    }
  }

  return null;
}
