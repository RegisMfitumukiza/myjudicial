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

// Helper for deep merge
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

// 1. Search Keys
const searchEn = {
  specialistsIn: "{specialty} Specialists",
  practiceAreasCount: "{count} Practice Areas ({areas})",
  verifiedAdvocatesInSpecialties: "Verified advocates specializing in {specialties} in Rwanda.",
  viewProfileAria: "View profile of {name}",
  closeLawyerDetails: "Close lawyer details",
  mapAriaLabel: "Lawyer map",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  recenterMap: "Recenter map",
  loadingSearch: "Loading search results..."
};

const searchFr = {
  specialistsIn: "Spécialistes en {specialty}",
  practiceAreasCount: "{count} Domaines de compétence ({areas})",
  verifiedAdvocatesInSpecialties: "Avocats vérifiés spécialisés en {specialties} au Rwanda.",
  viewProfileAria: "Voir le profil de {name}",
  closeLawyerDetails: "Fermer les détails de l'avocat",
  mapAriaLabel: "Carte des avocats",
  zoomIn: "Zoom avant",
  zoomOut: "Zoom arrière",
  recenterMap: "Recentrer la carte",
  loadingSearch: "Chargement des résultats de recherche..."
};

const searchRw = {
  specialistsIn: "Inzobere muri {specialty}",
  practiceAreasCount: "Inzego {count} z'ubumenyi ({areas})",
  verifiedAdvocatesInSpecialties: "Abavoka bemewe b'inzobere muri {specialties} mu Rwanda.",
  viewProfileAria: "Reba umwirondoro wa {name}",
  closeLawyerDetails: "Funga amakuru arambuye y'umwavoka",
  mapAriaLabel: "Ikarita y'abavoka",
  zoomIn: "Gukuza",
  zoomOut: "Kugabanya",
  recenterMap: "Kugarura ikarita hagati",
  loadingSearch: "Iri gushaka ibisubizo..."
};

// 2. Practice Areas
const practiceAreasEn = {
  clearSearch: "Clear search"
};
const practiceAreasFr = {
  clearSearch: "Effacer la recherche"
};
const practiceAreasRw = {
  clearSearch: "Gusiba ibyo washakishije"
};

// 3. Lawyers Keys
const lawyersEn = {
  verifiedTooltip: "Rwanda Bar Verified Advocate",
  contactRate: "Contact",
  legalServices: "Legal Services",
  reportModal: {
    spam: "Spam or misleading",
    harassment: "Harassment or inappropriate content",
    unprofessional: "Unprofessional conduct",
    offensiveLanguage: "Offensive language",
    fakeReview: "Fake or dishonest review",
    other: "Other issue"
  }
};
const lawyersFr = {
  verifiedTooltip: "Avocat certifié par le Barreau du Rwanda",
  contactRate: "Sur devis",
  legalServices: "Services juridiques",
  reportModal: {
    spam: "Spam ou trompeur",
    harassment: "Harcèlement ou contenu inapproprié",
    unprofessional: "Conduite non professionnelle",
    offensiveLanguage: "Langage offensant",
    fakeReview: "Avis faux ou malhonnête",
    other: "Autre motif"
  }
};
const lawyersRw = {
  verifiedTooltip: "Umwavoka wemewe n'Urugaga rw'Abavoka mu Rwanda",
  contactRate: "Vugana nawe",
  legalServices: "Serivisi z'amategeko",
  reportModal: {
    spam: "Ubutumwa buyobya cyangwa butari bwo",
    harassment: "Ihohotera cyangwa amagambo adakwiye",
    unprofessional: "Imyitwarire inyuranye n'ubunyamwuga",
    offensiveLanguage: "Ururimi rusebanya cyangwa rutukana",
    fakeReview: "Ibitekerezo by'ibihimbano",
    other: "Ikindi kibazo"
  }
};

// 4. Booking Keys
const bookingEn = {
  optional: "Optional",
  notSelected: "Not selected",
  durationMinutes: "{minutes} mins",
  dateAtTime: "{date} at {time}",
  days: {
    sun: "Sun",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat"
  },
  months: {
    jan: "January",
    feb: "February",
    mar: "March",
    apr: "April",
    may: "May",
    jun: "June",
    jul: "July",
    aug: "August",
    sep: "September",
    oct: "October",
    nov: "November",
    dec: "December"
  },
  cancelled: {
    title: "Booking Cancelled",
    whatHappened: "What Happened?",
    reasonPaymentAbandoned: "Payment was cancelled or timed out before completion.",
    noChargesMade: "No charges were made to your account. Your slot has been released.",
    browseLawyers: "Browse Lawyers Again"
  }
};

const bookingFr = {
  optional: "Optionnel",
  notSelected: "Non sélectionné",
  durationMinutes: "{minutes} min",
  dateAtTime: "{date} à {time}",
  days: {
    sun: "Dim",
    mon: "Lun",
    tue: "Mar",
    wed: "Mer",
    thu: "Jeu",
    fri: "Ven",
    sat: "Sam"
  },
  months: {
    jan: "Janvier",
    feb: "Février",
    mar: "Mars",
    apr: "Avril",
    may: "Mai",
    jun: "Juin",
    jul: "Juillet",
    aug: "Août",
    sep: "Septembre",
    oct: "Octobre",
    nov: "Novembre",
    dec: "Décembre"
  },
  cancelled: {
    title: "Réservation annulée",
    whatHappened: "Que s'est-il passé ?",
    reasonPaymentAbandoned: "Le paiement a été annulé ou a expiré avant finalisation.",
    noChargesMade: "Aucun montant n'a été débité de votre compte. Votre créneau a été libéré.",
    browseLawyers: "Parcourir à nouveau les avocats"
  }
};

const bookingRw = {
  optional: "Bihitamo",
  notSelected: "Ntabwo byatoranyijwe",
  durationMinutes: "Iminota {minutes}",
  dateAtTime: "{date} saa {time}",
  days: {
    sun: "Kyu",
    mon: "Kmb",
    tue: "Kab",
    wed: "Gtu",
    thu: "Krn",
    fri: "Gtn",
    sat: "Gnd"
  },
  months: {
    jan: "Mutarama",
    feb: "Gashyantare",
    mar: "Werurwe",
    apr: "Mata",
    may: "Gicurasi",
    jun: "Kamena",
    jul: "Nyakanga",
    aug: "Kanama",
    sep: "Nzeli",
    oct: "Ukwakira",
    nov: "Ugushyingo",
    dec: "Ukuboza"
  },
  cancelled: {
    title: "Gahunda yateshejwe agaciro",
    whatHappened: "Byagenze bite?",
    reasonPaymentAbandoned: "Kwishyura byahagaritswe cyangwa igihe cyagenwe cyarangiye mbere yo kurangiza.",
    noChargesMade: "Nta mafaranga yakuwe kuri konti yawe. Igihe wari watoranyije cyasubijwe mu bindi biboneka.",
    browseLawyers: "Kongera gushaka abavoka"
  }
};

// 5. AI Assistant Keys
const aiEn = {
  greeting: "Hello! I'm your AI Legal Assistant. Describe your legal situation, and I'll help analyze it and connect you with qualified advocates in Rwanda.",
  quickPrompt1: "I need help reviewing an employment contract",
  quickPrompt2: "How do I resolve a land boundary dispute?",
  quickPrompt3: "What are the steps to register a new business?",
  quickPrompt4: "Need advice on a commercial lease agreement",
  openFullWorkspace: "Open in Full Case Workspace",
  chatWithAI: "Chat with AI Assistant",
  confidenceHigh: "High confidence match",
  confidenceMedium: "Medium confidence match",
  upload: "Upload",
  yearsExpUnit: "yr",
  loadingWorkspace: "Loading AI Legal Assistant workspace...",
  recommendations: {
    expertsFound: "I found **{count} matching experts** for your case."
  }
};

const aiFr = {
  greeting: "Bonjour ! Je suis votre assistant juridique IA. Décrivez votre situation juridique, et je vous aiderai à l'analyser et à vous mettre en relation avec des avocats qualifiés au Rwanda.",
  quickPrompt1: "J'ai besoin d'aide pour réviser un contrat de travail",
  quickPrompt2: "Comment résoudre un litige de délimitation de terrain ?",
  quickPrompt3: "Quelles sont les étapes pour immatriculer une entreprise ?",
  quickPrompt4: "Besoin de conseils sur un bail commercial",
  openFullWorkspace: "Ouvrir dans l'espace de travail complet",
  chatWithAI: "Discuter avec l'assistant IA",
  confidenceHigh: "Correspondance très précise",
  confidenceMedium: "Correspondance moyenne",
  upload: "Télécharger",
  yearsExpUnit: "an",
  loadingWorkspace: "Chargement de l'espace de l'assistant juridique IA...",
  recommendations: {
    expertsFound: "J'ai trouvé **{count} avocats correspondants** pour votre dossier."
  }
};

const aiRw = {
  greeting: "Muraho! Ndi umufasha wanyu w'ubwenge bukorano (AI) mu by'amategeko. Sobanura ikibazo cyawe cy'amategeko, ngufashe kugisesengura no kuguha abavoka babifitiye ubushobozi mu Rwanda.",
  quickPrompt1: "Nkeneye ubufasha bwo gusuzuma amasezerano y'akazi",
  quickPrompt2: "Ni gute nakemura impaka z'imipaka y'ubutaka?",
  quickPrompt3: "Ni izihe ntambwe zo kwandikisha ubucuruzi bushya?",
  quickPrompt4: "Nkeneye inama ku masezerano yo gukodesha inzu y'ubucuruzi",
  openFullWorkspace: "Fungura mu mwanya wose w'ikibazo",
  chatWithAI: "Ganira n'umufasha wa AI",
  confidenceHigh: "Guhuza k'urwego rwo hejuru",
  confidenceMedium: "Guhuza k'urwego ruringaniye",
  upload: "Gushyiraho dosiye",
  yearsExpUnit: "umwaka",
  loadingWorkspace: "Iri gukora umwanya w'umufasha wa AI...",
  recommendations: {
    expertsFound: "Nabonye **abavoka {count} babifitiye ubushobozi** ku kibazo cyawe."
  }
};

// 6. Contact, Pricing & Help additions
const contactAdditionsEn = {
  form: {
    businessHoursLabel: "Business Hours",
    businessHoursValue: "Monday – Friday: 8:00 AM – 6:00 PM CAT",
    subjectPlaceholder: "How can we help?",
    messagePlaceholder: "Describe your inquiry in detail..."
  },
  officeMapTitle: "MyJudicial Headquarters in Kigali, Rwanda"
};
const contactAdditionsFr = {
  form: {
    businessHoursLabel: "Heures d'ouverture",
    businessHoursValue: "Lundi – Vendredi : 8h00 – 18h00 CAT",
    subjectPlaceholder: "Comment pouvons-nous vous aider ?",
    messagePlaceholder: "Décrivez votre demande en détail..."
  },
  officeMapTitle: "Siège de MyJudicial à Kigali, Rwanda"
};
const contactAdditionsRw = {
  form: {
    businessHoursLabel: "Amasaha y'akazi",
    businessHoursValue: "Kuwa Mbere – Kuwa Gatanu: 8:00 – 18:00 CAT",
    subjectPlaceholder: "Ni gute twagufasha?",
    messagePlaceholder: "Sobanura ikibazo cyawe mu buryo burambuye..."
  },
  officeMapTitle: "Icyicaro gikuru cya MyJudicial i Kigali, mu Rwanda"
};

const pricingAdditionsEn = {
  mostPopular: "Most Popular"
};
const pricingAdditionsFr = {
  mostPopular: "Le plus populaire"
};
const pricingAdditionsRw = {
  mostPopular: "Ikunzwe cyane"
};

const helpAdditionsEn = {
  readArticles: "Read Articles"
};
const helpAdditionsFr = {
  readArticles: "Lire les articles"
};
const helpAdditionsRw = {
  readArticles: "Soma ingingo"
};

// 7. Errors Keys
const errorsEn = {
  notFound: {
    title: "Page Not Found",
    description: "The page you are looking for does not exist or has been moved.",
    backHome: "Back to Home"
  },
  general: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    retry: "Try Again"
  }
};
const errorsFr = {
  notFound: {
    title: "Page non trouvée",
    description: "La page que vous recherchez n'existe pas ou a été déplacée.",
    backHome: "Retour à l'accueil"
  },
  general: {
    title: "Une erreur est survenue",
    description: "Une erreur inattendue est survenue. Veuillez réessayer.",
    retry: "Réessayer"
  }
};
const errorsRw = {
  notFound: {
    title: "Ipaji ntiyabonetse",
    description: "Ipaji ushakisha ntiriho cyangwa yimuwe.",
    backHome: "Subira ahabanza"
  },
  general: {
    title: "Habaye ikibazo",
    description: "Habaye ikosa ritunguranye. Ongera ugerageze.",
    retry: "Ongera ugerageze"
  }
};

// Apply all updates
deepMerge(en.search, searchEn);
deepMerge(fr.search, searchFr);
deepMerge(rw.search, searchRw);

deepMerge(en.practiceAreasPage, practiceAreasEn);
deepMerge(fr.practiceAreasPage, practiceAreasFr);
deepMerge(rw.practiceAreasPage, practiceAreasRw);

if (!en.lawyers) en.lawyers = {};
if (!fr.lawyers) fr.lawyers = {};
if (!rw.lawyers) rw.lawyers = {};
deepMerge(en.lawyers, lawyersEn);
deepMerge(fr.lawyers, lawyersFr);
deepMerge(rw.lawyers, lawyersRw);

if (!en.booking) en.booking = {};
if (!fr.booking) fr.booking = {};
if (!rw.booking) rw.booking = {};
deepMerge(en.booking, bookingEn);
deepMerge(fr.booking, bookingFr);
deepMerge(rw.booking, bookingRw);

if (!en.ai) en.ai = {};
if (!fr.ai) fr.ai = {};
if (!rw.ai) rw.ai = {};
deepMerge(en.ai, aiEn);
deepMerge(fr.ai, aiFr);
deepMerge(rw.ai, aiRw);

deepMerge(en.contactPage, contactAdditionsEn);
deepMerge(fr.contactPage, contactAdditionsFr);
deepMerge(rw.contactPage, contactAdditionsRw);

deepMerge(en.pricingPage, pricingAdditionsEn);
deepMerge(fr.pricingPage, pricingAdditionsFr);
deepMerge(rw.pricingPage, pricingAdditionsRw);

deepMerge(en.helpPage, helpAdditionsEn);
deepMerge(fr.helpPage, helpAdditionsFr);
deepMerge(rw.helpPage, helpAdditionsRw);

if (!en.errors) en.errors = {};
if (!fr.errors) fr.errors = {};
if (!rw.errors) rw.errors = {};
deepMerge(en.errors, errorsEn);
deepMerge(fr.errors, errorsFr);
deepMerge(rw.errors, errorsRw);

// Parity check & save
function ensureParity(source, target, fallbackSource) {
  for (const k of Object.keys(source)) {
    if (typeof source[k] === 'object' && source[k] !== null && !Array.isArray(source[k])) {
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {};
      }
      ensureParity(source[k], target[k], fallbackSource ? fallbackSource[k] : undefined);
    } else {
      if (target[k] === undefined) {
        target[k] = fallbackSource && fallbackSource[k] !== undefined ? fallbackSource[k] : source[k];
      }
    }
  }
}

ensureParity(en, fr, en);
ensureParity(en, rw, en);

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf8');
fs.writeFileSync(rwPath, JSON.stringify(rw, null, 2) + '\n', 'utf8');

console.log('UI Keys Injection complete!');
