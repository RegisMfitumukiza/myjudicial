"use client";

import { AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useProfileCompletionStatus } from "../hooks/useExpertProfile";
import { useExpertOnboardingDraft } from "../hooks/useExpertOnboardingDraft";
import { useTranslations } from "next-intl";

export function ProfileCompletionBanner() {
  const t = useTranslations("experts");
  const { isIncomplete, isLoading } = useProfileCompletionStatus();
  const draft = useExpertOnboardingDraft();

  if (isLoading || !isIncomplete) {
    return null;
  }

  const isDraftActive = draft.hasDraft && draft.currentStep >= 1;

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold flex items-center gap-2">
            <span>
              {isDraftActive
                ? t("profileCompletion.resumeTitle", { step: draft.currentStep, total: draft.totalSteps })
                : t("profileCompletion.title")}
            </span>
            {isDraftActive && (
              <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
                {draft.completionPercentage}%
              </span>
            )}
          </AlertTitle>
          <AlertDescription className="mt-1 text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
            {isDraftActive
              ? t("profileCompletion.resumeBannerSubtitle", { pct: draft.completionPercentage, step: draft.currentStep })
              : t("profileCompletion.subtitle")}
          </AlertDescription>
        </div>
        <Link href="/expert/onboarding">
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 whitespace-nowrap shadow-xs"
          >
            {isDraftActive
              ? t("profileCompletion.resumeBannerBtn", { step: draft.currentStep })
              : t("profileCompletion.title")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </Alert>
  );
}

export function ProfileCompletionCard({
  hasAvailability = false
}: {
  hasAvailability?: boolean;
}) {
  const t = useTranslations("experts");
  const { profile, isComplete } = useProfileCompletionStatus();
  const draft = useExpertOnboardingDraft();

  const hasProfile = isComplete || (draft.hasDraft && draft.currentStep >= 2);
  const hasServices = (isComplete && Array.isArray(profile?.specialties) && profile.specialties.length > 0) || (draft.hasDraft && draft.currentStep >= 4);
  const isVerified = profile?.status === "VERIFIED";
  const hasSubmittedDocs = (profile?.status !== undefined && profile.status !== "DRAFT") || (draft.hasDraft && draft.currentStep >= 6);

  const steps = [
    {
      labelKey: "steps.profile",
      completed: hasProfile,
      descKey: hasProfile
        ? "steps.profileDone"
        : draft.hasDraft && draft.currentStep === 1
        ? "steps.profileInProgress"
        : "steps.profilePending",
      isInProgress: !hasProfile && draft.hasDraft && draft.currentStep === 1,
    },
    {
      labelKey: "steps.services",
      completed: hasServices,
      descKey: hasServices
        ? "steps.servicesDone"
        : draft.hasDraft && (draft.currentStep === 2 || draft.currentStep === 3)
        ? "steps.servicesInProgress"
        : "steps.servicesPending",
      isInProgress: !hasServices && draft.hasDraft && (draft.currentStep === 2 || draft.currentStep === 3),
    },
    {
      labelKey: "steps.documents",
      completed: hasSubmittedDocs,
      descKey: hasSubmittedDocs
        ? "steps.documentsDone"
        : draft.hasDraft && (draft.currentStep === 4 || draft.currentStep === 5)
        ? "steps.documentsInProgress"
        : "steps.documentsPending",
      isInProgress: !hasSubmittedDocs && draft.hasDraft && (draft.currentStep === 4 || draft.currentStep === 5),
    },
    {
      labelKey: "steps.verification",
      completed: isVerified,
      descKey: isVerified ? "steps.verificationDone" : "steps.verificationPending",
      isInProgress: false,
    },
    {
      labelKey: "steps.availability",
      completed: hasAvailability,
      descKey: hasAvailability ? "steps.availabilityDone" : "steps.availabilityPending",
      isInProgress: false,
    },
  ];

  // If profile is completed, calculate based on finished records
  // If user is in onboarding wizard draft, display draft percentage to match wizard exactly!
  const completionPercentage = isComplete
    ? Math.round((steps.filter(s => s.completed).length / steps.length) * 100)
    : draft.hasDraft
    ? draft.completionPercentage
    : 0;

  const isFullyComplete = completionPercentage === 100 && isVerified;

  if (isFullyComplete) {
    return null;
  }

  const isDraftActive = draft.hasDraft && !isComplete;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("onboarding.title")}
            </h3>
            {isDraftActive && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-brand-blue border border-brand-blue/20 dark:bg-blue-950/60 dark:text-blue-300">
                {t("profileCompletion.draftStep", { step: draft.currentStep, total: draft.totalSteps })}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isDraftActive
              ? t("profileCompletion.resumeSubtitle", { step: draft.currentStep, total: draft.totalSteps, pct: completionPercentage })
              : t("profileCompletion.completedLabel", { pct: completionPercentage })}
          </p>
        </div>
        <div className="text-2xl font-bold text-brand-blue">
          {completionPercentage}%
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full bg-brand-blue transition-all duration-500"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      <div className="mt-6 space-y-4">
        {steps.map((step, index) => (
          <div key={step.labelKey} className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {step.completed ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              ) : step.isInProgress ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-blue bg-blue-50 text-sm font-semibold text-brand-blue dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-300">
                  <Clock className="h-4 w-4 animate-pulse" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  {index + 1}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${
                step.completed
                  ? "text-slate-900 dark:text-white"
                  : step.isInProgress
                  ? "text-brand-blue dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}>
                {t(step.labelKey as any)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
                {t(step.descKey as any)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!isFullyComplete && (
        <Link href="/expert/onboarding">
          <Button className="mt-6 w-full bg-brand-dark text-on-brand hover:bg-brand-dark/90 font-medium">
            {isDraftActive
              ? t("profileCompletion.resumeCta", { step: draft.currentStep, total: draft.totalSteps })
              : t("profileCompletion.title")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}
