"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { AiStep } from "../types";

const STEPS: AiStep[] = ["describe", "refine", "match"];

const STEP_INDEX: Record<AiStep, number> = {
  describe: 0,
  refine: 1,
  match: 2,
};

export function AiStepIndicator({ currentStep }: { currentStep: AiStep }) {
  const t = useTranslations("ai.steps");
  const current = STEP_INDEX[currentStep];

  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, i) => {
        const isActive = i === current;
        const isCompleted = i < current;

        return (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-8 transition-colors",
                  i <= current ? "bg-brand-dark" : "bg-border"
                )}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-brand-dark text-on-brand"
                    : isCompleted
                      ? "bg-brand-dark text-on-brand"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors hidden sm:inline",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {t(step)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
