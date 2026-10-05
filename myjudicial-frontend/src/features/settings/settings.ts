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

export const DEFAULTS: SettingsData = {
  platformName: "MyJudicial",
  maintenanceMode: false,
  defaultRole: "CITIZEN",
  platformFeePercent: 15,
  minEscrowDurationSeconds: 300,
  paymentMode: "PAYMENT_REQUIRED",
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
    maintenanceNotice: asString(r.maintenanceNotice, DEFAULTS.maintenanceNotice),
    legalDisclaimer: asString(r.legalDisclaimer, DEFAULTS.legalDisclaimer),
    minAdvanceBookingHours: asNumber(r.minAdvanceBookingHours, DEFAULTS.minAdvanceBookingHours),
    cancellationGraceHours: asNumber(r.cancellationGraceHours, DEFAULTS.cancellationGraceHours),
  };
}