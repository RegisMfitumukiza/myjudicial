import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { ComplianceRepository } from "./compliance.repository.js";
import { ProfileRepository } from "../profile/profile.repository.js";
import { sendCredentialExpiryWarning } from "../../../infrastructure/email/email.service.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/index.js";
import { logger } from "../../../shared/utils/logger.js";


export const ComplianceService = {
  /**
   * Get compliance status for the authenticated expert.
   */
  getStatus: async (userId: string) => {
    const data = await ComplianceRepository.findByUserId(userId);
    if (!data) {
      return {
        status: "DRAFT",
        credentialsExpiry: null,
        daysUntilExpiry: null,
        isExpired: false,
        lastVerification: null,
        statusMessage: "Please complete your profile to begin verification.",
      };
    }

    const now = new Date();
    const expiry = data.credentialsExpiry;
    const daysUntilExpiry = expiry
      ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      status: data.status,
      credentialsExpiry: expiry,
      daysUntilExpiry,
      isExpired: expiry ? expiry <= now : false,
      lastVerification: data.verifications[0] ?? null,
      statusMessage: getComplianceMessage(data.status, daysUntilExpiry),
    };
  },

  /**
   * Update credentials expiry date.
   * Expert submits this when renewing their credentials.
   */
  updateExpiry: async (userId: string, expiryDate: string) => {
    const profile = await ProfileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));

    const date = new Date(expiryDate);
    if (isNaN(date.getTime())) {
      throw new ValidationError("Invalid expiry date format");
    }
    if (date <= new Date()) {
      throw new ValidationError("Credentials expiry date must be in the future");
    }

    return ComplianceRepository.updateCredentialsExpiry(profile.id, date);
  },

  /**
   * Automated cron job — runs daily.
   * 1. Suspends experts with expired credentials
   * 2. Sends 30-day warning emails to experts expiring soon
   */
  runDailyComplianceCheck: async (): Promise<void> => {
    try {
      // Suspend expired experts
      const suspended = await ComplianceRepository.suspendExpired();
      if (suspended > 0) {
        logger.info(`Compliance: suspended ${suspended} expert(s) with expired credentials`);
      }

      // Send 30-day warning emails
      const expiring = await ComplianceRepository.findExpiringWithin(30);
      for (const expert of expiring) {
        if (expert.user.email && expert.credentialsExpiry) {
          const expiryDate = expert.credentialsExpiry.toLocaleDateString("en-RW");
          const expertLanguage = (expert.user.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';
          
          // Send email
          await sendCredentialExpiryWarning(
            expert.user.email,
            expert.displayName,
            expiryDate,
            expertLanguage
          );
        }
      }

      if (expiring.length > 0) {
        logger.info(`Compliance: sent ${expiring.length} expiry warning notification(s)`);
      }
    } catch (error) {
      logger.error("Daily compliance check failed", { error });
    }
  },
};

const getComplianceMessage = (status: string, daysUntilExpiry: number | null): string => {
  if (status === "SUSPENDED") {
    return "Your credentials have expired. Please upload updated documents to reactivate your profile.";
  }
  if (status === "VERIFIED" && daysUntilExpiry !== null && daysUntilExpiry <= 30) {
    return `Your credentials expire in ${daysUntilExpiry} day(s). Please renew them to avoid suspension.`;
  }
  if (status === "PENDING_VERIFICATION") {
    return "Your profile is under review. Estimated review time: 24-48 hours.";
  }
  if (status === "REJECTED") {
    return "Your profile was rejected. Please review the feedback and resubmit your documents.";
  }
  return "Your profile is active and compliant.";
};
