"use client";

import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useProfileCompletionStatus } from "../hooks/useExpertProfile";
import { useTranslations } from "next-intl";

export function ProfileCompletionBanner() {
  const t = useTranslations("experts");
  const { isIncomplete, isLoading } = useProfileCompletionStatus();

  if (isLoading || !isIncomplete) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <AlertTitle className="text-amber-900 dark:text-amber-100">
            {t("profileCompletion.title")}
          </AlertTitle>
          <AlertDescription className="mt-1 text-amber-700 dark:text-amber-300">
            {t("profileCompletion.subtitle")}
          </AlertDescription>
        </div>
        <Link href="/expert/onboarding">
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 whitespace-nowrap"
          >
            {t("profileCompletion.title")}
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

  const hasProfile = isComplete;
  const hasServices = isComplete && Array.isArray(profile?.specialties) && profile.specialties.length > 0;
  const isVerified = profile?.status === "VERIFIED";
  const hasSubmittedDocs = profile?.status !== undefined && profile.status !== "DRAFT";

  const steps = [
    {
      labelKey: "steps.profile",
      completed: hasProfile,
      descKey: hasProfile ? "steps.profileDone" : "steps.profilePending"
    },
    {
      labelKey: "steps.services",
      completed: hasServices,
      descKey: hasServices ? "steps.servicesDone" : "steps.servicesPending"
    },
    {
      labelKey: "steps.documents",
      completed: hasSubmittedDocs,
      descKey: hasSubmittedDocs ? "steps.documentsDone" : "steps.documentsPending"
    },
    {
      labelKey: "steps.verification",
      completed: isVerified,
      descKey: isVerified ? "steps.verificationDone" : "steps.verificationPending"
    },
    {
      labelKey: "steps.availability",
      completed: hasAvailability,
      descKey: hasAvailability ? "steps.availabilityDone" : "steps.availabilityPending"
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const completionPercentage = Math.round((completedCount / steps.length) * 100);
  const isFullyComplete = completionPercentage === 100;

  if (isFullyComplete) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {t("onboarding.title")}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("profileCompletion.completedLabel", { pct: completionPercentage })}
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
          <Button className="mt-6 w-full bg-brand-dark text-on-brand hover:bg-brand-dark/90">
            {t("profileCompletion.title")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}
