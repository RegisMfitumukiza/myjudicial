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

console.log('Original keys count: EN =', countKeys(en), 'FR =', countKeys(fr), 'RW =', countKeys(rw));

function countKeys(obj) {
  let count = 0;
  function walk(o) {
    if (typeof o === 'object' && o !== null) {
      for (const k of Object.keys(o)) {
        count++;
        walk(o[k]);
      }
    }
  }
  walk(obj);
  return count;
}

// 1. PRACTICE AREAS SPECIALTIES (Descriptions & Topics)
const practiceAreaSpecialtiesEn = {
  COMMERCIAL_LAW: {
    name: "Commercial Law",
    description: "Commercial disputes, trade contracts, business debt recovery, and cross-border transactions under Rwandan commercial law.",
    topics: ["Trade Agreements", "Commercial Litigation", "Debt Recovery", "Distribution Contracts"]
  },
  CONTRACT_LAW: {
    name: "Contract Law",
    description: "Drafting, reviewing, and enforcing binding agreements, non-disclosure pacts, and resolving breach of contract disputes.",
    topics: ["Contract Drafting & Review", "Breach of Contract", "NDAs & Service Agreements", "Commercial Mediation"]
  },
  CORPORATE_LAW: {
    name: "Corporate Law",
    description: "RDB business formation, shareholder structures, corporate governance, mergers, and legal compliance for companies in Rwanda.",
    topics: ["RDB Company Registration", "Shareholder Agreements", "M&A & Restructuring", "Corporate Compliance"]
  },
  CRIMINAL_LAW: {
    name: "Criminal Law",
    description: "Defense representation and legal counsel for RIB investigations, prosecution bail hearings, and court trial defense.",
    topics: ["RIB Investigations", "Bail Hearings", "Financial & Economic Crimes", "Court Trial Defense"]
  },
  TAX_LAW: {
    name: "Tax Law",
    description: "Rwanda Revenue Authority (RRA) compliance, tax dispute litigation, customs appeals, and corporate tax structuring.",
    topics: ["RRA Tax Audits", "Tax Dispute Appeals", "VAT & Customs Compliance", "Corporate Tax Planning"]
  },
  IMMIGRATION_LAW: {
    name: "Immigration Law",
    description: "Work permits (Classes A through G), investor and business visas, permanent residency, and Rwandan dual citizenship.",
    topics: ["Work Permits (Class A–G)", "Investor & Business Visas", "Residency Permits", "Dual Citizenship"]
  },
  FAMILY_LAW: {
    name: "Family Law",
    description: "Compassionate legal counsel for divorce proceedings, child custody, matrimonial property regimes, and inheritance succession.",
    topics: ["Divorce & Separation", "Child Custody & Support", "Inheritance & Succession", "Matrimonial Regimes"]
  },
  INTELLECTUAL_PROPERTY: {
    name: "Intellectual Property",
    description: "Protecting trademarks, patents, industrial designs, copyrights, and brand enforcement registered with RDB.",
    topics: ["RDB Trademark Registration", "Brand Infringement", "Copyright Protection", "Patent Filing"]
  },
  EMPLOYMENT_LAW: {
    name: "Employment Law",
    description: "Resolving workplace disputes, wrongful termination claims, employment contract negotiations, and labor inspectorate mediation.",
    topics: ["Unfair Dismissal Claims", "Employment Contracts", "Severance Calculations", "Workplace Mediation"]
  },
  LAND_LAW: {
    name: "Land Law",
    description: "Comprehensive legal assistance for land title transfers, RLMUA registration, boundary conflicts, and commercial leases.",
    topics: ["Land Title Transfers", "RLMUA Registration", "Boundary Disputes", "Commercial Leases"]
  }
};

const practiceAreaSpecialtiesFr = {
  COMMERCIAL_LAW: {
    name: "Droit commercial",
    description: "Litiges commerciaux, contrats d'affaires, recouvrement de créances et transactions transfrontalières selon le droit rwandais.",
    topics: ["Accords commerciaux", "Contentieux commercial", "Recouvrement de créances", "Contrats de distribution"]
  },
  CONTRACT_LAW: {
    name: "Droit des contrats",
    description: "Rédaction, révision et exécution d'accords contractuels, accords de confidentialité et résolution des ruptures de contrat.",
    topics: ["Rédaction & Révision", "Rupture de contrat", "Accords de confidentialité", "Médiation contractuelle"]
  },
  CORPORATE_LAW: {
    name: "Droit des sociétés",
    description: "Création d'entreprises au RDB, pactes d'actionnaires, gouvernance d'entreprise, fusions et conformité légale au Rwanda.",
    topics: ["Enregistrement RDB", "Pactes d'actionnaires", "Fusions & Acquisitions", "Conformité d'entreprise"]
  },
  CRIMINAL_LAW: {
    name: "Droit pénal",
    description: "Défense pénale et assistance juridique pour les enquêtes du RIB, audiences de mise en liberté provisoire et plaidoiries.",
    topics: ["Enquêtes RIB", "Liberté sous caution", "Infractions financières", "Défense devant les tribunaux"]
  },
  TAX_LAW: {
    name: "Droit fiscal",
    description: "Conformité fiscale auprès de la RRA, recours fiscaux, litiges douaniers et optimisation fiscale d'entreprise.",
    topics: ["Contrôles fiscaux RRA", "Recours & Contentieux", "TVA & Douanes", "Planification fiscale"]
  },
  IMMIGRATION_LAW: {
    name: "Droit de l'immigration",
    description: "Permis de travail (classes A à G), visas d'investisseurs et d'affaires, résidence permanente et double nationalité rwandaise.",
    topics: ["Permis de travail (A à G)", "Visas d'affaires", "Résidence permanente", "Double nationalité"]
  },
  FAMILY_LAW: {
    name: "Droit de la famille",
    description: "Accompagnement juridique pour les procédures de divorce, garde d'enfants, régimes matrimoniaux et successions héréditaires.",
    topics: ["Divorce & Séparation", "Garde & Pension", "Successions & Héritage", "Régimes matrimoniaux"]
  },
  INTELLECTUAL_PROPERTY: {
    name: "Propriété intellectuelle",
    description: "Protection des marques, brevets, dessins industriels, droits d'auteur et défense de marque enregistrée au RDB.",
    topics: ["Dépôt de marque RDB", "Contrefaçon & Litiges", "Droits d'auteur", "Brevets d'invention"]
  },
  EMPLOYMENT_LAW: {
    name: "Droit du travail",
    description: "Résolution des litiges de travail, licenciements abusifs, négociation de contrats et médiation auprès de l'inspection du travail.",
    topics: ["Licenciement abusif", "Contrats de travail", "Indemnités de départ", "Médiation du travail"]
  },
  LAND_LAW: {
    name: "Droit foncier & immobilier",
    description: "Assistance complète pour les mutations foncières, enregistrement RLMUA, litiges de bornage et baux commerciaux.",
    topics: ["Mutations de titres fonciers", "Enregistrement RLMUA", "Conflits de limites", "Baux commerciaux"]
  }
};

const practiceAreaSpecialtiesRw = {
  COMMERCIAL_LAW: {
    name: "Amategeko y'Ubucuruzi",
    description: "Amakimbirane y'ubucuruzi, amasezerano y'ubucuruzi, kwishyuza imyenda n'ubucuruzi bwambukiranya imipaka mu mategeko y'u Rwanda.",
    topics: ["Amasezerano y'ubucuruzi", "Imanza z'ubucuruzi", "Kwishyuza imyenda", "Amasezerano yo gukwirakwiza"]
  },
  CONTRACT_LAW: {
    name: "Amategeko y'Amasezerano",
    description: "Guhimba, gusuzuma no gukurikirana ishyirwa mu bikorwa ry'amasezerano, kugira ibanga no gukemura impaka zivutse.",
    topics: ["Kwandika & Gusuzuma amasezerano", "Kutubahiriza amasezerano", "Amasezerano y'ibanga", "Ubuhuza mu masezerano"]
  },
  CORPORATE_LAW: {
    name: "Amategeko y'Ibigo n'Inganda",
    description: "Kwandikisha ubucuruzi muri RDB, imigabane mu masosiyete, imiyoborere y'ibigo, guhuza ibigo no kubahiriza amategeko y'u Rwanda.",
    topics: ["Kwandikisha sosiyete muri RDB", "Amasezerano y'abanyamigabane", "Guhuza ibigo", "Kubahiriza amategeko"]
  },
  CRIMINAL_LAW: {
    name: "Amategeko Mpanabyaha",
    description: "Kunganira abakekwaho ibyaha mu iperereza rya RIB, ibirego by'ifungwa n'ifungurwa by'agateganyo, no kuburanira mu nkiko.",
    topics: ["Iperereza rya RIB", "Iremezwa ry'ingwate", "Ibyaha by'ubukungu n'imari", "Kunganira mu rukiko"]
  },
  TAX_LAW: {
    name: "Amategeko y'Imisoro n'Amahoro",
    description: "Kubahiriza amategeko y'Ikigo cy'Imisoro n'Amahoro (RRA), kujuririra ibihano by'imisoro, gasutamo no gutegura imisoro y'ibigo.",
    topics: ["Kugenzura imisoro na RRA", "Kujuririra imisoro", "TVA & Gasutamo", "Gupanga imisoro y'ubucuruzi"]
  },
  IMMIGRATION_LAW: {
    name: "Amategeko y'Abinjira n'Abasohoka",
    description: "Uruhushya rwo gukora mu Rwanda (Ibyiciro A kugeza G), viza z'abashoramari, gutura burundu n'ubwenegihugu bubiri bw'u Rwanda.",
    topics: ["Uruhushya rwo gukora (A–G)", "Viza z'abashoramari", "Uruhushya rwo gutura", "Ubwenegihugu bubiri"]
  },
  FAMILY_LAW: {
    name: "Amategeko y'Umuryango",
    description: "Ubujyanama buzira amakemwa mu gutandukana kw'abashakanye, kurera abana, imicungire y'umutungo n'izungura ry'umurage.",
    topics: ["Gutandukana & Gusesa ishyingirwa", "Kurerera abana & Indezo", "Izungura & Umurage", "Imicungire y'umutungo"]
  },
  INTELLECTUAL_PROPERTY: {
    name: "Umutungo mu by'Ubwenge",
    description: "Kurengera ibirango by'ubucuruzi, ibihangano, ibivumbuwe, uburenganzira bw'umuhanzi byanditswe muri RDB.",
    topics: ["Kwandikisha ikirango muri RDB", "Kurengera uburenganzira", "Uburenganzira bw'umuhanzi", "Ipatanti y'ubuvumbuzi"]
  },
  EMPLOYMENT_LAW: {
    name: "Amategeko y'Umurimo",
    description: "Gukemura amakimbirane yo mu kazi, kwirukanwa binyuranyije n'amategeko, amasezerano y'umurimo n'ubuhuza bw'ubugenzuzi bw'umurimo.",
    topics: ["Kwirukanwa bidakurikije amategeko", "Amasezerano y'umurimo", "Imperekeza z'akazi", "Ubuhuza bw'umurimo"]
  },
  LAND_LAW: {
    name: "Amategeko y'Ubutaka n'Umutungo Utimukanwa",
    description: "Ubufasha bwuzuye mu guhererekanya ibyangombwa by'ubutaka, kwiyandikisha muri RLMUA, amakimbirane y'imbibi n'ubukode bw'ubucuruzi.",
    topics: ["Guhererekanya ibyangombwa", "Kwandikisha muri RLMUA", "Amakimbirane y'imbibi", "Ubukode bw'ubucuruzi"]
  }
};

en.practiceAreasPage.specialties = practiceAreaSpecialtiesEn;
fr.practiceAreasPage.specialties = practiceAreaSpecialtiesFr;
rw.practiceAreasPage.specialties = practiceAreaSpecialtiesRw;

// 2. PUBLIC EXPERT PROFILE NEW KEYS
const expertProfileEn = {
  reportReasons: {
    spam: "Spam or promotional content",
    harassment: "Harassment or offensive behavior",
    offensiveLanguage: "Inappropriate or offensive language",
    fakeReview: "Fraudulent or fake review",
    other: "Other reason"
  },
  contactRate: "Contact",
  legalServices: "Legal Services"
};

const expertProfileFr = {
  reportReasons: {
    spam: "Spam ou contenu promotionnel",
    harassment: "Harcèlement ou comportement abusif",
    offensiveLanguage: "Langage offensant ou inapproprié",
    fakeReview: "Avis frauduleux ou faux",
    other: "Autre motif"
  },
  contactRate: "Sur devis",
  legalServices: "Services juridiques"
};

const expertProfileRw = {
  reportReasons: {
    spam: "Ubutumwa bwamamaza bidakenewe",
    harassment: "Ihohotera cyangwa imvugo ibangamye",
    offensiveLanguage: "Imvugo itiyubashye",
    fakeReview: "Ibitekerezo by'ibihimbano",
    other: "Izindi mpamvu"
  },
  contactRate: "Baza igiciro",
  legalServices: "Ubufasha mu by'amategeko"
};

Object.assign(en.public.expertProfile, expertProfileEn);
Object.assign(fr.public.expertProfile, expertProfileFr);
Object.assign(rw.public.expertProfile, expertProfileRw);

// 3. PUBLIC BOOKINGS NEW KEYS
const bookingsEn = {
  whatHappened: "What Happened?",
  cancelledExplanation: "The payment was cancelled before completion. This could be because you:",
  cancelledReason1: "Clicked \"Cancel\" on the payment screen",
  cancelledReason2: "Closed the payment window",
  cancelledReason3: "Experienced a connection timeout",
  browseLawyersAgain: "Browse Lawyers Again",
  contactSupport: "Contact Support",
  mobileMoneyUnavailable: "Mobile Money provider temporarily unavailable",
  browseMoreLawyers: "Browse More Lawyers",
  tip: "Tip",
  tipDesc: "Make sure you have sufficient funds and approve the mobile money prompt on your phone within 60 seconds."
};

const bookingsFr = {
  whatHappened: "Que s'est-il passé ?",
  cancelledExplanation: "Le paiement a été interrompu avant sa finalisation. Cela peut être dû à :",
  cancelledReason1: "Un clic sur « Annuler » sur l'écran de paiement",
  cancelledReason2: "La fermeture intempestive de la fenêtre de paiement",
  cancelledReason3: "Un dépassement du délai de connexion réseau",
  browseLawyersAgain: "Parcourir à nouveau les avocats",
  contactSupport: "Contacter l'assistance",
  mobileMoneyUnavailable: "Service Mobile Money momentanément indisponible",
  browseMoreLawyers: "Découvrir d'autres avocats",
  tip: "Conseil",
  tipDesc: "Vérifiez votre solde Mobile Money et validez l'invite avec votre code PIN sur votre téléphone dans les 60 secondes."
};

const bookingsRw = {
  whatHappened: "Byagenze bite?",
  cancelledExplanation: "Kwishyura byahagaze bitarangiye. Ibi bishobora kuba byatewe na:",
  cancelledReason1: "Wakanze ahanditse \"Kureka\" kuri terefone",
  cancelledReason2: "Wafunze idirishya ryo kwishyura",
  cancelledReason3: "Igihe cyo kwishyura cyarangiye kubera interineti",
  browseLawyersAgain: "Ongera ushake abavoka",
  contactSupport: "Vugana n'abashinzwe ubufasha",
  mobileMoneyUnavailable: "Serivisi ya Mobile Money ntabwo iri kuboneka muri aka kanya",
  browseMoreLawyers: "Reba izindi nzobere mu by'amategeko",
  tip: "Inama",
  tipDesc: "Reba neza ko ufite amafaranga ahagije kuri konte yawe kandi wemeze kwishyura ukoresheje PIN yawe mu masegonda 60."
};

Object.assign(en.public.bookings, bookingsEn);
Object.assign(fr.public.bookings, bookingsFr);
Object.assign(rw.public.bookings, bookingsRw);

// 4. PUBLIC AI CHAT NEW KEYS
const aiChatEn = {
  chatWithAi: "Chat with AI",
  commonTopics: "Common topics:",
  prompts: {
    land: "Land boundary & title dispute",
    employment: "Unfair employment dismissal",
    contract: "Commercial contract breach",
    family: "Divorce & custody questions"
  },
  urgency: "Urgency:",
  recommendedExperts: "Recommended Experts:",
  view: "View",
  analyzing: "Analyzing case & finding lawyers...",
  openFullWorkspace: "Open in Full Case Workspace",
  welcomeMessage: "Hello! I'm your MyJudicial AI Legal Assistant. Describe any legal matter in Rwanda to receive instant case triage and verified expert recommendations.",
  triageResponse: "Based on your description, this case falls under **{specialty}** with **{urgency} urgency**.",
  errorMessage: "I encountered an issue analyzing your request. You can also explore our full legal intake workspace directly.",
  inputPlaceholder: "Describe your legal issue...",
  sendMessage: "Send message",
  dismiss: "Dismiss AI assistant",
  expandWorkspace: "Expand to Full Workspace",
  closeChat: "Close chat"
};

const aiChatFr = {
  chatWithAi: "Discuter avec l'IA",
  commonTopics: "Sujets fréquents :",
  prompts: {
    land: "Litige foncier et bornage de terrain",
    employment: "Licenciement abusif au travail",
    contract: "Rupture de contrat commercial",
    family: "Questions de divorce et garde d'enfants"
  },
  urgency: "Urgence :",
  recommendedExperts: "Avocats recommandés :",
  view: "Voir",
  analyzing: "Analyse du dossier et recherche d'avocats...",
  openFullWorkspace: "Ouvrir dans l'espace complet du dossier",
  welcomeMessage: "Bonjour ! Je suis votre Assistant Juridique IA MyJudicial. Décrivez votre situation juridique au Rwanda pour recevoir une orientation immédiate et des recommandations d'experts certifiés.",
  triageResponse: "D'après votre description, ce dossier relève du **{specialty}** avec un niveau d'urgence **{urgency}**.",
  errorMessage: "Une difficulté est survenue lors de l'analyse. Vous pouvez également accéder directement à notre espace d'évaluation juridique complet.",
  inputPlaceholder: "Décrivez votre situation juridique...",
  sendMessage: "Envoyer le message",
  dismiss: "Fermer l'assistant IA",
  expandWorkspace: "Ouvrir en plein écran",
  closeChat: "Fermer le chat"
};

const aiChatRw = {
  chatWithAi: "Ganira na AI",
  commonTopics: "Ingingo zikunze kugaragara:",
  prompts: {
    land: "Amakimbirane y'imbibi n'ubutaka",
    employment: "Kwirukanwa mu kazi binyuranyije n'amategeko",
    contract: "Ukwica amasezerano y'ubucuruzi",
    family: "Ibibazo byo gutandukana n'uburere bw'abana"
  },
  urgency: "Ubwihutirwe:",
  recommendedExperts: "Inzobere zasabwe:",
  view: "Reba",
  analyzing: "Iri gusesengura ikibazo no gushaka abavoka...",
  openFullWorkspace: "Fungura ahagenewe gusesengura ibibazo byose",
  welcomeMessage: "Muraho! Ndi Umufasha wanyu w'Ubwenge bwa Mudasobwa (AI) mu by'Amategeko kuri MyJudicial. Sobanura ikibazo icyo ari cyo cyose mu mategeko y'u Rwanda uhabwe ubujyanama bw'ibanze n'abavoka b'inzobere bakibereye.",
  triageResponse: "Dukurikije ibisobanuro byawe, iki kibazo kigengwa n'**{specialty}** gifite ubwihutirwe bwo ku kigero cya **{urgency}**.",
  errorMessage: "Habayeho ikibazo mu gusesengura ubusabe bwawe. Urashobora gukoresha ahasanzwe hasesengurirwa ibibazo by'amategeko mu buryo bwisumbuyeho.",
  inputPlaceholder: "Sobanura ikibazo cyawe mu mategeko...",
  sendMessage: "Ohereza ubutumwa",
  dismiss: "Funga ubufasha bwa AI",
  expandWorkspace: "Kwagura idirishya ryose",
  closeChat: "Funga ibiganiro"
};

Object.assign(en.public.aiChat, aiChatEn);
Object.assign(fr.public.aiChat, aiChatFr);
Object.assign(rw.public.aiChat, aiChatRw);

// 5. SEARCH NAMESPACE ADDITIONS
const searchEn = {
  viewProfileOf: "View profile of {name}",
  closeDetails: "Close expert details",
  legalExpert: "Legal Expert",
  specialistsIn: "{specialty} Specialists",
  practiceAreasCount: "{count} Practice Areas",
  verifiedAdvocatesInSpecialties: "Verified advocates specializing in {specialties} in Rwanda.",
  radius: {
    allRwanda: "All Rwanda"
  }
};

const searchFr = {
  viewProfileOf: "Consulter le profil de {name}",
  closeDetails: "Fermer les détails de l'expert",
  legalExpert: "Expert juridique",
  specialistsIn: "Spécialistes en {specialty}",
  practiceAreasCount: "{count} domaines de compétence",
  verifiedAdvocatesInSpecialties: "Avocats certifiés spécialisés en {specialties} au Rwanda.",
  radius: {
    allRwanda: "Tout le Rwanda"
  }
};

const searchRw = {
  viewProfileOf: "Reba umwirondoro wa {name}",
  closeDetails: "Funga amakuru y'inzobere",
  legalExpert: "Inzobere mu by'amategeko",
  specialistsIn: "Inzobere muri {specialty}",
  practiceAreasCount: "Amashami y'amategeko {count}",
  verifiedAdvocatesInSpecialties: "Abavoka b'inzobere bemewe muri {specialties} mu Rwanda.",
  radius: {
    allRwanda: "U Rwanda rwose"
  }
};

Object.assign(en.search, searchEn);
Object.assign(fr.search, searchFr);
Object.assign(rw.search, searchRw);

// 6. BOOKING NAMESPACE ADDITIONS
const bookingEn = {
  notSelected: "Not selected",
  durationMinutes: "{count} minutes",
  durationMin: "{count} min",
  dateAtTime: "{date} at {time}",
  optional: "Optional"
};

const bookingFr = {
  notSelected: "Non sélectionné",
  durationMinutes: "{count} minutes",
  durationMin: "{count} min",
  dateAtTime: "{date} à {time}",
  optional: "Optionnel"
};

const bookingRw = {
  notSelected: "Ntabwo byatoranyijwe",
  durationMinutes: "Iminota {count}",
  durationMin: "Imin. {count}",
  dateAtTime: "Kuwa {date} saa {time}",
  optional: "Bishobora gusimbukwa"
};

Object.assign(en.booking, bookingEn);
Object.assign(fr.booking, bookingFr);
Object.assign(rw.booking, bookingRw);

// 7. CONTACT PAGE ADDITIONS
const contactEn = {
  labels: {
    email: "Email",
    location: "Location",
    hours: "Business Hours"
  },
  formPlaceholders: {
    name: "John Doe",
    email: "john@example.com",
    subject: "How can we help?",
    message: "Describe your inquiry..."
  },
  mapTitle: "MyJudicial Location"
};

const contactFr = {
  labels: {
    email: "E-mail",
    location: "Adresse",
    hours: "Heures d'ouverture"
  },
  formPlaceholders: {
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    subject: "En quoi pouvons-nous vous aider ?",
    message: "Décrivez votre demande..."
  },
  mapTitle: "Emplacement de MyJudicial"
};

const contactRw = {
  labels: {
    email: "Imeli",
    location: "Aho dukorera",
    hours: "Amasaha yo gukora"
  },
  formPlaceholders: {
    name: "Kwizera Jean",
    email: "kwizera@example.com",
    subject: "Ni iki twagufasha?",
    message: "Sobanura ubutumwa bwawe..."
  },
  mapTitle: "Aho MyJudicial iherereye"
};

Object.assign(en.contactPage, contactEn);
Object.assign(fr.contactPage, contactFr);
Object.assign(rw.contactPage, contactRw);

// 8. PRICING & HELP ADDITIONS
en.pricingPage.tiers.consultation.badge = "Most Popular";
fr.pricingPage.tiers.consultation.badge = "Le plus demandé";
rw.pricingPage.tiers.consultation.badge = "Ikunzwe cyane";

en.helpPage.topics.readArticles = "Read Articles";
fr.helpPage.topics.readArticles = "Lire les articles";
rw.helpPage.topics.readArticles = "Soma ingingo";

// 9. ERRORS NAMESPACE ADDITIONS
en.errors = {
  notFound: {
    badge: "404",
    title: "Page not found",
    description: "The page you are looking for does not exist or may have moved.",
    goHome: "Go home"
  },
  general: {
    badge: "Error",
    title: "Something went wrong",
    description: "The request could not be completed. You can try again.",
    tryAgain: "Try again"
  }
};

fr.errors = {
  notFound: {
    badge: "404",
    title: "Page non trouvée",
    description: "La page que vous recherchez n'existe pas ou a été déplacée.",
    goHome: "Retour à l'accueil"
  },
  general: {
    badge: "Erreur",
    title: "Une erreur est survenue",
    description: "La requête n'a pas pu aboutir. Veuillez réessayer.",
    tryAgain: "Réessayer"
  }
};

rw.errors = {
  notFound: {
    badge: "404",
    title: "Ipaji ntiyabonetse",
    description: "Ipaji mushakisha ntiyabonetse cyangwa yimuriwe ahandi.",
    goHome: "Subira ahabanza"
  },
  general: {
    badge: "Ikosa",
    title: "Habaye ikibazo",
    description: "Icyifuzo cyanyu nticyashobotse kurangira. Ongera mugerageze.",
    tryAgain: "Ongera ugerageze"
  }
};

// 10. AI NAMESPACE ADDITIONS
const aiEn = {
  analysisResponse: "I've analyzed your case. It falls under **{specialty}** with {urgency} urgency.",
  matchesFound: "I found **{count} matching experts** for your case.",
  upload: "Upload",
  yrShort: "{years} yr"
};

const aiFr = {
  analysisResponse: "J'ai analysé votre dossier. Il relève du domaine **{specialty}** avec une urgence {urgency}.",
  matchesFound: "J'ai trouvé **{count} experts correspondants** pour votre dossier.",
  upload: "Téléverser",
  yrShort: "{years} ans"
};

const aiRw = {
  analysisResponse: "Nasesenguye ikibazo cyawe. Kigengwa n'**{specialty}** gifite ubwihutirwe bwa {urgency}.",
  matchesFound: "Nabonye **inzobere {count} zikwiriye** ikibazo cyawe.",
  upload: "Kuzana inyandiko",
  yrShort: "imyaka {years}"
};

Object.assign(en.ai, aiEn);
Object.assign(fr.ai, aiFr);
Object.assign(rw.ai, aiRw);

// 11. TRANSLATING UNTRANSLATED PUBLIC PAGES FOR FR AND RW
// 11.1 about
fr.about = {
  hero: {
    badge: "À propos de MyJudicial",
    title: "Rapprocher la justice de chaque citoyen rwandais",
    subtitle: "MyJudicial est la première plateforme légale numérique du Rwanda reliant les particuliers et les entreprises à des avocats certifiés par le Barreau du Rwanda.",
    stats: {
      verifiedExperts: "Avocats certifiés",
      completedConsultations: "Consultations réalisées",
      totalClients: "Clients satisfaits"
    }
  },
  mission: {
    title: "Notre mission",
    text: "Démocratiser l'accès à la justice et aux conseils juridiques qualifiés au Rwanda grâce à une technologie transparente, accessible et sécurisée.",
    visionTitle: "Notre vision",
    visionText: "Un Rwanda où chaque citoyen, entrepreneur et organisation bénéficie d'une protection juridique équitable et immédiate sans complications."
  },
  story: {
    title: "Notre histoire",
    text1: "Fondée à Kigali, MyJudicial est née du constat que trouver un avocat qualifié et disponible était complexe, opaque et intimidant pour la majorité des citoyens.",
    text2: "Nous avons développé un pont numérique conforme aux régulations rwandaises permettant des consultations vérifiées, avec tarification claire et paiement sécurisé via Mobile Money."
  },
  values: {
    title: "Nos valeurs fondamentales",
    access: {
      title: "Accessibilité",
      text: "Le droit doit être compréhensible et accessible à tous, sans barrières financières imprévues ni démarches opaques."
    },
    transparency: {
      title: "Transparence",
      text: "Honoraires fixes, identité certifiée par le Barreau et avis de clients réels avant chaque engagement."
    },
    trust: {
      title: "Confiance & Sécurité",
      text: "Paiements retenus sous séquestre jusqu'à la tenue effective de la consultation et confidentialité absolue de vos données."
    }
  },
  cta: {
    title: "Prêt à obtenir un conseil juridique de confiance ?",
    findLawyer: "Trouver un avocat",
    joinLawyer: "Rejoindre en tant qu'avocat"
  }
};

rw.about = {
  hero: {
    badge: "Ibyerekeye MyJudicial",
    title: "Kwegereza ubutabera no kugisha inama buri munyarwanda",
    subtitle: "MyJudicial ni urubuga rwa mbere rw'ikoranabuhanga mu Rwanda ruhuza abaturage na ba rwiyemezamirimo n'abavoka b'umwuga bemewe n'Urugaga rw'Abavoka mu Rwanda.",
    stats: {
      verifiedExperts: "Abavoka bemewe",
      completedConsultations: "Inama zatanzwe",
      totalClients: "Abaturage bafashijwe"
    }
  },
  mission: {
    title: "Intego yacu",
    text: "Kworohereza buri wese kubona inama z'amategeko zizewe kandi zinoze mu Rwanda binyuze mu ikoranabuhanga ryizewe kandi ryihuse.",
    visionTitle: "Icyerekezo cyacu",
    visionText: "U Rwanda aho buri muturarwanda na buri kigo babona ubutabera n'ubufasha mu by'amategeko mu mucyo no mu buryo bworoshye."
  },
  story: {
    title: "Amateka yacu",
    text1: "MyJudicial yatangirijwe i Kigali nyuma yo kubona ko kubona umwavoka w'umwuga uhuye n'ikibazo cyawe byari bigoranye ku baturage benshi.",
    text2: "Twubatse urubuga rworohereza abantu kubona abavoka b'umwuga, kumenya ibiciro mbere yo gufata gahunda, no kwishyura mu mutekano binyuze kuri Mobile Money."
  },
  values: {
    title: "Indangagaciro zacu",
    access: {
      title: "Kwegerezwa abaturage",
      text: "Ubufasha mu by'amategeko bugomba kubonwa na buri wese bitabangamiye ubushobozi bwe cyangwa aho aherereye."
    },
    transparency: {
      title: "Gukorera mu mucyo",
      text: "Ibiciro bisobanutse, abavoka bemewe n'Urugaga rw'Abavoka, n'ibitekerezo by'abakiriya bahawe serivisi nyakuri."
    },
    trust: {
      title: "Kwizera n'Umutekano",
      text: "Amafaranga yawe arindwa neza kugeza igihe inama y'amategeko irangiye neza kandi amakuru yawe akagirwa ibanga rikomeye."
    }
  },
  cta: {
    title: "Witeguye kubona umwavoka w'umwuga uyu munsi?",
    findLawyer: "Shaka Umwavoka",
    joinLawyer: "Iyandikishe nk'Umwavoka"
  }
};

// 11.2 contactPage
fr.contactPage.hero = {
  badge: "Contactez-nous",
  title: "Nous sommes à votre écoute",
  subtitle: "Une question juridique, un partenariat ou besoin d'assistance ? Notre équipe à Kigali est à votre disposition."
};
fr.contactPage.info = {
  title: "Nos coordonnées",
  email: "support@myjudicial.rw",
  location: "Kigali, Rwanda",
  hours: "Du lundi au vendredi : 08h00 – 18h00 CAT"
};
fr.contactPage.form = {
  title: "Envoyez-nous un message",
  name: "Nom complet",
  email: "Adresse e-mail",
  subject: "Objet de votre demande",
  message: "Votre message",
  submit: "Envoyer le message"
};

rw.contactPage.hero = {
  badge: "Twandikire",
  title: "Turahari ku bwanyu",
  subtitle: "Ufite ikibazo cyangwa ukeneye ubufasha? Ikipe ya MyJudicial i Kigali iriteguye kugufasha."
};
rw.contactPage.info = {
  title: "Aho wadusanga",
  email: "support@myjudicial.rw",
  location: "Kigali, u Rwanda",
  hours: "Kuwa mbere kugeza kuwa gatanu: 08:00 – 18:00 CAT"
};
rw.contactPage.form = {
  title: "Tyoherereze ubutumwa",
  name: "Amazina yose",
  email: "Imeli yawe",
  subject: "Impamvu y'ubutumwa",
  message: "Ubutumwa bwawe",
  submit: "Ohereza ubutumwa"
};

// 11.3 faqsPage
fr.faqsPage = {
  hero: {
    badge: "Foire Aux Questions",
    title: "Questions fréquentes",
    subtitle: "Trouvez des réponses claires sur le fonctionnement de MyJudicial, la vérification des avocats et la sécurité des paiements."
  },
  cta: {
    title: "Vous n'avez pas trouvé votre réponse ?",
    subtitle: "Notre équipe d'assistance à Kigali est disponible pour vous accompagner.",
    contact: "Contactez le support"
  }
};

rw.faqsPage = {
  hero: {
    badge: "Ibibazo Bikunze Kubazwa",
    title: "Ibisobanuro ku bibazo bikunze kubazwa",
    subtitle: "Bona ibisubizo byihuse ku mikorere ya MyJudicial, kwemeza abavoka n'umutekano wo kwishyura."
  },
  cta: {
    title: "Ntiwabonye igisubizo cy'ikibazo cyawe?",
    subtitle: "Ikipe yacu ishinzwe gufasha abakiriya i Kigali yiteguye kugusubiza no kugufasha.",
    contact: "Twandikire ubufasha"
  }
};

// 11.4 helpPage
fr.helpPage = {
  hero: {
    badge: "Centre d'Assistance",
    title: "Comment pouvons-nous vous aider ?",
    subtitle: "Consultez nos guides, démarches et conseils juridiques pour naviguer sereinement sur la plateforme.",
    searchPlaceholder: "Rechercher une question (réservation, paiement MoMo, annulation, avocat)..."
  },
  topics: {
    title: "Parcourir par thématique",
    gettingStarted: {
      title: "Premiers pas",
      desc: "Comprendre comment trouver un avocat, poser une question à l'IA et créer votre compte client."
    },
    booking: {
      title: "Réservations",
      desc: "Choisir un créneau, reprogrammer, annuler ou rejoindre une consultation vidéo."
    },
    payments: {
      title: "Paiements & MoMo",
      desc: "Fonctionnement du séquestre, MTN MoMo, Airtel Money, facturation et remboursements."
    },
    account: {
      title: "Compte & Sécurité",
      desc: "Gérer vos coordonnées, modifier votre mot de passe et protéger vos données personnelles."
    },
    lawyers: {
      title: "Pour les avocats",
      desc: "Inscription, certification auprès du Barreau, gestion de l'agenda et encaissement des honoraires."
    },
    trust: {
      title: "Confiance & Barreau",
      desc: "Critères de vérification des avocats, protection des données et conformité légale au Rwanda."
    },
    readArticles: "Lire les articles"
  },
  cta: {
    title: "Besoin d'une assistance personnalisée ?",
    button: "Contacter le support"
  }
};

rw.helpPage = {
  hero: {
    badge: "Ikigo cy'Ubufasha",
    title: "Ni gute twagufasha uyu munsi?",
    subtitle: "Shakira hano inyandiko n'ubujyanama ku mikoreshereze y'urubuga n'ubufasha mu by'amategeko.",
    searchPlaceholder: "Shakisha ikibazo (gufata gahunda, kwishyura na MoMo, guhindura umunsi)..."
  },
  topics: {
    title: "Ibyiciro by'ubufasha",
    gettingStarted: {
      title: "Gutangira",
      desc: "Uko ushaka umwavoka, uko ubaza ikibazo AI n'uko ufungura konti yawe."
    },
    booking: {
      title: "Gufata gahunda",
      desc: "Guhitamo umunsi n'isaha, guhindura gahunda, gusiba cyangwa kwinjira mu nama ya videwo."
    },
    payments: {
      title: "Kwishyura & MoMo",
      desc: "Uko amafaranga arindwa (Escrow), MTN MoMo, Airtel Money no gusubizwa amafaranga."
    },
    account: {
      title: "Konti & Umutekano",
      desc: "Guhindura amakuru yawe, umutekano w'ijambobanga no kurinda amakuru bwite."
    },
    lawyers: {
      title: "Ku bavoka",
      desc: "Kwiyandikisha, kwemezwa n'Urugaga rw'Abavoka, gucunga gahunda no kwakira amafaranga."
    },
    trust: {
      title: "Kwizera & Urugaga",
      desc: "Uburyo abavoka bagenzurwa, amategeko y'u Rwanda no kurinda amabanga y'abakiriya."
    },
    readArticles: "Soma ingingo"
  },
  cta: {
    title: "Ukeneye ubufasha bwihariye ubu?",
    button: "Vugana n'abashinzwe ubufasha"
  }
};

// 11.5 howItWorksPage
fr.howItWorksPage = {
  hero: {
    badge: "Guide d'Utilisation",
    title: "Comment fonctionne MyJudicial",
    subtitle: "Un parcours transparent, sécurisé et rapide pour obtenir l'assistance juridique dont vous avez besoin."
  },
  steps: {
    title: "4 étapes simples vers votre conseil juridique",
    step1: {
      title: "1. Recherchez ou demandez à l'IA",
      text: "Filtrez par domaine, localisation et honoraires, ou décrivez votre litige à notre IA pour être orienté immédiatement."
    },
    step2: {
      title: "2. Choisissez un créneau",
      text: "Sélectionnez le service souhaité et la date qui vous convient : consultation vidéo, téléphonique ou en cabinet."
    },
    step3: {
      title: "3. Payez en toute sécurité",
      text: "Réglez par MTN MoMo ou Airtel Money. Vos fonds sont retenus sous séquestre sécurisé jusqu'à la consultation."
    },
    step4: {
      title: "4. Réalisez la consultation",
      text: "Échangez en direct avec votre avocat certifié et recevez un avis juridique professionnel et personnalisé."
    }
  },
  payment: {
    title: "Protection absolue des paiements",
    text: "Vos fonds ne sont versés à l'avocat qu'une fois votre consultation terminée. Si l'avocat n'honore pas le rendez-vous, vous êtes intégralement remboursé.",
    momo: "Paiements instantanés par MTN Mobile Money et Airtel Money sécurisés."
  },
  cta: {
    title: "Commencez dès aujourd'hui",
    startNow: "Trouver un avocat",
    contactSupport: "Poser une question"
  }
};

rw.howItWorksPage = {
  hero: {
    badge: "Uko Bikora",
    title: "Uko MyJudicial igufasha kubona umwavoka",
    subtitle: "Uburyo bworoshye, bwihuse kandi bwizewe bwo kubona inama z'amategeko zinoze mu Rwanda."
  },
  steps: {
    title: "Intambwe 4 zoroshye zo kugisha inama",
    step1: {
      title: "1. Shakisha cyangwa ubaze AI",
      text: "Hitamo ishami ry'amategeko, akarere n'ibiciro, cyangwa usobanurire AI igufashe kubona umwavoka ukwiriye."
    },
    step2: {
      title: "2. Hitamo umunsi n'isaha",
      text: "Hitamo serivisi y'amategeko wifuza n'igihe kikunogeye: inama kuri videwo, kuri terefone cyangwa guhura ku biro."
    },
    step3: {
      title: "3. Ishyura mu mutekano",
      text: "Ishyura ukoresheje MTN MoMo cyangwa Airtel Money. Amafaranga yawe arindwa kugeza inama irangiye."
    },
    step4: {
      title: "4. Gisha inama umwavoka",
      text: "Vugana n'umwavoka wemewe n'Urugaga rw'Abavoka, umusobanurire ikibazo cyawe aguhe inama z'umwuga."
    }
  },
  payment: {
    title: "Umutekano usesuye ku mafaranga wishyuye",
    text: "Amafaranga yawe ntabwo ahabwa umwavoka kugeza igihe inama y'amategeko irangiye neza. Iyo umwavoka atabonetse, urayabwirwa yose.",
    momo: "Kwishyura byoroshye kandi byihuse binyuze kuri MTN Mobile Money na Airtel Money."
  },
  cta: {
    title: "Tangira ubu",
    startNow: "Shaka Umwavoka",
    contactSupport: "Baza ikibazo"
  }
};

// 11.6 partnersPage
fr.partnersPage = {
  hero: {
    badge: "Partenariats Institutionnels",
    title: "Nos Partenaires de Confiance",
    subtitle: "Nous collaborons avec les institutions majeures du Rwanda pour garantir l'intégrité, la conformité et la sécurité de chaque échange juridique."
  },
  categories: {
    legal: {
      title: "Institutions Juridiques",
      desc: "Collaboration étroite avec les instances professionnelles pour certifier la qualification de nos avocats.",
      items: [
        "Rwanda Bar Association (Barreau du Rwanda)",
        "Tribunaux et juridictions commerciales",
        "Cabinets d'avocats associés de Kigali"
      ]
    },
    financial: {
      title: "Partenaires Financiers & Télécoms",
      desc: "Intégration directe avec les réseaux de paiement mobile pour des transactions d'honoraires sans faille.",
      items: [
        "MTN Mobile Money Rwanda",
        "Airtel Money Rwanda",
        "Passerelles bancaires conformes Banque Nationale du Rwanda"
      ]
    },
    ngo: {
      title: "ONG & Accès à la Justice",
      desc: "Programmes dédiés avec des organisations civiles pour favoriser l'aide légale et l'équité pour tous.",
      items: [
        "Organisations de défense des droits civils",
        "Incubateurs et chambres de commerce rwandaises",
        "Programmes d'accès universel au droit"
      ]
    }
  },
  cta: {
    title: "Devenir Partenaire de MyJudicial",
    subtitle: "Vous êtes une institution, un cabinet d'avocats ou une organisation engagée dans l'accès au droit au Rwanda ? Échangeons ensemble.",
    button: "Nous contacter pour un partenariat"
  }
};

rw.partnersPage = {
  hero: {
    badge: "Abafatanyabikorwa",
    title: "Abafatanyabikorwa bacu b'ibanze",
    subtitle: "Dukorana n'inzego z'ubutabera n'ibigo by'imari mu Rwanda kugira ngo serivisi zitangwe mu mucyo no mu mutekano."
  },
  categories: {
    legal: {
      title: "Inzego z'Amategeko",
      desc: "Ubufatanye bwa hafi mu kwemeza no kugenzura ubushobozi bw'abavoka bari ku rubuga.",
      items: [
        "Urugaga rw'Abavoka mu Rwanda (Rwanda Bar Association)",
        "Inkiko n'Inkiko z'Ubucuruzi",
        "Ibiro by'abavoka bizewe i Kigali"
      ]
    },
    financial: {
      title: "Ibigo by'Imari n'Itumanaho",
      desc: "Guhuza imbuga n'inzira zo kwishyura kuri terefone kugira ngo kwishyura byorohere buri wese.",
      items: [
        "MTN Mobile Money Rwanda",
        "Airtel Money Rwanda",
        "Inzira z'amabanki zubahirije amabwiriza ya BNR"
      ]
    },
    ngo: {
      title: "Imiryango Itari iya Leta",
      desc: "Gukorana n'imiryango itegamiye kuri leta mu guteza imbere ubutabera bugera kuri bose.",
      items: [
        "Imiryango irengera uburenganzira bwa muntu",
        "Iruganda n'amasosiyete y'ubucuruzi mu Rwanda",
        "Gahunda zo gufasha abatishoboye kubona ubutabera"
      ]
    }
  },
  cta: {
    title: "Koranana na MyJudicial",
    subtitle: "Uri ikigo, ibiro by'abavoka cyangwa umuryango wifuza kwagura ubufasha mu by'amategeko? Twandikire.",
    button: "Twandikire ku bufatanye"
  }
};

// 11.7 pricingPage
fr.pricingPage = {
  hero: {
    badge: "Honoraires & Tarifs",
    title: "Tarification transparente, sans frais cachés",
    subtitle: "Consultez les tarifs de chaque avocat avant de vous engager. Paiement sécurisé sous séquestre avec garantie de remboursement."
  },
  howItWorks: {
    title: "Comment fonctionnent les tarifs ?",
    points: {
      fixedFees: {
        title: "Honoraires forfaitaires",
        text: "Chaque avocat fixe ses honoraires de consultation à l'avance. Vous savez exactement combien vous payez avant de confirmer."
      },
      platformFee: {
        title: "Frais inclus",
        text: "Nos frais de fonctionnement sont intégrés de manière transparente. Aucun supplément imprévu lors du paiement."
      },
      escrow: {
        title: "Garantie sous séquestre",
        text: "Votre argent est conservé en lieu sûr. Si votre consultation n'a pas lieu, vous êtes remboursé immédiatement."
      }
    }
  },
  tiers: {
    free: {
      name: "Découverte & Recherche",
      price: "Gratuit",
      desc: "Pour les citoyens et entreprises souhaitant trouver le bon avocat ou poser une question à l'IA.",
      features: [
        "Recherche illimitée d'avocats certifiés",
        "Filtrage par domaine juridique et tarif",
        "Triage de dossier par l'IA MyJudicial",
        "Consultation des avis et qualifications"
      ],
      cta: "Commencer la recherche"
    },
    consultation: {
      name: "Consultation avec un Avocat",
      price: "Dès 15 000 RWF",
      desc: "Échange personnalisé et confidentiel avec un avocat membre du Barreau du Rwanda.",
      badge: "Le plus demandé",
      features: [
        "Entretien vidéo, téléphonique ou en cabinet",
        "Examen approfondi de vos documents légaux",
        "Conseils sur mesure sous le droit rwandais",
        "Paiement protégé par séquestre MoMo"
      ],
      cta: "Réserver une consultation"
    },
    lawyer: {
      name: "Pour les Avocats",
      price: "Adhésion pro",
      desc: "Pour les avocats certifiés du Barreau souhaitant développer leur clientèle numérique.",
      features: [
        "Profil officiel vérifié par le Barreau",
        "Prise de rendez-vous et agenda automatisés",
        "Encaissement garanti par Mobile Money",
        "Outils de gestion de dossiers et clients"
      ],
      cta: "Rejoindre en tant qu'avocat"
    }
  },
  escrow: {
    badge: "Sécurité Maximale",
    title: "Le Paiement sous Séquestre MyJudicial",
    text: "Lorsque vous effectuez un paiement par MTN MoMo ou Airtel Money, les fonds ne sont pas immédiatement remis à l'avocat. Ils sont placés sur un compte de séquestre sécurisé. Ils ne sont débloqués qu'une fois la consultation confirmée. Vous êtes ainsi protégé à 100% contre les absences ou imprévus."
  },
  cta: {
    title: "Obtenez une réponse juridique dès aujourd'hui",
    subtitle: "Des centaines d'avocats vérifiés sont prêts à vous accompagner dans toutes vos démarches.",
    button: "Trouver mon avocat"
  }
};

rw.pricingPage = {
  hero: {
    badge: "Ibiciro & Kwishyura",
    title: "Ibiciro bisobanutse, nta kiguzi cy'ibanga",
    subtitle: "Banza umenye igiciro cy'umwavoka mbere yo kwiyemeza. Amafaranga yawe arindwa kugeza uhawe serivisi."
  },
  howItWorks: {
    title: "Ibiciro biteye bite?",
    points: {
      fixedFees: {
        title: "Ibiciro bizwi mbere",
        text: "Buri mwavoka ashyiraho ibiciro bye byo kugisha inama. Umenya amafaranga wishingira mbere yo kwemeza gahunda."
      },
      platformFee: {
        title: "Ibiciro bibumbye byose",
        text: "Nta yandi mafaranga wishyuzwa yiyongereyeho. Icyo ubona nicyo cyonyine wishyura."
      },
      escrow: {
        title: "Kwirinda igihombo",
        text: "Amafaranga yawe abikwa mu mutekano. Iyo inama itabaye, urayasubizwa yose nta kabuza."
      }
    }
  },
  tiers: {
    free: {
      name: "Gushakisha no Kureba",
      price: "Ubuntu",
      desc: "Ku baturage n'ibigo bishaka kubona umwavoka ukwiriye cyangwa gukoresha AI.",
      features: [
        "Gushakisha abavoka bemewe nta kiguzi",
        "Gushungura ukurikije ishami ry'amategeko n'igiciro",
        "Gukoresha AI mu gusesengura ikibazo",
        "Kureba uburambe n'ibitekerezo by'abandi bakiriya"
      ],
      cta: "Tangira gushakisha"
    },
    consultation: {
      name: "Kugisha Inama Umwavoka",
      price: "Guhera ku 15,000 RWF",
      desc: "Inama y'umwuga kandi y'ibanga n'umwavoka wemewe n'Urugaga rw'Abavoka mu Rwanda.",
      badge: "Ikunzwe cyane",
      features: [
        "Inama kuri videwo, kuri terefone cyangwa ku biro",
        "Gusuzuma inyandiko n'amasezerano yawe",
        "Ubujyanama bwihariye hakurikijwe amategeko y'u Rwanda",
        "Umutekano wo kwishyura urinzwe na MoMo"
      ],
      cta: "Fata gahunda y'inama"
    },
    lawyer: {
      name: "Ku Bavoka",
      price: "Konti y'umwuga",
      desc: "Ku bavoka bemewe n'Urugaga rw'Abavoka bifuza kwakira abakiriya banyuze ku ikoranabuhanga.",
      features: [
        "Konti yemejwe n'Urugaga rw'Abavoka",
        "Gahunda yo gufata gahunda zikora mu buryo bwikora",
        "Kwishyurwa mu mutekano binyuze kuri MoMo",
        "Ibikoresho byo gukurikirana abakiriya na dosiye"
      ],
      cta: "Iyandikishe nk'Umwavoka"
    }
  },
  escrow: {
    badge: "Umutekano Usesuye",
    title: "Uburyo Amafaranga yawe Arindwa na MyJudicial",
    text: "Iyo wishyuye ukoresheje MTN MoMo cyangwa Airtel Money, amafaranga ntabwo ahita ahabwa umwavoka ako kanya. Ahubwo arindwa neza na MyJudicial akamugeraho ari uko inama yarangiye neza. Iyo inama itabaye, amafaranga yawe uyasubizwa yose ijana ku ijana."
  },
  cta: {
    title: "Bona inama z'amategeko uyu munsi",
    subtitle: "Amagana y'abavoka b'inzobere biteguye kugufasha mu bibazo byawe byose by'amategeko.",
    button: "Shaka umwavoka ubu"
  }
};

// 11.8 resourcesPage
fr.resourcesPage = {
  hero: {
    badge: "Ressources Juridiques",
    title: "Guides & Informations Juridiques",
    subtitle: "Comprendre vos droits et obligations selon le cadre légal rwandais."
  },
  comingSoon: {
    title: "Articles & Modèles en cours de rédaction",
    desc: "Nos avocats partenaires rédigent actuellement des guides pratiques sur l'enregistrement RDB, les mutations foncières, le droit du travail et le droit de la famille au Rwanda. Revenez très bientôt !"
  },
  categories: {
    title: "Domaines couverts",
    family: "Droit de la famille & Successions",
    commercial: "Droit commercial & Sociétés",
    property: "Droit foncier & Immobilier",
    employment: "Droit du travail & Emploi",
    immigration: "Immigration & Visas",
    tax: "Fiscalité & Douanes RRA"
  },
  cta: {
    title: "Besoin d'une assistance immédiate sur votre dossier ?",
    button: "Consulter un avocat certifié"
  }
};

rw.resourcesPage = {
  hero: {
    badge: "Ubumenyi mu Mategeko",
    title: "Inyandiko & Amakuru ku Mategeko",
    subtitle: "Sobanukirwa uburenganzira n'inshingano byawe hakurikijwe amategeko y'u Rwanda."
  },
  comingSoon: {
    title: "Inyandiko ziracyatunganywa n'abavoka",
    desc: "Abavoka bacu b'umwuga bari gutegura inyandiko zifasha abaturage gusobanukirwa iby'ubutaka, kwandikisha ibigo muri RDB, amategeko y'umurimo n'ay'umuryango. Zizajya ahagaragara vuba !"
  },
  categories: {
    title: "Amashami y'amategeko ari gutunganywa",
    family: "Amategeko y'Umuryango & Izungura",
    commercial: "Amategeko y'Ubucuruzi & Ibigo",
    property: "Amategeko y'Ubutaka & Umutungo",
    employment: "Amategeko y'Umurimo",
    immigration: "Abinjira n'Abasohoka & Viza",
    tax: "Imisoro ya RRA & Gasutamo"
  },
  cta: {
    title: "Ukeneye inama z'amategeko kuri dosiye yawe ubu?",
    button: "Gisha inama umwavoka wemewe"
  }
};

// 11.9 comingSoonPage (Blog, Careers, Press)
fr.comingSoonPage = {
  blog: {
    hero: {
      badge: "Blog Juridique",
      title: "Actualités & Décryptages Juridiques",
      subtitle: "Analyses de l'actualité légale, jurisprudences et conseils d'avocats au Rwanda."
    },
    comingSoon: {
      title: "Articles à paraître très prochainement",
      desc: "Notre comité de rédaction juridique prépare des analyses approfondies sur les réformes légales et le droit des affaires au Rwanda."
    }
  },
  careers: {
    hero: {
      badge: "Recrutement & Carrières",
      title: "Rejoignez l'équipe MyJudicial",
      subtitle: "Contribuez à réinventer l'accès au droit et à la justice numérique au Rwanda et en Afrique."
    },
    comingSoon: {
      title: "Postes ouverts bientôt disponibles",
      desc: "Nous préparons notre prochaine phase de recrutement en ingénierie logicielle, conformité légale et support client à Kigali."
    }
  },
  press: {
    hero: {
      badge: "Espace Presse",
      title: "Espace Presse & Médias",
      subtitle: "Communiqués, parutions médiatiques et kits presse de MyJudicial."
    },
    comingSoon: {
      title: "Espace en cours de finalisation",
      desc: "Pour toute demande d'interview ou renseignement presse, n'hésitez pas à nous contacter directement."
    }
  },
  cta: {
    title: "Restez connecté avec MyJudicial",
    button1: "Explorer les avocats",
    button2: "Nous contacter"
  }
};

rw.comingSoonPage = {
  blog: {
    hero: {
      badge: "Blog y'Amategeko",
      title: "Amakuru & Isesengura mu Mategeko",
      subtitle: "Inyandiko zisesengura amategeko n'inama z'abavoka mu Rwanda."
    },
    comingSoon: {
      title: "Inyandiko ziri gutunganywa zizajya ahagaragara vuba",
      desc: "Ikipe yacu y'abavoka iri gutunganya inyandiko zicukumbuye ku mategeko mashya n'ubucuruzi mu Rwanda."
    }
  },
  careers: {
    hero: {
      badge: "Kazi muri MyJudicial",
      title: "Koranana natwe muri MyJudicial",
      subtitle: "Fatanya natwe kwegereza ubutabera no kuvugurura uburyo amategeko agera kuri buri wese."
    },
    comingSoon: {
      title: "Imyanya y'akazi izatangazwa vuba",
      desc: "Turi gutegura imyanya y'akazi mu by'ikoranabuhanga, kumenyekanisha ibikorwa n'ubufasha mu by'amategeko i Kigali."
    }
  },
  press: {
    hero: {
      badge: "Ibitangazamakuru",
      title: "Amakuru n'Ibitangazamakuru",
      subtitle: "Itangazo ry'ibikorwa bya MyJudicial n'amakuru y'ingenzi ku bitangazamakuru."
    },
    comingSoon: {
      title: "Akarusho ku bitangazamakuru karacyatunganywa",
      desc: "Niba uri umunyamakuru wifuza amakuru cyangwa ikiganiro, watwandikira ubu."
    }
  },
  cta: {
    title: "Komeza kubana na MyJudicial",
    button1: "Shaka umwavoka",
    button2: "Twandikire"
  }
};

// 11.10 legalPages (Cookies, Privacy, Terms)
fr.legalPages = {
  cookies: {
    hero: {
      badge: "Politique des Cookies",
      title: "Gestion et Utilisation des Cookies",
      updated: "Dernière mise à jour : Mars 2026"
    },
    content: {
      intro: "La présente politique explique comment MyJudicial utilise les cookies et technologies similaires pour vous offrir une expérience fluide, sécurisée et adaptée à vos préférences linguistiques.",
      sections: [
        {
          title: "1. Qu'est-ce qu'un cookie ?",
          text: "Un cookie est un petit fichier texte stocké sur votre appareil lors de votre navigation. Il permet de mémoriser vos choix (comme votre langue préférée : Anglais, Français ou Kinyarwanda) et d'assurer la sécurité de votre session."
        },
        {
          title: "2. Les cookies que nous utilisons",
          text: "Nous utilisons des cookies strictement nécessaires au fonctionnement du site, à l'authentification sécurisée, à la mémorisation de votre langue et à la prévention des fraudes."
        },
        {
          title: "3. Vos choix et gestion",
          text: "Vous pouvez à tout moment configurer votre navigateur pour refuser les cookies, mais certaines fonctionnalités (comme la conservation de votre session ou de votre panier de réservation) pourraient en être affectées."
        }
      ]
    }
  },
  privacy: {
    hero: {
      badge: "Protection des Données",
      title: "Politique de Confidentialité",
      updated: "Dernière mise à jour : Mars 2026"
    },
    content: {
      intro: "Chez MyJudicial, la confidentialité de vos démarches juridiques est une priorité absolue. Nous traitons vos données personnelles conformément à la loi rwandaise n° 058/2021 sur la protection des données et de la vie privée.",
      sections: [
        {
          title: "1. Collecte des données personnelles",
          text: "Nous collectons uniquement les informations nécessaires à la création de votre compte, à la mise en relation avec des avocats certifiés et au traitement sécurisé de vos paiements par Mobile Money."
        },
        {
          title: "2. Secret professionnel et confidentialité juridique",
          text: "Les informations partagées lors de vos consultations sont couvertes par le secret professionnel des avocats conformément aux règles déontologiques du Barreau du Rwanda."
        },
        {
          title: "3. Sécurité et non-divulgation",
          text: "Vos données sont chiffrées selon les standards de sécurité les plus stricts. Nous ne vendons ni ne partageons vos données avec des tiers non autorisés."
        }
      ]
    }
  },
  terms: {
    hero: {
      badge: "Cadre Juridique",
      title: "Conditions Générales d'Utilisation",
      updated: "Dernière mise à jour : Mars 2026"
    },
    content: {
      intro: "En accédant à MyJudicial, vous acceptez d'être lié par les présentes conditions générales d'utilisation qui régissent l'accès à notre plateforme et aux services juridiques proposés.",
      sections: [
        {
          title: "1. Nature de la plateforme",
          text: "MyJudicial est une plateforme numérique facilitant la mise en relation entre des clients et des avocats indépendants certifiés par le Barreau du Rwanda. MyJudicial ne constitue pas elle-même un cabinet d'avocats."
        },
        {
          title: "2. Réservations et paiements",
          text: "Toutes les consultations réservées sont sécurisées par un compte de séquestre. Les fonds ne sont débloqués au professionnel qu'après réalisation effective de la prestation."
        },
        {
          title: "3. Responsabilités et déontologie",
          text: "Les avocats exercent sous leur propre responsabilité professionnelle et dans le respect strict des règles de déontologie établies par le Barreau du Rwanda."
        }
      ]
    }
  }
};

rw.legalPages = {
  cookies: {
    hero: {
      badge: "Amategeko ya Kuki (Cookies)",
      title: "Imikoreshereze ya Kuki",
      updated: "Iheruka kuvugururwa: Werurwe 2026"
    },
    content: {
      intro: "Aya mabwiriza asobanura uburyo MyJudicial ikoresha kuki n'ubundi buryo bwo kubika amakuru kugira ngo urubuga rwacu rugukorere neza kandi rwibuke ururimi wahisemo (Icyongereza, Igifaransa cyangwa Ikinyarwanda).",
      sections: [
        {
          title: "1. Kuki ni iki?",
          text: "Kuki ni dosiye nto ibikwa kuri terefone cyangwa mudasobwa yawe igihe urangamiye urubuga. Ifasha kumenya ibyo wahisemo no kurinda umutekano wawe igihe uri ku rubuga."
        },
        {
          title: "2. Kuki dukoresha",
          text: "Dukoresha kuki za ngombwa gusa zituma ushobora kwinjira muri konti yawe, guhitamo ururimi rwawe no kurinda ubutumwa bwawe n'amafaranga yawe."
        },
        {
          title: "3. Guhagarika kuki",
          text: "Ushobora guhagarika kuki muri porogaramu ukoresha usura interineti, ariko bimwe mu bikorwa by'urubuga (nko kuguma muri konti yawe) bishobora kutazakora neza."
        }
      ]
    }
  },
  privacy: {
    hero: {
      badge: "Kurinda Amakuru Bwite",
      title: "Politiki y'Ibanga",
      updated: "Iheruka kuvugururwa: Werurwe 2026"
    },
    content: {
      intro: "Kuri MyJudicial, kurinda amabanga y'ibibazo byawe by'amategeko nibyo dushyira imbere ya byose. Dukurikiza Itegeko ry'u Rwanda nº 058/2021 ryerekeye kurinda amakuru bwite n'ubuzima bwite bw'umuntu.",
      sections: [
        {
          title: "1. Amakuru dukusanya",
          text: "Dukusanya gusa amakuru akenewe mu gufungura konti yawe, kuguhuza n'umwavoka wemewe no kwishyura mu mutekano binyuze kuri Mobile Money."
        },
        {
          title: "2. Ibanga ry'umwuga w'ubwavoka",
          text: "Amakuru yose usangiza umwavoka mu gihe cy'inama arinzwe n'ibanga ry'umwuga w'ubwavoka hakurikijwe amategeko y'Urugaga rw'Abavoka mu Rwanda."
        },
        {
          title: "3. Umutekano n'ibanga rikomeye",
          text: "Amakuru yawe abikwa mu buryo bugezweho bukingiye ku buryo nta muntu utabifitiye uburenganzira wayabona. Ntitubagurisha cyangwa ngo dusangize amakuru yawe abandi."
        }
      ]
    }
  },
  terms: {
    hero: {
      badge: "Amategeko Ngenderwaho",
      title: "Amabwiriza Ngenderwaho yo Gukoresha Urubuga",
      updated: "Iheruka kuvugururwa: Werurwe 2026"
    },
    content: {
      intro: "Mu gukoresha urubuga rwa MyJudicial, wemera gukurikiza aya mabwiriza ngenderwaho agenga uburyo urubuga n'amahuriro by'amategeko bikoreshwa.",
      sections: [
        {
          title: "1. Imiterere y'urubuga",
          text: "MyJudicial ni urubuga rw'ikoranabuhanga ruhuza abakeneye ubutabera n'abavoka bigenga bemewe n'Urugaga rw'Abavoka mu Rwanda. MyJudicial ubwayo ntabwo ari ibiro by'abavoka."
        },
        {
          title: "2. Gufata gahunda no kwishyura",
          text: "Inama zose zifashwe zishyurwa binyuze mu buryo bwizewe (Escrow). Amafaranga ntabwo ahabwa umwavoka kugeza igihe inama irangiye neza."
        },
        {
          title: "3. Inshingano n'imyitwarire y'umwuga",
          text: "Abavoka bakora ku giti cyabo mu bwisanzure no kubahiriza amategeko n'amabwiriza agenga imyitwarire y'umwuga w'ubwavoka ashyirwaho n'Urugaga rw'Abavoka mu Rwanda."
        }
      ]
    }
  }
};

// 11.11 expertDashboard_faq-section
fr["expertDashboard_faq-section"] = {
  faqTag: "FAQ",
  faqTitle: "Questions fréquemment posées",
  faqSubtitle: "Tout ce que vous devez savoir sur la prise de rendez-vous, les paiements et les avocats.",
  faq1q: "Comment fonctionnent les réservations ?",
  faq1a: "Parcourez les profils des avocats certifiés, sélectionnez une prestation et un créneau horaire, puis validez votre demande. Vous recevrez une confirmation immédiate par SMS et e-mail.",
  faq2q: "Quels sont les moyens de paiement acceptés ?",
  faq2a: "Nous acceptons MTN Mobile Money et Airtel Money. Votre paiement est conservé sur un compte de séquestre sécurisé et n'est versé à l'avocat qu'une fois la consultation terminée.",
  faq3q: "Tous les avocats sont-ils certifiés ?",
  faq3a: "Oui. Chaque avocat inscrit sur MyJudicial est certifié par le Barreau du Rwanda, son identité est vérifiée et son inscription contrôlée avant d'apparaître sur la plateforme.",
  faq4q: "Les consultations peuvent-elles se faire en ligne ?",
  faq4a: "Absolument. De nombreux avocats proposent des consultations par visioconférence, par téléphone ou en présentiel dans leur cabinet. Vous choisissez votre mode préféré.",
  faq5q: "Puis-je annuler ou reporter une réservation ?",
  faq5a: "Oui. Vous pouvez annuler ou reporter votre consultation sans frais jusqu'à 24 heures avant l'heure prévue directement depuis votre espace client.",
  faq6q: "Mon argent est-il protégé en cas d'absence de l'avocat ?",
  faq6a: "Tout à fait. Tous les paiements sont conservés sous séquestre jusqu'à la tenue effective du rendez-vous. Si l'avocat ne se présente pas, vous êtes remboursé intégralement.",
  faq7q: "Comment fonctionne le paiement Mobile Money ?",
  faq7a: "Au moment de la réservation, vous recevez une demande de validation MoMo directement sur votre téléphone. Entrez simplement votre code secret PIN pour confirmer instantanément."
};

rw["expertDashboard_faq-section"] = {
  faqTag: "Ibibazo Bikunze Kubazwa",
  faqTitle: "Ibibazo abakiriya bakunze kubaza",
  faqSubtitle: "Ibyo wifuza kumenya byose ku bijyanye no gufata gahunda, kwishyura n'abavoka bacu.",
  faq1q: "Ni gute mfatanya gahunda n'umwavoka?",
  faq1a: "Shakisha umwavoka wifuza, hitamo serivisi y'amategeko n'igihe kikunogeye, hanyuma wemeze. Uhita wohererezwa ubutumwa bugufi kuri SMS na imeli byemeza gahunda yawe.",
  faq2q: "Ni ubuhe buryo bwo kwishyura mwemera?",
  faq2a: "Twemera MTN Mobile Money na Airtel Money. Amafaranga yawe arindwa neza na MyJudicial kugeza igihe inama irangiye, akaba aribwo ahabwa umwavoka.",
  faq3q: "Ese abavoka bose bari hano barazewe?",
  faq3a: "Yego rwose. Buri mwavoka wose uri kuri MyJudicial yemejwe n'Urugaga rw'Abavoka mu Rwanda (Rwanda Bar Association) kandi umwirondoro we waragenzuwe mbere yo gushyirwa ku rubuga.",
  faq4q: "Ese inama z'amategeko zishobora kubera kuri interineti?",
  faq4a: "Yego cyane. Abavoka benshi batanga inama binyuze kuri videwo, kuri terefone cyangwa guhurira ku biro byabo. Uhitamo uburyo bukunogeye igihe ufata gahunda.",
  faq5q: "Ese nshobora guhindura umunsi cyangwa gusiba gahunda?",
  faq5a: "Yego. Urashobora guhindura umunsi cyangwa gusiba gahunda mbere y'amasaha 24 ngo inama ibe binyuze kuri konti yawe ya MyJudicial.",
  faq6q: "Ese amafaranga yanjye ararindwa igihe umwavoka atabonetse?",
  faq6a: "Ijana ku ijana. Amafaranga yose abikwa mu mutekano kugeza inama ibaye. Iyo umwavoka atabonetse ku mpamvu iyo ari yo yose, uhita uyasubizwa yose nta kiguzi waciwe.",
  faq7q: "Ni gute nishyura nkoresheje Mobile Money?",
  faq7a: "Iyo wemeje gufata gahunda, uhita ubona ubutumwa bukubaza kwemeza kwishyura kuri terefone yawe. Shyiramo umubare w'ibanga wawe (PIN) kugira ngo wishyure ako kanya."
};

// 11.12 expertDashboard_availability-preview
fr["expertDashboard_availability-preview"] = {
  checkingAvailability: "Vérification des disponibilités...",
  scanningNext14Days: "Recherche sur les 14 prochains jours ({searchDate})...",
  noAvailabilityIn14Days: "Aucun créneau disponible sur les 14 prochains jours",
  nextAvailable: "Prochaine disponibilité",
  bookNow: "Réserver"
};

rw["expertDashboard_availability-preview"] = {
  checkingAvailability: "Iri kugenzura igihe aboneka...",
  scanningNext14Days: "Iri gushakisha mu minsi 14 iri imbere ({searchDate})...",
  noAvailabilityIn14Days: "Nta gihe kiboneka mu minsi 14 iri imbere",
  nextAvailable: "Igihe cya mbere aboneka",
  bookNow: "Fata gahunda"
};

// Ensure exact key synchronization: every key in en must exist in fr and rw
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

// Write back formatted JSON
fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf8');
fs.writeFileSync(rwPath, JSON.stringify(rw, null, 2) + '\n', 'utf8');

console.log('Updated keys count: EN =', countKeys(en), 'FR =', countKeys(fr), 'RW =', countKeys(rw));
console.log('Translation update complete!');
