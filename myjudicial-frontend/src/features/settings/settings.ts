import type {
  CareerRoleItem,
  CareersHiringStatus,
  CoreValueItem,
  MilestoneItem,
  SupplementalFaqItem,
} from "./hooks/useSocialLinks";

export interface SocialLinks {
  x?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  whatsapp?: string;
}

/** Admin platform settings payload, mirroring `myjudicial-backend` SettingsData. */
export interface SettingsData {
  platformName: string;
  maintenanceMode: boolean;
  defaultRole: string;
  platformFeePercent: number;
  minEscrowDurationSeconds: number;
  paymentMode: "BOOKING_FIRST" | "PAYMENT_REQUIRED";
  /** Whether Airtel Money is enabled as a payment option (admin-controlled). */
  airtelEnabled: boolean;
  socialLinks?: SocialLinks;
  // Company & Contact Details
  supportEmail: string;
  hotlinePhone: string;
  whatsappNumber: string;
  officeBuilding: string;
  officeStreet: string;
  officeDistrict: string;
  officePoBox: string;
  supportWorkingHours: string;
  // Public Editorial Content
  aboutVision: string;
  aboutMission: string;
  aboutStory: string;
  aboutHeroBadge: string;
  aboutHeroTitle: string;
  aboutHeroSubtitle: string;
  aboutCoreValues: CoreValueItem[];
  aboutMilestones: MilestoneItem[];
  // Careers & Talent
  careersEmail: string;
  careersHiringStatus: CareersHiringStatus;
  careersHeroTitle: string;
  careersHeroSubtitle: string;
  careersOpenRoles: CareerRoleItem[];
  careersRequirePhone: boolean;
  careersRequireLinkedIn: boolean;
  careersRequirePortfolio: boolean;
  careersRequireResume: boolean;
  careersRequireCoverNote: boolean;
  // Help & Supplemental FAQs
  supplementalFaqs: SupplementalFaqItem[];
  // Legal Policies & Compliance
  legalEffectiveDate: string;
  dpoContactEmail: string;
  // SEO & Open Graph Social Sharing
  ogImageUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  // Brand & Public Identity
  platformTagline: string;
  copyrightNotice: string;
  brandLogoUrl?: string;
  brandFaviconUrl?: string;
  // Maintenance & Broadcast Notices
  maintenanceNotice: string;
  // Legal & Regulatory Disclaimers
  legalDisclaimer: string;
  // Consultation Governance Rules
  minAdvanceBookingHours: number;
  cancellationGraceHours: number;
}

export const DEFAULT_SOCIAL: SocialLinks = {
  x: "https://twitter.com/myjudicial",
  linkedin: "https://linkedin.com/company/myjudicial",
  facebook: "https://facebook.com/myjudicial",
  instagram: "https://instagram.com/myjudicial",
  youtube: "",
  whatsapp: "",
};

export const DEFAULT_FAQS: SupplementalFaqItem[] = [
  {
    id: "faq-1",
    category: "clients",
    question: "How do I choose and book a verified advocate on MyJudicial?",
    answer: "Browse our directory by practice area, language, or location, or describe your situation to our AI Legal Assistant for instant triage. Select an advocate, pick an available calendar slot, and confirm your booking with escrow protection.",
  },
  {
    id: "faq-2",
    category: "clients",
    question: "What languages do advocates on MyJudicial consult in?",
    answer: "All advocates are fluent in at least two of Rwanda's official legal languages. You can filter and consult in Kinyarwanda, English, or French to ensure complete clarity and comfort.",
  },
  {
    id: "faq-3",
    category: "clients",
    question: "I live in the Rwandan diaspora. Can I consult an advocate about land, succession, or business?",
    answer: "Yes. You can pay with international credit or debit cards, schedule consultations across international time zones, and meet via our encrypted in-browser video room to review land certificates (UPI), business contracts, or succession files.",
  },
  {
    id: "faq-4",
    category: "clients",
    question: "Do I need to download Zoom, Teams, or an app to join the video consultation?",
    answer: "No. Our consultation room runs 100% inside your web browser using LiveKit WebRTC. You do not need to download or install any external software on your computer or phone.",
  },
  {
    id: "faq-5",
    category: "clients",
    question: "Can the advocate represent me in court after our online consultation?",
    answer: "Yes. Online consultations serve as an initial diagnostic session. If your case requires litigation, your advocate can issue an official retainer agreement (convention d'honoraires) and power of attorney (procuration) to represent you before Rwandan courts via the IECMS.",
  },
  {
    id: "faq-6",
    category: "experts",
    question: "How and when do advocates receive consultation payouts?",
    answer: "Payouts are automated and guaranteed. Once you conclude the consultation and submit the session brief, the escrow balance is released immediately to your registered MTN Mobile Money, Airtel Money, or Rwandan commercial bank account.",
  },
  {
    id: "faq-7",
    category: "experts",
    question: "Do advocates retain full autonomy over their consultation rates and schedule?",
    answer: "Yes. In accordance with Rwanda Bar Association standards, advocates independently set their consultation fees and configure their available hours. MyJudicial does not fix prices or impose mandatory tariffs.",
  },
  {
    id: "faq-8",
    category: "experts",
    question: "How is my Rwanda Bar Association (RBA) accreditation vetted?",
    answer: "Every advocate is verified against the official Rwanda Bar Association Roll, practicing certificate, and National ID before their profile is published. Only advocates in active good standing are admitted.",
  },
  {
    id: "faq-9",
    category: "experts",
    question: "What happens if a client fails to attend the scheduled consultation?",
    answer: "Your professional time is protected. If a client fails to attend without cancelling at least 24 hours in advance, the consultation fee held in escrow is disbursed to the advocate in accordance with platform cancellation policy.",
  },
  {
    id: "faq-10",
    category: "billing",
    question: "How does the regulated escrow system protect my money?",
    answer: "When you book a consultation, your payment is held safely in a regulated escrow custody account. The advocate is only paid after the consultation has concluded satisfactorily. If a session is cancelled or the advocate does not attend, your funds are refunded.",
  },
  {
    id: "faq-11",
    category: "billing",
    question: "Which payment methods are accepted on MyJudicial?",
    answer: "We accept MTN Mobile Money and Airtel Money for local payments, as well as Visa and Mastercard debit and credit cards for domestic and international clients.",
  },
  {
    id: "faq-12",
    category: "billing",
    question: "Are there any hidden fees, platform surcharges, or extra invoices?",
    answer: "No. The consultation fee displayed on the advocate's profile is the total, final amount. There are no hidden booking fees, subscription traps, or unexpected charges.",
  },
  {
    id: "faq-13",
    category: "billing",
    question: "What is the refund and cancellation policy?",
    answer: "Clients can reschedule or cancel a consultation for a full refund up to 24 hours before the scheduled time. If an advocate fails to join a session, the client receives a 100% immediate escrow refund.",
  },
  {
    id: "faq-14",
    category: "security",
    question: "Are all lawyers on MyJudicial accredited by the Rwanda Bar Association?",
    answer: "Yes. Every single legal expert on MyJudicial is an accredited advocate cross-checked against the official Rwanda Bar Association Roll. We do not allow unverified third parties to offer legal counsel.",
  },
  {
    id: "faq-15",
    category: "security",
    question: "Is my consultation recorded by the platform?",
    answer: "No. We never record video or audio consultations. All sessions use peer-to-peer encrypted WebRTC to preserve strict legal professional secrecy and attorney-client privilege.",
  },
  {
    id: "faq-16",
    category: "security",
    question: "How does MyJudicial comply with Rwandan Data Protection Law No. 058/2021?",
    answer: "All client data, uploaded evidence, and intake documents are encrypted and stored in compliance with Law No. 058/2021 relating to the protection of personal data. Only your chosen advocate has confidential access to your case documents.",
  },
];

export const DEFAULT_CAREERS_ROLES: CareerRoleItem[] = [
  {
    id: "role-legal-ops",
    title: "Bilingual Legal Operations Specialist",
    department: "Legal Operations",
    location: "Kigali, Rwanda",
    type: "Full-time",
    applyUrl: "mailto:careers@myjudicial.com?subject=Application%20-%20Legal%20Operations%20Specialist",
    summary: "Support advocate onboarding, IECMS case documentation verification, and trilingual client intake triage.",
    responsibilities: [
      "Review and verify advocate credentials against the Rwanda Bar Association roll",
      "Assist clients and advocates with consultation scheduling and case briefs",
      "Coordinate with the dispute resolution and escrow team for session verifications",
      "Maintain knowledge base resources in Kinyarwanda, English, and French",
    ],
    requirements: [
      "Bachelor's degree in Law (LLB) from an accredited university",
      "Fluency in Kinyarwanda, English, and French",
      "2+ years experience in legal practice or legal administration in Rwanda",
      "Strong understanding of Rwanda legal frameworks and court procedures",
    ],
    niceToHave: [
      "Experience with the Integrated Electronic Case Management System (IECMS)",
      "Customer-facing tech platform experience",
    ],
    published: true,
  },
  {
    id: "role-fullstack-fintech",
    title: "Senior Full-Stack Engineer (Escrow & Payments)",
    department: "Engineering",
    location: "Kigali, Rwanda / Remote",
    type: "Full-time",
    applyUrl: "mailto:careers@myjudicial.com?subject=Application%20-%20Senior%20Full-Stack%20Engineer",
    summary: "Architect and scale our real-time escrow ledger, MTN Mobile Money / Airtel Money integrations, and WebRTC video consultation infrastructure.",
    responsibilities: [
      "Develop secure, auditable payment and escrow release services",
      "Optimize real-time WebRTC consultation infrastructure using LiveKit",
      "Ensure 99.9% uptime for core booking and consultation flows",
      "Implement bank-grade security and encryption standards",
    ],
    requirements: [
      "5+ years professional experience with TypeScript, Next.js, and Node.js",
      "Hands-on experience with mobile money APIs or regulated payment gateways",
      "Solid understanding of PostgreSQL, ACID transactions, and distributed locks",
      "Passionate about clean code, automated testing, and security best practices",
    ],
    niceToHave: [
      "Experience with WebRTC or LiveKit",
      "Knowledge of East African fintech infrastructure",
    ],
    published: true,
  },
  {
    id: "role-compliance-officer",
    title: "Advocate Accreditation & Compliance Lead",
    department: "Compliance & Ethics",
    location: "Kigali, Rwanda",
    type: "Full-time",
    applyUrl: "mailto:careers@myjudicial.com?subject=Application%20-%20Compliance%20Lead",
    summary: "Lead platform compliance with Rwanda Bar Association ethical rules, Law No. 058/2021 on Personal Data Protection, and statutory escrow regulations.",
    responsibilities: [
      "Maintain rigorous vetting protocols for all legal advocates joining the platform",
      "Serve as primary liaison with the Rwanda Bar Association and regulatory bodies",
      "Supervise data privacy compliance under Rwanda Law No. 058/2021",
      "Audit dispute resolution procedures and client confidentiality protocols",
    ],
    requirements: [
      "Active or former member of the Rwanda Bar Association with clean disciplinary record",
      "In-depth knowledge of Rwandan professional ethics (déontologie)",
      "Experience in data protection and privacy regulatory compliance",
      "Demonstrated integrity and commitment to access to justice",
    ],
    niceToHave: [
      "Certified Information Privacy Professional (CIPP) or equivalent",
      "Master of Laws (LLM) in Commercial Law, Dispute Resolution, or Tech Law",
    ],
    published: true,
  },
];

export const DEFAULTS: SettingsData = {
  platformName: "MyJudicial",
  maintenanceMode: false,
  defaultRole: "CITIZEN",
  platformFeePercent: 15,
  minEscrowDurationSeconds: 300,
  paymentMode: "PAYMENT_REQUIRED",
  airtelEnabled: false,
  socialLinks: DEFAULT_SOCIAL,
  supportEmail: "support@myjudicial.com",
  hotlinePhone: "+250 788 312 456",
  whatsappNumber: "+250 788 312 456",
  officeBuilding: "Centenary House, 4th Floor",
  officeStreet: "KN 3 Ave & KN 4 St",
  officeDistrict: "Nyarugenge Central Business District, Kigali, Rwanda",
  officePoBox: "P.O. Box 2848, Kigali",
  supportWorkingHours: "Monday – Friday: 8:00 AM – 6:00 PM CAT",
  aboutVision: "",
  aboutMission: "",
  aboutStory: "",
  aboutHeroBadge: "",
  aboutHeroTitle: "",
  aboutHeroSubtitle: "",
  aboutCoreValues: [
    {
      id: "val-1",
      title: "Universal Access",
      description: "Breaking down financial, geographic, and informational barriers so every Rwandan citizen can access quality legal support.",
      icon: "Users",
    },
    {
      id: "val-2",
      title: "Radical Transparency",
      description: "No hidden retainer fees, ambiguous hourly billings, or unexpected litigation surprises. Clear upfront pricing.",
      icon: "Scale",
    },
    {
      id: "val-3",
      title: "Uncompromising Trust",
      description: "Every advocate is verified with the Rwanda Bar Association. Client consultation funds are safely escrowed.",
      icon: "ShieldCheck",
    },
    {
      id: "val-4",
      title: "Regulatory Compliance",
      description: "Strict adherence to the Rwanda Bar Association Roll, Law No. 058/2021 on Personal Data Protection, and judicial standards.",
      icon: "Lock",
    },
  ],
  aboutMilestones: [
    {
      id: "m-2024",
      year: "2024",
      title: "Regulatory & Compliance Foundation",
      description: "Formulation of the digital marketplace charter aligning with Rwanda Bar Association ethical guidelines and Law No. 058/2021 on Personal Data Protection.",
    },
    {
      id: "m-2025",
      year: "2025",
      title: "Dual-Tier Escrow & Mobile Integration",
      description: "Direct integration with MTN Mobile Money, Airtel Money, and licensed banking escrow custody, providing secure, transparent fee protections.",
    },
    {
      id: "m-2026",
      year: "2026",
      title: "Nationwide 30-District Deployment",
      description: "Expanding certified counsel access across all provinces in Kinyarwanda, English, and French, coupled with AI-assisted legal research tools.",
    },
  ],
  careersEmail: "careers@myjudicial.com",
  careersHiringStatus: "TALENT_POOL",
  careersHeroTitle: "",
  careersHeroSubtitle: "",
  careersOpenRoles: [],
  careersRequirePhone: false,
  careersRequireLinkedIn: false,
  careersRequirePortfolio: false,
  careersRequireResume: true,
  careersRequireCoverNote: true,
  supplementalFaqs: [],
  legalEffectiveDate: "September 2026",
  dpoContactEmail: "support@myjudicial.com",
  ogImageUrl: "/og_image.png",
  seoTitle: "MyJudicial | Find Verified Legal Experts in Rwanda",
  seoDescription: "Browse verified lawyers, compare fixed fees, and book legal consultations instantly. Rwanda's premier legal marketplace.",
  seoKeywords: "lawyer Rwanda, legal services Kigali, legal consultation, Bar certified advocates, Rwanda Bar Association",
  platformTagline: "Democratizing Access to Justice Across Rwanda",
  copyrightNotice: "© 2026 MyJudicial Ltd. All rights reserved.",
  brandLogoUrl: "",
  brandFaviconUrl: "",
  maintenanceNotice: "",
  legalDisclaimer: "MyJudicial is an independent technology marketplace connecting clients with accredited legal practitioners. MyJudicial does not directly provide legal representation.",
  minAdvanceBookingHours: 2,
  cancellationGraceHours: 24,
};

export type {
  CareerRoleItem,
  CareersHiringStatus,
  CoreValueItem,
  MilestoneItem,
  SupplementalFaqItem,
};

const asString = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;
const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const asBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;
const asArray = <T,>(value: unknown, fallback: T[]): T[] => (Array.isArray(value) ? (value as T[]) : fallback);

/**
 * Fills every missing key with its default so that consumers can trust the
 * shape regardless of which keys exist as rows in the K/V settings store.
 */
export function normalizeSettings(raw: Partial<SettingsData> | null | undefined): SettingsData {
  const r = raw ?? {};
  return {
    platformName: asString(r.platformName, DEFAULTS.platformName),
    maintenanceMode: asBoolean(r.maintenanceMode, DEFAULTS.maintenanceMode),
    defaultRole: asString(r.defaultRole, DEFAULTS.defaultRole),
    platformFeePercent: asNumber(r.platformFeePercent, DEFAULTS.platformFeePercent),
    minEscrowDurationSeconds: asNumber(
      r.minEscrowDurationSeconds,
      DEFAULTS.minEscrowDurationSeconds
    ),
    paymentMode:
      r.paymentMode === "BOOKING_FIRST" || r.paymentMode === "PAYMENT_REQUIRED"
        ? r.paymentMode
        : DEFAULTS.paymentMode,
    airtelEnabled: asBoolean(r.airtelEnabled, DEFAULTS.airtelEnabled),
    socialLinks: r.socialLinks ? { ...DEFAULT_SOCIAL, ...r.socialLinks } : DEFAULT_SOCIAL,
    supportEmail: asString(r.supportEmail, DEFAULTS.supportEmail),
    hotlinePhone: asString(r.hotlinePhone, DEFAULTS.hotlinePhone),
    whatsappNumber: asString(r.whatsappNumber, DEFAULTS.whatsappNumber),
    officeBuilding: asString(r.officeBuilding, DEFAULTS.officeBuilding),
    officeStreet: asString(r.officeStreet, DEFAULTS.officeStreet),
    officeDistrict: asString(r.officeDistrict, DEFAULTS.officeDistrict),
    officePoBox: asString(r.officePoBox, DEFAULTS.officePoBox),
    supportWorkingHours: asString(r.supportWorkingHours, DEFAULTS.supportWorkingHours),
    aboutVision: asString(r.aboutVision, DEFAULTS.aboutVision),
    aboutMission: asString(r.aboutMission, DEFAULTS.aboutMission),
    aboutStory: asString(r.aboutStory, DEFAULTS.aboutStory),
    aboutHeroBadge: asString(r.aboutHeroBadge, DEFAULTS.aboutHeroBadge),
    aboutHeroTitle: asString(r.aboutHeroTitle, DEFAULTS.aboutHeroTitle),
    aboutHeroSubtitle: asString(r.aboutHeroSubtitle, DEFAULTS.aboutHeroSubtitle),
    aboutCoreValues: asArray(r.aboutCoreValues, DEFAULTS.aboutCoreValues),
    aboutMilestones: asArray(r.aboutMilestones, DEFAULTS.aboutMilestones),
    careersEmail: asString(r.careersEmail, DEFAULTS.careersEmail),
    careersHiringStatus:
      r.careersHiringStatus === "ACTIVELY_HIRING" ||
      r.careersHiringStatus === "TALENT_POOL" ||
      r.careersHiringStatus === "PAUSED"
        ? r.careersHiringStatus
        : DEFAULTS.careersHiringStatus,
    careersHeroTitle: asString(r.careersHeroTitle, DEFAULTS.careersHeroTitle),
    careersHeroSubtitle: asString(r.careersHeroSubtitle, DEFAULTS.careersHeroSubtitle),
    careersOpenRoles: asArray(r.careersOpenRoles, DEFAULTS.careersOpenRoles),
    careersRequirePhone: asBoolean(r.careersRequirePhone, DEFAULTS.careersRequirePhone),
    careersRequireLinkedIn: asBoolean(r.careersRequireLinkedIn, DEFAULTS.careersRequireLinkedIn),
    careersRequirePortfolio: asBoolean(r.careersRequirePortfolio, DEFAULTS.careersRequirePortfolio),
    careersRequireResume: asBoolean(r.careersRequireResume, DEFAULTS.careersRequireResume),
    careersRequireCoverNote: asBoolean(r.careersRequireCoverNote, DEFAULTS.careersRequireCoverNote),
    supplementalFaqs: asArray(r.supplementalFaqs, DEFAULTS.supplementalFaqs),
    legalEffectiveDate: asString(r.legalEffectiveDate, DEFAULTS.legalEffectiveDate),
    dpoContactEmail: asString(r.dpoContactEmail, DEFAULTS.dpoContactEmail),
    ogImageUrl: asString(r.ogImageUrl, DEFAULTS.ogImageUrl),
    seoTitle: asString(r.seoTitle, DEFAULTS.seoTitle),
    seoDescription: asString(r.seoDescription, DEFAULTS.seoDescription),
    seoKeywords: asString(r.seoKeywords, DEFAULTS.seoKeywords),
    platformTagline: asString(r.platformTagline, DEFAULTS.platformTagline),
    copyrightNotice: asString(r.copyrightNotice, DEFAULTS.copyrightNotice),
    brandLogoUrl: asString(r.brandLogoUrl, ""),
    brandFaviconUrl: asString(r.brandFaviconUrl, ""),
    maintenanceNotice: asString(r.maintenanceNotice, DEFAULTS.maintenanceNotice),
    legalDisclaimer: asString(r.legalDisclaimer, DEFAULTS.legalDisclaimer),
    minAdvanceBookingHours: asNumber(r.minAdvanceBookingHours, DEFAULTS.minAdvanceBookingHours),
    cancellationGraceHours: asNumber(r.cancellationGraceHours, DEFAULTS.cancellationGraceHours),
  };
}