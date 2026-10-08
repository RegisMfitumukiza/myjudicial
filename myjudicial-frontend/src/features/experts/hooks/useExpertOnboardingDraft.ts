"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

const STORAGE_KEY = "mj_expert_onboarding";
const STORAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
export const TOTAL_ONBOARDING_STEPS = 7;

export interface SavedLocalProgress {
  currentStep: number;
  formData: Record<string, any>;
  savedAt: number;
}

export interface OnboardingDraftState {
  hasDraft: boolean;
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  savedAt: number | null;
  formData: Record<string, any> | null;
  isLoading: boolean;
}

export function loadLocalOnboardingDraft(): SavedLocalProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: SavedLocalProgress = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > STORAGE_MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function useExpertOnboardingDraft(): OnboardingDraftState {
  const [localDraft, setLocalDraft] = useState<SavedLocalProgress | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setLocalDraft(loadLocalOnboardingDraft());

    // Listen to local storage changes across tabs or in-wizard saves
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setLocalDraft(loadLocalOnboardingDraft());
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Fetch backend onboarding status and draft
  const { data: onboardingRes, isLoading: isQueryLoading } = useQuery({
    queryKey: ["experts", "onboarding"],
    queryFn: async () => {
      return await apiFetch<{
        data: {
          currentStep: string;
          completedSteps: string[];
          completionPercentage: number;
          totalSteps: number;
          draft?: {
            currentStep: number;
            formData: Record<string, any>;
            savedAt: number;
            completionPercentage: number;
          } | null;
        };
      }>("/experts/onboarding", { method: "GET" });
    },
    staleTime: 30 * 1000,
  });

  const serverDraft = onboardingRes?.data?.draft ?? null;

  // Determine active draft: favor the freshest timestamp between local and cloud draft
  let activeDraft: {
    currentStep: number;
    formData: Record<string, any>;
    savedAt: number;
    completionPercentage?: number;
  } | null = null;

  if (localDraft && serverDraft) {
    activeDraft = (localDraft.savedAt >= (serverDraft.savedAt || 0))
      ? localDraft
      : serverDraft;
  } else if (localDraft) {
    activeDraft = localDraft;
  } else if (serverDraft) {
    activeDraft = serverDraft;
  }

  const hasDraft = !!activeDraft && typeof activeDraft.currentStep === "number" && activeDraft.currentStep >= 1;
  const currentStep = hasDraft ? Math.max(1, Math.min(TOTAL_ONBOARDING_STEPS, activeDraft!.currentStep)) : 1;
  const totalSteps = TOTAL_ONBOARDING_STEPS;

  // Exact step-to-percentage formula used in ExpertOnboardingWizard
  // Step 1: 14%, Step 2: 29%, Step 3: 43%, Step 4: 57%, Step 5: 71%, Step 6: 86%, Step 7: 100%
  const completionPercentage = hasDraft
    ? (activeDraft?.completionPercentage ?? Math.round((currentStep / totalSteps) * 100))
    : 0;

  return {
    hasDraft,
    currentStep,
    totalSteps,
    completionPercentage,
    savedAt: activeDraft?.savedAt ?? null,
    formData: activeDraft?.formData ?? null,
    isLoading: !isClient || isQueryLoading,
  };
}
