"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ArrowRight, User, Briefcase, Clock, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/shared/components/dashboard/status-badge";
import { ErrorState, LoadingSpinner, PageHeader } from "@/shared/components/dashboard";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedMinutes: number;
  dependencies?: string[];
}

interface OnboardingProgress {
  data: {
    currentStep: string;
    completedSteps: string[];
    totalSteps: number;
    completionPercentage: number;
    isComplete: boolean;
    steps: OnboardingStep[];
  };
}

const STEP_HREFS: Record<string, string> = {
  profile: "/expert/dashboard/profile",
  services: "/expert/dashboard/services",
  availability: "/expert/dashboard/availability",
  verification: "/expert/dashboard/verification",
  compliance: "/expert/dashboard/verification",
};

const STEP_ICONS: Record<string, typeof User> = {
  profile: User,
  services: Briefcase,
  availability: Clock,
  verification: ShieldCheck,
  compliance: ShieldCheck,
};

export default function GettingStartedPage() {
  const t = useTranslations("expertDashboard_gettingstarted");
  const { data, isLoading, error } = useQuery({
    queryKey: ["onboarding-progress"],
    queryFn: () => apiFetch<OnboardingProgress>("/experts/onboarding"),
    refetchInterval: 30000,
  });

  const progress = data?.data;

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="mt-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={t("failedToLoad")} />
        ) : progress ? (
          <div className="space-y-8">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {progress.isComplete
                    ? t("allStepsCompleted")
                    : t("stepsProgress", { completed: progress.completedSteps.length, total: progress.totalSteps })}
                </p>
                <span className="text-xs font-medium text-primary">
                  {progress.completionPercentage}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress.completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {progress.steps.map((step) => {
                const done = step.completed;
                const isCurrent = !done && step.id === progress.currentStep;
                const Icon = STEP_ICONS[step.id] ?? Briefcase;
                const href = STEP_HREFS[step.id] ?? "/expert/dashboard";

                return (
                  <Link
                    key={step.id}
                    href={href}
                    className={cn(
                      "flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
                      done && "border-primary/30 bg-primary/5",
                      isCurrent && "ring-2 ring-primary/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        done
                          ? "bg-primary/10 text-primary"
                          : isCurrent
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      {done ? <CheckCircle2 size={18} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{step.title}</p>
                        {done && <StatusBadge tone="active">{t("done")}</StatusBadge>}
                        {isCurrent && <StatusBadge tone="info">{t("next")}</StatusBadge>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                    </div>
                    {!done && (
                      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center">
                        <ArrowRight size={14} className="text-muted-foreground" aria-hidden="true" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
