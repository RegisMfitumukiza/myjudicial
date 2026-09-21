import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const enPath = path.join(rootDir, 'messages', 'en.json');
const frPath = path.join(rootDir, 'messages', 'fr.json');
const rwPath = path.join(rootDir, 'messages', 'rw.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const rw = JSON.parse(fs.readFileSync(rwPath, 'utf8'));

// 1. Update shared.sidebar and root sidebar
const sidebarAdditionsEn = {
  consultations: "Consultations",
  verifications: "Verifications",
  documents: "Documents",
  practiceAreas: "Practice Areas",
  marketplace: "Marketplace",
  trustSafety: "Trust & Safety",
  operations: "Operations",
  configuration: "Configuration",
  collapseSidebar: "Collapse sidebar",
  openNavigationMenu: "Open navigation menu",
  closeNavigationMenu: "Close navigation menu"
};

const sidebarAdditionsFr = {
  consultations: "Consultations",
  verifications: "Vérifications",
  documents: "Documents",
  practiceAreas: "Domaines de droit",
  marketplace: "Marché",
  trustSafety: "Confiance et sécurité",
  operations: "Opérations",
  configuration: "Configuration",
  collapseSidebar: "Réduire la barre latérale",
  openNavigationMenu: "Ouvrir le menu de navigation",
  closeNavigationMenu: "Fermer le menu de navigation"
};

const sidebarAdditionsRw = {
  consultations: "Inama nshingamategeko",
  verifications: "Isuzuma ry'ibyemezo",
  documents: "Inyandiko",
  practiceAreas: "Amashami y'amategeko",
  marketplace: "Isoko ry'abanyamategeko",
  trustSafety: "Icyizere n'umutekano",
  operations: "Ibikorwa",
  configuration: "Iboneza",
  collapseSidebar: "Kugabanya umwanya w'urubuga",
  openNavigationMenu: "Fungura menu y'urubuga",
  closeNavigationMenu: "Funga menu y'urubuga"
};

// Merge into shared.sidebar
en.shared = en.shared || {};
en.shared.sidebar = { ...en.shared.sidebar, ...sidebarAdditionsEn };
fr.shared = fr.shared || {};
fr.shared.sidebar = { ...fr.shared.sidebar, ...sidebarAdditionsFr };
rw.shared = rw.shared || {};
rw.shared.sidebar = { ...rw.shared.sidebar, ...sidebarAdditionsRw };

// Merge into root sidebar if it exists
if (en.sidebar) en.sidebar = { ...en.sidebar, ...sidebarAdditionsEn };
if (fr.sidebar) fr.sidebar = { ...fr.sidebar, ...sidebarAdditionsFr };
if (rw.sidebar) rw.sidebar = { ...rw.sidebar, ...sidebarAdditionsRw };

// 2. Update expertDashboard_consultations
const consultAdditionsEn = {
  viewDetails: "View Details",
  joinRoom: "Join Room"
};
const consultAdditionsFr = {
  viewDetails: "Voir les détails",
  joinRoom: "Rejoindre la salle"
};
const consultAdditionsRw = {
  viewDetails: "Reba ibirambuye",
  joinRoom: "Kwinjira mu cyumba"
};

en.expertDashboard_consultations = { ...en.expertDashboard_consultations, ...consultAdditionsEn };
fr.expertDashboard_consultations = { ...fr.expertDashboard_consultations, ...consultAdditionsFr };
rw.expertDashboard_consultations = { ...rw.expertDashboard_consultations, ...consultAdditionsRw };

// 3. Update expertDashboard_join
const joinAdditionsEn = {
  preConsultationBrief: "Pre-Consultation Brief",
  analyze: "Analyze",
  clientNotes: "Client Notes",
  analyzingCase: "Analyzing case with AI...",
  analyzeError: "Could not analyze case notes. Please try again."
};
const joinAdditionsFr = {
  preConsultationBrief: "Dossier préliminaire",
  analyze: "Analyser",
  clientNotes: "Notes du client",
  analyzingCase: "Analyse du dossier par l'IA en cours...",
  analyzeError: "Impossible d'analyser les notes du dossier. Veuillez réessayer."
};
const joinAdditionsRw = {
  preConsultationBrief: "Incamake mbere y'inama",
  analyze: "Gusesengura",
  clientNotes: "Inyandiko z'umukiriya",
  analyzingCase: "AI irimo gusesengura ikibazo...",
  analyzeError: "Ntibyashobotse gusesengura inyandiko z'ikibazo. Ongera ugerageze."
};

en.expertDashboard_join = { ...en.expertDashboard_join, ...joinAdditionsEn };
fr.expertDashboard_join = { ...fr.expertDashboard_join, ...joinAdditionsFr };
rw.expertDashboard_join = { ...rw.expertDashboard_join, ...joinAdditionsRw };

// 4. Create expertDashboard_bookings
en.expertDashboard_bookings = {
  title: "Bookings",
  description: "Manage all your consultation bookings in one place",
  tabs: {
    pending: "Pending",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled"
  },
  empty: {
    pending: "No pending booking requests.",
    active: "No active consultations.",
    completed: "No completed consultations yet.",
    cancelled: "No cancelled bookings."
  },
  deliveryModes: {
    inPerson: "In-Person",
    phone: "Phone",
    document: "Document",
    video: "Video",
    office: "Office",
    phoneCall: "Phone Call",
    documents: "Documents",
    videoCall: "Video Call"
  },
  status: {
    awaitingConfirmation: "Awaiting Confirmation",
    awaitingPayment: "Awaiting Payment",
    rescheduleRequested: "Reschedule Requested",
    completed: "Completed",
    cancelled: "Cancelled",
    refunded: "Refunded",
    confirmed: "Confirmed",
    paid: "Paid",
    active: "Active",
    pending: "Pending",
    created: "Created",
    done: "Done"
  },
  actions: {
    accept: "Accept",
    decline: "Decline",
    message: "Message",
    messageClient: "Message Client",
    joinCall: "Join Call",
    notYetTime: "Not yet time",
    backToBookings: "Back to Bookings",
    addToCalendar: "Add to Calendar",
    reschedule: "Reschedule",
    reviewDocuments: "Review Documents",
    confirmDecline: "Confirm Decline",
    cancel: "Cancel",
    keepBooking: "Keep Booking",
    declineTitle: "Decline this booking?",
    reasonLabel: "Reason for declining (min. 5 characters)",
    reasonPlaceholder: "e.g. Schedule conflict, unable to take this case...",
    declining: "Declining..."
  },
  details: {
    withClient: "with {name}",
    progress: "Progress",
    bookingCancelled: "Booking Cancelled",
    bookingRefunded: "Booking Refunded",
    reason: "Reason: {reason}",
    schedule: "Schedule",
    date: "Date",
    duration: "Duration: {duration} min",
    client: "Client",
    service: "Service",
    payment: "Payment",
    paymentPendingNotice: "Payment will be requested once you confirm this booking.",
    statusLabel: "Status",
    yourPayout: "Your Payout",
    officeLocation: "Office: {address}",
    callClientAt: "Call client at: {phone}",
    inPersonAppointment: "In-Person Office Appointment"
  },
  ai: {
    clientNotes: "Client Notes",
    aiAnalysis: "AI Analysis",
    analyzing: "Analyzing case with AI...",
    analyzeError: "Could not analyze case. Please try again.",
    summaryTitle: "Post-Consultation Summary",
    step1Desc: "Step 1: Write your consultation notes. AI will structure them into a professional summary for the client.",
    notesPlaceholder: "Write your consultation notes here - key issues discussed, advice given, follow-up actions, etc.",
    generatingSummary: "Generating Summary...",
    generateSummary: "Generate Summary",
    structuringSummary: "AI is structuring your notes into a professional summary...",
    notesError: "Could not analyze notes. Please try again.",
    step2Desc: "Step 2: Review the AI-generated summary below. Edit as needed, then send to client.",
    editableSummaryLabel: "Editable Summary (will be sent to client)",
    sendingSummary: "Sending...",
    sendSummary: "Send Consultation Summary",
    startOver: "Start Over",
    summarySentTitle: "Summary sent to client",
    summarySentDesc: "The consultation summary has been delivered to the client's inbox."
  },
  toasts: {
    acceptSuccess: "Booking accepted. The client has been notified.",
    acceptError: "Failed to accept booking",
    declineSuccess: "Booking declined successfully.",
    declineError: "Failed to decline booking.",
    declineMinLength: "Please provide a reason of at least 5 characters.",
    chatUnavailable: "Conversation isn't available for this booking yet.",
    summarySent: "Consultation summary sent to client.",
    summaryError: "Failed to send summary.",
    noChatFound: "No conversation found for this booking. Use 'Message Client' to start one.",
    loadError: "Failed to load bookings. Please try again.",
    bookingNotFound: "Booking not found"
  }
};

fr.expertDashboard_bookings = {
  title: "Réservations",
  description: "Gérez toutes vos réservations de consultation en un seul endroit",
  tabs: {
    pending: "En attente",
    active: "Actives",
    completed: "Terminées",
    cancelled: "Annulées"
  },
  empty: {
    pending: "Aucune demande de réservation en attente.",
    active: "Aucune consultation active.",
    completed: "Aucune consultation terminée pour le moment.",
    cancelled: "Aucune réservation annulée."
  },
  deliveryModes: {
    inPerson: "En personne",
    phone: "Téléphone",
    document: "Document",
    video: "Vidéo",
    office: "Bureau",
    phoneCall: "Appel téléphonique",
    documents: "Documents",
    videoCall: "Appel vidéo"
  },
  status: {
    awaitingConfirmation: "En attente de confirmation",
    awaitingPayment: "En attente de paiement",
    rescheduleRequested: "Report demandé",
    completed: "Terminée",
    cancelled: "Annulée",
    refunded: "Remboursée",
    confirmed: "Confirmée",
    paid: "Payée",
    active: "Active",
    pending: "En attente",
    created: "Créée",
    done: "Terminé"
  },
  actions: {
    accept: "Accepter",
    decline: "Refuser",
    message: "Message",
    messageClient: "Envoyer un message au client",
    joinCall: "Rejoindre l'appel",
    notYetTime: "Pas encore l'heure",
    backToBookings: "Retour aux réservations",
    addToCalendar: "Ajouter au calendrier",
    reschedule: "Reprogrammer",
    reviewDocuments: "Examiner les documents",
    confirmDecline: "Confirmer le refus",
    cancel: "Annuler",
    keepBooking: "Conserver la réservation",
    declineTitle: "Refuser cette réservation ?",
    reasonLabel: "Motif du refus (5 caractères minimum)",
    reasonPlaceholder: "ex. Conflit d'horaire, impossible de prendre ce dossier...",
    declining: "Refus en cours..."
  },
  details: {
    withClient: "avec {name}",
    progress: "Progression",
    bookingCancelled: "Réservation annulée",
    bookingRefunded: "Réservation remboursée",
    reason: "Motif : {reason}",
    schedule: "Horaire",
    date: "Date",
    duration: "Durée : {duration} min",
    client: "Client",
    service: "Service",
    payment: "Paiement",
    paymentPendingNotice: "Le paiement sera demandé une fois que vous aurez confirmé cette réservation.",
    statusLabel: "Statut",
    yourPayout: "Votre versement",
    officeLocation: "Cabinet : {address}",
    callClientAt: "Appeler le client au : {phone}",
    inPersonAppointment: "Rendez-vous au cabinet en personne"
  },
  ai: {
    clientNotes: "Notes du client",
    aiAnalysis: "Analyse IA",
    analyzing: "Analyse du dossier par l'IA en cours...",
    analyzeError: "Impossible d'analyser le dossier. Veuillez réessayer.",
    summaryTitle: "Résumé post-consultation",
    step1Desc: "Étape 1 : Rédigez vos notes de consultation. L'IA les structurera en un résumé professionnel pour le client.",
    notesPlaceholder: "Rédigez vos notes de consultation ici - questions clés abordées, conseils prodigués, actions de suivi, etc.",
    generatingSummary: "Génération du résumé...",
    generateSummary: "Générer le résumé",
    structuringSummary: "L'IA structure vos notes en un résumé professionnel...",
    notesError: "Impossible d'analyser les notes. Veuillez réessayer.",
    step2Desc: "Étape 2 : Examinez le résumé généré par l'IA ci-dessous. Modifiez-le si nécessaire, puis envoyez-le au client.",
    editableSummaryLabel: "Résumé modifiable (sera envoyé au client)",
    sendingSummary: "Envoi en cours...",
    sendSummary: "Envoyer le résumé de consultation",
    startOver: "Recommencer",
    summarySentTitle: "Résumé envoyé au client",
    summarySentDesc: "Le résumé de consultation a été envoyé dans la boîte de réception du client."
  },
  toasts: {
    acceptSuccess: "Réservation acceptée. Le client a été notifié.",
    acceptError: "Échec de l'acceptation de la réservation",
    declineSuccess: "Réservation refusée avec succès.",
    declineError: "Échec du refus de la réservation.",
    declineMinLength: "Veuillez indiquer un motif d'au moins 5 caractères.",
    chatUnavailable: "La conversation n'est pas encore disponible pour cette réservation.",
    summarySent: "Résumé de la consultation envoyé au client.",
    summaryError: "Échec de l'envoi du résumé.",
    noChatFound: "Aucune conversation trouvée pour cette réservation. Utilisez 'Envoyer un message au client' pour en démarrer une.",
    loadError: "Échec du chargement des réservations. Veuillez réessayer.",
    bookingNotFound: "Réservation introuvable"
  }
};

rw.expertDashboard_bookings = {
  title: "Gahunda z'inama",
  description: "Cunga gahunda zawe zose z'ubujyanama ahantu hamwe",
  tabs: {
    pending: "Zitegerejwe",
    active: "Izikora",
    completed: "Izarangiye",
    cancelled: "Izahagaritswe"
  },
  empty: {
    pending: "Nta busabe bw'inama butegerejwe kugeza ubu.",
    active: "Nta nama ziri gukora kugeza ubu.",
    completed: "Nta nama zirarangira kugeza ubu.",
    cancelled: "Nta nama zahagaritswe."
  },
  deliveryModes: {
    inPerson: "Imbonankubone",
    phone: "Telefoni",
    document: "Inyandiko",
    video: "Videwo",
    office: "Ibiro",
    phoneCall: "Guhamagara",
    documents: "Inyandiko",
    videoCall: "Inama kuri videwo"
  },
  status: {
    awaitingConfirmation: "Bitegereje kwemezwa",
    awaitingPayment: "Bitegereje kwishyurwa",
    rescheduleRequested: "Hasabwe guhindura igihe",
    completed: "Yarangiye",
    cancelled: "Gahunda yahagaritswe",
    refunded: "Yasubijwe",
    confirmed: "Yemejwe",
    paid: "Yishyuwe",
    active: "Irakora",
    pending: "Itegerezwa",
    created: "Yaremwe",
    done: "Birarangiye"
  },
  actions: {
    accept: "Emeza",
    decline: "Hana",
    message: "Ubutumwa",
    messageClient: "Ohereza ubutumwa umukiriya",
    joinCall: "Injira mu nama",
    notYetTime: "Igihe ntikiragera",
    backToBookings: "Subira ku nama",
    addToCalendar: "Ongeraho muri kalendari",
    reschedule: "Hindura igihe",
    reviewDocuments: "Suzuma inyandiko",
    confirmDecline: "Emeza ko ubyanze",
    cancel: "Kureka",
    keepBooking: "Gumana gahunda",
    declineTitle: "Wanze iyi gahunda y'inama?",
    reasonLabel: "Impamvu yo kwanga (byibuze inyuguti 5)",
    reasonPlaceholder: "urug. Gahunda zirabangikanye, sinshobora gufata iyi dosiye...",
    declining: "Kwirukana..."
  },
  details: {
    withClient: "hamwe na {name}",
    progress: "Aho ibikorwa bigeze",
    bookingCancelled: "Gahunda yahagaritswe",
    bookingRefunded: "Gahunda yishyuwe yasubijwe",
    reason: "Impamvu: {reason}",
    schedule: "Gahunda",
    date: "Itariki",
    duration: "Igihe: iminota {duration}",
    client: "Umukiriya",
    service: "Serivisi",
    payment: "Kwishyura",
    paymentPendingNotice: "Ubwishyu buzasabwa umaze kwemeza iyi gahunda y'inama.",
    statusLabel: "Imimerere",
    yourPayout: "Amafaranga yawe",
    officeLocation: "Ibiro: {address}",
    callClientAt: "Hamagara umukiriya kuri: {phone}",
    inPersonAppointment: "Inama imbonankubone ku biro"
  },
  ai: {
    clientNotes: "Inyandiko z'umukiriya",
    aiAnalysis: "Isesengura rya AI",
    analyzing: "AI irimo gusesengura ikibazo...",
    analyzeError: "Ntibyashobotse gusesengura ikibazo. Ongera ugerageze.",
    summaryTitle: "Incamake nyuma y'inama",
    step1Desc: "Intambwe ya 1: Andika inyandiko zawe z'inama. AI irazitunganya mu buryo bw'umwuga buhabwa umukiriya.",
    notesPlaceholder: "Andika inyandiko zawe z'inama hano - ingingo z'ingenzi zaganiriweho, inama zatanzwe, ibigomba gukurikiraho, n'ibindi.",
    generatingSummary: "Gutunganya incamake...",
    generateSummary: "Kora incamake",
    structuringSummary: "AI irimo gutunganya inyandiko zawe z'inama mu buryo bw'umwuga...",
    notesError: "Ntibyashobotse gusesengura inyandiko. Ongera ugerageze.",
    step2Desc: "Intambwe ya 2: Suzuma incamake yakozwe na AI hasi aha. Hinduramo ibikenewe, hanyuma uyohereze umukiriya.",
    editableSummaryLabel: "Incamake ushobora guhindura (iyo yoherezwa umukiriya)",
    sendingSummary: "Kohereza...",
    sendSummary: "Ohereza incamake y'inama",
    startOver: "Tangira bundi bushya",
    summarySentTitle: "Incamake yoherejwe umukiriya",
    summarySentDesc: "Incamake y'inama yoherejwe muri konte y'umukiriya."
  },
  toasts: {
    acceptSuccess: "Gahunda yemejwe. Umukiriya yamenyeshejwe.",
    acceptError: "Kwemera gahunda byanze",
    declineSuccess: "Gahunda yanzwe neza.",
    declineError: "Kwanga gahunda byanze.",
    declineMinLength: "Tanga impamvu ifite nibura inyuguti 5.",
    chatUnavailable: "Kuganira ntibiraboneka kuri iyi gahunda y'inama.",
    summarySent: "Incamake y'inama yoherejwe umukiriya.",
    summaryError: "Kohereza incamake byanze.",
    noChatFound: "Nta biganiro bibonetse kuri iyi gahunda. Kanda 'Ohereza ubutumwa umukiriya' kugira ngo utangire.",
    loadError: "Gufungura gahunda byanze. Ongera ugerageze.",
    bookingNotFound: "Gahunda ntibonetse"
  }
};

// 5. Create expertDashboard_settings
en.expertDashboard_settings = {
  title: "Settings",
  description: "Manage your account preferences",
  appearanceTitle: "Appearance",
  appearanceDesc: "Customize your visual theme and interface mode",
  themeMode: "Theme Mode",
  themeDesc: "Switch between light and dark themes",
  additionalSettings: "Additional Settings",
  additionalSettingsDesc: "Quick access to specialized account and schedule configuration",
  scheduleSettingsTitle: "Schedule Settings",
  scheduleSettingsDesc: "Notice periods, buffers, and daily caps",
  dateOverridesTitle: "Date Overrides",
  dateOverridesDesc: "Custom hours and vacation blackouts",
  accountSecurityTitle: "Account & Security",
  accountSecurityDesc: "Password changes and active logged-in device sessions"
};

fr.expertDashboard_settings = {
  title: "Paramètres",
  description: "Gérez les préférences de votre compte",
  appearanceTitle: "Apparence",
  appearanceDesc: "Personnalisez votre thème visuel et le mode d'interface",
  themeMode: "Mode de thème",
  themeDesc: "Basculer entre les thèmes clair et sombre",
  additionalSettings: "Paramètres supplémentaires",
  additionalSettingsDesc: "Accès rapide à la configuration spécialisée du compte et des horaires",
  scheduleSettingsTitle: "Paramètres d'horaire",
  scheduleSettingsDesc: "Délais de prévenance, intervalles de pause et limites quotidiennes",
  dateOverridesTitle: "Remplacements de dates",
  dateOverridesDesc: "Horaires personnalisés et périodes de vacances",
  accountSecurityTitle: "Compte et sécurité",
  accountSecurityDesc: "Changement de mot de passe et sessions d'appareils connectés"
};

rw.expertDashboard_settings = {
  title: "Igenamiterere",
  description: "Cunga amahitamo ya konte yawe",
  appearanceTitle: "Imiterere y'urubuga",
  appearanceDesc: "Hitamo ibara n'uburyo bwo kugaragara k'urubuga",
  themeMode: "Uburyo bw'amabara",
  themeDesc: "Guhindura hagati y'umweru n'umukara",
  additionalSettings: "Irimo igenamiterere ryisumbuyeho",
  additionalSettingsDesc: "Kugera byoroshye ku miterere y'ingengabihe na konte",
  scheduleSettingsTitle: "Igenamiterere ry'ingengabihe",
  scheduleSettingsDesc: "Igihe cyo kumenyesha mbere, ibiruhuko hagati y'inama, n'umubare ntarengwa",
  dateOverridesTitle: "Guhindura amatariki",
  dateOverridesDesc: "Amasaha yihariye n'igihe cy'ikiruhuko",
  accountSecurityTitle: "Konte n'Umutekano",
  accountSecurityDesc: "Guhindura ijambobanga n'ibikoresho byafunguye konte"
};

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf8');
fs.writeFileSync(rwPath, JSON.stringify(rw, null, 2) + '\n', 'utf8');

console.log("Successfully updated en.json, fr.json, and rw.json!");
