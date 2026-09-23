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

interface PublicSettingsResponse {
  success: boolean;
  data: {
    paymentMode?: string;
    socialLinks?: SocialLinks;
  };
}

export const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  x: "",
  linkedin: "",
  facebook: "",
  instagram: "",
  youtube: "",
  whatsapp: "",
};

export function useSocialLinks(): {
  socialLinks: SocialLinks;
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

  const socialLinks: SocialLinks = {
    ...DEFAULT_SOCIAL_LINKS,
    ...(data?.socialLinks ?? {}),
  };

  return {
    socialLinks,
    isLoading,
  };
}
