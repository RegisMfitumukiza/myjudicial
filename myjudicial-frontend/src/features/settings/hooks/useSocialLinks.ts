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

export interface PlatformPublicSettings {
  platformName: string;
  paymentMode: "BOOKING_FIRST" | "PAYMENT_REQUIRED";
  maintenanceMode: boolean;
  socialLinks: SocialLinks;
  supportEmail: string;
  hotlinePhone: string;
  whatsappNumber: string;
  officeBuilding: string;
  officeStreet: string;
  officeDistrict: string;
  officePoBox: string;
  aboutVision: string;
  aboutMission: string;
  aboutStory: string;
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

export const DEFAULT_PLATFORM_SETTINGS: PlatformPublicSettings = {
  platformName: "MyJudicial",
  paymentMode: "PAYMENT_REQUIRED",
  maintenanceMode: false,
  socialLinks: DEFAULT_SOCIAL_LINKS,
  supportEmail: "support@myjudicial.com",
  hotlinePhone: "+250 788 312 456",
  whatsappNumber: "+250 788 312 456",
  officeBuilding: "Centenary House, 4th Floor",
  officeStreet: "KN 3 Ave & KN 4 St",
  officeDistrict: "Nyarugenge Central Business District, Kigali, Rwanda",
  officePoBox: "P.O. Box 2848, Kigali",
  aboutVision: "",
  aboutMission: "",
  aboutStory: "",
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
