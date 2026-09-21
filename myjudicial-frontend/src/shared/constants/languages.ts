/**
 * Centralized Language localization utility.
 * Translates language ISO codes (e.g. "en", "fr", "rw") into localized names
 * according to the current user locale.
 */

export const LOCALIZED_LANGUAGES: Record<string, Record<string, string>> = {
  en: {
    en: "English",
    fr: "French",
    rw: "Kinyarwanda",
    sw: "Swahili",
    de: "German",
    es: "Spanish",
    zh: "Mandarin",
    ar: "Arabic",
  },
  fr: {
    en: "Anglais",
    fr: "Français",
    rw: "Kinyarwanda",
    sw: "Swahili",
    de: "Allemand",
    es: "Espagnol",
    zh: "Mandarin",
    ar: "Arabe",
  },
  rw: {
    en: "Icyongereza",
    fr: "Igifaransa",
    rw: "Ikinyarwanda",
    sw: "Igiswahili",
    de: "Ikidage",
    es: "Icyesipanyole",
    zh: "Igishinwa",
    ar: "Icyarabu",
  },
};

export const LANGUAGE_CODE_MAP: Record<string, string> = {
  en: "en",
  english: "en",
  anglais: "en",
  icyongereza: "en",
  fr: "fr",
  french: "fr",
  français: "fr",
  francais: "fr",
  igifaransa: "fr",
  rw: "rw",
  kinyarwanda: "rw",
  ikinyarwanda: "rw",
  sw: "sw",
  swahili: "sw",
  kiswahili: "sw",
  igiswahili: "sw",
  de: "de",
  german: "de",
  allemand: "de",
  deutsch: "de",
  ikidage: "de",
  es: "es",
  spanish: "es",
  espagnol: "es",
  español: "es",
  icyesipanyole: "es",
  zh: "zh",
  chinese: "zh",
  mandarin: "zh",
  chinois: "zh",
  igishinwa: "zh",
  ar: "ar",
  arabic: "ar",
  arabe: "ar",
  icyarabu: "ar",
};

export function getLocalizedLanguage(code: string | null | undefined, currentLocale: string = "en"): string {
  if (!code) return "";
  const cleaned = code.trim().toLowerCase();
  const langKey = LANGUAGE_CODE_MAP[cleaned] || cleaned;
  const localeMap = LOCALIZED_LANGUAGES[currentLocale] || LOCALIZED_LANGUAGES.en;
  return localeMap[langKey] || LOCALIZED_LANGUAGES.en[langKey] || code;
}
