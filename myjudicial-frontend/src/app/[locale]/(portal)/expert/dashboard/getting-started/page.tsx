"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ArrowRight, Loader2, User, Briefcase, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";

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
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">{t("title")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center shadow-md dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-red-600 dark:text-red-400">{t("failedToLoad")}</p>
        </div>
      ) : progress ? (
        <div className="space-y-8">
          <div className="rounded-xl border border-brand-border bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">
                {progress.isComplete
                  ? t("allStepsCompleted")
                  : t("stepsProgress", { completed: progress.completedSteps.length, total: progress.totalSteps })}
              </p>
              <span className="text-xs font-medium text-brand-blue">
                {progress.completionPercentage}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-brand-blue transition-all"
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
                  className={`flex items-start gap-4 rounded-xl border p-5 shadow-md transition-all hover:shadow-lg ${
                    done
                      ? "border-green-200 bg-green-50/50 dark:border-green-800/30 dark:bg-green-950/20"
                      : isCurrent
                        ? "border-brand-blue/20 bg-blue-50/50 dark:border-blue-800/30 dark:bg-blue-950/20"
                        : "border-brand-border bg-white dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      done
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : isCurrent
                          ? "bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300"
                          : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                    }`}
                  >
                    {done ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-semibold ${
                          done
                            ? "text-green-700 dark:text-green-300"
                            : "text-brand-dark dark:text-gray-100"
                        }`}
                      >
                        {step.title}
                      </p>
                      {done && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {t("done")}
                        </span>
                      )}
                      {isCurrent && (
                        <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 text-[10px] font-medium text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300">
                          {t("next")}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                  </div>
                  {!done && (
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center">
                      <ArrowRight size={14} className="text-gray-400" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
