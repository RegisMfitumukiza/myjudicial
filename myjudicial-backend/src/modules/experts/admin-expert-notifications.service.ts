/**
 * Admin Expert Notifications Service
 * Handles sending notifications to experts from admin actions
 */

import { prisma } from "../../infrastructure/database/prisma.js";
import {
  sendVerificationReminderDetailedEmail,
  sendVerificationRejectionEmail,
} from "../../infrastructure/email/email.service.js";
import { NotFoundError } from "../../shared/errors/index.js";
import { logger } from "../../shared/utils/logger.js";


export const AdminExpertNotificationsService = {
  /**
   * Send reminder to expert to submit verification documents
   */
  sendVerificationReminder: async (expertUserId: string, adminId: string) => {
    // Get expert details with their profile
    let expert = await prisma.user.findUnique({
      where: { id: expertUserId },
      include: {
        expertProfile: true,
      },
    });

    if (!expert) {
      // Fallback: Check if expertUserId is actually an ExpertProfile.id
      const profile = await prisma.expertProfile.findUnique({
        where: { id: expertUserId },
        include: { user: { include: { expertProfile: true } } },
      });
      if (profile?.user) {
        expert = profile.user;
      }
    }

    if (!expert || !expert.expertProfile) {
      throw new NotFoundError("Expert");
    }

    // Check if already verified
    if (expert.expertProfile.status === "VERIFIED") {
      throw new Error("Expert is already verified");
    }

    // Fetch the latest verification record to determine missing documents.
    // ExpertVerification.expertId references ExpertProfile.id, NOT User.id.
    const latestVerification = await prisma.expertVerification.findFirst({
      where: { expertId: expert.expertProfile.id },
      orderBy: { createdAt: "desc" },
    });

    // Check if verification is currently under admin review — still send reminder
    // (admin may want to remind an expert who submitted partial docs)

    // Determine which required documents are missing
    const missingDocs: string[] = [];
    if (!latestVerification?.identityDocumentObjectKey) {
      missingDocs.push("National ID or Passport");
    }
    if (!latestVerification?.barCertificateObjectKey) {
      missingDocs.push("Bar Association Certificate");
    }

    const expertName = expert.firstName || "Expert";
    const expertLanguage = (expert.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';

    // Send reminder email using centralized template
    await sendVerificationReminderDetailedEmail(expert.email, expertName, missingDocs, expertLanguage);

    // Log the action
    await prisma.adminAction.create({
      data: {
        adminUserId: adminId,
        expertId: expert.expertProfile?.id,
        action: "SEND_VERIFICATION_REMINDER",
        reason: "Admin sent verification reminder to expert",
        metadata: {
          type: "VERIFICATION_REMINDER",
          expertEmail: expert.email,
          expertName: `${expert.firstName} ${expert.lastName}`,
          expertUserId: expert.id,
          missingDocuments: missingDocs,
        },
      },
    });

    logger.info("Verification reminder sent to expert", {
      expertId: expert.id,
      expertEmail: expert.email,
      adminId,
      missingDocuments: missingDocs,
    });

    return {
      success: true,
      message: missingDocs.length > 0
        ? `Verification reminder sent successfully. Expert is missing: ${missingDocs.join(", ")}.`
        : "Verification reminder sent successfully.",
      sentTo: expert.email,
      missingDocuments: missingDocs,
    };
  },


  /**
   * Send notification about rejected verification with reason
   */
  notifyVerificationRejection: async (expertUserId: string, reason: string, adminId: string) => {
    let expert = await prisma.user.findUnique({
      where: { id: expertUserId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        preferredLanguage: true,
      },
    });

    if (!expert) {
      const profile = await prisma.expertProfile.findUnique({
        where: { id: expertUserId },
        select: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              preferredLanguage: true,
            },
          },
        },
      });
      if (profile?.user) {
        expert = profile.user;
      }
    }

    if (!expert) {
      throw new NotFoundError("Expert");
    }

    const expertName = expert.firstName || "Expert";
    const expertLanguage = (expert.preferredLanguage as 'en' | 'fr' | 'rw') || 'en';

    // Send rejection notification using centralized template
    await sendVerificationRejectionEmail(expert.email, expertName, reason, expertLanguage);

    logger.info("Rejection notification sent to expert", {
      expertId: expert.id,
      expertEmail: expert.email,
      adminId,
    });

    return {
      success: true,
      message: "Rejection notification sent successfully",
    };
  },
};
