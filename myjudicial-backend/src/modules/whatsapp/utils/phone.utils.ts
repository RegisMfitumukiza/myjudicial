import { parsePhoneNumber } from "libphonenumber-js";
import { WhatsAppError, WhatsAppErrorType } from "./whatsapp.errors.js";

/**
 * Validates and formats a phone number to E.164 format
 * @param phone - Phone number string
 * @param defaultCountry - Default country code (default: RW for Rwanda)
 * @returns Formatted phone number in E.164 format (+250788123456)
 */
export const validateAndFormatPhone = (
  phone: string,
  defaultCountry: string = 'RW'
): string => {
  if (!phone || typeof phone !== 'string') {
    throw new WhatsAppError(
      'Phone number is required',
      WhatsAppErrorType.INVALID_PHONE
    );
  }

  try {
    // Remove any whitespace and special characters except +
    const cleanPhone = phone.trim().replace(/[^\d+]/g, '');
    
    // Parse the phone number
    const phoneNumber = parsePhoneNumber(cleanPhone, defaultCountry as any);
    
    if (!phoneNumber) {
      throw new WhatsAppError(
        `Invalid phone number format: ${phone}`,
        WhatsAppErrorType.INVALID_PHONE
      );
    }

    if (!phoneNumber.isValid()) {
      throw new WhatsAppError(
        `Invalid phone number: ${phone}`,
        WhatsAppErrorType.INVALID_PHONE
      );
    }

    // Return in E.164 format
    return phoneNumber.format('E.164');
  } catch (error) {
    if (error instanceof WhatsAppError) {
      throw error;
    }
    
    throw new WhatsAppError(
      `Phone number validation failed: ${phone}`,
      WhatsAppErrorType.INVALID_PHONE
    );
  }
};

/**
 * Checks if a phone number is a valid WhatsApp number
 * Note: This is a basic check. In production, you might want to use
 * WhatsApp's phone number verification API
 */
export const isWhatsAppNumber = (phone: string): boolean => {
  try {
    const formatted = validateAndFormatPhone(phone);
    // Basic check - ensure it's mobile number
    // Rwanda mobile numbers start with +2507 (Airtel, Tigo, MTN)
    if (formatted.startsWith('+2507')) {
      return true;
    }
    
    // Add other country mobile number patterns as needed
    return true; // For now, assume all valid numbers support WhatsApp
  } catch {
    return false;
  }
};

/**
 * Extracts country code from a phone number
 */
export const getCountryCode = (phone: string): string | null => {
  try {
    const phoneNumber = parsePhoneNumber(phone);
    return phoneNumber?.country || null;
  } catch {
    return null;
  }
};

/**
 * Formats phone number for display (not for API calls)
 */
export const formatForDisplay = (phone: string): string => {
  try {
    const phoneNumber = parsePhoneNumber(phone);
    return phoneNumber?.formatInternational() || phone;
  } catch {
    return phone;
  }
};