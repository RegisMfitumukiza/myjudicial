import fs from 'fs';
import path from 'path';

const messagesDir = path.resolve('messages');

const EN_CAREERS = {
  meta: {
    title: "Careers & Talent Pool | MyJudicial",
    description: "Join the team modernizing access to justice in Rwanda. Explore culture, engineering, compliance, and spontaneous applications."
  },
  hero: {
    badge: "Careers at MyJudicial",
    title: "Build the Digital Infrastructure of Justice in Rwanda",
    subtitle: "We are a mission-driven team combining software engineering, artificial intelligence, and Rwandan legal ethics to empower millions of citizens."
  },
  whyJoin: {
    badge: "Life at MyJudicial",
    title: "Why Build With Us",
    subtitle: "Join an ambitious startup based in Kigali with real societal impact across East Africa.",
    impact: {
      title: "Direct Impact on Justice",
      desc: "Every feature you ship directly helps citizens, families, and businesses resolve critical legal challenges with verified counsel."
    },
    tech: {
      title: "High-Trust Tech Stack",
      desc: "We build with Next.js, TypeScript, PostgreSQL, Prisma, AI model pipelines, and real-time telecom Mobile Money escrow integrations."
    },
    culture: {
      title: "Autonomous & Transparent Culture",
      desc: "We value ownership, speed, intellectual honesty, and deep respect for the rule of law and user privacy."
    }
  },
  departments: {
    badge: "Our Teams",
    title: "Disciplines We Hire For",
    subtitle: "As we scale our operations in Kigali, we seek exceptional talent across four key pillars.",
    engineering: {
      title: "Software & AI Engineering",
      desc: "Full-stack web engineers, security architects, and AI/NLP research specialists building reliable legal tech."
    },
    legalCompliance: {
      title: "Legal Research & Bar Compliance",
      desc: "Rwandan legal researchers, ethics compliance officers, and institutional relations specialists."
    },
    operations: {
      title: "Operations & Marketplace Growth",
      desc: "Advocate network coordinators, financial escrow analysts, and client onboarding managers."
    },
    support: {
      title: "Customer Success & Trust",
      desc: "Trilingual customer advocates delivering compassionate support in Kinyarwanda, English, and French."
    }
  },
  talentPool: {
    badge: "Rolling Applications",
    title: "Spontaneous Applications & Talent Pool",
    subtitle: "Even when specific requisitions are not publicly posted, we continuously review exceptional candidates who believe in our mission.",
    instruction: "Send your CV, portfolio or GitHub link, and a short introduction to:",
    email: "careers@myjudicial.com",
    locationNotice: "Hybrid roles based at our Kigali headquarters, with flexible remote arrangements for select technical functions."
  },
  cta: {
    title: "Ready to shape the future of legal tech?",
    subtitle: "Introduce yourself or explore how our platform empowers citizens and advocates today.",
    explorePlatform: "Explore How It Works",
    sendCv: "Send Your Application"
  }
};

const FR_CAREERS = {
  meta: {
    title: "Carrières & Vivier de Talents | MyJudicial",
    description: "Rejoignez l'équipe qui modernise l'accès au droit au Rwanda. Découvrez notre culture, nos métiers et postulez spontanément."
  },
  hero: {
    badge: "Carrières chez MyJudicial",
    title: "Bâtissez l'Infrastructure Numérique de la Justice au Rwanda",
    subtitle: "Nous sommes une équipe engagée alliant ingénierie logicielle, intelligence artificielle et déontologie juridique pour aider des millions de citoyens."
  },
  whyJoin: {
    badge: "Travailler chez MyJudicial",
    title: "Pourquoi Nous Rejoindre",
    subtitle: "Rejoignez une startup ambitieuse basée à Kigali avec un véritable impact sociétal à travers l'Afrique de l'Est.",
    impact: {
      title: "Impact Direct sur la Justice",
      desc: "Chaque fonctionnalité déployée aide concrètement citoyens, familles et entreprises à résoudre leurs litiges avec des avocats certifiés."
    },
    tech: {
      title: "Technologies de Haute Confiance",
      desc: "Nous développons avec Next.js, TypeScript, PostgreSQL, Prisma, des modèles d'IA et des séquestres Mobile Money télécom en temps réel."
    },
    culture: {
      title: "Culture d'Autonomie & Transparence",
      desc: "Nous valorisons la responsabilité, la rapidité d'exécution, la franchise intellectuelle et le respect absolu de la vie privée."
    }
  },
  departments: {
    badge: "Nos Pôles",
    title: "Les Profils que Nous Recherchons",
    subtitle: "Dans le cadre de notre développement à Kigali, nous recherchons des talents exceptionnels dans quatre domaines clés.",
    engineering: {
      title: "Ingénierie Logicielle & IA",
      desc: "Développeurs full-stack, architectes sécurité et spécialistes IA/NLP concevant des solutions juridiques fiables."
    },
    legalCompliance: {
      title: "Recherche Juridique & Conformité Barreau",
      desc: "Juristes rwandais, responsables de conformité déontologique et spécialistes des relations institutionnelles."
    },
    operations: {
      title: "Opérations & Croissance Réseau",
      desc: "Coordinateurs du réseau d'avocats, analystes financiers du séquestre et gestionnaires de l'intégration client."
    },
    support: {
      title: "Support Client & Confiance",
      desc: "Conseillers trilingues apportant un accompagnement bienveillant en kinyarwanda, anglais et français."
    }
  },
  talentPool: {
    badge: "Candidatures Spontanées",
    title: "Candidature Libre & Vivier de Talents",
    subtitle: "Même en l'absence de poste ouvert spécifique, nous examinons en continu les profils d'exception qui partagent notre mission.",
    instruction: "Envoyez votre CV, lien portfolio ou GitHub, et quelques mots de motivation à :",
    email: "careers@myjudicial.com",
    locationNotice: "Postes en mode hybride à notre siège de Kigali, avec télétravail flexible pour certaines fonctions techniques."
  },
  cta: {
    title: "Prêt à façonner l'avenir de la legal tech ?",
    subtitle: "Présentez-vous ou découvrez comment notre plateforme accompagne citoyens et avocats dès aujourd'hui.",
    explorePlatform: "Découvrir le fonctionnement",
    sendCv: "Envoyer votre candidature"
  }
};

const RW_CAREERS = {
  meta: {
    title: "Imyanya y'Akazi & Kwaka Akazi | MyJudicial",
    description: "Fatanya n'itsinda rigezweho ritezimbere ubutabera mu Rwanda. Menya imikorere, amakipe, no kohereza dosiye yawe."
  },
  hero: {
    badge: "Akazi muri MyJudicial",
    title: "Kubaka Ikoranabuhanga ry'Ubutabera mu Rwanda",
    subtitle: "Turi itsinda ryiyemeje gukoresha ikoranabuhanga, ubwenge bw'ubukorano (AI), n'amahame y'ubuvoka mu gufasha abaturage bose."
  },
  whyJoin: {
    badge: "Gukora muri MyJudicial",
    title: "Impamvu Wagakwiye Gukorana Natwe",
    subtitle: "Injira muri sosiyete nshya ifite icyerekezo i Kigali ifite n'uruhare runini mu iterambere ry'ubutabera muri Afurika y'Uburasirazuba.",
    impact: {
      title: "Uruhare Rutaziguye ku Butabera",
      desc: "Buri kintu ukora kigira uruhare mu gufasha abaturage, imiryango, n'ubucuruzi gukemura ibibazo by'amategeko n'abavoka bemejwe."
    },
    tech: {
      title: "Ikoranabuhanga Ryizewe",
      desc: "Dukoresha Next.js, TypeScript, PostgreSQL, Prisma, AI igezweho, ndetse n'ubwishyu bwa Mobile Money burinzwe."
    },
    culture: {
      title: "Ubwigenge & Gukorera mu Mucyo",
      desc: "Duha agaciro kwigira, kwihuta mu bikorwa, kuvugisha ukuri, no kubahiriza amategeko n'umutekano w'amakuru."
    }
  },
  departments: {
    badge: "Amakipe Yacu",
    title: "Inzego Z'Impano Dushaka",
    subtitle: "Mu gihe turimo kwagura ibikorwa byacu i Kigali, dushaka abahanga mu nzego enye z'ingenzi.",
    engineering: {
      title: "Abahanga mu Ikoranabuhanga & AI",
      desc: "Abubatsi ba porogaramu za mudasobwa na telefoni, umutekano w'ikoranabuhanga, n'ubushakashatsi bwa AI."
    },
    legalCompliance: {
      title: "Ubushakashatsi bw'Amategeko & Urugaga",
      desc: "Abanyamategeko b'u Rwanda, abagenzura iyubahirizwa ry'amategeko n'amahame y'ubuvoka, n'imikoranire n'inzego."
    },
    operations: {
      title: "Imicungire y'Ibikorwa & Iterambere",
      desc: "Abahuza b'urusobe rw'abavoka, abasesengura iby'ubwishyu n'ubwirinzi, n'abayobora iyakirwa ry'abakiriya."
    },
    support: {
      title: "Ifashamugisha & Kwita ku Bakiriya",
      desc: "Abafasha abakiriya mu ndimi eshatu: Ikinyarwanda, Icyongereza, n'Igifaransa babafasha mu bwitonzi."
    }
  },
  talentPool: {
    badge: "Kwakira Ubusabe Buhoraho",
    title: "Gusaba Akazi no Kwiyandikisha mu Bategereje",
    subtitle: "Niyo nta myanya yihariye yaba itangajwe, duhora dusuzuma ubusabe bw'abantu b'abahanga bifuza gufatanya natwe muri uyu mushinga.",
    instruction: "Ohereza umwirondoro wawe (CV), imirimo wakoze (portfolio/GitHub), n'ibaruwa igusobanura kuri:",
    email: "careers@myjudicial.com",
    locationNotice: "Imyanya ikorera ku biro byacu i Kigali, hamwe n'uburyo bwo gukorera mu rugo ku mirimo imwe n'imwe y'ikoranabuhanga."
  },
  cta: {
    title: "Witeguye gufatanya natwe guhindura ubutabera?",
    subtitle: "Igaragaze cyangwa urebe uko urubuga rwacu rufasha abaturage n'abavoka muri iki gihe.",
    explorePlatform: "Reba Uburyo Bigenda",
    sendCv: "Ohereza Dosiye Yawe"
  }
};

const EN_ABOUT_EXT = {
  ecosystem: {
    badge: "Institutional Ecosystem",
    title: "Built with Rwanda's Legal & Financial Institutions",
    subtitle: "MyJudicial collaborates with accredited institutions across Rwanda to ensure professional standards and seamless escrow execution.",
    legal: {
      title: "Legal Framework & Bar Standards",
      desc: "Cross-referenced with the official Rwanda Bar Association (RBA) Roll of Advocates. Every practicing lawyer's active license and standing is verified."
    },
    financial: {
      title: "Escrow Banking & Mobile Money",
      desc: "Integrated with MTN Mobile Money, Airtel Money, and licensed commercial banking escrow custody to guarantee 100% funds protection."
    },
    regulatory: {
      title: "Regulatory & Data Compliance",
      desc: "Operating in strict compliance with Law No. 058/2021 relating to the protection of personal data and privacy in Rwanda."
    },
    partnerCta: "Institutional Inquiries",
    partnerCtaDesc: "Are you a legal institution, bar council, NGO, or corporate partner looking to collaborate?"
  },
  disclaimer: {
    title: "Regulatory Notice",
    text: "MyJudicial is an independent technology platform connecting clients with accredited Rwanda Bar Association advocates. MyJudicial is not a law firm and does not provide legal representation directly."
  }
};

const FR_ABOUT_EXT = {
  ecosystem: {
    badge: "Écosystème Institutionnel",
    title: "Conçu avec les Institutions Juridiques & Financières du Rwanda",
    subtitle: "MyJudicial collabore avec des institutions reconnues au Rwanda pour garantir des normes d'excellence et une exécution rigoureuse du séquestre.",
    legal: {
      title: "Cadre Légal & Barreau du Rwanda",
      desc: "Recoupement avec le Tableau officiel de l'Ordre des Avocats du Rwanda. La validité du droit d'exercice de chaque avocat est systématiquement contrôlée."
    },
    financial: {
      title: "Séquestre Financier & Mobile Money",
      desc: "Intégration directe avec MTN MoMo, Airtel Money et des comptes de séquestre bancaires agréés pour garantir la protection totale des fonds."
    },
    regulatory: {
      title: "Conformité Légale & Protection des Données",
      desc: "Fonctionnement en stricte conformité avec la Loi n° 058/2021 relative à la protection des données personnelles et de la vie privée au Rwanda."
    },
    partnerCta: "Partenariats Institutionnels",
    partnerCtaDesc: "Vous êtes une institution juridique, une ONG ou un partenaire institutionnel souhaitant collaborer ?"
  },
  disclaimer: {
    title: "Mention Réglementaire",
    text: "MyJudicial est une plateforme technologique indépendante mettant en relation les justiciables avec des avocats inscrits au Barreau du Rwanda. MyJudicial n'est pas un cabinet d'avocats et ne fournit pas directement de conseils juridiques."
  }
};

const RW_ABOUT_EXT = {
  ecosystem: {
    badge: "Inzego Dukorana Nazo",
    title: "Byubatse ku bufatanye n'Inzego z'Amategeko n'Imari mu Rwanda",
    subtitle: "MyJudicial ikorana n'inzego zizewe mu Rwanda kugira ngo yimakaze ubunyamwuga n'umutekano w'ubwishyu mu bwishingizi.",
    legal: {
      title: "Amategeko n'Urugaga rw'Abavoka",
      desc: "Guhuza amakuru n'Urutonde rw'Urugaga rw'Abavoka mu Rwanda. Buri mwavoka asuzumirwa icyangombwa cy'umwuga n'uko ahagaze mu rugaga."
    },
    financial: {
      title: "Ubwishingizi bw'Amafaranga & Mobile Money",
      desc: "Ihuza ritaziguye na MTN Mobile Money, Airtel Money, na banki zizewe kugira ngo amafaranga yawe arindwe 100% mu mutekano."
    },
    regulatory: {
      title: "Ibijyanye n'Amategeko & Kurinda Amakuru",
      desc: "Gukorera ku mategeko y'u Rwanda no kubahiriza Itegeko No. 058/2021 rirebana no kurinda amakuru bwite y'abantu."
    },
    partnerCta: "Ubufatanye bw'Inzego",
    partnerCtaDesc: "Uri urwego rw'amategeko, umuryango utegamiye kuri leta, cyangwa ikigo cyifuza gukorana natwe?"
  },
  disclaimer: {
    title: "Itangazo ry'Amategeko",
    text: "MyJudicial ni urubuga rw'ikoranabuhanga ruhuza abakiriya n'abavoka bemewe n'Urugaga rw'Abavoka mu Rwanda. MyJudicial ntabwo ari ibiro by'avoka kandi ntitutanga ubufasha bw'amategeko mu buryo bweruye."
  }
};

const EN_FOOTER_EXT = {
  supportEmail: "support@myjudicial.com",
  disclaimer: "MyJudicial is an independent technology platform connecting clients with accredited Rwanda Bar Association advocates. MyJudicial is not a law firm and does not provide legal representation directly.",
  columns: {
    practiceAreas: "Practice Areas",
    platform: "Platform & Pricing",
    forLawyers: "For Advocates",
    company: "Company & Legal"
  },
  links: {
    landLaw: "Land & Property Law",
    commercialLaw: "Corporate & Commercial",
    familyLaw: "Family & Succession",
    employmentLaw: "Labor & Employment",
    criminalLaw: "Criminal Defense",
    allPracticeAreas: "All Practice Areas",
    findLawyer: "Find a Lawyer",
    pricing: "Transparent Pricing & Escrow",
    howItWorks: "How It Works",
    aiAssistant: "AI Legal Assistant",
    becomeExpert: "Join as an Advocate",
    advocateSignIn: "Advocate Sign In",
    howAdvocatesWork: "How Advocates Work",
    verification: "Bar Standards & Vetting",
    aboutUs: "About MyJudicial",
    careers: "Careers",
    faqs: "Help & FAQs",
    contact: "Contact & Support",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    cookies: "Cookie Policy"
  }
};

const FR_FOOTER_EXT = {
  supportEmail: "support@myjudicial.com",
  disclaimer: "MyJudicial est une plateforme technologique indépendante mettant en relation les justiciables avec des avocats inscrits au Barreau du Rwanda. MyJudicial n'est pas un cabinet d'avocats et ne fournit pas directement de conseils juridiques.",
  columns: {
    practiceAreas: "Domaines Juridiques",
    platform: "Plateforme & Tarifs",
    forLawyers: "Pour les Avocats",
    company: "Société & Légal"
  },
  links: {
    landLaw: "Droit Foncier & Immobilier",
    commercialLaw: "Droit des Affaires & Sociétés",
    familyLaw: "Droit de la Famille & Successions",
    employmentLaw: "Droit du Travail & Emploi",
    criminalLaw: "Défense Pénale",
    allPracticeAreas: "Tous les Domaines",
    findLawyer: "Trouver un Avocat",
    pricing: "Tarification & Séquestre",
    howItWorks: "Comment ça Marche",
    aiAssistant: "Assistant Juridique IA",
    becomeExpert: "Rejoindre comme Avocat",
    advocateSignIn: "Connexion Avocat",
    howAdvocatesWork: "Comment Exercer sur MyJudicial",
    verification: "Normes & Contrôle Barreau",
    aboutUs: "À Propos de MyJudicial",
    careers: "Carrières",
    faqs: "Aide & FAQ",
    contact: "Contact & Support",
    privacyPolicy: "Politique de Confidentialité",
    termsOfService: "Conditions Générales",
    cookies: "Politique des Cookies"
  }
};

const RW_FOOTER_EXT = {
  supportEmail: "support@myjudicial.com",
  disclaimer: "MyJudicial ni urubuga rw'ikoranabuhanga ruhuza abakiriya n'abavoka bemewe n'Urugaga rw'Abavoka mu Rwanda. MyJudicial ntabwo ari ibiro by'avoka kandi ntitutanga ubufasha bw'amategeko mu buryo bweruye.",
  columns: {
    practiceAreas: "Inzego z'Ubuhanga",
    platform: "Urubuga & Ibiciro",
    forLawyers: "Ku Bavoka",
    company: "Sosiyete & Amategeko"
  },
  links: {
    landLaw: "Amategeko y'Ubutaka n'Imitungo",
    commercialLaw: "Amategeko y'Ubucuruzi & Amasosiyete",
    familyLaw: "Amategeko y'Umuryango n'Izungura",
    employmentLaw: "Amategeko y'Umurimo n'Akazi",
    criminalLaw: "Kunganira mu Manza Mpanabyaha",
    allPracticeAreas: "Inzego Zose z'Ubuhanga",
    findLawyer: "Shaka Umwavoka",
    pricing: "Ibiciro Bisobanutse & Ubwirinzi",
    howItWorks: "Uburyo Bigenda",
    aiAssistant: "Umufasha wa AI w'Amategeko",
    becomeExpert: "Iyandikishe nk'Umwavoka",
    advocateSignIn: "Injira nk'Umwavoka",
    howAdvocatesWork: "Uko Abavoka Bakora",
    verification: "Ibisabwa n'Urugaga rw'Abavoka",
    aboutUs: "Abo Turi Bo",
    careers: "Imyanya y'Akazi",
    faqs: "Ifashamugisha & Ibibazo Bikunzwe",
    contact: "Twandikire & Ubufasha",
    privacyPolicy: "Politike y'Ibanga",
    termsOfService: "Amategeko y'Ikoresha",
    cookies: "Politike ya Cookies"
  }
};

function updateLocale(fileName, careersObj, aboutExt, footerExt) {
  const filePath = path.join(messagesDir, fileName);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  data.careersPage = careersObj;
  data.about = { ...data.about, ...aboutExt };

  // Retain all existing footer links, merge new ones
  const existingLinks = data.landing?.footer?.links || {};
  const existingCols = data.landing?.footer?.columns || {};

  data.landing = data.landing || {};
  data.landing.footer = {
    ...data.landing.footer,
    supportEmail: footerExt.supportEmail,
    disclaimer: footerExt.disclaimer,
    columns: {
      ...existingCols,
      ...footerExt.columns
    },
    links: {
      ...existingLinks,
      ...footerExt.links
    }
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Updated ${fileName}`);
}

updateLocale('en.json', EN_CAREERS, EN_ABOUT_EXT, EN_FOOTER_EXT);
updateLocale('fr.json', FR_CAREERS, FR_ABOUT_EXT, FR_FOOTER_EXT);
updateLocale('rw.json', RW_CAREERS, RW_ABOUT_EXT, RW_FOOTER_EXT);
