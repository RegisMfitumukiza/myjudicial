import { logger } from "../../../shared/utils/logger.js";
import { WhatsAppError } from "./whatsapp.errors.js";

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's not a retryable error
      if (!WhatsAppError.isRetryable(error)) {
        logger.debug('Error is not retryable, throwing immediately', {
          error: lastError.message,
          attempt
        });
        throw error;
      }

      if (attempt === maxRetries) {
        logger.error('Max retries exceeded', {
          attempts: attempt,
          error: lastError.message
        });
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.1 * exponentialDelay; // Add up to 10% jitter
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      logger.warn('Retrying after error', {
        attempt,
        maxRetries,
        delay,
        error: lastError.message
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

/**
 * Sleep utility for delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};