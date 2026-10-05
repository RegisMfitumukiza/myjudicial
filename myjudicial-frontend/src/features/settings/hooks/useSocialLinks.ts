"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

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
  /**
   * Optional, forward-looking fields. They are not required by the current
   * careers page: when present they enrich the role card, when absent the page
   * falls back to the summary row only.
   */
  slug?: string;
  summary?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  niceToHave?: string[];
  applicationInstructions?: string;
  /** Defaults to published. Set false to keep a role in settings but off the public page. */
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

export interface PlatformPublicSettings {
  platformName: string;
  paymentMode: "BOOKING_FIRST" | "PAYMENT_REQUIRED";
  maintenanceMode: boolean;
  platformFeePercent: number;
  socialLinks: SocialLinks;
  supportEmail: string;
  hotlinePhone: string;
  whatsappNumber: string;
  officeBuilding: string;
  officeStreet: string;
  officeDistrict: string;
  officePoBox: string;
  supportWorkingHours: string;
  aboutVision: string;
  aboutMission: string;
  aboutStory: string;
  aboutHeroBadge?: string;
  aboutHeroTitle?: string;
  aboutHeroSubtitle?: string;
  aboutCoreValues: CoreValueItem[];
  aboutMilestones: MilestoneItem[];
  careersEmail: string;
  careersHiringStatus: CareersHiringStatus;
  careersHeroTitle?: string;
  careersHeroSubtitle?: string;
  careersOpenRoles: CareerRoleItem[];
  careersRequirePhone?: boolean;
  careersRequireLinkedIn?: boolean;
  careersRequirePortfolio?: boolean;
  careersRequireResume?: boolean;
  careersRequireCoverNote?: boolean;
  supplementalFaqs: SupplementalFaqItem[];
  legalEffectiveDate: string;
  dpoContactEmail: string;
  ogImageUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  platformTagline: string;
  copyrightNotice: string;
  maintenanceNotice: string;
  legalDisclaimer: string;
  minAdvanceBookingHours: number;
  cancellationGraceHours: number;
}

interface PublicSettingsResponse {
  success: boolean;
  data: PlatformPublicSettings;
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  x: "",
  linkedin: "",
  facebook: "",
  instagram: "",
  youtube: "",
  whatsapp: "",
};

export const DEFAULT_CORE_VALUES: CoreValueItem[] = [
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
];

export const DEFAULT_MILESTONES: MilestoneItem[] = [
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
];

export const DEFAULT_PLATFORM_SETTINGS: PlatformPublicSettings = {
  platformName: "MyJudicial",
  paymentMode: "PAYMENT_REQUIRED",
  maintenanceMode: false,
  platformFeePercent: 15,
  socialLinks: DEFAULT_SOCIAL_LINKS,
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
  aboutCoreValues: DEFAULT_CORE_VALUES,
  aboutMilestones: DEFAULT_MILESTONES,
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
  dpoContactEmail: "",
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

export function usePlatformSettings(): {
  settings: PlatformPublicSettings;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["settings", "public"],
    queryFn: async () => {
      const response = await apiFetch<PublicSettingsResponse>("/settings");
      if (!response.success) throw new Error("Failed to load platform settings");
      return response.data;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const settings: PlatformPublicSettings = {
    ...DEFAULT_PLATFORM_SETTINGS,
    ...(data ?? {}),
    socialLinks: {
      ...DEFAULT_SOCIAL_LINKS,
      ...(data?.socialLinks ?? {}),
    },
  };

  return {
    settings,
    isLoading,
  };
}

export function useSocialLinks(): {
  socialLinks: SocialLinks;
  isLoading: boolean;
} {
  const { settings, isLoading } = usePlatformSettings();
  return {
    socialLinks: settings.socialLinks,
    isLoading,
  };
}
