import { brevo, EMAIL_FROM_NAME, EMAIL_FROM_ADDRESS, EMAIL_REPLY_TO } from "./email.client.js";
import { prisma } from "../database/prisma.js";
import { logger } from "../../shared/utils/logger.js";
import { emailLayout } from "./templates/email-layout.js";
import { AdminSettingService } from "../../modules/settings/admin-setting.service.js";
import {
  button, tableRow, dataTable, alertBox, heading, paragraph,
  divider, contentBlock, badge, buildUrl, FRONTEND,
} from "./templates/components.js";
import { getEmailSubject, getEmailContent, EMAIL_CONTENT } from "./email-templates.i18n.js";

type Language = 'en' | 'fr' | 'rw';

const getBrandingSettings = async (): Promise<{ tagline?: string; copyrightNotice?: string }> => {
  try {
    const res = await AdminSettingService.getAll();
    return {
      tagline: res.data.platformTagline,
      copyrightNotice: res.data.copyrightNotice,
    };
  } catch {
    return {};
  }
};

type SendEmailParams = {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: { email: string; name?: string };
  template?: string;
  attachment?: Array<{ content?: string; url?: string; name: string }>;
};

/**
 * Core send function. All email helpers call this.
 * Failures are logged but never thrown — email must not block the main flow.
 */
const sendEmail = async (params: SendEmailParams): Promise<void> => {
  let status: "SENT" | "FAILED" = "SENT";
  let errorMessage: string | undefined;

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM_ADDRESS },
      to: params.to,
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
      replyTo: params.replyTo ?? { email: EMAIL_REPLY_TO },
      attachment: params.attachment,
    });

    logger.info("Email sent", {
      to: params.to.map((r) => r.email),
      subject: params.subject,
    });
  } catch (error) {
    status = "FAILED";
    errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to send email", {
      to: params.to.map((r) => r.email),
      subject: params.subject,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  // Best-effort audit log — must never break or block sending
  try {
    await prisma.emailLog.create({
      data: {
        toEmail: params.to.map((r) => r.email).join(", "),
        subject: params.subject,
        template: params.template ?? null,
        status,
        error: errorMessage ? errorMessage.slice(0, 500) : null,
      },
    });
  } catch (logError) {
    logger.error("Failed to write email log", {
      error: logError instanceof Error ? logError.message : String(logError),
    });
  }
};

/**
 * Welcome email after registration.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendWelcomeEmail = async (
  to: string,
  firstName: string,
  role: string,
  language: Language = 'en'
): Promise<void> => {
  const roleType = role === "EXPERT" ? "EXPERT" : "CLIENT";
  const roleLabel = EMAIL_CONTENT.WELCOME.roleLabel[roleType][language];
  const loginUrl = buildUrl(FRONTEND.login);

  const greeting = getEmailContent('WELCOME', 'greeting', language, firstName);
  const accountCreated = getEmailContent('WELCOME', 'accountCreated', language, roleLabel);
  const getStarted = getEmailContent('WELCOME', 'getStarted', language);
  const loginButton = getEmailContent('WELCOME', 'loginButton', language);
  const didntCreate = getEmailContent('WELCOME', 'didntCreate', language);

  const branding = await getBrandingSettings();
  const html = emailLayout(`
    ${contentBlock(
      heading(getEmailSubject('WELCOME', language)),
      paragraph(greeting),
      paragraph(accountCreated),
      paragraph(getStarted),
      button(loginButton, loginUrl),
      divider(),
      paragraph(didntCreate, { color: "#94a3b8", size: "13px" }),
    )}
  `, {
    previewText: `${getEmailSubject('WELCOME', language)}, ${firstName}`,
    language,
    tagline: branding.tagline,
    copyrightNotice: branding.copyrightNotice,
  });

  await sendEmail({
    to: [{ email: to, name: firstName }],
    subject: getEmailSubject('WELCOME', language),
    template: "WELCOME",
    htmlContent: html,
    textContent:
      `${getEmailSubject('WELCOME', language)}, ${firstName}!\n\n` +
      `${accountCreated}\n\n` +
      `${loginButton}: ${loginUrl}\n\n` +
      getStarted,
  });
};

/**
 * Send a 6-digit OTP login code.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendOtpEmail = async (
  to: string,
  otpCode: string,
  userId?: string,
  phone?: string,
  language: Language = 'en'
): Promise<void> => {
  const headingText = getEmailContent('OTP', 'heading', language);
  const yourCode = getEmailContent('OTP', 'yourCode', language);
  const expiresWarning = getEmailContent('OTP', 'expiresWarning', language);
  const didntRequest = getEmailContent('OTP', 'didntRequest', language);
  const branding = await getBrandingSettings();

  const html = emailLayout(`
    ${contentBlock(
      heading(headingText),
      paragraph(yourCode),
      `
      <tr>
        <td style="padding:20px 0;text-align:center;">
          <div style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#1d4ed8;
                      background:#f1f5f9;padding:24px;border-radius:12px;
                      border:2px dashed #cbd5e1;">
            ${otpCode}
          </div>
        </td>
      </tr>
      `,
      alertBox(expiresWarning, "warning"),
      divider(),
      paragraph(didntRequest, { size: "13px", color: "#94a3b8" }),
    )}
  `, {
    previewText: `${getEmailSubject('OTP_CODE', language)}: ${otpCode}`,
    language,
    tagline: branding.tagline,
    copyrightNotice: branding.copyrightNotice,
    hidePromotionalLinks: true,
  });

  await sendEmail({
    to: [{ email: to }],
    subject: getEmailSubject('OTP_CODE', language),
    template: "OTP_CODE",
    htmlContent: html,
    textContent: `${yourCode} ${otpCode}\n\n${expiresWarning}`,
  });
};

/**
 * Send a magic login link.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendMagicLinkEmail = async (
  to: string,
  magicLink: string,
  language: Language = 'en'
): Promise<void> => {
  const clickToLogin = getEmailContent('MAGIC_LINK', 'clickToLogin', language);
  const loginButton = getEmailContent('MAGIC_LINK', 'loginButton', language);
  const didntRequest = getEmailContent('MAGIC_LINK', 'didntRequest', language);
  const subject = getEmailSubject('MAGIC_LINK', language);
  const branding = await getBrandingSettings();

  const html = emailLayout(`
    ${contentBlock(
      heading(subject),
      paragraph(clickToLogin),
      button(loginButton, magicLink),
      divider(),
      paragraph(didntRequest, { size: "13px", color: "#94a3b8" }),
    )}
  `, {
    previewText: subject,
    language,
    tagline: branding.tagline,
    copyrightNotice: branding.copyrightNotice,
    hidePromotionalLinks: true,
  });

  await sendEmail({
    to: [{ email: to }],
    subject,
    template: "MAGIC_LINK",
    htmlContent: html,
    textContent: `${loginButton}: ${magicLink}\n\n${clickToLogin}`,
  });
};

/**
 * Send password reset link.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  token: string,
  language: Language = 'en'
): Promise<void> => {
  const resetUrl = buildUrl(FRONTEND.resetPassword(token, language));
  const greeting = getEmailContent('PASSWORD_RESET', 'greeting', language, name);
  const message = getEmailContent('PASSWORD_RESET', 'message', language);
  const resetButton = getEmailContent('PASSWORD_RESET', 'resetButton', language);
  const expiresWarning = getEmailContent('PASSWORD_RESET', 'expiresWarning', language);
  const didntRequest = getEmailContent('PASSWORD_RESET', 'didntRequest', language);
  const subject = getEmailSubject('PASSWORD_RESET', language);
  const branding = await getBrandingSettings();

  const html = emailLayout(`
    ${contentBlock(
      heading(subject),
      paragraph(greeting),
      paragraph(message),
      button(resetButton, resetUrl),
      alertBox(expiresWarning, "warning"),
      divider(),
      paragraph(didntRequest, { size: "13px", color: "#94a3b8" }),
    )}
  `, {
    previewText: `${subject}, ${name}`,
    language,
    tagline: branding.tagline,
    copyrightNotice: branding.copyrightNotice,
    hidePromotionalLinks: true,
  });

  await sendEmail({
    to: [{ email: to, name }],
    subject,
    template: "PASSWORD_RESET",
    htmlContent: html,
    textContent: `${subject}\n\n${greeting}\n\n${message}\n\n${resetButton}: ${resetUrl}\n\n${expiresWarning}\n\n${didntRequest}`,
  });
};

/**
 * Send booking confirmation to the client after payment.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendBookingConfirmationEmail = async (
  to: string,
  details: {
    recipientName: string;
    expertName: string;
    clientName: string;
    serviceName: string;
    scheduledAt: string;
    bookingId: string;
  },
  language: Language = 'en'
): Promise<void> => {
  const bookingUrl = buildUrl(FRONTEND.bookings(details.bookingId));

  const title = getEmailContent('BOOKING_CONFIRMED', 'title', language);
  const message = getEmailContent('BOOKING_CONFIRMED', 'message', language);
  const expertLabel = getEmailContent('BOOKING_CONFIRMED', 'expert', language);
  const serviceLabel = getEmailContent('BOOKING_CONFIRMED', 'service', language);
  const scheduledLabel = getEmailContent('BOOKING_CONFIRMED', 'scheduled', language);
  const referenceLabel = getEmailContent('BOOKING_CONFIRMED', 'reference', language);
  const viewButton = getEmailContent('BOOKING_CONFIRMED', 'viewButton', language);
  const reminderNote = getEmailContent('BOOKING_CONFIRMED', 'reminderNote', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      paragraph(message),
      dataTable(
        tableRow(expertLabel, details.expertName, { bold: true }) +
        tableRow(serviceLabel, details.serviceName) +
        tableRow(scheduledLabel, details.scheduledAt) +
        tableRow(referenceLabel, details.bookingId, { bold: false, color: "#94a3b8" })
      ),
      button(viewButton, bookingUrl),
      divider(),
      paragraph(reminderNote, { size: "13px", color: "#94a3b8" }),
    )}
  `, { previewText: `${title} - ${details.serviceName}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject: getEmailSubject('BOOKING_CONFIRMED', language, details.serviceName),
    template: "BOOKING_CONFIRMED",
    htmlContent: html,
  });
};

/**
 * Send booking confirmation to the expert after payment.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendExpertBookingConfirmationEmail = async (
  to: string,
  details: {
    expertName: string;
    clientName: string;
    serviceName: string;
    scheduledAt: string;
    bookingId: string;
  },
  language: Language = 'en'
): Promise<void> => {
  const bookingUrl = buildUrl(FRONTEND.expertBookingsDetail(details.bookingId));

  const title = getEmailContent('BOOKING_CONFIRMED', 'title', language);
  const greeting = getEmailContent('WELCOME', 'greeting', language, details.expertName);
  const message = getEmailContent('BOOKING_CONFIRMED', 'messageExpert', language);
  const clientLabel = getEmailContent('COMMON', 'client', language);
  const serviceLabel = getEmailContent('BOOKING_CONFIRMED', 'service', language);
  const scheduledLabel = getEmailContent('BOOKING_CONFIRMED', 'scheduled', language);
  const referenceLabel = getEmailContent('BOOKING_CONFIRMED', 'reference', language);
  const viewButton = getEmailContent('COMMON', 'viewBooking', language);
  const reminderNote = getEmailContent('BOOKING_CONFIRMED', 'reminderNote', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      paragraph(greeting),
      paragraph(message),
      dataTable(
        tableRow(clientLabel, details.clientName, { bold: true }) +
        tableRow(serviceLabel, details.serviceName) +
        tableRow(scheduledLabel, details.scheduledAt) +
        tableRow(referenceLabel, details.bookingId, { bold: false, color: "#94a3b8" })
      ),
      button(viewButton, bookingUrl),
      divider(),
      paragraph(reminderNote, { size: "13px", color: "#94a3b8" }),
    )}
  `, { previewText: `${title}: ${details.serviceName}` });

  await sendEmail({
    to: [{ email: to, name: details.expertName }],
    subject: getEmailSubject('BOOKING_CONFIRMED', language, details.serviceName),
    template: "BOOKING_CONFIRMED_EXPERT",
    htmlContent: html,
  });
};

/**
 * Send booking summary immediately after booking creation.
 *
 * @param paymentRequired - true (legacy): amount is shown and the copy asks the
 *   client to pay. false (booking-first): amount is omitted and the copy says
 *   the request awaits the expert's confirmation.
 */
export const sendBookingSummaryEmail = async (
  to: string,
  details: {
    recipientName: string;
    expertName: string;
    serviceName: string;
    scheduledAt: string;
    bookingId: string;
    amount?: string;
    paymentRequired: boolean;
  },
  language: Language = 'en'
): Promise<void> => {
  const bookingUrl = buildUrl(FRONTEND.bookings(details.bookingId));
  const t = (key: string) => getEmailContent('BOOKING_SUMMARY', key, language);

  const html = emailLayout(`
    ${contentBlock(
      heading(t('title')),
      alertBox(
        details.paymentRequired ? t('message') : t('messageAwaitingConfirmation'),
        "info"
      ),
      dataTable(
        tableRow(t('expert'), details.expertName, { bold: true }) +
        tableRow(t('service'), details.serviceName) +
        tableRow(t('dateTime'), details.scheduledAt) +
        (details.amount ? tableRow(t('amount'), details.amount, { bold: true }) : "") +
        tableRow(t('reference'), details.bookingId, { bold: false, color: "#94a3b8" })
      ),
      button(t('viewBookingButton'), bookingUrl),
      paragraph(
        details.paymentRequired ? t('confirmationNote') : t('confirmationNoteAwaitingExpert'),
        { size: "13px", color: "#94a3b8" }
      ),
    )}
  `, { previewText: `Booking created: ${details.serviceName}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject: getEmailSubject('BOOKING_SUMMARY', language, details.serviceName),
    template: "BOOKING_SUMMARY",
    htmlContent: html,
  });
};

/**
 * Notify expert about a new booking request.
 *
 * @param paymentRequired - true (legacy): request awaits the client's payment.
 *   false (booking-first): expert must review and confirm the request.
 */
export const sendNewBookingRequestEmail = async (
  to: string,
  details: {
    expertName: string;
    clientName: string;
    serviceName: string;
    scheduledAt: string;
    bookingId: string;
    paymentRequired: boolean;
  },
  language: Language = 'en'
): Promise<void> => {
  const bookingUrl = buildUrl(FRONTEND.expertBookingsDetail(details.bookingId));
  const t = (key: string) => getEmailContent('NEW_BOOKING_REQUEST', key, language);

  const html = emailLayout(`
    ${contentBlock(
      heading(t('title')),
      paragraph(details.paymentRequired ? t('message') : t('messageAwaitingResponse')),
      dataTable(
        tableRow(t('client'), details.clientName, { bold: true }) +
        tableRow(t('service'), details.serviceName) +
        tableRow(t('scheduled'), details.scheduledAt) +
        tableRow(t('reference'), details.bookingId, { bold: false, color: "#94a3b8" })
      ),
      button(t('viewButton'), bookingUrl),
      divider(),
      paragraph(
        details.paymentRequired ? t('confirmationNote') : t('confirmationNoteOnAccept'),
        { size: "13px", color: "#94a3b8" }
      ),
    )}
  `, { previewText: `New booking request: ${details.serviceName}` });

  await sendEmail({
    to: [{ email: to, name: details.expertName }],
    subject: getEmailSubject('NEW_BOOKING_REQUEST', language, details.serviceName),
    template: "NEW_BOOKING_REQUEST",
    htmlContent: html,
  });
};

/**
 * Send booking reminder email with join link.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendBookingReminderEmail = async (
  to: string,
  details: {
    recipientName: string;
    expertName: string;
    scheduledAt: string;
    bookingId: string;
    joinUrl: string;
  },
  language: Language = 'en'
): Promise<void> => {
  const subject = getEmailSubject('BOOKING_REMINDER', language, details.bookingId);
  const greeting = getEmailContent('WELCOME', 'greeting', language, details.recipientName);
  
  // Reminder-specific content (add to EMAIL_CONTENT if needed, using inline for now)
  const reminderMessage = {
    en: `This is a reminder that your legal consultation with <strong>${details.expertName}</strong> is scheduled to start soon.`,
    fr: `Ceci est un rappel que votre consultation juridique avec <strong>${details.expertName}</strong> est prévue de commencer bientôt.`,
    rw: `Iki ni kwibuka ko inama yawe y'amategeko hamwe na <strong>${details.expertName}</strong> igomba gutangira vuba.`,
  };

  const joinPrompt = {
    en: "Click the button below to join the video consultation room:",
    fr: "Cliquez sur le bouton ci-dessous pour rejoindre la salle de consultation vidéo :",
    rw: "Kanda buto hasi kugira ngo winjire mu cyumba cy'inama ya videwo:",
  };

  const joinButton = {
    en: "Join Consultation Room",
    fr: "Rejoindre la salle de consultation",
    rw: "Injira mu cyumba cy'inama",
  };

  const roomNote = {
    en: "The room will open 15 minutes before your scheduled time.",
    fr: "La salle s'ouvrira 15 minutes avant votre heure prévue.",
    rw: "Icyumba kizafungura mbere y'iminota 15 igihe cyawe cyagenewe.",
  };

  const html = emailLayout(`
    ${contentBlock(
      heading(subject),
      paragraph(greeting),
      paragraph(reminderMessage[language]),
      dataTable(
        tableRow(getEmailContent('BOOKING_CONFIRMED', 'scheduled', language), details.scheduledAt, { bold: true }) +
        tableRow(getEmailContent('BOOKING_CONFIRMED', 'reference', language), details.bookingId, { bold: false, color: "#94a3b8" })
      ),
      paragraph(joinPrompt[language]),
      button(joinButton[language], details.joinUrl),
      divider(),
      paragraph(roomNote[language], { size: "13px", color: "#94a3b8" }),
    )}
  `, { previewText: `${subject}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject,
    template: "BOOKING_REMINDER",
    htmlContent: html,
  });
};

/**
 * Send booking cancellation notice.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendBookingCancelledEmail = async (
  to: string,
  details: {
    recipientName: string;
    cancelledBy: string;
    reason: string;
    refunded: boolean;
    bookingId: string;
  },
  language: Language = 'en'
): Promise<void> => {
  const subject = getEmailSubject('BOOKING_CANCELLED', language, details.bookingId);
  const greeting = getEmailContent('WELCOME', 'greeting', language, details.recipientName);
  
  const cancelMessage = {
    en: `Your booking (ID: ${details.bookingId}) has been cancelled by the <strong>${details.cancelledBy}</strong>.`,
    fr: `Votre réservation (ID : ${details.bookingId}) a été annulée par <strong>${details.cancelledBy}</strong>.`,
    rw: `Gahunda yawe (ID: ${details.bookingId}) yahagaritswe na <strong>${details.cancelledBy}</strong>.`,
  };

  const refundLabel = {
    en: "Refund Status",
    fr: "Statut du remboursement",
    rw: "Imiterere y'amafaranga yasubijwe",
  };

  const refundProcessed = {
    en: "Refund Processed",
    fr: "Remboursement traité",
    rw: "Amafaranga yasubijwe",
  };

  const noRefund = {
    en: "No Refund Applicable",
    fr: "Aucun remboursement applicable",
    rw: "Nta mafaranga yasubizwa",
  };

  const refundNote = {
    en: "Your refund will be processed within 5-10 business days.",
    fr: "Votre remboursement sera traité dans les 5 à 10 jours ouvrables.",
    rw: "Amafaranga yawe azasubizwa mu minsi 5-10 y'akazi.",
  };

  const noRefundNote = {
    en: "No refund is applicable for this cancellation.",
    fr: "Aucun remboursement n'est applicable pour cette annulation.",
    rw: "Nta mafaranga asubizwa kuri iki gihagarika.",
  };

  const html = emailLayout(`
    ${contentBlock(
      heading(subject),
      paragraph(greeting),
      paragraph(cancelMessage[language]),
      dataTable(
        tableRow(getEmailContent('COMMON', 'reason', language), details.reason) +
        tableRow(
          refundLabel[language],
          details.refunded ? badge(refundProcessed[language], "success") : badge(noRefund[language], "error"),
        )
      ),
      details.refunded
        ? alertBox(refundNote[language], "success")
        : alertBox(noRefundNote[language], "info"),
    )}
  `, { previewText: `${subject}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject,
    template: "BOOKING_CANCELLED",
    htmlContent: html,
  });
};

/**
 * Send refund confirmation email.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendRefundConfirmationEmail = async (
  to: string,
  details: {
    recipientName: string;
    amount: number;
    percentage: number;
    bookingId: string;
  },
  language: Language = 'en'
): Promise<void> => {
  const paymentsUrl = buildUrl(FRONTEND.clientPayments);
  const subject = getEmailSubject('REFUND_CONFIRMED', language, details.bookingId);
  const title = getEmailContent('REFUND_CONFIRMED', 'title', language);
  const message = getEmailContent('REFUND_CONFIRMED', 'message', language);
  const viewPayments = getEmailContent('REFUND_CONFIRMED', 'viewPayments', language);
  const bookingRefLabel = getEmailContent('REFUND_CONFIRMED', 'bookingReference', language);
  const refundPctLabel = getEmailContent('REFUND_CONFIRMED', 'refundPercentage', language);
  const refundedAmtLabel = getEmailContent('REFUND_CONFIRMED', 'refundedAmount', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      alertBox(message, "success"),
      dataTable(
        tableRow(bookingRefLabel, details.bookingId) +
        tableRow(refundPctLabel, `${details.percentage}%`, { bold: true }) +
        tableRow(refundedAmtLabel, `${details.amount} RWF`, { bold: true, color: "#15803d" })
      ),
      button(viewPayments, paymentsUrl),
    )}
  `, { previewText: `${subject}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject,
    template: "REFUND_CONFIRMED",
    htmlContent: html,
  });
};

/**
 * Send 30-day credential expiry warning to an expert.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendCredentialExpiryWarning = async (
  to: string,
  expertName: string,
  expiryDate: string,
  language: Language = 'en'
): Promise<void> => {
  const credentialsUrl = buildUrl(FRONTEND.expertCredentials);
  const subject = getEmailSubject('CREDENTIAL_EXPIRY', language);
  const greeting = getEmailContent('WELCOME', 'greeting', language, expertName);

  const expiryMessage = {
    en: `Your professional credentials on MyJudicial expire on <strong style="color:#d32f2f">${expiryDate}</strong>.`,
    fr: `Vos informations d'identification professionnelles sur MyJudicial expirent le <strong style="color:#d32f2f">${expiryDate}</strong>.`,
    rw: `Ibyangombwa byawe bya umwuga kuri MyJudicial bizarangira ku <strong style="color:#d32f2f">${expiryDate}</strong>.`,
  };

  const warningNote = {
    en: "Please upload your renewed credentials before this date to avoid automatic suspension of your account and removal from the map.",
    fr: "Veuillez télécharger vos nouvelles informations d'identification avant cette date pour éviter la suspension automatique de votre compte et la suppression de la carte.",
    rw: "Nyamuneka shyiramo ibyangombwa byawe bishya mbere yiki gihe kugira ngo wirinde guhagarikwa kwa konti yawe no gukurwa ku karita.",
  };

  const updateButton = {
    en: "Update Credentials",
    fr: "Mettre à jour les informations d'identification",
    rw: "Kuvugurura ibyangombwa",
  };

  const html = emailLayout(`
    ${contentBlock(
      heading(subject),
      paragraph(greeting),
      paragraph(expiryMessage[language]),
      alertBox(warningNote[language], "warning"),
      button(updateButton[language], credentialsUrl),
    )}
  `, { previewText: `${subject}` });

  await sendEmail({
    to: [{ email: to, name: expertName }],
    subject,
    template: "CREDENTIAL_EXPIRY",
    htmlContent: html,
  });
};

/**
 * Send review notification email to expert.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendReviewNotificationEmail = async (
  to: string,
  details: {
    expertName: string;
    citizenName: string;
    rating: number;
    comment: string;
    reviewId: string;
  },
  language: Language = 'en'
): Promise<void> => {
  const reviewsUrl = buildUrl(FRONTEND.expertReviews);
  const stars = "★".repeat(details.rating) + "☆".repeat(5 - details.rating);
  const subject = getEmailSubject('NEW_REVIEW', language, details.rating);
  const title = getEmailContent('NEW_REVIEW', 'title', language);
  const fromLabel = getEmailContent('NEW_REVIEW', 'fromLabel', language, details.citizenName);
  const noComment = getEmailContent('NEW_REVIEW', 'noComment', language);
  const viewReviews = getEmailContent('NEW_REVIEW', 'viewReviews', language);
  const keepUp = getEmailContent('NEW_REVIEW', 'keepUp', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      paragraph(fromLabel),
      `
      <tr>
        <td style="padding:16px 0;">
          <div style="background:#f8fafc;border-left:4px solid #1d4ed8;padding:20px;border-radius:4px;">
            <div style="font-size:24px;color:#f59e0b;margin-bottom:8px;">${stars}</div>
            ${details.comment
              ? `<p style="color:#475569;font-style:italic;margin:8px 0;font-size:15px;">"${details.comment}"</p>`
              : `<p style="color:#94a3b8;font-size:14px;margin:8px 0;">${noComment}</p>`}
          </div>
        </td>
      </tr>
      `,
      button(viewReviews, reviewsUrl),
      divider(),
      paragraph(keepUp, { size: "13px", color: "#94a3b8" }),
    )}
  `, { previewText: `${subject}` });

  await sendEmail({
    to: [{ email: to, name: details.expertName }],
    subject,
    template: "NEW_REVIEW",
    htmlContent: html,
    textContent:
      `${title}, ${details.expertName}!\n\n` +
      `${fromLabel.replace(/<[^>]*>/g, '')}\n\n` +
      (details.comment ? `"${details.comment}"\n\n` : "") +
      `${viewReviews}: ${reviewsUrl}`,
  });
};

/**
 * Send new message notification email when user is offline.
 * Routes to the correct messaging page based on role.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendNewMessageEmail = async (
  to: string,
  details: {
    recipientName: string;
    senderName: string;
    messagePreview: string;
    conversationLink: string;
    recipientRole?: "CITIZEN" | "EXPERT" | "ADMIN";
  },
  language: Language = 'en'
): Promise<void> => {
  const messagesUrl = details.recipientRole === "EXPERT"
    ? buildUrl(FRONTEND.expertMessages)
    : buildUrl(FRONTEND.clientMessages);
  const subject = getEmailSubject('NEW_MESSAGE', language, details.senderName);
  const title = getEmailContent('NEW_MESSAGE', 'title', language);
  const fromLabel = getEmailContent('NEW_MESSAGE', 'fromLabel', language, details.senderName);
  const viewConversation = getEmailContent('NEW_MESSAGE', 'viewConversation', language);
  const replyNote = getEmailContent('NEW_MESSAGE', 'replyNote', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      paragraph(fromLabel),
      `
      <tr>
        <td style="padding:12px 0;">
          <div style="background:#f8fafc;border-left:4px solid #1d4ed8;padding:16px;border-radius:4px;">
            <p style="color:#475569;margin:0;font-size:15px;">${details.messagePreview}</p>
          </div>
        </td>
      </tr>
      `,
      button(viewConversation, messagesUrl),
      divider(),
      paragraph(replyNote, { size: "13px", color: "#94a3b8" }),
    )}
  `, { previewText: `${subject}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject,
    template: "NEW_MESSAGE",
    htmlContent: html,
    textContent:
      `${title}, ${details.recipientName}!\n\n` +
      `${fromLabel.replace(/<[^>]*>/g, '')}\n\n` +
      `"${details.messagePreview}"\n\n` +
      `${viewConversation}: ${messagesUrl}`,
  });
};

/**
 * Send conversation started notification.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendConversationStartedEmail = async (
  to: string,
  details: {
    recipientName: string;
    expertName: string;
    bookingId: string;
    chatLink: string;
    recipientRole?: "CITIZEN" | "EXPERT" | "ADMIN";
  },
  language: Language = 'en'
): Promise<void> => {
  const chatUrl = details.recipientRole === "EXPERT"
    ? buildUrl(FRONTEND.expertMessages)
    : buildUrl(FRONTEND.clientMessages);
  const subject = getEmailSubject('CHAT_AVAILABLE', language, details.bookingId);
  const title = getEmailContent('CHAT_AVAILABLE', 'title', language);
  const message = getEmailContent('CHAT_AVAILABLE', 'message', language, details.expertName);
  const detailsText = getEmailContent('CHAT_AVAILABLE', 'details', language);
  const openChat = getEmailContent('CHAT_AVAILABLE', 'openChat', language);
  const tipNote = getEmailContent('CHAT_AVAILABLE', 'tipNote', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      paragraph(message),
      paragraph(detailsText),
      button(openChat, chatUrl),
      divider(),
      paragraph(tipNote, { size: "13px", color: "#94a3b8" }),
    )}
  `, { previewText: `${subject}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject,
    template: "CHAT_AVAILABLE",
    htmlContent: html,
    textContent:
      `${title}, ${details.recipientName}!\n\n` +
      `${message.replace(/<[^>]*>/g, '')}\n\n` +
      `${detailsText}\n\n` +
      `${openChat}: ${chatUrl}`,
  });
};

/**
 * Send reschedule request notification.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendRescheduleRequestEmail = async (
  to: string,
  details: {
    recipientName: string;
    serviceName: string;
    currentDate: string;
    currentTime: string;
    newDate: string;
    newTime: string;
    reason?: string;
    rescheduledBy: string;
    bookingId: string;
  },
  language: Language = 'en'
): Promise<void> => {
  const bookingUrl = details.recipientName
    ? buildUrl(FRONTEND.expertBookingsDetail(details.bookingId))
    : buildUrl(FRONTEND.bookings(details.bookingId));
  const subject = getEmailSubject('RESCHEDULE_REQUEST', language, details.serviceName);
  const title = getEmailContent('RESCHEDULE_REQUEST', 'title', language);
  const message = getEmailContent('RESCHEDULE_REQUEST', 'message', language, details.rescheduledBy);
  const reviewRequest = getEmailContent('RESCHEDULE_REQUEST', 'reviewRequest', language);
  const currentTimeLabel = getEmailContent('RESCHEDULE_REQUEST', 'currentTime', language);
  const requestedNewTimeLabel = getEmailContent('RESCHEDULE_REQUEST', 'requestedNewTime', language);
  const reasonLabel = getEmailContent('COMMON', 'reason', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      paragraph(message),
      dataTable(
        tableRow(currentTimeLabel, `${details.currentDate} at ${details.currentTime}`) +
        tableRow(requestedNewTimeLabel, `${details.newDate} at ${details.newTime}`, { bold: true }) +
        (details.reason ? tableRow(reasonLabel, details.reason) : "")
      ),
      button(reviewRequest, bookingUrl),
    )}
  `, { previewText: `${subject}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject,
    htmlContent: html,
  });
};

/**
 * Send reschedule accepted notification.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendRescheduleAcceptedEmail = async (
  to: string,
  details: {
    recipientName: string;
    serviceName: string;
    newDate: string;
    newTime: string;
    approvedBy: string;
    bookingId: string;
  },
  language: Language = 'en'
): Promise<void> => {
  const subject = getEmailSubject('RESCHEDULE_ACCEPTED', language, details.serviceName);
  const title = getEmailContent('RESCHEDULE_ACCEPTED', 'title', language);
  const message = getEmailContent('RESCHEDULE_ACCEPTED', 'message', language, details.approvedBy);
  const newDateLabel = getEmailContent('RESCHEDULE_ACCEPTED', 'newDate', language);
  const newTimeLabel = getEmailContent('RESCHEDULE_ACCEPTED', 'newTime', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      alertBox(message, "success"),
      dataTable(
        tableRow(newDateLabel, details.newDate, { bold: true }) +
        tableRow(newTimeLabel, details.newTime, { bold: true })
      ),
    )}
  `, { previewText: `${subject}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject,
    template: "RESCHEDULE_ACCEPTED",
    htmlContent: html,
  });
};

/**
 * Send reschedule declined notification.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendRescheduleDeclinedEmail = async (
  to: string,
  details: {
    recipientName: string;
    serviceName: string;
    declinedBy: string;
    reason?: string;
  },
  language: Language = 'en'
): Promise<void> => {
  const subject = getEmailSubject('RESCHEDULE_DECLINED', language, details.serviceName);
  const title = getEmailContent('RESCHEDULE_DECLINED', 'title', language);
  const message = getEmailContent('RESCHEDULE_DECLINED', 'message', language, details.declinedBy);
  const reasonLabel = getEmailContent('COMMON', 'reason', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      alertBox(message, "info"),
      details.reason
        ? dataTable(tableRow(reasonLabel, details.reason))
        : "",
    )}
  `, { previewText: `${subject}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject,
    template: "RESCHEDULE_DECLINED",
    htmlContent: html,
  });
};

/**
 * Send expert profile approved notification.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendApprovalEmail = async (
  to: string,
  name: string,
  language: Language = 'en'
): Promise<void> => {
  const dashboardUrl = buildUrl(FRONTEND.expertDashboard);
  const subject = getEmailSubject('PROFILE_APPROVED', language);
  const title = getEmailContent('PROFILE_APPROVED', 'title', language);
  const message = getEmailContent('PROFILE_APPROVED', 'message', language);
  const goToDashboard = getEmailContent('PROFILE_APPROVED', 'goToDashboard', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      alertBox(message, "success"),
      button(goToDashboard, dashboardUrl),
    )}
  `, { previewText: `${subject}`, language });

  await sendEmail({
    to: [{ email: to, name }],
    subject,
    template: "PROFILE_APPROVED",
    htmlContent: html,
  });
};

/**
 * Send expert profile rejected notification.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendRejectionEmail = async (
  to: string,
  name: string,
  reason: string,
  language: Language = 'en'
): Promise<void> => {
  const documentsUrl = buildUrl(FRONTEND.expertVerification);
  const subject = getEmailSubject('PROFILE_REJECTED', language);
  const title = getEmailContent('PROFILE_REJECTED', 'title', language);
  const reviewMessage = getEmailContent('PROFILE_REJECTED', 'reviewMessage', language);
  const reasonLabel = getEmailContent('PROFILE_REJECTED', 'reasonLabel', language);
  const updateMessage = getEmailContent('PROFILE_REJECTED', 'updateMessage', language);
  const resubmitButton = getEmailContent('PROFILE_REJECTED', 'resubmitButton', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      paragraph(reviewMessage),
      alertBox(`<strong>${reasonLabel}</strong> ${reason}`, "error"),
      paragraph(updateMessage),
      button(resubmitButton, documentsUrl),
    )}
  `, { previewText: `${subject}`, language });

  await sendEmail({
    to: [{ email: to, name }],
    subject,
    template: "PROFILE_REJECTED",
    htmlContent: html,
  });
};

/**
 * Send reminder to expert to complete document submission.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendVerificationReminderEmail = async (
  to: string,
  name: string,
  language: Language = 'en'
): Promise<void> => {
  const documentsUrl = buildUrl(FRONTEND.expertVerification);
  const subject = getEmailSubject('VERIFICATION_REMINDER', language);
  const title = getEmailContent('VERIFICATION_REMINDER', 'title', language);
  const adminWaiting = getEmailContent('VERIFICATION_REMINDER', 'adminWaiting', language);
  const uploadMessage = getEmailContent('VERIFICATION_REMINDER', 'uploadMessage', language);
  const uploadButton = getEmailContent('VERIFICATION_REMINDER', 'uploadButton', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      paragraph(adminWaiting),
      paragraph(uploadMessage),
      button(uploadButton, documentsUrl),
    )}
  `, { previewText: `${subject}`, language });

  await sendEmail({
    to: [{ email: to, name }],
    subject,
    template: "VERIFICATION_REMINDER",
    htmlContent: html,
  });
};

/**
 * Send corrections-requested email to expert.
 * 
 * @param language - User's preferred language (en, fr, or rw)
 */
export const sendCorrectionsEmail = async (
  to: string,
  name: string,
  notes: string,
  language: Language = 'en'
): Promise<void> => {
  const documentsUrl = buildUrl(FRONTEND.expertVerification);
  const subject = getEmailSubject('CORRECTIONS_REQUIRED', language);
  const title = getEmailContent('CORRECTIONS_REQUIRED', 'title', language);
  const adminMessage = getEmailContent('CORRECTIONS_REQUIRED', 'adminMessage', language);
  const updateMessage = getEmailContent('CORRECTIONS_REQUIRED', 'updateMessage', language);
  const updateButton = getEmailContent('CORRECTIONS_REQUIRED', 'updateButton', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      paragraph(adminMessage),
      alertBox(notes, "warning"),
      paragraph(updateMessage),
      button(updateButton, documentsUrl),
    )}
  `, { previewText: `${subject}`, language });

  await sendEmail({
    to: [{ email: to, name }],
    subject,
    template: "CORRECTIONS_REQUIRED",
    htmlContent: html,
  });
};

/**
 * Send admin notification for new expert verification request.
 */
export const sendNewVerificationRequestEmail = async (
  to: string,
  adminName: string,
  expertName: string,
  language: Language = 'en'
): Promise<void> => {
  const verificationsUrl = buildUrl(FRONTEND.adminVerifications);
  const t = (key: string) => getEmailContent('NEW_VERIFICATION_REQUEST_ADMIN', key, language, expertName);

  const html = emailLayout(`
    ${contentBlock(
      heading(t('title')),
      paragraph(t('message')),
      paragraph(t('reviewPrompt')),
      button(t('reviewButton'), verificationsUrl),
    )}
  `, { previewText: `New verification request from ${expertName}` });

  await sendEmail({
    to: [{ email: to, name: adminName }],
    subject: getEmailSubject('NEW_VERIFICATION_REQUEST', language),
    template: "NEW_VERIFICATION_REQUEST_ADMIN",
    htmlContent: html,
  });
};

/**
 * Send notification to admins when a new expert registers.
 */
export const sendNewExpertRegistrationEmail = async (
  to: string,
  adminName: string,
  expertName: string,
  expertEmail: string,
  language: Language = 'en'
): Promise<void> => {
  const expertsUrl = buildUrl(FRONTEND.adminExperts);
  const t = (key: string) => getEmailContent('NEW_EXPERT_REGISTRATION', key, language, expertName, expertEmail);

  const html = emailLayout(`
    ${contentBlock(
      heading(t('title')),
      paragraph(t('message')),
      paragraph(t('nextSteps')),
      button(t('viewButton'), expertsUrl),
    )}
  `, { previewText: `New expert registered: ${expertName}` });

  await sendEmail({
    to: [{ email: to, name: adminName }],
    subject: getEmailSubject('NEW_EXPERT_REGISTRATION', language),
    template: "NEW_EXPERT_REGISTRATION",
    htmlContent: html,
  });
};

/**
 * Send verification reminder with missing documents list.
 */
export const sendVerificationReminderDetailedEmail = async (
  to: string,
  name: string,
  missingDocs: string[],
  language: Language = 'en'
): Promise<void> => {
  const profileUrl = buildUrl(FRONTEND.expertProfile);
  const t = (key: string) => getEmailContent('VERIFICATION_REMINDER_DETAILED', key, language, name);

  const missingListHtml = missingDocs.length > 0
    ? `
      <tr>
        <td style="padding:12px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            ${missingDocs.map((d) => `
              <tr>
                <td style="padding:8px 12px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;margin-bottom:4px;font-size:14px;color:#92400e;">
                  ${d}
                </td>
              </tr>
            `).join("")}
          </table>
        </td>
      </tr>`
    : "";

  const html = emailLayout(`
    ${contentBlock(
      heading(t('title')),
      paragraph(t('greeting')),
      paragraph(t('incompleteProfile')),
      missingListHtml,
      divider(),
      paragraph(t('loginPrompt')),
      button(t('completeButton'), profileUrl),
      divider(),
      paragraph(t('timelineNote'), { size: "13px", color: "#94a3b8" }),
    )}
  `, { previewText: "Complete your MyJudicial verification" });

  await sendEmail({
    to: [{ email: to, name }],
    subject: getEmailSubject('VERIFICATION_REMINDER', language),
    template: "VERIFICATION_REMINDER_DETAILED",
    htmlContent: html,
  });
};

/**
 * Send verification rejection with reason.
 */
export const sendVerificationRejectionEmail = async (
  to: string,
  name: string,
  reason: string,
  language: Language = 'en'
): Promise<void> => {
  const profileUrl = buildUrl(FRONTEND.expertProfile);
  const t = (key: string) => getEmailContent('VERIFICATION_REJECTION', key, language, name);

  const html = emailLayout(`
    ${contentBlock(
      heading(t('title')),
      paragraph(t('greeting')),
      paragraph(t('thankYou')),
      alertBox(`<strong>${t('reasonLabel')}</strong><br/>${reason}`, "error"),
      heading(t('nextSteps'), "h3"),
      paragraph(t('steps')),
      button(t('resubmitButton'), profileUrl),
      divider(),
      paragraph(t('teamNote'), { size: "13px", color: "#94a3b8" }),
    )}
  `, { previewText: "Verification documents require attention" });

  await sendEmail({
    to: [{ email: to, name }],
    subject: "Verification Documents Require Attention - MyJudicial",
    template: "VERIFICATION_REJECTION",
    htmlContent: html,
  });
};

/**
 * Send notification when expert profile is reset to draft by admin.
 */
export const sendVerificationResetToDraftEmail = async (
  to: string,
  name: string,
  language: Language = 'en'
): Promise<void> => {
  const profileUrl = buildUrl(FRONTEND.expertProfile);
  const t = (key: string) => getEmailContent('VERIFICATION_RESET', key, language, name);

  const html = emailLayout(`
    ${contentBlock(
      heading(t('title')),
      paragraph(t('greeting')),
      paragraph(t('message')),
      divider(),
      button(t('actionButton'), profileUrl),
      divider(),
      paragraph(t('timelineNote'), { size: "13px", color: "#94a3b8" }),
    )}
  `, { previewText: "Your expert profile has been reset to draft" });

  await sendEmail({
    to: [{ email: to, name }],
    subject: getEmailSubject('VERIFICATION_RESET', language),
    template: "VERIFICATION_RESET",
    htmlContent: html,
  });
};

/**
 * Send a broadcast email from admin to a user.
 */
export const sendBroadcastEmail = async (
  to: string,
  firstName: string,
  title: string,
  message: string,
): Promise<void> => {
  const html = emailLayout(`
    ${contentBlock(
      heading(title),
      paragraph(`Hi ${firstName},`),
      paragraph(message),
      divider(),
      paragraph("This is a broadcast message from the MyJudicial team.", { color: "#94a3b8", size: "13px" }),
    )}
  `, { previewText: title });

  await sendEmail({
    to: [{ email: to, name: firstName }],
    subject: title,
    template: "BROADCAST",
    htmlContent: html,
  });
};

/**
 * Send job application details to the recruiting/support inbox and an acknowledgement to the applicant.
 */
export const sendCareerApplicationEmail = async (params: {
  fullName: string;
  email: string;
  phone?: string;
  roleTitle?: string;
  linkedin?: string;
  portfolio?: string;
  resumeLink?: string;
  resumeFileName?: string;
  resumeBase64?: string;
  coverNote: string;
  careersEmail: string;
}): Promise<void> => {
  const roleName = params.roleTitle || "General Talent Pool";
  const subject = `[Job Application] ${roleName} — ${params.fullName}`;

  const resumeSection = params.resumeLink
    ? `<a href="${params.resumeLink}" target="_blank" style="color:#003366;text-decoration:underline;">${params.resumeLink}</a>`
    : params.resumeFileName
      ? `Attached file: <strong>${params.resumeFileName}</strong>`
      : "Not provided";

  const adminHtml = emailLayout(`
    ${contentBlock(
      heading("New Job Application Received"),
      paragraph(`A new candidate has submitted an expression of interest through the MyJudicial Careers portal.`),
      dataTable([
        tableRow("Target Role", roleName),
        tableRow("Applicant Name", params.fullName),
        tableRow("Email Address", `<a href="mailto:${params.email}" style="color:#003366;">${params.email}</a>`),
        tableRow("Phone Number", params.phone || "Not provided"),
        tableRow("LinkedIn", params.linkedin ? `<a href="${params.linkedin}" target="_blank" style="color:#003366;">${params.linkedin}</a>` : "Not provided"),
        tableRow("Portfolio / GitHub", params.portfolio ? `<a href="${params.portfolio}" target="_blank" style="color:#003366;">${params.portfolio}</a>` : "Not provided"),
        tableRow("Resume / CV", resumeSection),
      ].join("")),
      heading("Cover Note / Why MyJudicial?", "h3"),
      alertBox(params.coverNote.replace(/\n/g, "<br/>"), "info"),
      divider(),
      paragraph("You can reply directly to this email to contact the candidate.", { size: "12px", color: "#64748b" }),
    )}
  `, { previewText: `New Application: ${roleName} — ${params.fullName}` });

  const attachments = params.resumeBase64 && params.resumeFileName
    ? [{ name: params.resumeFileName, content: params.resumeBase64 }]
    : undefined;

  // 1. Send to hiring team
  await sendEmail({
    to: [{ email: params.careersEmail, name: "MyJudicial Recruiting" }],
    replyTo: { email: params.email, name: params.fullName },
    subject,
    template: "CAREER_APPLICATION_INTERNAL",
    htmlContent: adminHtml,
    attachment: attachments,
  });

  // 2. Send acknowledgment to candidate
  const applicantHtml = emailLayout(`
    ${contentBlock(
      heading("Application Received"),
      paragraph(`Dear ${params.fullName},`),
      paragraph(`Thank you for submitting your application for <strong>${roleName}</strong> at MyJudicial.`),
      paragraph(`Our recruiting and leadership team will review your qualifications and experience. If your background aligns with our current hiring requirements, a member of our talent team will reach out directly within 3–5 business days to schedule an introductory conversation.`),
      divider(),
      paragraph("Best regards,<br/><strong>The MyJudicial Team</strong>"),
    )}
  `, { previewText: `Application Received: ${roleName}` });

  await sendEmail({
    to: [{ email: params.email, name: params.fullName }],
    subject: `Application Received: ${roleName} — MyJudicial`,
    template: "CAREER_APPLICATION_ACKNOWLEDGMENT",
    htmlContent: applicantHtml,
  });
};

export const sendContactInquiryEmail = async (params: {
  ticketId: string;
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  reference?: string;
  subject: string;
  message: string;
  supportEmail: string;
}): Promise<void> => {
  const categoryNames: Record<string, string> = {
    client: "Citizen & Client Support",
    advocate: "Advocate & Bar Roll Verification",
    institutional: "Institutional Partnerships",
    general: "General Inquiry",
  };
  const categoryTitle = categoryNames[params.department] || params.department;
  const adminSubject = `[Inquiry #${params.ticketId}] [${categoryTitle}] ${params.subject} — ${params.fullName}`;

  const adminHtml = emailLayout(`
    ${contentBlock(
      heading(`New Inquiry Received: #${params.ticketId}`),
      paragraph(`A new message was submitted through the MyJudicial Contact Portal.`),
      dataTable([
        tableRow("Ticket ID", params.ticketId),
        tableRow("Department", categoryTitle),
        tableRow("Full Name", params.fullName),
        tableRow("Email Address", `<a href="mailto:${params.email}" style="color:#003366;">${params.email}</a>`),
        tableRow("Phone Number", params.phone || "Not provided"),
        tableRow("Case / Booking Ref", params.reference || "None"),
        tableRow("Subject", params.subject),
      ].join("")),
      heading("Inquiry Message", "h3"),
      alertBox(params.message.replace(/\n/g, "<br/>"), "info"),
      divider(),
      paragraph("Reply directly to this email to respond to the sender.", { size: "12px", color: "#64748b" }),
    )}
  `, { previewText: `Inquiry #${params.ticketId} from ${params.fullName} (${categoryTitle})` });

  // 1. Send to legal operations / support desk
  await sendEmail({
    to: [{ email: params.supportEmail, name: "MyJudicial Legal Operations" }],
    replyTo: { email: params.email, name: params.fullName },
    subject: adminSubject,
    template: "CONTACT_INQUIRY_INTERNAL",
    htmlContent: adminHtml,
  });

  // 2. Send acknowledgment to sender
  const userHtml = emailLayout(`
    ${contentBlock(
      heading("We Received Your Message"),
      paragraph(`Dear ${params.fullName},`),
      paragraph(`Thank you for contacting MyJudicial. Your inquiry has been received by our legal operations desk and logged under reference ticket:`),
      `<div style="margin: 20px 0; padding: 14px 20px; background: #f0f4f8; border: 1px solid #d9e2ec; border-radius: 12px; text-align: center; font-family: monospace; font-size: 18px; font-weight: bold; color: #003366; letter-spacing: 1px;">${params.ticketId}</div>`,
      paragraph(`<strong>Department:</strong> ${categoryTitle}<br/><strong>Subject:</strong> ${params.subject}`),
      paragraph(`Our team in Kigali reviews incoming matters during business hours (Monday – Friday, 8:00 AM – 6:00 PM CAT). You can expect a response to this email within <strong>2 business hours</strong>.`),
      divider(),
      paragraph("Warm regards,<br/><strong>MyJudicial Legal Operations Desk</strong><br/>Kigali, Rwanda"),
    )}
  `, { previewText: `Inquiry Received: Ticket #${params.ticketId}` });

  await sendEmail({
    to: [{ email: params.email, name: params.fullName }],
    subject: `Inquiry Received: Ticket #${params.ticketId} — MyJudicial`,
    template: "CONTACT_INQUIRY_ACKNOWLEDGMENT",
    htmlContent: userHtml,
  });
};

/**
 * Notify client that the expert has marked the consultation as delivered.
 * Alerts them to review, confirm, or report an issue within 24 hours before auto-release.
 */
export const sendConsultationDeliveredEmail = async (
  to: string,
  details: {
    recipientName: string;
    expertName: string;
    serviceName: string;
    bookingId: string;
    deliverySummary?: string | null;
  },
  language: Language = 'en'
): Promise<void> => {
  const bookingUrl = buildUrl(FRONTEND.bookings(details.bookingId));
  const t = (key: string) => getEmailContent('CONSULTATION_DELIVERED', key, language);

  const expertLabel = getEmailContent('BOOKING_CONFIRMED', 'expert', language);
  const serviceLabel = getEmailContent('BOOKING_CONFIRMED', 'service', language);
  const referenceLabel = getEmailContent('BOOKING_CONFIRMED', 'reference', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(t('title')),
      paragraph(getEmailContent('CONSULTATION_DELIVERED', 'message', language, details.expertName)),
      alertBox(t('autoReleaseWarning'), "warning"),
      dataTable(
        tableRow(expertLabel, details.expertName, { bold: true }) +
        tableRow(serviceLabel, details.serviceName) +
        tableRow(referenceLabel, details.bookingId, { bold: false, color: "#94a3b8" }) +
        (details.deliverySummary ? tableRow(t('expertNotesLabel'), details.deliverySummary) : "")
      ),
      button(t('confirmButton'), bookingUrl),
      divider(),
      paragraph(t('disputeHint'), { size: "13px", color: "#64748b" }),
    )}
  `, { previewText: `Action required: Confirm consultation with ${details.expertName}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject: getEmailSubject('CONSULTATION_DELIVERED', language, details.serviceName),
    template: "CONSULTATION_DELIVERED",
    htmlContent: html,
  });
};

/**
 * Notify expert and admin that a client reported an issue on a delivered consultation.
 */
export const sendConsultationIssueReportedEmail = async (
  to: string,
  details: {
    recipientName: string;
    clientName: string;
    serviceName: string;
    bookingId: string;
    reason: string;
    isAdminNotification?: boolean;
  },
  language: Language = 'en'
): Promise<void> => {
  const bookingUrl = buildUrl(
    details.isAdminNotification
      ? `/admin/dashboard/bookings/${details.bookingId}`
      : FRONTEND.expertBookingsDetail(details.bookingId)
  );
  const t = (key: string) => getEmailContent('CONSULTATION_ISSUE_REPORTED', key, language);
  const clientLabel = getEmailContent('COMMON', 'client', language);
  const serviceLabel = getEmailContent('BOOKING_CONFIRMED', 'service', language);
  const referenceLabel = getEmailContent('BOOKING_CONFIRMED', 'reference', language);

  const html = emailLayout(`
    ${contentBlock(
      heading(t('title')),
      paragraph(getEmailContent('CONSULTATION_ISSUE_REPORTED', 'messageCitizen', language, details.clientName)),
      alertBox(`<strong>${t('reasonLabel')}</strong> ${details.reason}`, "error"),
      dataTable(
        tableRow(clientLabel, details.clientName, { bold: true }) +
        tableRow(serviceLabel, details.serviceName) +
        tableRow(referenceLabel, details.bookingId, { bold: false, color: "#94a3b8" })
      ),
      button(t('viewBookingButton'), bookingUrl),
      divider(),
      paragraph(t('actionAdvice'), { size: "13px", color: "#64748b" }),
    )}
  `, { previewText: `Issue reported on booking ${details.bookingId}` });

  await sendEmail({
    to: [{ email: to, name: details.recipientName }],
    subject: getEmailSubject('CONSULTATION_ISSUE_REPORTED', language, details.bookingId),
    template: "CONSULTATION_ISSUE_REPORTED",
    htmlContent: html,
  });
};




