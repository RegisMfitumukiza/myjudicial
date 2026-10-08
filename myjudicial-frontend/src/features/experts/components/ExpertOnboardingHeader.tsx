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
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">{t("onboardingHeader.benefit1")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">{t("onboardingHeader.benefit2")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="truncate">{t("onboardingHeader.benefit3")}</span>
            </div>
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
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeStep = steps[safeActiveIndex];
  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const completionPercentage = Math.round(((safeActiveIndex + 1) / totalSteps) * 100);

  return (
    <nav
      aria-label="Onboarding Progress"
      className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md shadow-xs transition-colors"
    >
      <div className="mx-auto max-w-4xl px-3 py-2.5 sm:px-6 sm:py-3">
        {/* Top: 7-Segment Precision Rail (Responsive across 230px to 4K without horizontal overflow) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 w-full items-center">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isClickable = Boolean(onStepClick && (step.completed || step.active));
            return (
              <button
                key={step.id}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(stepNumber)}
                title={`Step ${stepNumber}: ${step.title} ${
                  step.completed ? "(Completed)" : step.active ? "(Current)" : ""
                }`}
                aria-label={`Step ${stepNumber}: ${step.title}`}
                aria-current={step.active ? "step" : undefined}
                className={`group relative h-2 sm:h-2.5 w-full rounded-full transition-all duration-300 focus:outline-hidden focus:ring-2 focus:ring-brand-dark/40 ${
                  step.completed
                    ? "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400 cursor-pointer shadow-xs"
                    : step.active
                    ? "bg-brand-dark dark:bg-white shadow-xs ring-2 ring-brand-dark/20 dark:ring-white/30"
                    : "bg-muted/70 dark:bg-muted/40 cursor-default opacity-70"
                }`}
              >
                {/* Floating Tooltip (Visible on hover on desktop) */}
                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 hidden sm:block z-40">
                  {stepNumber}. {step.title} {step.completed ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom: Contextual Status Bar */}
        <div className="mt-2 sm:mt-2.5 flex items-center justify-between gap-2 min-w-0">
          {/* Active Step Indicator & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-5 w-5 sm:h-5.5 sm:w-5.5 shrink-0 items-center justify-center rounded-full bg-brand-dark text-[10px] sm:text-xs font-bold text-on-brand dark:bg-white dark:text-black shadow-xs">
              {safeActiveIndex + 1}
            </span>
            <div className="min-w-0 truncate">
              <h2 className="text-xs sm:text-sm font-bold text-foreground truncate leading-tight">
                {activeStep?.title}
              </h2>
            </div>
          </div>

          {/* Progress Readout & Fast Jump Chips for Completed Steps */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-muted-foreground whitespace-nowrap">
              <span>
                <span className="font-bold text-foreground">{safeActiveIndex + 1}</span> / {totalSteps}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {completionPercentage}%
              </span>
            </div>

            {/* Fast Step Navigation for Completed Steps (visible on md+) */}
            {onStepClick && completedCount > 0 && (
              <div className="hidden md:flex items-center gap-1 pl-2 border-l border-border/60">
                {steps.map((step, idx) => {
                  const isClickable = step.completed || step.active;
                  if (!isClickable) return null;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => onStepClick(idx + 1)}
                      title={`Jump to ${idx + 1}. ${step.title}`}
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        step.active
                          ? "bg-brand-dark text-on-brand dark:bg-white dark:text-black ring-1 ring-brand-dark/20 shadow-xs"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 cursor-pointer"
                      }`}
                    >
                      {step.completed ? "✓" : idx + 1}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}