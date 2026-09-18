import fs from 'fs';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

const en = loadJson(path.join(MESSAGES_DIR, 'en.json'));
const fr = loadJson(path.join(MESSAGES_DIR, 'fr.json'));
const rw = loadJson(path.join(MESSAGES_DIR, 'rw.json'));

// 1. Specialties dictionary
const specialtiesEn = {
  FAMILY_LAW: "Family Law",
  COMMERCIAL_LAW: "Commercial Law",
  EMPLOYMENT_LAW: "Employment Law",
  LAND_LAW: "Land & Property Law",
  CRIMINAL_LAW: "Criminal Defense",
  TAX_LAW: "Tax & Revenue Law",
  IMMIGRATION_LAW: "Immigration Law",
  CORPORATE_LAW: "Corporate Law",
  CONTRACT_LAW: "Contract Law",
  INTELLECTUAL_PROPERTY: "Intellectual Property",
  OTHER: "Other",
};

const specialtiesFr = {
  FAMILY_LAW: "Droit de la famille",
  COMMERCIAL_LAW: "Droit commercial",
  EMPLOYMENT_LAW: "Droit du travail",
  LAND_LAW: "Droit foncier & immobilier",
  CRIMINAL_LAW: "Droit pénal & défense",
  TAX_LAW: "Droit fiscal & des affaires",
  IMMIGRATION_LAW: "Droit de l'immigration",
  CORPORATE_LAW: "Droit des sociétés",
  CONTRACT_LAW: "Droit des contrats",
  INTELLECTUAL_PROPERTY: "Propriété intellectuelle",
  OTHER: "Autre",
};

const specialtiesRw = {
  FAMILY_LAW: "Amategeko y'umuryango",
  COMMERCIAL_LAW: "Amategeko y'ubucuruzi",
  EMPLOYMENT_LAW: "Amategeko y'umurimo",
  LAND_LAW: "Amategeko y'ubutaka n'umutungo",
  CRIMINAL_LAW: "Amategeko mpanabyaha",
  TAX_LAW: "Amategeko y'imisoro n'amahoro",
  IMMIGRATION_LAW: "Amategeko yo kwinjira no gutura",
  CORPORATE_LAW: "Amategeko y'amasosiyete",
  CONTRACT_LAW: "Amategeko y'amasezerano",
  INTELLECTUAL_PROPERTY: "Umutungo mu by'ubwenge",
  OTHER: "Ibindi",
};

en.specialties = specialtiesEn;
fr.specialties = specialtiesFr;
rw.specialties = specialtiesRw;

// 2. Common additions
for (const dict of [en, fr, rw]) {
  if (!dict.common) dict.common = {};
  if (!dict.common.badges) dict.common.badges = {};
  if (!dict.common.roles) dict.common.roles = {};
  if (!dict.common.errors) dict.common.errors = {};
  if (!dict.common.actions) dict.common.actions = {};
  if (!dict.common.aria) dict.common.aria = {};
}

en.common.badges.new = "New";
fr.common.badges.new = "Nouveau";
rw.common.badges.new = "Gishya";

en.common.roles.expert = "Verified Advocate";
en.common.roles.admin = "Platform Admin";
en.common.roles.client = "Client";

fr.common.roles.expert = "Avocat vérifié";
fr.common.roles.admin = "Administrateur";
fr.common.roles.client = "Client";

rw.common.roles.expert = "Umwavoka wemewe";
rw.common.roles.admin = "Umuhuzabikorwa";
rw.common.roles.client = "Umukiriya";

en.common.errors.sectionFailed = "This section failed to load.";
fr.common.errors.sectionFailed = "Échec du chargement de cette section.";
rw.common.errors.sectionFailed = "Gufungura iki gice byanze.";

en.common.actions.retry = "Retry";
fr.common.actions.retry = "Réessayer";
rw.common.actions.retry = "Ongera ugerageze";

en.common.aria.accountMenu = "Account menu";
fr.common.aria.accountMenu = "Menu du compte";
rw.common.aria.accountMenu = "Ibyerekeye konti";

// 3. Header button labels (concise, professional legal terms)
en.header.joinAsAdvocate = "Join as Advocate";
fr.header.joinAsAdvocate = "Devenir Avocat";
rw.header.joinAsAdvocate = "Kuba Umwavoka";

// 4. Landing translations
// EN
en.landing.bar = {
  verified: "Verified Lawyers",
  transparentPricing: "Transparent Pricing",
  mobileMoney: "Secure Mobile Money",
  aiMatching: "AI Matching",
  realReviews: "Real Reviews",
};

en.landing.sort = {
  nearest: "Nearest",
  highestRated: "Highest Rated",
  mostExperienced: "Most Experienced",
  mostReviewed: "Most Reviewed",
};

en.landing.search = {
  placeholder: "Search by name or specialty…",
  nearMe: "Search near me on map",
  clear: "Clear search text",
  availableToday: "Available Today",
  viewAllOnSearch: "View all results",
};

en.landing.card = {
  ...en.landing.card,
  verified: "Verified",
  online: "Online",
  consultation: "/ consultation",
  feeOnRequest: "Fee on request",
  onRequest: "On request",
  allExperts: "All Experts",
  view: "View Profile",
  expertCount: "{count, plural, =1 {# expert} other {# experts}}",
  experience: "{count, plural, =1 {# yr} other {# yrs}}",
};

en.landing.trustWhy = {
  title: "Why Trust MyJudicial?",
  verified: {
    title: "Verified Lawyers",
    desc: "Every expert is identity-verified and bar-certified.",
  },
  escrow: {
    title: "Escrow Protection",
    desc: "Payments held in escrow until consultation is complete.",
  },
  momo: {
    title: "Mobile Money",
    desc: "Pay securely with MTN or Airtel Money.",
  },
  pricing: {
    title: "Transparent Pricing",
    desc: "No hidden fees. Fixed consultation rates.",
  },
  reviews: {
    title: "Real Reviews",
    desc: "All reviews come from verified clients.",
  },
  sameday: {
    title: "Same-day Booking",
    desc: "Book available lawyers within hours.",
  },
};

// FR
fr.landing.bar = {
  verified: "Avocats vérifiés",
  transparentPricing: "Tarifs transparents",
  mobileMoney: "Mobile Money sécurisé",
  aiMatching: "Recommandation IA",
  realReviews: "Avis authentiques",
};

fr.landing.sort = {
  nearest: "Les plus proches",
  highestRated: "Les mieux notés",
  mostExperienced: "Les plus expérimentés",
  mostReviewed: "Les plus commentés",
};

fr.landing.search = {
  placeholder: "Rechercher par nom ou spécialité…",
  nearMe: "Rechercher près de moi sur la carte",
  clear: "Effacer la recherche",
  availableToday: "Disponible aujourd'hui",
  viewAllOnSearch: "Voir tous les résultats",
};

fr.landing.card = {
  ...fr.landing.card,
  verified: "Vérifié",
  online: "En ligne",
  consultation: "/ consultation",
  feeOnRequest: "Honoraires sur demande",
  onRequest: "Sur demande",
  allExperts: "Tous les experts",
  view: "Voir le profil",
  expertCount: "{count, plural, =1 {# expert} other {# experts}}",
  experience: "{count, plural, =1 {# an d'expérience} other {# ans d'expérience}}",
};

fr.landing.trustWhy = {
  title: "Pourquoi faire confiance à MyJudicial ?",
  verified: {
    title: "Avocats vérifiés",
    desc: "Chaque expert est identifié et certifié par le Barreau du Rwanda.",
  },
  escrow: {
    title: "Protection par séquestre",
    desc: "Fonds conservés en séquestre jusqu'à la fin de la consultation.",
  },
  momo: {
    title: "Mobile Money",
    desc: "Payez en toute sécurité avec MTN Mobile Money ou Airtel Money.",
  },
  pricing: {
    title: "Tarifs transparents",
    desc: "Aucun frais caché. Honoraires forfaitaires connus à l'avance.",
  },
  reviews: {
    title: "Avis authentiques",
    desc: "Tous les avis proviennent de clients réels ayant consulté.",
  },
  sameday: {
    title: "Réservation le jour même",
    desc: "Consultez un avocat disponible en quelques heures.",
  },
};

fr.landing.sections.mostBooked = "Les plus réservés";
fr.landing.sections.mostBookedSub = "Avocats sollicités par le plus grand nombre de clients";

fr.landing.meta = {
  title: "MyJudicial | Trouvez des Avocats Certifiés au Rwanda",
  description: "Consultez des avocats certifiés, comparez les honoraires transparents et réservez votre consultation en quelques minutes.",
};

// RW
rw.landing.bar = {
  verified: "Abavoka bemejwe",
  transparentPricing: "Ibiciro bisobanutse",
  mobileMoney: "Mobile Money yizewe",
  aiMatching: "Guhuza na AI",
  realReviews: "Ubuhamya nyakuri",
};

rw.landing.sort = {
  nearest: "Abari hafi",
  highestRated: "Abakunzwe cyane",
  mostExperienced: "Abafite uburambe",
  mostReviewed: "Bafite ibitekerezo byinshi",
};

rw.landing.search = {
  placeholder: "Shakisha ku izina cyangwa umwuga…",
  nearMe: "Shakisha abari hafi yanjye ku ikarita",
  clear: "Siba ibyanditswe",
  availableToday: "Baboneka uyu munsi",
  viewAllOnSearch: "Raba ibisubizo byose",
};

rw.landing.card = {
  ...rw.landing.card,
  verified: "Yemejwe",
  online: "Ari ku murongo",
  consultation: "/ ku nama",
  feeOnRequest: "Ibiciro ku busabe",
  onRequest: "Ku busabe",
  allExperts: "Abahanga bose",
  view: "Reba umwirondoro",
  expertCount: "{count, plural, =1 {Inzobere #} other {Inzobere #}}",
  experience: "{count, plural, =1 {Umwaka # w'uburambe} other {Imyaka # y'uburambe}}",
};

rw.landing.trustWhy = {
  title: "Kuki Wizera MyJudicial?",
  verified: {
    title: "Abavoka Bemejwe",
    desc: "Buri munyamategeko yaragenzuwe kandi yemejwe n'Urugaga rw'Abavoka mu Rwanda.",
  },
  escrow: {
    title: "Umutekano w'Amafaranga",
    desc: "Amafaranga abikwa mu buryo bwizewe kugeza inama irangiye neza.",
  },
  momo: {
    title: "Mobile Money",
    desc: "Ishyura mu mutekano ukoresheje MTN MoMo cyangwa Airtel Money.",
  },
  pricing: {
    title: "Ibiciro Bisobanutse",
    desc: "Nta mafaranga y'ihishaho. Ibiciro by'inama birazwi mbere.",
  },
  reviews: {
    title: "Ubuhamya Nyakuri",
    desc: "Ibitekerezo byose bitangwa n'abakiriya babonye serivisi by'ukuri.",
  },
  sameday: {
    title: "Gufata Gahunda Uyu Munsi",
    desc: "Bona umwavoka uboneka mu masaha make akugire inama.",
  },
};

rw.landing.sections.mostBooked = "Abasabwa cyane";
rw.landing.sections.mostBookedSub = "Abavoka bafitiwe ikizere n'abakiriya benshi";

rw.landing.meta = {
  title: "MyJudicial | Shaka Abavoka Bemejwe mu Rwanda",
  description: "Shaka abavoka bemejwe, gereranya ibiciro bisobanutse, kandi ufate gahunda yo kugisha inama mu minota mike.",
};

// Write out updated json files
saveJson(path.join(MESSAGES_DIR, 'en.json'), en);
saveJson(path.join(MESSAGES_DIR, 'fr.json'), fr);
saveJson(path.join(MESSAGES_DIR, 'rw.json'), rw);

console.log("Successfully updated en.json, fr.json, and rw.json with clean landing translations!");
