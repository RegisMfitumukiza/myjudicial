import { AppError } from "../../../shared/errors/index.js";
import { WhatsAppErrorType } from "../types/whatsapp.types.js";

export { WhatsAppErrorType };

export class WhatsAppError extends AppError {
  public readonly errorType: WhatsAppErrorType;
  public readonly retryable: boolean;

  constructor(
    message: string,
    errorType: WhatsAppErrorType,
    retryable: boolean = false
  ) {
    super(message, 500); // Use 500 status code for WhatsApp errors
    this.errorType = errorType;
    this.retryable = retryable;
    this.name = 'WhatsAppError';
  }

  static fromMetaError(error: any): WhatsAppError {
    const { code, title, message } = error;

    switch (code) {
      case 131056: // Rate limit exceeded
        return new WhatsAppError(
          `Rate limit exceeded: ${message}`,
          WhatsAppErrorType.RATE_LIMIT,
          true
        );
      case 131051: // Unsupported message type
      case 131052: // Media download error
        return new WhatsAppError(
          message,
          WhatsAppErrorType.INVALID_PHONE,
          false
        );
      case 100: // Invalid parameter
        if (message.includes('phone')) {
          return new WhatsAppError(
            `Invalid phone number: ${message}`,
            WhatsAppErrorType.INVALID_PHONE,
            false
          );
        }
        return new WhatsAppError(
          message,
          WhatsAppErrorType.TEMPLATE_NOT_FOUND,
          false
        );
      case 190: // Invalid access token
        return new WhatsAppError(
          'Invalid WhatsApp access token',
          WhatsAppErrorType.AUTH_ERROR,
          false
        );
      default:
        return new WhatsAppError(
          `WhatsApp API error: ${title || message}`,
          WhatsAppErrorType.NETWORK_ERROR,
          true
        );
    }
  }

  static isRetryable(error: any): boolean {
    if (error instanceof WhatsAppError) {
      return error.retryable;
    }
    
    // Network errors are retryable
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    return false;
  }
}