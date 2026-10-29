"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getExpertsProfileMe } from "@/api/generated";
import { ExpertStatus } from "@/features/experts/types";
import { UserRole } from "@/features/auth/types";
import { apiFetch } from "@/lib/api/client";

export interface ExpertProfile {
  id: string;
  userId: string;
  barNumber: string;
  yearsOfExperience: number;
  specialties: string[];
  languages: string[];
  bio: string | null;
  hourlyRate: number;
  currency: string;
  status: ExpertStatus;
  credentialsExpiry: string | null;
  profileImageObjectKey: string | null;
  officeAddress?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sectorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const EXPERT_PROFILE_QUERY_KEY = ["experts", "profile", "me"] as const;
export const EXPERT_PHOTO_URL_QUERY_KEY = ["experts", "photo", "url"] as const;

export function useExpertProfile(options?: { enabled?: boolean }) {
  const { data: session } = useSession();
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as
    | string
    | undefined;
  const role = (session?.user as any)?.role;
  const isExpert = role === UserRole.EXPERT || role === "EXPERT";

  return useQuery({
    queryKey: EXPERT_PROFILE_QUERY_KEY,
    queryFn: async () => {
      const response = await getExpertsProfileMe();
      return response.status === 200 ? response.data.data : null;
    },
    enabled: !!accessToken && isExpert && (options?.enabled ?? true),
    retry: false,
  });
}

/**
 * Fetches a fresh signed URL for the expert's profile photo.
 * Only runs when the user is an expert and the profile has a profileImageObjectKey.
 */
export function useExpertPhotoUrl(options?: { enabled?: boolean }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isExpert = role === UserRole.EXPERT || role === "EXPERT";
  const isHookEnabled = isExpert && (options?.enabled ?? true);

  const { data: profile } = useExpertProfile({ enabled: isHookEnabled });
  const hasPhoto = !!(profile as any)?.profileImageObjectKey;

  return useQuery({
    queryKey: EXPERT_PHOTO_URL_QUERY_KEY,
    queryFn: async () => {
      const result = await apiFetch<{ data: { photoUrl: string; expiresAt: string } }>(
        "/experts/photo/profile/url",
        { method: "GET" }
      );
      return result.data?.photoUrl ?? null;
    },
    enabled: isHookEnabled && hasPhoto,
    // Signed URLs expire — refetch every 50 minutes to stay fresh
    staleTime: 50 * 60 * 1000,
    retry: false,
  });
}

/**
 * Returns a hook that invalidates both the profile query and the photo URL
 * query after a successful photo upload, and triggers a session update.
 */
export function useInvalidateProfilePhoto() {
  const queryClient = useQueryClient();
  const { update: updateSession } = useSession();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: EXPERT_PROFILE_QUERY_KEY });
    await queryClient.invalidateQueries({ queryKey: EXPERT_PHOTO_URL_QUERY_KEY });
    // Refresh the NextAuth session so session.user.image reflects the new photo
    await updateSession();
  };
}

export function useProfileCompletionStatus() {
  const { data: profile, isLoading, error } = useExpertProfile();

  const isComplete = !!profile;
  const isIncomplete = !isLoading && (error || !profile);
  
  return {
    profile,
    isComplete,
    isIncomplete,
    isLoading,
    needsOnboarding: isIncomplete,
  };
}
