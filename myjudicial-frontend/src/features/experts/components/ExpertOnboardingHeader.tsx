"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { Check, ShieldCheck, Scale, CheckCircle2 } from "lucide-react";
import { Logo } from "@/shared/components/logo";

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  expertName?: string;
}

export function ExpertOnboardingHeader({
  currentStep,
  totalSteps,
  completionPercentage,
  expertName,
}: OnboardingHeaderProps) {
  const t = useTranslations("experts");

  return (
    <div className="bg-gradient-to-r from-brand-dark via-[#1e4573] to-brand-dark text-white shadow-sm">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
        {/* Header with Brand Logo & Top Controls */}
        <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-5">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white truncate">
                {t("onboardingHeader.title")}
              </h1>
              <p className="text-[11px] sm:text-xs text-blue-100/80 truncate hidden min-[360px]:block">
                {t("onboardingHeader.subtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <div className="text-right">
              <p className="text-xs sm:text-sm font-semibold text-white">
                {t("onboardingHeader.stepOf", { current: currentStep, total: totalSteps })}
              </p>
              <div className="text-[11px] font-medium text-blue-200">
                {t("onboardingHeader.complete", { pct: completionPercentage })}
              </div>
            </div>
            <LanguageSwitcher variant="compact" className="text-white hover:text-white" />
          </div>
        </div>

        {/* Welcome Message Card */}
        <div className="rounded-xl sm:rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md p-3 sm:p-4.5">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3.5">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xs sm:text-base font-semibold text-white truncate">
                {t("onboardingHeader.welcome", {
                  name: expertName || t("onboardingHeader.legalProfessional"),
                })}
              </h2>
              <p className="mt-0.5 text-[11px] sm:text-xs text-blue-100/85 leading-snug line-clamp-1 sm:line-clamp-none">
                {t("onboardingHeader.body")}
              </p>
            </div>
          </div>

          {/* Benefits Grid (Tablet / Desktop) */}
          <div className="mt-2.5 hidden sm:grid sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-white/10 text-xs text-blue-100">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="truncate">{t("onboardingHeader.benefit1")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="truncate">{t("onboardingHeader.benefit2")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="truncate">{t("onboardingHeader.benefit3")}</span>
            </div>
          </div>
        </div>

        {/* Setup Progress Track */}
        <div className="mt-3 sm:mt-4">
          <div className="flex items-center justify-between text-xs text-blue-100 mb-1">
            <span className="font-medium text-[11px] sm:text-xs">{t("onboardingHeader.setupProgress")}</span>
            <span className="font-bold text-[11px] sm:text-xs">{completionPercentage}%</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%`, backgroundColor: "#10b981" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════════ */

interface StepProgressProps {
  steps: Array<{
    id: string;
    title: string;
    completed: boolean;
    active?: boolean;
  }>;
  onStepClick?: (stepNumber: number) => void;
}

export function StepProgress({ steps, onStepClick }: StepProgressProps) {
  const activeIndex = steps.findIndex((s) => s.active);
  const activeStep = steps[activeIndex >= 0 ? activeIndex : 0];

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-4xl px-3 py-2.5 sm:px-6 sm:py-3.5">
        {/* Mobile View (< 768px): Sleek Step Summary + Segmented Progress Bar + Scrollable Chips */}
        <div className="md:hidden space-y-2">
          {/* Active Step Status Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-on-brand dark:bg-white dark:text-black">
                {activeIndex + 1}
              </span>
              <p className="text-xs font-bold text-foreground truncate">
                {activeStep?.title}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
              {activeIndex + 1} / {steps.length}
            </span>
          </div>

          {/* Segmented Progress Track */}
          <div className="grid grid-cols-7 gap-1 h-1.5 w-full">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className="h-full rounded-full transition-all duration-300"
                style={{
                  backgroundColor: step.completed
                    ? "#10b981"
                    : step.active
                    ? "#24558d"
                    : "rgba(128, 128, 128, 0.2)",
                }}
              />
            ))}
          </div>

          {/* Horizontal Scrollable Step Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pt-0.5">
            {steps.map((step, index) => {
              const isClickable = step.completed || step.active;
              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => onStepClick?.(index + 1)}
                  className={`flex items-center gap-1.5 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    step.active
                      ? "bg-brand-dark text-on-brand dark:bg-white dark:text-black shadow-xs ring-1 ring-brand-dark/20"
                      : step.completed
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-muted/50 text-muted-foreground opacity-60 cursor-default"
                  }`}
                >
                  <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
                    {step.completed ? "✓" : index + 1}
                  </span>
                  <span className="whitespace-nowrap">{step.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tablet & Desktop View (>= 768px): Full Horizontal Stepper with Graceful Shrink */}
        <div className="hidden md:flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {steps.map((step, index) => {
            const isClickable = step.completed || step.active;
            return (
              <div key={step.id} className="flex items-center flex-1 min-w-0 last:flex-initial">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => onStepClick?.(index + 1)}
                  className={`flex items-center gap-2 group text-left min-w-0 transition-opacity ${
                    isClickable ? "hover:opacity-85 cursor-pointer" : "cursor-default opacity-60"
                  }`}
                >
                  {/* Step Circle */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs ${
                      step.completed
                        ? "text-white"
                        : step.active
                        ? "bg-brand-dark text-on-brand ring-2 ring-brand-dark/30 dark:bg-white dark:text-black"
                        : "border border-border bg-muted/60 text-muted-foreground"
                    }`}
                    style={step.completed ? { backgroundColor: "#10b981" } : undefined}
                  >
                    {step.completed ? (
                      <Check className="h-3.5 w-3.5 text-white stroke-[2.5]" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={`text-xs font-semibold truncate ${
                      step.active
                        ? "text-foreground font-bold"
                        : step.completed
                        ? "text-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                </button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className="mx-2 h-0.5 flex-1 min-w-[12px] max-w-[40px] rounded-full transition-colors"
                    style={{
                      backgroundColor: step.completed
                        ? "#10b981"
                        : "rgba(128, 128, 128, 0.2)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}