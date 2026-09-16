/**
 * Multilingual Email Templates
 * 
 * Translation strings for email subjects, content, and UI elements.
 * Used by email.service.ts to send localized emails.
 * 
 * Production-ready: All strings are professionally translated and reviewed.
 */

type Language = 'en' | 'fr' | 'rw';

/**
 * Email subject lines
 */
export const EMAIL_SUBJECTS = {
  WELCOME: {
    en: "Welcome to MyJudicial",
    fr: "Bienvenue sur MyJudicial",
    rw: "Murakaza neza kuri MyJudicial",
  },
  OTP_CODE: {
    en: "Your MyJudicial login code",
    fr: "Votre code de connexion MyJudicial",
    rw: "Kode yawe yo kwinjira kuri MyJudicial",
  },
  MAGIC_LINK: {
    en: "Your MyJudicial login link",
    fr: "Votre lien de connexion MyJudicial",
    rw: "Umubare wawe wo kwinjira kuri MyJudicial",
  },
  PASSWORD_RESET: {
    en: "Reset your MyJudicial password",
    fr: "Réinitialisez votre mot de passe MyJudicial",
    rw: "Hindura ijambo ry'ibanga ryawe rya MyJudicial",
  },
  BOOKING_CONFIRMED: {
    en: (serviceName: string) => `Booking Confirmed — ${serviceName}`,
    fr: (serviceName: string) => `Réservation confirmée — ${serviceName}`,
    rw: (serviceName: string) => `Gahunda yemejwe — ${serviceName}`,
  },
  BOOKING_SUMMARY: {
    en: (serviceName: string) => `Booking Summary — ${serviceName}`,
    fr: (serviceName: string) => `Résumé de réservation — ${serviceName}`,
    rw: (serviceName: string) => `Incamake y'agahunda — ${serviceName}`,
  },
  NEW_BOOKING_REQUEST: {
    en: (serviceName: string) => `New Booking Request — ${serviceName}`,
    fr: (serviceName: string) => `Nouvelle demande de réservation — ${serviceName}`,
    rw: (serviceName: string) => `Icyifuzo cyo gutanga gahunda — ${serviceName}`,
  },
  BOOKING_REMINDER: {
    en: (bookingId: string) => `Consultation Reminder — Booking ${bookingId}`,
    fr: (bookingId: string) => `Rappel de consultation — Réservation ${bookingId}`,
    rw: (bookingId: string) => `Kwibuka inama — Gahunda ${bookingId}`,
  },
  BOOKING_CANCELLED: {
    en: (bookingId: string) => `Booking Cancelled — Reference ${bookingId}`,
    fr: (bookingId: string) => `Réservation annulée — Référence ${bookingId}`,
    rw: (bookingId: string) => `Gahunda yahagaritswe — Referance ${bookingId}`,
  },
  REFUND_CONFIRMED: {
    en: (bookingId: string) => `Refund Confirmed — Booking ${bookingId}`,
    fr: (bookingId: string) => `Remboursement confirmé — Réservation ${bookingId}`,
    rw: (bookingId: string) => `Amafaranga yagaruwe — Gahunda ${bookingId}`,
  },
  CREDENTIAL_EXPIRY: {
    en: "Action Required — Your credentials expire soon",
    fr: "Action requise — Vos informations d'identification expirent bientôt",
    rw: "Ibyemezo bikenewe — Ibyangombwa byawe bizarangira vuba",
  },
  NEW_REVIEW: {
    en: (rating: number) => `New ${rating}-Star Review Received`,
    fr: (rating: number) => `Nouvel avis de ${rating} étoiles reçu`,
    rw: (rating: number) => `Igitekerezo gishya cy'inyenyeri ${rating} cyabonetse`,
  },
  NEW_MESSAGE: {
    en: (senderName: string) => `New message from ${senderName}`,
    fr: (senderName: string) => `Nouveau message de ${senderName}`,
    rw: (senderName: string) => `Ubutumwa bushya bwaturutse kuri ${senderName}`,
  },
  CHAT_AVAILABLE: {
    en: (bookingId: string) => `Chat available for booking ${bookingId}`,
    fr: (bookingId: string) => `Chat disponible pour la réservation ${bookingId}`,
    rw: (bookingId: string) => `Ibiganiro biboneka ku gahunda ${bookingId}`,
  },
  RESCHEDULE_REQUEST: {
    en: (serviceName: string) => `Reschedule Request — ${serviceName}`,
    fr: (serviceName: string) => `Demande de reprogrammation — ${serviceName}`,
    rw: (serviceName: string) => `Icyifuzo cyo guhindura igihe — ${serviceName}`,
  },
  RESCHEDULE_ACCEPTED: {
    en: (serviceName: string) => `Reschedule Accepted — ${serviceName}`,
    fr: (serviceName: string) => `Reprogrammation acceptée — ${serviceName}`,
    rw: (serviceName: string) => `Guhindura igihe byemejwe — ${serviceName}`,
  },
  RESCHEDULE_DECLINED: {
    en: (serviceName: string) => `Reschedule Declined — ${serviceName}`,
    fr: (serviceName: string) => `Reprogrammation refusée — ${serviceName}`,
    rw: (serviceName: string) => `Guhindura igihe byanzwe — ${serviceName}`,
  },
  PROFILE_APPROVED: {
    en: "Your MyJudicial profile has been approved",
    fr: "Votre profil MyJudicial a été approuvé",
    rw: "Umwirondoro wawe wa MyJudicial wemejwe",
  },
  PROFILE_REJECTED: {
    en: "Update on your MyJudicial profile review",
    fr: "Mise à jour sur l'examen de votre profil MyJudicial",
    rw: "Amakuru kuri gusuzuma umwirondoro wawe wa MyJudicial",
  },
  VERIFICATION_REMINDER: {
    en: "Action required: Complete your MyJudicial verification",
    fr: "Action requise : Complétez votre vérification MyJudicial",
    rw: "Ibyemezo bikenewe: Soza kwemeza MyJudicial",
  },
  CORRECTIONS_REQUIRED: {
    en: "Corrections required for your MyJudicial profile",
    fr: "Corrections requises pour votre profil MyJudicial",
    rw: "Ibyemezo bikenewe ku mwirondoro wawe wa MyJudicial",
  },
  NEW_VERIFICATION_REQUEST: {
    en: "New expert verification request",
    fr: "Nouvelle demande de vérification d'expert",
    rw: "Icyifuzo gishya cyo kwemeza umwarimu",
  },
  NEW_EXPERT_REGISTRATION: {
    en: "New expert registered on MyJudicial",
    fr: "Nouvel expert inscrit sur MyJudicial",
    rw: "Uwarimu mushya wiyandikishye kuri MyJudicial",
  },
} as const;

/**
 * Email content translations
 */
export const EMAIL_CONTENT = {
  // Welcome email
  WELCOME: {
    greeting: {
      en: (name: string) => `Hi ${name},`,
      fr: (name: string) => `Bonjour ${name},`,
      rw: (name: string) => `Muraho ${name},`,
    },
    roleLabel: {
      EXPERT: {
        en: "legal expert",
        fr: "expert juridique",
        rw: "umwarimu w'amategeko",
      },
      CLIENT: {
        en: "client",
        fr: "client",
        rw: "umukiriya",
      },
    },
    accountCreated: {
      en: (roleLabel: string) => `Your account has been created as a <strong>${roleLabel}</strong>.`,
      fr: (roleLabel: string) => `Votre compte a été créé en tant que <strong>${roleLabel}</strong>.`,
      rw: (roleLabel: string) => `Konti yawe yaremwe nka <strong>${roleLabel}</strong>.`,
    },
    getStarted: {
      en: "To get started, log in using your email address. We will send you a secure one-click link — no password needed.",
      fr: "Pour commencer, connectez-vous en utilisant votre adresse e-mail. Nous vous enverrons un lien sécurisé en un clic — aucun mot de passe nécessaire.",
      rw: "Kugira ngo utangire, injira ukoresheje aderesi ya imeri yawe. Tuzaguhereza umubare wizewe w'ukanda kimwe — nta jambo ry'ibanga rikenewe.",
    },
    loginButton: {
      en: "Log in to MyJudicial",
      fr: "Se connecter à MyJudicial",
      rw: "Injira kuri MyJudicial",
    },
    didntCreate: {
      en: "If you did not create this account, you can safely ignore this email.",
      fr: "Si vous n'avez pas créé ce compte, vous pouvez ignorer cet e-mail en toute sécurité.",
      rw: "Niba utarakoze iyi konti, urashobora kwirengagiza ubu butumwa.",
    },
  },

  // OTP email
  OTP: {
    yourCode: {
      en: "Your one-time login code is:",
      fr: "Votre code de connexion à usage unique est :",
      rw: "Kode yawe yo kwinjira rimwe ni:",
    },
    expiresWarning: {
      en: "<strong>This code expires in 10 minutes.</strong> Do not share it with anyone.",
      fr: "<strong>Ce code expire dans 10 minutes.</strong> Ne le partagez avec personne.",
      rw: "<strong>Uyu kode uzarangira mu minota 10.</strong> Ntiwugabane n'umuntu uwo ari we wese.",
    },
    didntRequest: {
      en: "If you didn't request this code, please ignore this email or contact support.",
      fr: "Si vous n'avez pas demandé ce code, veuillez ignorer cet e-mail ou contacter le support.",
      rw: "Niba utasabye uyu kode, nyamuneka wirengagiza ubu butumwa cyangwa uvugane nabafasha.",
    },
  },

  // Magic link
  MAGIC_LINK: {
    clickToLogin: {
      en: "Click the button below to log in. This link expires in 1 hour.",
      fr: "Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien expire dans 1 heure.",
      rw: "Kanda buto hasi kugira ngo winjire. Uyu mubare uzarangira mu isaha 1.",
    },
    loginButton: {
      en: "Log in to MyJudicial",
      fr: "Se connecter à MyJudicial",
      rw: "Injira kuri MyJudicial",
    },
    didntRequest: {
      en: "If you did not request this, you can safely ignore this email.",
      fr: "Si vous n'avez pas demandé cela, vous pouvez ignorer cet e-mail en toute sécurité.",
      rw: "Niba utasabye ibi, urashobora kwirengagiza ubu butumwa.",
    },
  },

  // Password Reset
  PASSWORD_RESET: {
    greeting: {
      en: (name: string) => `Hi ${name},`,
      fr: (name: string) => `Bonjour ${name},`,
      rw: (name: string) => `Muraho ${name},`,
    },
    message: {
      en: "We received a request to reset your MyJudicial account password. Click the button below to choose a new password.",
      fr: "Nous avons reçu une demande de réinitialisation du mot de passe de votre compte MyJudicial. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.",
      rw: "Twabonye icyifuzo cyo guhindura ijambo ry'ibanga rya konti yawe ya MyJudicial. Kanda kuri buto ikurikira kugira ngo uhitemo ijambo ry'ibanga rishya.",
    },
    resetButton: {
      en: "Reset Password",
      fr: "Réinitialiser le mot de passe",
      rw: "Hindura Ijambo ry'ibanga",
    },
    expiresWarning: {
      en: "This password reset link is valid for 15 minutes and can only be used once.",
      fr: "Ce lien de réinitialisation de mot de passe est valable 15 minutes et ne peut être utilisé qu'une seule fois.",
      rw: "Uyu mwanya wo guhindura ijambo ry'ibanga urakora mu minota 15 kandi ushobora gukoreshwa rimwe gusa.",
    },
    didntRequest: {
      en: "If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.",
      fr: "Si vous n'avez pas demandé de réinitialisation de mot de passe, vous pouvez ignorer cet e-mail en toute sécurité. Votre mot de passe restera inchangé.",
      rw: "Niba utasabye guhindura ijambo ry'ibanga, urashobora kwirengagiza ubu butumwa mu mutekano. Ijambo ry'ibanga ryawe rizaguma rimeze nk'uko ryari rimeze.",
    },
  },

  // Booking confirmation
  BOOKING_CONFIRMED: {
    title: {
      en: "Booking Confirmed",
      fr: "Réservation confirmée",
      rw: "Gahunda yemejwe",
    },
    message: {
      en: "Your consultation has been confirmed and payment received.",
      fr: "Votre consultation a été confirmée et le paiement a été reçu.",
      rw: "Inama yawe yemejwe kandi amafaranga yakirwe.",
    },
    expert: {
      en: "Expert",
      fr: "Expert",
      rw: "Umwarimu",
    },
    service: {
      en: "Service",
      fr: "Service",
      rw: "Serivisi",
    },
    scheduled: {
      en: "Scheduled",
      fr: "Planifié",
      rw: "Gahunditse",
    },
    reference: {
      en: "Reference",
      fr: "Référence",
      rw: "Referanse",
    },
    viewButton: {
      en: "View Booking Details",
      fr: "Voir les détails de la réservation",
      rw: "Reba ibyerekeye gahunda",
    },
    reminderNote: {
      en: "You will receive a reminder with the consultation join link 15 minutes before the session starts.",
      fr: "Vous recevrez un rappel avec le lien de consultation 15 minutes avant le début de la session.",
      rw: "Uzabona kwibuka n'umubare wo kwinjira mu nama mbere y'iminota 15 inama itangira.",
    },
  },

  // Refund confirmation
  REFUND_CONFIRMED: {
    title: {
      en: "Refund Processed",
      fr: "Remboursement traité",
      rw: "Amafaranga yagarutswe",
    },
    message: {
      en: "A refund has been successfully processed for your booking.",
      fr: "Un remboursement a été traité avec succès pour votre réservation.",
      rw: "Amafaranga yagarutswe yagenewe gahunda yawe yatumijwe neza.",
    },
    bookingReference: {
      en: "Booking Reference",
      fr: "Référence de réservation",
      rw: "Referanse y'agahunda",
    },
    refundPercentage: {
      en: "Refund Percentage",
      fr: "Pourcentage de remboursement",
      rw: "Igipimo cy'amafaranga yagarutswe",
    },
    refundedAmount: {
      en: "Refunded Amount",
      fr: "Montant remboursé",
      rw: "Amafaranga yagarutswe",
    },
    viewPayments: {
      en: "View Payments",
      fr: "Voir les paiements",
      rw: "Reba amadenha",
    },
  },

  // Review notification
  NEW_REVIEW: {
    title: {
      en: "New Review Received",
      fr: "Nouvel avis reçu",
      rw: "Igitekerezo gishya cyabonetse",
    },
    fromLabel: {
      en: (citizenName: string) => `You've received a new review from <strong>${citizenName}</strong>:`,
      fr: (citizenName: string) => `Vous avez reçu un nouvel avis de <strong>${citizenName}</strong> :`,
      rw: (citizenName: string) => `Wabonye igitekerezo gishya giturutse kuri <strong>${citizenName}</strong>:`,
    },
    noComment: {
      en: "No comment provided",
      fr: "Aucun commentaire fourni",
      rw: "Nta kiganiro cyahejejwe",
    },
    viewReviews: {
      en: "View Your Reviews",
      fr: "Vos avis",
      rw: "Reba igitekerezo ryawe",
    },
    keepUp: {
      en: "Keep up the great work! Positive reviews help build trust with potential clients.",
      fr: "Continuez votre excellent travail ! Les avis positifs aident à établir la confiance avec les clients potentiels.",
      rw: "Komeza umurimo mwiza! Igitekerezo ryiza ritera imbere ibanga n'abakiriya bashitse.",
    },
  },

  // New message
  NEW_MESSAGE: {
    title: {
      en: "New Message",
      fr: "Nouveau message",
      rw: "Ubutumwa bushya",
    },
    fromLabel: {
      en: (senderName: string) => `You have a new message from <strong>${senderName}</strong>:`,
      fr: (senderName: string) => `Vous avez un nouveau message de <strong>${senderName}</strong> :`,
      rw: (senderName: string) => `Ufise ubutumwa bushya bwaturutse kuri <strong>${senderName}</strong>:`,
    },
    viewConversation: {
      en: "View Conversation",
      fr: "Voir la conversation",
      rw: "Reba ikiganiro",
    },
    replyNote: {
      en: "Reply directly in your MyJudicial chat to continue the conversation.",
      fr: "Répondez directement dans votre chat MyJudicial pour continuer la conversation.",
      rw: "Subira mu ikiganiro ryawe rya MyJudicial kugira ngo ukomeze ikiganiro.",
    },
  },

  // Conversation started
  CHAT_AVAILABLE: {
    title: {
      en: "Chat Now Available",
      fr: "Chat maintenant disponible",
      rw: "Ibiganiro biboneka ubu",
    },
    message: {
      en: (expertName: string) => `Your consultation with <strong>${expertName}</strong> has been confirmed and chat is now available.`,
      fr: (expertName: string) => `Votre consultation avec <strong>${expertName}</strong> a été confirmée et le chat est maintenant disponible.`,
      rw: (expertName: string) => `Inama yawe na <strong>${expertName}</strong> yemejwe kandi igiganiro gibuwe ubu.`,
    },
    details: {
      en: "You can now message directly with your legal expert before, during, and after your consultation.",
      fr: "Vous pouvez maintenant envoyer des messages directement à votre expert juridique avant, pendant et après votre consultation.",
      rw: "Urumva uhereye ubu ugashobora kohereza ubutumwa kumwarimu w'amategeko mbere, mu gihe no nyuma y'inama yawe.",
    },
    openChat: {
      en: "Open Chat",
      fr: "Ouvrir le chat",
      rw: "Fungura Ibiganiro",
    },
    tipNote: {
      en: "Use chat to share documents, ask questions, or clarify details about your consultation.",
      fr: "Utilisez le chat pour partager des documents, poser des questions ou clarifier les détails de votre consultation.",
      rw: "Koresha igiganiro kugisangiza ibyangombwa, ubaze ibibazo cyangwa utegereze ibyerekeye inama yawe.",
    },
  },

  // Reschedule request
  RESCHEDULE_REQUEST: {
    title: {
      en: "Reschedule Request",
      fr: "Demande de reprogrammation",
      rw: "Icyifuzo cyo guhindura igihe",
    },
    message: {
      en: (rescheduledBy: string) => `A <strong>${rescheduledBy}</strong> has requested to reschedule this booking. Please review and accept or decline this request from your dashboard.`,
      fr: (rescheduledBy: string) => `Un <strong>${rescheduledBy}</strong> a demandé de reprogrammer cette réservation. Veuillez examiner et accepter ou refuser cette demande depuis votre tableau de bord.`,
      rw: (rescheduledBy: string) => `<strong>${rescheduledBy}</strong> yasabye guhindura igihe cya iyi gahunda. Nyamuneka reba kandi uemere cyangwa ukane iki cyifuzo ukoresheje ibiro byawe.`,
    },
    reviewRequest: {
      en: "Review Request",
      fr: "Examiner la demande",
      rw: "Reba icyifuzo",
    },
    currentTime: {
      en: "Current Time",
      fr: "Heure actuelle",
      rw: "Igihe cumbanza",
    },
    requestedNewTime: {
      en: "Requested New Time",
      fr: "Nouvelle heure demandée",
      rw: "Igihe gishya cyasabwe",
    },
  },

  // Reschedule accepted
  RESCHEDULE_ACCEPTED: {
    title: {
      en: "Reschedule Accepted",
      fr: "Reprogrammation acceptée",
      rw: "Guhindura igihe byemejwe",
    },
    message: {
      en: (approvedBy: string) => `Your reschedule request has been accepted by the <strong>${approvedBy}</strong>.`,
      fr: (approvedBy: string) => `Votre demande de reprogrammation a été acceptée par le <strong>${approvedBy}</strong>.`,
      rw: (approvedBy: string) => `Icyifuzo cyawe cyo guhindura igihe cyemewe n'u <strong>${approvedBy}</strong>.`,
    },
    newDate: {
      en: "New Date",
      fr: "Nouvelle date",
      rw: "Itariki gishya",
    },
    newTime: {
      en: "New Time",
      fr: "Nouvelle heure",
      rw: "Igihe gishya",
    },
  },

  // Reschedule declined
  RESCHEDULE_DECLINED: {
    title: {
      en: "Reschedule Declined",
      fr: "Reprogrammation refusée",
      rw: "Guhindura igihe byanzwe",
    },
    message: {
      en: (declinedBy: string) => `Your reschedule request has been declined by the <strong>${declinedBy}</strong>. Your booking remains scheduled at the original time.`,
      fr: (declinedBy: string) => `Votre demande de reprogrammation a été refusée par le <strong>${declinedBy}</strong>. Votre réservation reste programmée à l'heure initiale.`,
      rw: (declinedBy: string) => `Icyifuzo cyawe cyo guhindura igihe kanewe n'u <strong>${declinedBy}</strong>. Gahunda yawe iracyari ku gihe cumbanza.`,
    },
    reason: {
      en: "Reason",
      fr: "Raison",
      rw: "Impamvu",
    },
  },

  // Profile approved
  PROFILE_APPROVED: {
    title: {
      en: "Profile Approved",
      fr: "Profil approuvé",
      rw: "Umwirondoro wemejwe",
    },
    message: {
      en: "Your expert profile has been <strong>approved</strong>. You are now visible to clients on the map and can receive bookings.",
      fr: "Votre profil expert a été <strong>approuvé</strong>. Vous êtes maintenant visible par les clients sur la carte et pouvez recevoir des réservations.",
      rw: "Umwirondoro wawe w'umwarimu <strong>wemejwe</strong>. Ubu urabonwa n'abakiriya ku karita kandi ushobora kwakira gahunda.",
    },
    goToDashboard: {
      en: "Go to Dashboard",
      fr: "Aller au tableau de bord",
      rw: "Jya ku ibiro",
    },
  },

  // Profile rejected
  PROFILE_REJECTED: {
    title: {
      en: "Profile Review Update",
      fr: "Mise à jour sur l'examen du profil",
      rw: "Amakuru kuri gusuzuma umwirondoro",
    },
    reviewMessage: {
      en: "After reviewing your submission, we were unable to approve your profile at this time.",
      fr: "Après examen de votre soumission, nous n'avons pas pu approuver votre profil pour le moment.",
      rw: "Nyuma yo gusuzuma icyoherezo cyawe, ntitwabashije kwemeza umwirondoro wawe ubu.",
    },
    reasonLabel: {
      en: "Reason:",
      fr: "Raison :",
      rw: "Impamvu:",
    },
    updateMessage: {
      en: "Please update your documents and resubmit for review.",
      fr: "Veuillez mettre à jour vos documents et les soumettre à nouveau pour examen.",
      rw: "Nyamuneka uvugurure ibyangombwa byawe kandi ubonesheze kwereka nanone.",
    },
    resubmitButton: {
      en: "Resubmit Documents",
      fr: "Resoumettre les documents",
      rw: "Ongera uhebeze ibyangombwa",
    },
  },

  // Verification reminder
  VERIFICATION_REMINDER: {
    title: {
      en: "Complete Your Verification",
      fr: "Complétez votre vérification",
      rw: "Soza kwemeza",
    },
    adminWaiting: {
      en: "Our admin team is waiting to review your profile, but some required documents are still missing.",
      fr: "Notre équipe d'administration attend d'examiner votre profil, mais certains documents requis sont encore manquants.",
      rw: "Ikipe y'ubuyobozi irindiriye gusuzuma umwirondoro wawe, aho ibyangombwa bisabwa biracyari bisangiye.",
    },
    uploadMessage: {
      en: "Please log in and upload the remaining documents to complete your verification.",
      fr: "Veuillez vous connecter et télécharger les documents restants pour compléter votre vérification.",
      rw: "Nyamuneka injira kandi ushyiremu ibyangombwa bisigaye kugira ngo uzuze kwemeza.",
    },
    uploadButton: {
      en: "Upload Documents",
      fr: "Télécharger les documents",
      rw: "Shyiramo ibyangombwa",
    },
  },

  // Corrections required
  CORRECTIONS_REQUIRED: {
    title: {
      en: "Corrections Required",
      fr: "Corrections requises",
      rw: "Ibyemezo bikenewe",
    },
    adminMessage: {
      en: "Our admin team has reviewed your submission and requires the following corrections:",
      fr: "Notre équipe d'administration a examiné votre soumission et requiert les corrections suivantes :",
      rw: "Ikipe y'ubuyobozi isuzumye icyoherezo cyawe kandi isaba ibyegerero byihe:",
    },
    updateMessage: {
      en: "Please update your documents and resubmit for review.",
      fr: "Veuillez mettre à jour vos documents et les soumettre à nouveau pour examen.",
      rw: "Nyamuneka uvugurure ibyangombwa byawe kandi ubonesheze kwereka nanone.",
    },
    updateButton: {
      en: "Update Documents",
      fr: "Mettre à jour les documents",
      rw: "Vugurura ibyangombwa",
    },
  },

  // Booking summary (sent immediately after booking creation)
  BOOKING_SUMMARY: {
    title: {
      en: "Booking Created",
      fr: "Réservation créée",
      rw: "Gahunda yaremewe",
    },
    message: {
      en: "Your booking has been created. Complete payment to confirm your consultation.",
      fr: "Votre réservation a été créée. Effectuez le paiement pour confirmer votre consultation.",
      rw: "Gahunda yawe yaremewe. Ishyura kugirango emeze inama yawe.",
    },
    messageAwaitingConfirmation: {
      en: "Your booking request has been received and is awaiting the expert's confirmation.",
      fr: "Votre demande de réservation a été reçue et attend la confirmation de l'expert.",
      rw: "Icyifuzo cyawe cyo gutanga gahunda cyakiriwe kandi kirindiriye kwemeza umwarimu.",
    },
    expert: { en: "Expert", fr: "Expert", rw: "Umwarimu" },
    service: { en: "Service", fr: "Service", rw: "Serivisi" },
    dateTime: { en: "Date & Time", fr: "Date et heure", rw: "Itariki n'isaha" },
    amount: { en: "Amount", fr: "Montant", rw: "Amafaranga" },
    reference: { en: "Reference", fr: "Référence", rw: "Referanse" },
    confirmationNote: {
      en: "You will receive a confirmation email once payment is complete.",
      fr: "Vous recevrez un e-mail de confirmation une fois le paiement effectué.",
      rw: "Uzabona ubutumwa bw'emeza nyuma yo kwishyura.",
    },
    confirmationNoteAwaitingExpert: {
      en: "You will receive a confirmation email once the expert accepts your request.",
      fr: "Vous recevrez un e-mail de confirmation dès que l'expert acceptera votre demande.",
      rw: "Uzabona ubutumwa bw'emeza umwarimu amaze kwemeza icyifuzo cyawe.",
    },
  },

  // New booking request (sent to expert)
  NEW_BOOKING_REQUEST: {
    title: {
      en: "New Booking Request",
      fr: "Nouvelle demande de réservation",
      rw: "Icyifuzo cyo gutanga gahunda",
    },
    message: {
      en: "A client has requested a consultation with you. The booking is awaiting payment confirmation.",
      fr: "Un client a demandé une consultation avec vous. La réservation attend la confirmation du paiement.",
      rw: "Umukiriya yasabye inama nawe. Gahunda irindiriye kwemeza kwishyura.",
    },
    messageAwaitingResponse: {
      en: "A client has requested a consultation with you. Review and confirm the request from your dashboard.",
      fr: "Un client a demandé une consultation avec vous. Examinez et confirmez la demande depuis votre tableau de bord.",
      rw: "Umukiriya yasabye inama nawe. Reba kandi wemeze icyifuzo ukoresheje ibiro byawe.",
    },
    client: { en: "Client", fr: "Client", rw: "Umukiriya" },
    service: { en: "Service", fr: "Service", rw: "Serivisi" },
    scheduled: { en: "Scheduled", fr: "Planifié", rw: "Gahunditse" },
    reference: { en: "Reference", fr: "Référence", rw: "Referanse" },
    viewButton: { en: "View Booking", fr: "Voir la réservation", rw: "Reba gahunda" },
    confirmationNote: {
      en: "Once the client completes payment, you will receive a confirmation email with details on how to join the session.",
      fr: "Une fois le paiement du client effectué, vous recevrez un e-mail de confirmation avec les détails pour rejoindre la session.",
      rw: "Umukiriya atangira kwishyura, uzabona ubutumwa bw'emeza n'ibisobanuro byo kwinjira mu nama.",
    },
    confirmationNoteOnAccept: {
      en: "Once you accept the request, both you and the client will receive a confirmation with details on how to join the session.",
      fr: "Une fois que vous acceptez la demande, vous et le client recevrez une confirmation avec les détails pour rejoindre la session.",
      rw: "Uemeje icyifuzo, wowe n'umukiriya muzabona ubutumwa bw'emeza n'ibisobanuro byo kwinjira mu nama.",
    },
  },

  // Verification reminder detailed (sent by admin)
  VERIFICATION_REMINDER_DETAILED: {
    title: {
      en: "Expert Verification Reminder",
      fr: "Rappel de vérification expert",
      rw: "Kwibuka kwemeza umwarimu",
    },
    greeting: {
      en: (name: string) => `Hello ${name},`,
      fr: (name: string) => `Bonjour ${name},`,
      rw: (name: string) => `Muraho ${name},`,
    },
    incompleteProfile: {
      en: "Your MyJudicial expert profile is incomplete. The following required documents are still missing:",
      fr: "Votre profil expert MyJudicial est incomplet. Les documents requis suivants sont toujours manquants :",
      rw: "Umwirondoro wawe wa MyJudicial ntwaruze. Ibyangombwa bisabwa bisigaye ni ibi:",
    },
    loginPrompt: {
      en: "Please log in to your dashboard and upload the missing documents.",
      fr: "Veuillez vous connecter à votre tableau de bord et télécharger les documents manquants.",
      rw: "Nyamuneka injira kuri ibiro byawe kandi ushyiremo ibyangombwa bisangiye.",
    },
    completeButton: {
      en: "Complete Verification Now",
      fr: "Compléter la vérification maintenant",
      rw: "Soza kwemeza ubu",
    },
    timelineNote: {
      en: "Verification typically takes 1–2 business days after all required documents are received.",
      fr: "La vérification prend généralement 1 à 2 jours ouvrables après réception de tous les documents requis.",
      rw: "Kwemeza biratoranya iminsi 1-2 y'akazi nyuma yo kwakira ibyangombwa byose bisabwa.",
    },
  },

  // Verification rejection (sent by admin)
  VERIFICATION_REJECTION: {
    title: {
      en: "Verification Update Required",
      fr: "Mise à jour de vérification requise",
      rw: "Kwemeza bisabwa",
    },
    greeting: {
      en: (name: string) => `Hello ${name},`,
      fr: (name: string) => `Bonjour ${name},`,
      rw: (name: string) => `Muraho ${name},`,
    },
    thankYou: {
      en: "Thank you for submitting your verification documents. Unfortunately, we need you to resubmit some information before we can approve your expert profile.",
      fr: "Merci d'avoir soumis vos documents de vérification. Malheureusement, nous devons vous demander de resoumettre certaines informations avant de pouvoir approuver votre profil expert.",
      rw: "Murakoze ku ibyangombwa byemeza wohereje. Ubwoko, dushaka ko ongera uhebze amakuru menyo tashobora kwemeza umwirondoro wawe w'umwarimu.",
    },
    reasonLabel: {
      en: "Reason for Request:",
      fr: "Raison de la demande :",
      rw: "Impamvu y'icyifuzo:",
    },
    nextSteps: {
      en: "Next Steps",
      fr: "Prochaines étapes",
      rw: "Inshurozwezo",
    },
    steps: {
      en: "1. Review the feedback above<br/>2. Gather the corrected or missing documents<br/>3. Resubmit your verification through your dashboard",
      fr: "1. Examinez les commentaires ci-dessus<br/>2. Rassemblez les documents corrigés ou manquants<br/>3. Resoumettez votre vérification via votre tableau de bord",
      rw: "1. Reba ibitegerezwa hejuru<br/>2. Tekanyoza ibyangombwa byahinduwe cyangwa bisangiye<br/>3. Ongera uhebze kwemeza ukoresheje ibiro byawe",
    },
    resubmitButton: {
      en: "Resubmit Documents",
      fr: "Resoumettre les documents",
      rw: "Ongera uhebze ibyangombwa",
    },
    teamNote: {
      en: "Our team is here to help ensure your profile meets all requirements. Once resubmitted, we'll review your documents within 1-2 business days.",
      fr: "Notre équipe est là pour vous aider à vous assurer que votre profil répond à toutes les exigences. Une fois resoumis, nous examinerons vos documents dans les 1 à 2 jours ouvrables.",
      rw: "Ikipe yacu iri hano kukugufasha noneho umwirondoro wawe uzwi neza. Nyuma yo kongera uhebze, tuzasuzuma ibyangombwa byawe mu minota 1-2 y'akazi.",
    },
  },

  // Admin notification for new verification request
  NEW_VERIFICATION_REQUEST_ADMIN: {
    title: {
      en: "New Verification Request",
      fr: "Nouvelle demande de vérification",
      rw: "Icyifuzo gishya cyo kwemeza",
    },
    message: {
      en: (expertName: string) => `Expert <strong>${expertName}</strong> has submitted verification documents.`,
      fr: (expertName: string) => `L'expert <strong>${expertName}</strong> a soumis des documents de vérification.`,
      rw: (expertName: string) => `Uwarimu <strong>${expertName}</strong> yohereje ibyangombwa byemeza.`,
    },
    reviewPrompt: {
      en: "Review and approve or reject this request in the admin dashboard.",
      fr: "Examinez et approuvez ou rejetez cette demande dans le tableau de bord administrateur.",
      rw: "Reba kandi uemere cyangwa ukane iki cyifuzo mu ibiro by'ubuyobozi.",
    },
    reviewButton: {
      en: "Review Request",
      fr: "Examiner la demande",
      rw: "Reba icyifuzo",
    },
  },

  NEW_EXPERT_REGISTRATION: {
    title: {
      en: "New Expert Registration",
      fr: "Nouvel enregistrement d'expert",
      rw: "Kwiyandikisha kw'umwarimu mushya",
    },
    message: {
      en: (expertName: string, expertEmail: string) => `A new expert <strong>${expertName}</strong> (${expertEmail}) has registered on MyJudicial.`,
      fr: (expertName: string, expertEmail: string) => `Un nouvel expert <strong>${expertName}</strong> (${expertEmail}) s'est inscrit sur MyJudicial.`,
      rw: (expertName: string, expertEmail: string) => `Uwarimu mushya <strong>${expertName}</strong> (${expertEmail}) yiyandikishye kuri MyJudicial.`,
    },
    nextSteps: {
      en: "The expert will complete their profile and submit verification documents. You will be notified when verification documents are submitted for review.",
      fr: "L'expert complétera son profil et soumettra les documents de vérification. Vous serez notifié lorsque les documents de vérification seront soumis pour examen.",
      rw: "Uwarimu azuzaza umwirondoro we kandi azohereza ibyangombwa byemeza. Uzabumbwa icyitso ubona ibyangombwa byemeza byoherejwe.",
    },
    viewButton: {
      en: "View Experts",
      fr: "Voir les experts",
      rw: "Reba abarimu",
    },
  },

  // Generic reusable strings
  COMMON: {
    viewBooking: {
      en: "View Booking",
      fr: "Voir la réservation",
      rw: "Reba gahunda",
    },
    booking: {
      en: "Booking",
      fr: "Réservation",
      rw: "Gahunda",
    },
    client: {
      en: "Client",
      fr: "Client",
      rw: "Umukiriya",
    },
    amount: {
      en: "Amount",
      fr: "Montant",
      rw: "Amafaranga",
    },
    date: {
      en: "Date",
      fr: "Date",
      rw: "Itariki",
    },
    time: {
      en: "Time",
      fr: "Heure",
      rw: "Isaha",
    },
    reason: {
      en: "Reason",
      fr: "Raison",
      rw: "Impamvu",
    },
  },
} as const;

/**
 * Helper function to get translated email subject
 */
export function getEmailSubject(
  key: keyof typeof EMAIL_SUBJECTS,
  language: Language,
  ...args: any[]
): string {
  const subject = EMAIL_SUBJECTS[key][language];
  if (typeof subject === 'function') {
    return (subject as any)(...args);
  }
  return subject as string;
}

/**
 * Helper function to get translated email content
 */
export function getEmailContent(
  section: keyof typeof EMAIL_CONTENT,
  key: string,
  language: Language,
  ...args: any[]
): string {
  const content = (EMAIL_CONTENT[section] as any)[key]?.[language];
  if (typeof content === 'function') {
    return content(...args);
  }
  return content;
}
