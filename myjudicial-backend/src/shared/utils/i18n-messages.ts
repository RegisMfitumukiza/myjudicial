/**
 * Internationalization (i18n) Message Utility
 * 
 * Centralized translation store for API error messages, success messages,
 * and other user-facing text that needs to be multilingual.
 * 
 * Usage in route handlers:
 * ```typescript
 * import { getErrorMessage, getSuccessMessage } from '@/shared/utils/i18n-messages';
 * 
 * const userLang = req.language || 'en';
 * return res.status(401).json({
 *   error: getErrorMessage('INVALID_CREDENTIALS', userLang)
 * });
 * ```
 */

type Language = 'en' | 'fr' | 'rw';

/**
 * Error Messages
 * 
 * Production-ready error message translations.
 * Add new error codes here as needed.
 */
const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_CREDENTIALS: {
    en: "Invalid email or password",
    fr: "E-mail ou mot de passe invalide",
    rw: "Imeri cyangwa ijambo ry'ibanga bidakwiye",
  },
  UNAUTHORIZED: {
    en: "You are not authorized to access this resource",
    fr: "Vous n'êtes pas autorisé à accéder à cette ressource",
    rw: "Ntabwo ufite uburenganzira bwo kubona iyi resurusi",
  },
  TOKEN_EXPIRED: {
    en: "Your session has expired. Please log in again",
    fr: "Votre session a expiré. Veuillez vous reconnecter",
    rw: "Igihe cy'umukono wawe cyararangiye. Nyamuneka ongera winjire",
  },
  OTP_INVALID: {
    en: "Invalid or expired OTP code",
    fr: "Code OTP invalide ou expiré",
    rw: "Kode ya OTP ntiyemewe cyangwa yararangiye",
  },
  OTP_EXPIRED: {
    en: "OTP code has expired. Please request a new one",
    fr: "Le code OTP a expiré. Veuillez en demander un nouveau",
    rw: "Kode ya OTP yararangiye. Nyamuneka saba iyindi",
  },
  OTP_ATTEMPTS_EXCEEDED: {
    en: "Too many verification attempts. Please request a new code",
    fr: "Trop de tentatives de vérification. Veuillez demander un nouveau code",
    rw: "Bikemera byinshi byabaye mu kugenzura. Nyamuneka saba kode nshya",
  },
  
  // Booking Errors
  BOOKING_UNAVAILABLE: {
    en: "This time slot is no longer available",
    fr: "Ce créneau horaire n'est plus disponible",
    rw: "Iyi gihe ntikiri iboneka",
  },
  BOOKING_NOT_FOUND: {
    en: "Booking not found",
    fr: "Réservation introuvable",
    rw: "Gahunda ntiyabonetse",
  },
  BOOKING_ALREADY_CANCELLED: {
    en: "This booking has already been cancelled",
    fr: "Cette réservation a déjà été annulée",
    rw: "Iyi gahunda yari yarahagaritswe",
  },
  CANNOT_CANCEL_BOOKING: {
    en: "This booking cannot be cancelled",
    fr: "Cette réservation ne peut pas être annulée",
    rw: "Iyi gahunda ntishobora guhagarikwa",
  },
  
  // Payment Errors
  INSUFFICIENT_FUNDS: {
    en: "Insufficient funds for this transaction",
    fr: "Fonds insuffisants pour cette transaction",
    rw: "Amafaranga ntabwo ahagije kuri iyi soko",
  },
  PAYMENT_FAILED: {
    en: "Payment processing failed. Please try again",
    fr: "Le traitement du paiement a échoué. Veuillez réessayer",
    rw: "Kwishyura byanze. Nyamuneka gerageza ukundi",
  },
  PAYMENT_ALREADY_PROCESSED: {
    en: "Payment has already been processed",
    fr: "Le paiement a déjà été traité",
    rw: "Kwishyura byari byakozwe",
  },
  
  // Expert/Profile Errors
  EXPERT_NOT_FOUND: {
    en: "Expert not found",
    fr: "Expert introuvable",
    rw: "Umwarimu ntabwo yabonetse",
  },
  EXPERT_NOT_VERIFIED: {
    en: "This expert has not been verified yet",
    fr: "Cet expert n'a pas encore été vérifié",
    rw: "Uyu mwarimu ntabwo yemejwe",
  },
  EXPERT_SUSPENDED: {
    en: "This expert account is currently suspended",
    fr: "Ce compte expert est actuellement suspendu",
    rw: "Konti y'uyu mwarimu yahagaritswe",
  },
  PROFILE_INCOMPLETE: {
    en: "Please complete your profile before proceeding",
    fr: "Veuillez compléter votre profil avant de continuer",
    rw: "Nyamuneka uzuza umwirondoro wawe mbere yo gukomeza",
  },
  
  // Validation Errors
  VALIDATION_ERROR: {
    en: "Please check your input and try again",
    fr: "Veuillez vérifier votre saisie et réessayer",
    rw: "Nyamuneka suzuma icyo wanditse hanyuma ugerageze ukundi",
  },
  REQUIRED_FIELD_MISSING: {
    en: "Required field is missing",
    fr: "Champ requis manquant",
    rw: "Ibikenewe ntibibayeho",
  },
  INVALID_EMAIL: {
    en: "Invalid email address",
    fr: "Adresse e-mail invalide",
    rw: "Aderesi ya imeri ntiyemewe",
  },
  INVALID_PHONE: {
    en: "Invalid phone number",
    fr: "Numéro de téléphone invalide",
    rw: "Numero ya telefoni ntiyemewe",
  },
  
  // System Errors
  SERVER_ERROR: {
    en: "An unexpected error occurred. Please try again later",
    fr: "Une erreur inattendue s'est produite. Veuillez réessayer plus tard",
    rw: "Hariho ikibazo kitunguranye. Nyamuneka gerageza nyuma",
  },
  DATABASE_ERROR: {
    en: "Database error. Please try again",
    fr: "Erreur de base de données. Veuillez réessayer",
    rw: "Ikibazo cy'ububiko. Nyamuneka gerageza ukundi",
  },
  NETWORK_ERROR: {
    en: "Network error. Please check your connection",
    fr: "Erreur réseau. Veuillez vérifier votre connexion",
    rw: "Ikibazo cya murandasi. Nyamuneka suzuma internet yawe",
  },
  SERVICE_UNAVAILABLE: {
    en: "Service temporarily unavailable. Please try again later",
    fr: "Service temporairement indisponible. Veuillez réessayer plus tard",
    rw: "Serivisi ntiboneka muri iki gihe. Nyamuneka gerageza nyuma",
  },
  RATE_LIMIT_EXCEEDED: {
    en: "Too many requests. Please slow down",
    fr: "Trop de requêtes. Veuillez ralentir",
    rw: "Urasaba kenshi cyane. Nyamuneka tegereza gato",
  },
  
  // Document Errors
  FILE_TOO_LARGE: {
    en: "File size exceeds maximum allowed (5MB)",
    fr: "La taille du fichier dépasse le maximum autorisé (5 Mo)",
    rw: "Ingano y'idosiye irarenzekereza (5MB)",
  },
  INVALID_FILE_TYPE: {
    en: "Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, PNG",
    fr: "Type de fichier invalide. Types autorisés : PDF, DOC, DOCX, JPG, PNG",
    rw: "Ubwoko bw'idosiye ntibwemewe. Ubwoko bwemewe: PDF, DOC, DOCX, JPG, PNG",
  },
  DOCUMENT_NOT_FOUND: {
    en: "Document not found",
    fr: "Document introuvable",
    rw: "Inyandiko ntiyabonetse",
  },
} as const;

/**
 * Success Messages
 * 
 * Positive confirmation messages for successful operations.
 */
const SUCCESS_MESSAGES = {
  BOOKING_CREATED: {
    en: "Booking created successfully",
    fr: "Réservation créée avec succès",
    rw: "Gahunda yaremwe neza",
  },
  BOOKING_CANCELLED: {
    en: "Booking cancelled successfully",
    fr: "Réservation annulée avec succès",
    rw: "Gahunda yahagaritswe neza",
  },
  PAYMENT_SUCCESS: {
    en: "Payment processed successfully",
    fr: "Paiement traité avec succès",
    rw: "Kwishyura byakozwe neza",
  },
  PROFILE_UPDATED: {
    en: "Profile updated successfully",
    fr: "Profil mis à jour avec succès",
    rw: "Umwirondoro wavuguruwe neza",
  },
  SETTINGS_SAVED: {
    en: "Settings saved successfully",
    fr: "Paramètres enregistrés avec succès",
    rw: "Igenamiterere ryabitswe neza",
  },
  EMAIL_SENT: {
    en: "Email sent successfully",
    fr: "E-mail envoyé avec succès",
    rw: "Imeri yoherejwe neza",
  },
  DOCUMENT_UPLOADED: {
    en: "Document uploaded successfully",
    fr: "Document téléchargé avec succès",
    rw: "Inyandiko yoherejwe neza",
  },
} as const;

/**
 * Get localized error message
 * 
 * @param code - Error message key
 * @param language - User's preferred language (defaults to 'en')
 * @returns Localized error message
 * 
 * @example
 * const message = getErrorMessage('INVALID_CREDENTIALS', 'fr');
 * // Returns: "E-mail ou mot de passe invalide"
 */
export function getErrorMessage(
  code: keyof typeof ERROR_MESSAGES,
  language: Language = 'en'
): string {
  const messages = ERROR_MESSAGES[code];
  if (!messages) {
    // Fallback for unknown error codes
    return ERROR_MESSAGES.SERVER_ERROR[language];
  }
  return messages[language] || messages.en;
}

/**
 * Get localized success message
 * 
 * @param code - Success message key
 * @param language - User's preferred language (defaults to 'en')
 * @returns Localized success message
 */
export function getSuccessMessage(
  code: keyof typeof SUCCESS_MESSAGES,
  language: Language = 'en'
): string {
  const messages = SUCCESS_MESSAGES[code];
  if (!messages) {
    return "Success"; // Generic fallback
  }
  return messages[language] || messages.en;
}

/**
 * Get all available error codes (for documentation/testing)
 */
export function getAvailableErrorCodes(): (keyof typeof ERROR_MESSAGES)[] {
  return Object.keys(ERROR_MESSAGES) as (keyof typeof ERROR_MESSAGES)[];
}

/**
 * Get all available success codes (for documentation/testing)
 */
export function getAvailableSuccessCodes(): (keyof typeof SUCCESS_MESSAGES)[] {
  return Object.keys(SUCCESS_MESSAGES) as (keyof typeof SUCCESS_MESSAGES)[];
}
