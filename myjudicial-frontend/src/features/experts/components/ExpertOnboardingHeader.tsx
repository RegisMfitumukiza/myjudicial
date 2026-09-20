"use client";

import { Logo } from "@/shared/components/logo";
import { CheckCircleIcon, ClockIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/shared/components/language-switcher";

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
  expertName 
}: OnboardingHeaderProps) {
  const t = useTranslations("experts");
  return (
    <div className="bg-gradient-to-r from-brand-dark via-brand-blue to-brand-dark text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Logo className="h-8 w-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold">{t("onboardingHeader.title")}</h1>
              <p className="text-blue-100 text-sm">{t("onboardingHeader.subtitle")}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-blue-100">{t("onboardingHeader.stepOf", { current: currentStep, total: totalSteps })}</p>
              <div className="text-xs text-blue-200">
                {t("onboardingHeader.complete", { pct: completionPercentage })}
              </div>
            </div>
            <LanguageSwitcher variant="compact" className="text-white hover:text-white" />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-2">
                {t("onboardingHeader.welcome", { name: expertName || t("onboardingHeader.legalProfessional") })}
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed">
                {t("onboardingHeader.body")}
              </p>
              
              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-blue-100">
                  <CheckCircleIcon className="h-4 w-4 text-green-300" />
                  <span>{t("onboardingHeader.benefit1")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-100">
                  <CheckCircleIcon className="h-4 w-4 text-green-300" />
                  <span>{t("onboardingHeader.benefit2")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-100">
                  <CheckCircleIcon className="h-4 w-4 text-green-300" />
                  <span>{t("onboardingHeader.benefit3")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-blue-100 mb-2">
          <span>{t("onboardingHeader.setupProgress")}</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════════ */

/**
 * Step Progress Indicator
 */
interface StepProgressProps {
  steps: Array<{
    id: string;
    title: string;
    completed: boolean;
    active?: boolean;
  }>;
}

export function StepProgress({ steps }: StepProgressProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step.completed 
                    ? 'bg-green-500 text-white'
                    : step.active
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.completed ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                
                {/* Step Label */}
                <div className="ml-2 hidden sm:block">
                  <p className={`text-xs font-medium ${
                    step.active ? 'text-brand-blue' : 
                    step.completed ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`mx-2 h-px w-8 sm:w-12 transition-colors ${
                  step.completed ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}