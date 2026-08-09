import { Request, Response, NextFunction } from 'express';

/**
 * Language Detection Middleware
 * 
 * Detects user's preferred language from multiple sources (priority order):
 * 1. User's saved preference (from authenticated session)
 * 2. Accept-Language header from browser
 * 3. Default to English
 * 
 * Attaches the detected language to req.language for use in route handlers.
 * 
 * @example
 * // In route handler
 * const userLang = req.language || 'en';
 * await sendEmail(email, subject, getTranslatedContent(userLang));
 */
export function detectLanguage(req: Request, res: Response, next: NextFunction): void {
  const SUPPORTED_LANGUAGES = ['en', 'fr', 'rw'] as const;
  type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
  
  let language: SupportedLanguage = 'en';
  
  // Priority 1: User's saved preference (from JWT/session)
  if (req.user?.preferredLanguage) {
    const userLang = req.user.preferredLanguage;
    if (SUPPORTED_LANGUAGES.includes(userLang as SupportedLanguage)) {
      language = userLang as SupportedLanguage;
    }
  }
  
  // Priority 2: Accept-Language header (fallback for unauthenticated users)
  else if (req.headers['accept-language']) {
    const acceptLang = req.headers['accept-language']
      .split(',')[0]          // Take first preference
      .split(';')[0]          // Remove quality values (e.g., ";q=0.9")
      .substring(0, 2)        // Extract language code (e.g., "fr-FR" → "fr")
      .toLowerCase();
    
    if (SUPPORTED_LANGUAGES.includes(acceptLang as SupportedLanguage)) {
      language = acceptLang as SupportedLanguage;
    }
  }
  
  // Attach to request object
  req.language = language;
  
  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      /**
       * Detected user language (en, fr, or rw)
       * Determined by user preference or Accept-Language header
       */
      language?: 'en' | 'fr' | 'rw';
    }
  }
}
