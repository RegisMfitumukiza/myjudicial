import { prisma } from "../../infrastructure/database/prisma.js";
import { writeAuditLog } from "../../shared/utils/audit.js";

export type PaymentMode = "BOOKING_FIRST" | "PAYMENT_REQUIRED";

export interface SocialLinks {
  x?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  whatsapp?: string;
}

export interface CoreValueItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface CareerRoleItem {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  applyUrl: string;
  slug?: string;
  summary?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  applicationInstructions?: string;
  published?: boolean;
}

export interface SupplementalFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface MilestoneItem {
  id: string;
  year: string;
  title: string;
  description: string;
}

export type CareersHiringStatus = "ACTIVELY_HIRING" | "TALENT_POOL" | "PAUSED";

export interface SettingsData {
  platformName: string;
  maintenanceMode: boolean;
  defaultRole: "CITIZEN" | "EXPERT";
  platformFeePercent: number;
  minEscrowDurationSeconds: number;
  /**
   * Booking workflow control.
   *
   * - "BOOKING_FIRST":   bookings are created as requests awaiting the expert's
   *   response; no Mobile Money payment is collected at booking time. Used while
   *   AzamPay is not production ready (Rwanda is migrating to E-Kash).
   * - "PAYMENT_REQUIRED": legacy flow — booking creation pushes an AzamPay MNO
   *   checkout and the booking is confirmed once payment is received.
   */
  paymentMode: PaymentMode;
  /**
   * Controls whether Airtel Money appears as a selectable payment option.
   * Set to true once Azampay confirms Airtel integration is production-ready.
   * Defaults to false (disabled) until activated by an admin.
   */
  airtelEnabled: boolean;
  socialLinks: SocialLinks;
  // Company Contact & Headquarter Location
  supportEmail: string;
  hotlinePhone: string;
  whatsappNumber: string;
  officeBuilding: string;
  officeStreet: string;
  officeDistrict: string;
  officePoBox: string;
  supportWorkingHours: string;
  // Public Editorial Content (About Us)
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

const DEFAULTS: SettingsData = {
  platformName: "MyJudicial",
  maintenanceMode: false,
  defaultRole: "CITIZEN",
  platformFeePercent: 15,
  minEscrowDurationSeconds: 300,
  paymentMode: "PAYMENT_REQUIRED",
  airtelEnabled: false,
  socialLinks: {
    x: "https://twitter.com/myjudicial",
    linkedin: "https://linkedin.com/company/myjudicial",
    facebook: "https://facebook.com/myjudicial",
    instagram: "https://instagram.com/myjudicial",
    youtube: "",
    whatsapp: "",
  },
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
  careersEmail: "support@myjudicial.com",
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

const KEYS: Record<keyof SettingsData, string> = {
  platformName: "platform_name",
  maintenanceMode: "maintenance_mode",
  defaultRole: "default_role",
  platformFeePercent: "platform_fee_percent",
  minEscrowDurationSeconds: "min_escrow_duration_seconds",
  paymentMode: "payment_mode",
  airtelEnabled: "airtel_enabled",
  socialLinks: "social_links",
  supportEmail: "support_email",
  hotlinePhone: "hotline_phone",
  whatsappNumber: "whatsapp_number",
  officeBuilding: "office_building",
  officeStreet: "office_street",
  officeDistrict: "office_district",
  officePoBox: "office_po_box",
  supportWorkingHours: "support_working_hours",
  aboutVision: "about_vision",
  aboutMission: "about_mission",
  aboutStory: "about_story",
  aboutHeroBadge: "about_hero_badge",
  aboutHeroTitle: "about_hero_title",
  aboutHeroSubtitle: "about_hero_subtitle",
  aboutCoreValues: "about_core_values",
  aboutMilestones: "about_milestones",
  careersEmail: "careers_email",
  careersHiringStatus: "careers_hiring_status",
  careersHeroTitle: "careers_hero_title",
  careersHeroSubtitle: "careers_hero_subtitle",
  careersOpenRoles: "careers_open_roles",
  careersRequirePhone: "careers_require_phone",
  careersRequireLinkedIn: "careers_require_linkedin",
  careersRequirePortfolio: "careers_require_portfolio",
  careersRequireResume: "careers_require_resume",
  careersRequireCoverNote: "careers_require_cover_note",
  supplementalFaqs: "supplemental_faqs",
  legalEffectiveDate: "legal_effective_date",
  dpoContactEmail: "dpo_contact_email",
  ogImageUrl: "og_image_url",
  seoTitle: "seo_title",
  seoDescription: "seo_description",
  seoKeywords: "seo_keywords",
  platformTagline: "platform_tagline",
  copyrightNotice: "copyright_notice",
  maintenanceNotice: "maintenance_notice",
  legalDisclaimer: "legal_disclaimer",
  minAdvanceBookingHours: "min_advance_booking_hours",
  cancellationGraceHours: "cancellation_grace_hours",
};

function fromRecord(rows: { key: string; value: unknown }[]): SettingsData {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const rawPaymentMode = map.get(KEYS.paymentMode) as PaymentMode | undefined;
  const rawSocial = map.get(KEYS.socialLinks);
  const parsedSocial: SocialLinks =
    typeof rawSocial === "object" && rawSocial !== null
      ? (rawSocial as SocialLinks)
      : DEFAULTS.socialLinks;
  const rawCoreValues = map.get(KEYS.aboutCoreValues);
  const parsedCoreValues: CoreValueItem[] = Array.isArray(rawCoreValues)
    ? (rawCoreValues as CoreValueItem[])
    : DEFAULTS.aboutCoreValues;
  const rawMilestones = map.get(KEYS.aboutMilestones);
  const parsedMilestones: MilestoneItem[] = Array.isArray(rawMilestones)
    ? (rawMilestones as MilestoneItem[])
    : DEFAULTS.aboutMilestones;
  const rawOpenRoles = map.get(KEYS.careersOpenRoles);
  const parsedOpenRoles: CareerRoleItem[] = Array.isArray(rawOpenRoles)
    ? (rawOpenRoles as CareerRoleItem[])
    : DEFAULTS.careersOpenRoles;
  const rawSupplementalFaqs = map.get(KEYS.supplementalFaqs);
  const parsedSupplementalFaqs: SupplementalFaqItem[] = Array.isArray(rawSupplementalFaqs)
    ? (rawSupplementalFaqs as SupplementalFaqItem[])
    : DEFAULTS.supplementalFaqs;
  const rawHiringStatus = map.get(KEYS.careersHiringStatus) as CareersHiringStatus | undefined;
  const parsedHiringStatus: CareersHiringStatus =
    rawHiringStatus === "ACTIVELY_HIRING" || rawHiringStatus === "TALENT_POOL" || rawHiringStatus === "PAUSED"
      ? rawHiringStatus
      : DEFAULTS.careersHiringStatus;

  return {
    platformName: (map.get(KEYS.platformName) as string) ?? DEFAULTS.platformName,
    maintenanceMode: (map.get(KEYS.maintenanceMode) as boolean) ?? DEFAULTS.maintenanceMode,
    defaultRole: (map.get(KEYS.defaultRole) as "CITIZEN" | "EXPERT") ?? DEFAULTS.defaultRole,
    platformFeePercent: (map.get(KEYS.platformFeePercent) as number) ?? DEFAULTS.platformFeePercent,
    minEscrowDurationSeconds: (map.get(KEYS.minEscrowDurationSeconds) as number) ?? DEFAULTS.minEscrowDurationSeconds,
    paymentMode:
      rawPaymentMode === "BOOKING_FIRST"
        ? "BOOKING_FIRST"
        : rawPaymentMode === "PAYMENT_REQUIRED"
        ? "PAYMENT_REQUIRED"
        : DEFAULTS.paymentMode,
    airtelEnabled: (map.get(KEYS.airtelEnabled) as boolean) ?? DEFAULTS.airtelEnabled,
    socialLinks: parsedSocial,
    supportEmail: (map.get(KEYS.supportEmail) as string) ?? DEFAULTS.supportEmail,
    hotlinePhone: (map.get(KEYS.hotlinePhone) as string) ?? DEFAULTS.hotlinePhone,
    whatsappNumber: (map.get(KEYS.whatsappNumber) as string) ?? DEFAULTS.whatsappNumber,
    officeBuilding: (map.get(KEYS.officeBuilding) as string) ?? DEFAULTS.officeBuilding,
    officeStreet: (map.get(KEYS.officeStreet) as string) ?? DEFAULTS.officeStreet,
    officeDistrict: (map.get(KEYS.officeDistrict) as string) ?? DEFAULTS.officeDistrict,
    officePoBox: (map.get(KEYS.officePoBox) as string) ?? DEFAULTS.officePoBox,
    supportWorkingHours: (map.get(KEYS.supportWorkingHours) as string) ?? DEFAULTS.supportWorkingHours,
    aboutVision: (map.get(KEYS.aboutVision) as string) ?? DEFAULTS.aboutVision,
    aboutMission: (map.get(KEYS.aboutMission) as string) ?? DEFAULTS.aboutMission,
    aboutStory: (map.get(KEYS.aboutStory) as string) ?? DEFAULTS.aboutStory,
    aboutHeroBadge: (map.get(KEYS.aboutHeroBadge) as string) ?? DEFAULTS.aboutHeroBadge,
    aboutHeroTitle: (map.get(KEYS.aboutHeroTitle) as string) ?? DEFAULTS.aboutHeroTitle,
    aboutHeroSubtitle: (map.get(KEYS.aboutHeroSubtitle) as string) ?? DEFAULTS.aboutHeroSubtitle,
    aboutCoreValues: parsedCoreValues,
    aboutMilestones: parsedMilestones,
    careersEmail: (map.get(KEYS.careersEmail) as string) ?? DEFAULTS.careersEmail,
    careersHiringStatus: parsedHiringStatus,
    careersHeroTitle: (map.get(KEYS.careersHeroTitle) as string) ?? DEFAULTS.careersHeroTitle,
    careersHeroSubtitle: (map.get(KEYS.careersHeroSubtitle) as string) ?? DEFAULTS.careersHeroSubtitle,
    careersOpenRoles: parsedOpenRoles,
    careersRequirePhone: (map.get(KEYS.careersRequirePhone) as boolean) ?? DEFAULTS.careersRequirePhone,
    careersRequireLinkedIn: (map.get(KEYS.careersRequireLinkedIn) as boolean) ?? DEFAULTS.careersRequireLinkedIn,
    careersRequirePortfolio: (map.get(KEYS.careersRequirePortfolio) as boolean) ?? DEFAULTS.careersRequirePortfolio,
    careersRequireResume: (map.get(KEYS.careersRequireResume) as boolean) ?? DEFAULTS.careersRequireResume,
    careersRequireCoverNote: (map.get(KEYS.careersRequireCoverNote) as boolean) ?? DEFAULTS.careersRequireCoverNote,
    supplementalFaqs: parsedSupplementalFaqs,
    legalEffectiveDate: (map.get(KEYS.legalEffectiveDate) as string) ?? DEFAULTS.legalEffectiveDate,
    dpoContactEmail: (map.get(KEYS.dpoContactEmail) as string) ?? DEFAULTS.dpoContactEmail,
    ogImageUrl: (map.get(KEYS.ogImageUrl) as string) ?? DEFAULTS.ogImageUrl,
    seoTitle: (map.get(KEYS.seoTitle) as string) ?? DEFAULTS.seoTitle,
    seoDescription: (map.get(KEYS.seoDescription) as string) ?? DEFAULTS.seoDescription,
    seoKeywords: (map.get(KEYS.seoKeywords) as string) ?? DEFAULTS.seoKeywords,
    platformTagline: (map.get(KEYS.platformTagline) as string) ?? DEFAULTS.platformTagline,
    copyrightNotice: (map.get(KEYS.copyrightNotice) as string) ?? DEFAULTS.copyrightNotice,
    maintenanceNotice: (map.get(KEYS.maintenanceNotice) as string) ?? DEFAULTS.maintenanceNotice,
    legalDisclaimer: (map.get(KEYS.legalDisclaimer) as string) ?? DEFAULTS.legalDisclaimer,
    minAdvanceBookingHours: (map.get(KEYS.minAdvanceBookingHours) as number) ?? DEFAULTS.minAdvanceBookingHours,
    cancellationGraceHours: (map.get(KEYS.cancellationGraceHours) as number) ?? DEFAULTS.cancellationGraceHours,
  };
}

let settingCache: { data: SettingsData; until: number } | null = null;

async function getAllCached(): Promise<SettingsData> {
  if (settingCache && Date.now() < settingCache.until) return settingCache.data;
  const rows = await prisma.platformSetting.findMany();
  const data = fromRecord(rows);
  settingCache = { data, until: Date.now() + 30_000 };
  return data;
}

export function invalidateSettingCache(): void {
  settingCache = null;
}

export const AdminSettingService = {
  async getAll(): Promise<{ data: SettingsData }> {
    const data = await getAllCached();
    return { data };
  },

  async get<K extends keyof SettingsData>(key: K): Promise<SettingsData[K]> {
    const data = await getAllCached();
    return data[key];
  },

  async update(input: Partial<SettingsData>, adminId: string, ipAddress?: string): Promise<{ data: SettingsData }> {
    const entries: { key: string; value: unknown }[] = [];

    if (input.platformName !== undefined) entries.push({ key: KEYS.platformName, value: input.platformName });
    if (input.maintenanceMode !== undefined) entries.push({ key: KEYS.maintenanceMode, value: input.maintenanceMode });
    if (input.defaultRole !== undefined) entries.push({ key: KEYS.defaultRole, value: input.defaultRole });
    if (input.platformFeePercent !== undefined) entries.push({ key: KEYS.platformFeePercent, value: input.platformFeePercent });
    if (input.minEscrowDurationSeconds !== undefined) entries.push({ key: KEYS.minEscrowDurationSeconds, value: input.minEscrowDurationSeconds });
    if (input.paymentMode !== undefined) entries.push({ key: KEYS.paymentMode, value: input.paymentMode });
    if (input.airtelEnabled !== undefined) entries.push({ key: KEYS.airtelEnabled, value: input.airtelEnabled });
    if (input.socialLinks !== undefined) entries.push({ key: KEYS.socialLinks, value: input.socialLinks });
    if (input.supportEmail !== undefined) entries.push({ key: KEYS.supportEmail, value: input.supportEmail });
    if (input.hotlinePhone !== undefined) entries.push({ key: KEYS.hotlinePhone, value: input.hotlinePhone });
    if (input.whatsappNumber !== undefined) entries.push({ key: KEYS.whatsappNumber, value: input.whatsappNumber });
    if (input.officeBuilding !== undefined) entries.push({ key: KEYS.officeBuilding, value: input.officeBuilding });
    if (input.officeStreet !== undefined) entries.push({ key: KEYS.officeStreet, value: input.officeStreet });
    if (input.officeDistrict !== undefined) entries.push({ key: KEYS.officeDistrict, value: input.officeDistrict });
    if (input.officePoBox !== undefined) entries.push({ key: KEYS.officePoBox, value: input.officePoBox });
    if (input.supportWorkingHours !== undefined) entries.push({ key: KEYS.supportWorkingHours, value: input.supportWorkingHours });
    if (input.aboutVision !== undefined) entries.push({ key: KEYS.aboutVision, value: input.aboutVision });
    if (input.aboutMission !== undefined) entries.push({ key: KEYS.aboutMission, value: input.aboutMission });
    if (input.aboutStory !== undefined) entries.push({ key: KEYS.aboutStory, value: input.aboutStory });
    if (input.aboutCoreValues !== undefined) entries.push({ key: KEYS.aboutCoreValues, value: input.aboutCoreValues });
    if (input.aboutMilestones !== undefined) entries.push({ key: KEYS.aboutMilestones, value: input.aboutMilestones });
    if (input.careersEmail !== undefined) entries.push({ key: KEYS.careersEmail, value: input.careersEmail });
    if (input.careersHiringStatus !== undefined) entries.push({ key: KEYS.careersHiringStatus, value: input.careersHiringStatus });
    if (input.careersOpenRoles !== undefined) entries.push({ key: KEYS.careersOpenRoles, value: input.careersOpenRoles });
    if (input.supplementalFaqs !== undefined) entries.push({ key: KEYS.supplementalFaqs, value: input.supplementalFaqs });
    if (input.legalEffectiveDate !== undefined) entries.push({ key: KEYS.legalEffectiveDate, value: input.legalEffectiveDate });
    if (input.dpoContactEmail !== undefined) entries.push({ key: KEYS.dpoContactEmail, value: input.dpoContactEmail });
    if (input.ogImageUrl !== undefined) entries.push({ key: KEYS.ogImageUrl, value: input.ogImageUrl });
    if (input.seoTitle !== undefined) entries.push({ key: KEYS.seoTitle, value: input.seoTitle });
    if (input.seoDescription !== undefined) entries.push({ key: KEYS.seoDescription, value: input.seoDescription });
    if (input.seoKeywords !== undefined) entries.push({ key: KEYS.seoKeywords, value: input.seoKeywords });
    if (input.platformTagline !== undefined) entries.push({ key: KEYS.platformTagline, value: input.platformTagline });
    if (input.copyrightNotice !== undefined) entries.push({ key: KEYS.copyrightNotice, value: input.copyrightNotice });
    if (input.maintenanceNotice !== undefined) entries.push({ key: KEYS.maintenanceNotice, value: input.maintenanceNotice });
    if (input.legalDisclaimer !== undefined) entries.push({ key: KEYS.legalDisclaimer, value: input.legalDisclaimer });
    if (input.minAdvanceBookingHours !== undefined) entries.push({ key: KEYS.minAdvanceBookingHours, value: input.minAdvanceBookingHours });
    if (input.cancellationGraceHours !== undefined) entries.push({ key: KEYS.cancellationGraceHours, value: input.cancellationGraceHours });

    if (entries.length === 0) return this.getAll();

    await prisma.$transaction(
      entries.map((e) =>
        prisma.platformSetting.upsert({
          where: { key: e.key },
          create: { key: e.key, value: e.value as any, updatedBy: adminId },
          update: { value: e.value as any, updatedBy: adminId },
        })
      )
    );

    invalidateSettingCache();

    await writeAuditLog({
      actorId: adminId,
      action: "UPDATE",
      resource: "USER",
      description: `Updated platform settings: ${entries.map((e) => e.key).join(", ")}`,
      ipAddress,
    });

    return this.getAll();
  },
};
