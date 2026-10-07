"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { Check, ShieldCheck, CheckCircle2 } from "lucide-react";
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
    <div className="bg-gradient-to-r from-[#173860] via-[#1f4a7d] to-[#173860] text-white border-b border-white/10 shadow-sm">
      <div className="mx-auto max-w-4xl px-3.5 py-3 sm:px-6 sm:py-5">
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Authentic Brand Logo & Portal Tag */}
          <div className="flex items-center gap-3 min-w-0">
            <Logo
              light
              iconSize={26}
              fontSize="text-base sm:text-lg font-bold"
              href="/expert/dashboard"
              hideTextOnSmall={false}
            />
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-medium text-blue-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{t("onboardingHeader.subtitle")}</span>
            </div>
          </div>

          {/* Step Pill, Completion & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/10 px-2.5 py-1 sm:px-3 sm:py-1 border border-white/15 text-xs">
              <span className="font-semibold text-white">
                {t("onboardingHeader.stepOf", { current: currentStep, total: totalSteps })}
              </span>
              <span className="text-white/40">·</span>
              <span className="font-bold text-emerald-300">
                {t("onboardingHeader.complete", { pct: completionPercentage })}
              </span>
            </div>
            <LanguageSwitcher variant="compact" className="text-white hover:text-white" />
          </div>
        </div>

        {/* Compact, Executive Context Banner (Zero Vertical Waste) */}
        <div className="mt-3 sm:mt-4 rounded-xl border border-white/15 bg-white/[0.07] backdrop-blur-md px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="min-w-0 flex items-center gap-2.5">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold text-white truncate">
                {t("onboardingHeader.welcome", {
                  name: expertName || t("onboardingHeader.legalProfessional"),
                })}
              </h2>
              <p className="text-[11px] sm:text-xs text-blue-100/80 truncate">
                {t("onboardingHeader.body")}
              </p>
            </div>
          </div>

          {/* Trust badges - sleek inline pill format */}
          <div className="hidden md:flex items-center gap-3 shrink-0 text-[11px] text-blue-100/90 pl-3 border-l border-white/15">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t("onboardingHeader.benefit1")}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t("onboardingHeader.benefit2")}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t("onboardingHeader.benefit3")}</span>
            </div>
          </div>
        </div>

        {/* Setup Progress Bar */}
        <div className="mt-2.5 sm:mt-3">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-blue-100/90 mb-1">
            <span className="font-medium">{t("onboardingHeader.setupProgress")}</span>
            <span className="font-bold">{completionPercentage}%</span>
          </div>
          <div className="h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
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
  const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeStep = steps[safeActiveIndex];

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md shadow-xs">
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

        {/* Tablet & Desktop View (>= 768px): Adaptive Zero-Truncation Stepper */}
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
                  className={`flex items-center gap-2 group text-left transition-all rounded-lg px-2 py-1 ${
                    step.active
                      ? "bg-brand-dark/5 dark:bg-white/10 ring-1 ring-brand-dark/15 dark:ring-white/20"
                      : isClickable
                      ? "hover:bg-muted/60 cursor-pointer"
                      : "cursor-default opacity-70"
                  }`}
                >
                  {/* Step Node Circle */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-xs ${
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

                  {/* Step Label: Active is ALWAYS fully visible; others adapt gracefully without ugly ellipsis */}
                  <div className="flex flex-col min-w-0">
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
                    {step.active && (
                      <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
                        Step {index + 1}
                      </span>
                    )}
                  </div>
                </button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className="mx-1 lg:mx-2 h-0.5 w-5 lg:w-8 xl:w-12 shrink-0 rounded-full transition-colors"
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