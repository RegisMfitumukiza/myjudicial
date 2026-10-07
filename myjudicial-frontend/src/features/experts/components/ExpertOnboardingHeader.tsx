"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { Check, CheckCircle2 } from "lucide-react";

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
    <div className="border-b border-border bg-card/80 backdrop-blur-xs">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-5">
        {/* Top Executive Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-2 w-2 rounded-full ring-2 ring-emerald-500/20"
                style={{ backgroundColor: "#10b981" }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("onboardingHeader.title")}
              </span>
              <span className="text-muted-foreground/40 hidden sm:inline">·</span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                {t("onboardingHeader.estimatedTime")}
              </span>
            </div>

            <h1 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
              {t("onboardingHeader.welcome", {
                name: expertName || t("onboardingHeader.legalProfessional"),
              })}
            </h1>

            <p className="mt-0.5 text-xs text-muted-foreground max-w-2xl leading-relaxed">
              {t("onboardingHeader.body")}
            </p>
          </div>

          {/* Status Controls */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs">
              <span className="font-semibold text-foreground">
                {t("onboardingHeader.stepOf", { current: currentStep, total: totalSteps })}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span
                className="font-bold"
                style={{ color: "#10b981" }}
              >
                {t("onboardingHeader.complete", { pct: completionPercentage })}
              </span>
            </div>
            <LanguageSwitcher variant="compact" />
          </div>
        </div>

        {/* Practitioner Badges (Clean inline list) */}
        <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#10b981" }} />
              <span>{t("onboardingHeader.benefit1")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#10b981" }} />
              <span>{t("onboardingHeader.benefit2")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#10b981" }} />
              <span>{t("onboardingHeader.benefit3")}</span>
            </div>
          </div>
        </div>

        {/* Single Sleek Progress Track */}
        <div className="mt-2.5 h-1 w-full bg-muted/60 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%`, backgroundColor: "#10b981" }}
          />
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
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeStep = steps[safeActiveIndex];

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-4xl px-3.5 py-2.5 sm:px-6 sm:py-3">
        {/* Mobile View (< 768px): Sleek Step Summary + Segmented Progress Bar + Scrollable Chips */}
        <div className="md:hidden space-y-2">
          {/* Active Step Status Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-on-brand dark:bg-white dark:text-black">
                {safeActiveIndex + 1}
              </span>
              <p className="text-xs font-bold text-foreground truncate">
                {activeStep?.title}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
              {safeActiveIndex + 1} / {steps.length}
            </span>
          </div>

          {/* Segmented Progress Track */}
          <div className="grid grid-cols-7 gap-1 h-1.5 w-full">
            {steps.map((step) => (
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
              const isClickable = Boolean(onStepClick && (step.completed || step.active));
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
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100"
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

        {/* Tablet & Desktop View (>= 768px): Unified Horizontal Stepper */}
        <div className="hidden md:flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
          {steps.map((step, index) => {
            const isClickable = Boolean(onStepClick && (step.completed || step.active));
            return (
              <div key={step.id} className="flex items-center min-w-0 last:flex-initial">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => onStepClick?.(index + 1)}
                  title={`${index + 1}. ${step.title}`}
                  className={`flex items-center gap-2 group text-left transition-all rounded-lg px-2.5 py-1.5 ${
                    step.active
                      ? "bg-brand-dark/5 dark:bg-white/10 ring-1 ring-brand-dark/15 dark:ring-white/20"
                      : isClickable
                      ? "hover:bg-muted/60 cursor-pointer"
                      : "cursor-default opacity-70"
                  }`}
                >
                  {/* Step Node Circle */}
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs ${
                      step.completed
                        ? "text-white"
                        : step.active
                        ? "bg-brand-dark text-on-brand ring-2 ring-brand-dark/25 dark:bg-white dark:text-black"
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

                  {/* Step Label: Active is ALWAYS visible; others adapt gracefully without ugly ellipsis */}
                  <span
                    className={`text-xs whitespace-nowrap transition-colors ${
                      step.active
                        ? "font-bold text-foreground"
                        : step.completed
                        ? "font-medium text-foreground/80 hidden xl:inline"
                        : "font-medium text-muted-foreground hidden 2xl:inline"
                    }`}
                  >
                    {step.title}
                  </span>
                </button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className="mx-1 lg:mx-2.5 h-0.5 w-5 lg:w-8 xl:w-12 shrink-0 rounded-full transition-colors"
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