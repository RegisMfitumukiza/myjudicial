"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Lock,
  Scale,
  Check,
  X,
  ChevronDown,
  Clock,
  Banknote,
  CalendarCheck,
  BadgeCheck,
  Smartphone,
  CheckCircle2,
  Coins,
  Receipt,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlatformSettings } from "@/lib/api/settings";

export default function PricingClient() {
  const t = useTranslations("pricingPage");
  const { settings } = usePlatformSettings();
  const feePercent = settings.platformFeePercent ?? 15;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── 1. Hero Section & Trust Rails ────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[0.04] via-background to-background py-12 min-[360px]:py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-3 min-[360px]:px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Exactly ONE Unified Platform Hero Badge per platform design system */}
            <div className="mb-3.5 sm:mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 min-[360px]:px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <ShieldCheck size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span className="truncate">{t("hero.badge")}</span>
            </div>

            <h1 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.16] sm:leading-[1.12] text-balance break-words">
              {t("hero.title")}
            </h1>

            <p className="mx-auto mt-3.5 sm:mt-4 max-w-2xl text-xs min-[360px]:text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-balance break-words">
              {t("hero.subtitle")}
            </p>

            {/* Action CTAs */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none mx-auto">
              <Link
                href="/search"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-6 py-3 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
              >
                {t("hero.findLawyer")} <ArrowRight size={16} />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-1.5 py-2 sm:py-3 px-3 sm:px-5 sm:rounded-xl sm:border sm:border-border sm:bg-card sm:hover:bg-accent text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-all shadow-2xs group"
              >
                <span>{t("hero.howItWorks")}</span>
                <ArrowRight size={14} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Authentic Payment Rails & Trust Badges Strip */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 min-[340px]:grid-cols-2 min-[540px]:flex min-[540px]:flex-wrap items-center justify-center gap-2 min-[360px]:gap-3 sm:gap-6 border-t border-border/60 pt-5 sm:pt-8 text-[11px] min-[360px]:text-xs font-semibold text-muted-foreground">
            <div className="flex items-center justify-center gap-1.5 min-[360px]:gap-2 rounded-xl border border-border bg-card px-2.5 min-[360px]:px-3.5 py-2 shadow-xs">
              <Smartphone size={14} className="text-foreground shrink-0" />
              <span>{t("hero.trustBadges.momo")}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 min-[360px]:gap-2 rounded-xl border border-border bg-card px-2.5 min-[360px]:px-3.5 py-2 shadow-xs">
              <Smartphone size={14} className="text-foreground shrink-0" />
              <span>{t("hero.trustBadges.airtel")}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 min-[360px]:gap-2 rounded-xl border border-border bg-card px-2.5 min-[360px]:px-3.5 py-2 shadow-xs">
              <CreditCard size={14} className="text-foreground shrink-0" />
              <span>{t("hero.trustBadges.cards")}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 min-[360px]:gap-2 rounded-xl border border-border bg-card px-2.5 min-[360px]:px-3.5 py-2 shadow-xs">
              <Scale size={14} className="text-foreground shrink-0" />
              <span>{t("hero.trustBadges.bar")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Pricing Pillars (Core Financial Guarantees) ───────────── */}
      <section className="py-12 min-[360px]:py-16 sm:py-20 border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <Scale size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span>{t("pillars.badge")}</span>
            </div>
            <h2 className="mt-2 text-xl min-[360px]:text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("pillars.title")}
            </h2>
            <p className="mt-2.5 sm:mt-3 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground">
              {t("pillars.subtitle")}
            </p>
          </div>

          <div className="grid gap-4 min-[360px]:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pillar 1 */}
            <div className="flex flex-col rounded-2xl border border-border bg-background p-4 min-[360px]:p-6 sm:p-7 shadow-xs transition-all hover:border-border/80 hover:shadow-sm">
              <div className="mb-4 sm:mb-5 flex h-10 w-10 min-[360px]:h-12 min-[360px]:w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Scale size={22} className="min-[360px]:hidden" />
                <Scale size={24} className="hidden min-[360px]:block" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("pillars.advocateRates.title")}
              </h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("pillars.advocateRates.desc")}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col rounded-2xl border border-border bg-background p-4 min-[360px]:p-6 sm:p-7 shadow-xs transition-all hover:border-border/80 hover:shadow-sm">
              <div className="mb-4 sm:mb-5 flex h-10 w-10 min-[360px]:h-12 min-[360px]:w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <CheckCircle2 size={22} className="min-[360px]:hidden" />
                <CheckCircle2 size={24} className="hidden min-[360px]:block" />
              </div>
              <h3 className="text-base min-[360px]:text-lg font-bold text-foreground">
                {t("pillars.transparentPlatformFee.title")}
              </h3>
              <p className="mt-2 min-[360px]:mt-2.5 text-xs min-[360px]:text-sm text-muted-foreground leading-relaxed">
                {t("pillars.transparentPlatformFee.desc")}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col rounded-2xl border border-border bg-background p-4 min-[360px]:p-6 sm:p-7 shadow-xs transition-all hover:border-border/80 hover:shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="mb-4 sm:mb-5 flex h-10 w-10 min-[360px]:h-12 min-[360px]:w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Banknote size={22} className="min-[360px]:hidden" />
                <Banknote size={24} className="hidden min-[360px]:block" />
              </div>
              <h3 className="text-base min-[360px]:text-lg font-bold text-foreground">
                {t("pillars.noRetainers.title")}
              </h3>
              <p className="mt-2 min-[360px]:mt-2.5 text-xs min-[360px]:text-sm text-muted-foreground leading-relaxed">
                {t("pillars.noRetainers.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. What You See Before You Book (Open Editorial Layout + Booking Card) ─── */}
      <section className="py-12 min-[360px]:py-16 sm:py-24 border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            {/* Left 7 cols: Open Editorial Feature List (Spacious & Breathable) */}
            <div className="lg:col-span-7">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold text-foreground shadow-2xs">
                <CheckCircle2 size={14} className="text-brand-dark dark:text-white shrink-0" />
                <span>{t("beforeBooking.badge")}</span>
              </div>
              <h2 className="mt-2 text-xl min-[360px]:text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t("beforeBooking.title")}
              </h2>
              <p className="mt-2.5 sm:mt-3 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                {t("beforeBooking.subtitle")}
              </p>

              {/* Unboxed, Generously Spaced Feature Breakdown */}
              <div className="mt-8 sm:mt-10 space-y-6 sm:space-y-7">
                {/* Feature 1 */}
                <div className="flex items-start gap-3 min-[360px]:gap-4">
                  <div className="flex h-9 w-9 min-[360px]:h-11 min-[360px]:w-11 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                    <BadgeCheck size={18} className="min-[360px]:hidden" />
                    <BadgeCheck size={20} className="hidden min-[360px]:block" />
                  </div>
                  <div>
                    <h3 className="text-sm min-[360px]:text-base font-bold text-foreground">
                      {t("beforeBooking.item1.title")}
                    </h3>
                    <p className="mt-1 text-xs min-[360px]:text-sm text-muted-foreground leading-relaxed max-w-lg">
                      {t("beforeBooking.item1.desc")}
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-3 min-[360px]:gap-4">
                  <div className="flex h-9 w-9 min-[360px]:h-11 min-[360px]:w-11 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                    <Clock size={18} className="min-[360px]:hidden" />
                    <Clock size={20} className="hidden min-[360px]:block" />
                  </div>
                  <div>
                    <h3 className="text-sm min-[360px]:text-base font-bold text-foreground">
                      {t("beforeBooking.item2.title")}
                    </h3>
                    <p className="mt-1 text-xs min-[360px]:text-sm text-muted-foreground leading-relaxed max-w-lg">
                      {t("beforeBooking.item2.desc")}
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-3 min-[360px]:gap-4">
                  <div className="flex h-9 w-9 min-[360px]:h-11 min-[360px]:w-11 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                    <Banknote size={18} className="min-[360px]:hidden" />
                    <Banknote size={20} className="hidden min-[360px]:block" />
                  </div>
                  <div>
                    <h3 className="text-sm min-[360px]:text-base font-bold text-foreground">
                      {t("beforeBooking.item3.title")}
                    </h3>
                    <p className="mt-1 text-xs min-[360px]:text-sm text-muted-foreground leading-relaxed max-w-lg">
                      {t("beforeBooking.item3.desc")}
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="flex items-start gap-3 min-[360px]:gap-4">
                  <div className="flex h-9 w-9 min-[360px]:h-11 min-[360px]:w-11 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                    <CalendarCheck size={18} className="min-[360px]:hidden" />
                    <CalendarCheck size={20} className="hidden min-[360px]:block" />
                  </div>
                  <div>
                    <h3 className="text-sm min-[360px]:text-base font-bold text-foreground">
                      {t("beforeBooking.item4.title")}
                    </h3>
                    <p className="mt-1 text-xs min-[360px]:text-sm text-muted-foreground leading-relaxed max-w-lg">
                      {t("beforeBooking.item4.desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Authentic Pre-Booking Card Mockup */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border-2 border-border/80 bg-card p-4 min-[360px]:p-6 shadow-xl transition-all">
                {/* Header: Verified Advocate Badge */}
                <div className="flex items-start justify-between border-b border-border pb-3.5 sm:pb-4 gap-2">
                  <div className="flex items-center gap-2.5 min-[360px]:gap-3 min-w-0">
                    <div className="flex h-9 w-9 min-[360px]:h-11 min-[360px]:w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground font-bold text-xs min-[360px]:text-sm">
                      JH
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs min-[360px]:text-sm font-bold text-foreground truncate">
                          {t("beforeBooking.mockup.lawyerName")}
                        </h4>
                        <BadgeCheck size={14} className="text-brand-dark dark:text-white shrink-0" />
                      </div>
                      <span className="text-[10px] min-[360px]:text-[11px] font-mono text-muted-foreground block truncate">
                        {t("beforeBooking.mockup.barRoll")}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 min-[360px]:px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Live
                  </span>
                </div>

                {/* Pre-Booking Transparency Fields */}
                <div className="mt-5 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Service</span>
                    <span className="font-semibold text-foreground text-right">
                      {t("beforeBooking.mockup.service")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Format</span>
                    <span className="font-semibold text-foreground text-right">
                      {t("beforeBooking.mockup.duration")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Appointment</span>
                    <span className="font-semibold text-foreground text-right">
                      {t("beforeBooking.mockup.date")}
                    </span>
                  </div>
                </div>

                {/* Pricing Box with Escrow Badge */}
                <div className="mt-6 rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-medium">
                        {t("beforeBooking.mockup.feeLabel")}
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                        {t("beforeBooking.mockup.feeValue")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-accent/60 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-2xs">
                      <Lock size={12} className="text-foreground shrink-0" />
                      <span>{t("beforeBooking.mockup.escrowProtected")}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <div className="mt-5">
                  <button
                    disabled
                    aria-label="Example booking button"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-foreground text-background py-3 text-xs sm:text-sm font-bold shadow-sm opacity-90 cursor-default"
                  >
                    <Smartphone size={16} />
                    <span>{t("beforeBooking.mockup.cta")}</span>
                  </button>
                  <p className="mt-2.5 text-center text-[11px] text-muted-foreground font-medium">
                    {t("beforeBooking.mockup.zeroSurcharge")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. The 4-Stage Escrow Protection Lifecycle ───────────────── */}
      <section className="py-12 min-[360px]:py-16 sm:py-24 border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <ShieldCheck size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span>{t("escrowPipeline.badge")}</span>
            </div>
            <h2 className="mt-2 text-xl min-[360px]:text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("escrowPipeline.title")}
            </h2>
            <p className="mt-2.5 sm:mt-3 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground">
              {t("escrowPipeline.subtitle")}
            </p>
          </div>

          {/* 4 Connected Stages with Desktop Track Line */}
          <div className="relative">
            <div className="hidden lg:block absolute top-12 left-10 right-10 h-0.5 bg-border -z-0" />

            <div className="grid gap-4 min-[360px]:gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
              {[1, 2, 3, 4].map((stepNum) => {
                const stepKey = `step${stepNum}` as "step1" | "step2" | "step3" | "step4";
                return (
                  <div
                    key={stepNum}
                    className="flex flex-col rounded-2xl border border-border bg-card p-4 min-[360px]:p-6 shadow-xs transition-all hover:border-border/90"
                  >
                    <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                      <span className="flex h-9 w-9 min-[360px]:h-10 min-[360px]:w-10 items-center justify-center rounded-xl bg-accent text-xs min-[360px]:text-sm font-bold text-foreground font-mono">
                        {t(`escrowPipeline.${stepKey}.step`)}
                      </span>
                      {stepNum === 4 ? (
                        <span className="flex h-6 min-[360px]:h-7 px-2 min-[360px]:px-2.5 items-center justify-center rounded-lg bg-emerald-500/10 text-[11px] min-[360px]:text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          100% Secure
                        </span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-border" />
                      )}
                    </div>
                    <h3 className="text-sm min-[360px]:text-base font-bold text-foreground">
                      {t(`escrowPipeline.${stepKey}.title`)}
                    </h3>
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {t(`escrowPipeline.${stepKey}.desc`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 100% Money-Back Guarantee Banner */}
          <div className="mt-8 sm:mt-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 min-[360px]:p-6 sm:p-8 text-center max-w-3xl mx-auto shadow-xs">
            <div className="inline-flex items-center gap-1.5 min-[360px]:gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 min-[360px]:px-3.5 py-1 text-[11px] min-[360px]:text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2.5 sm:mb-3">
              <ShieldCheck size={14} className="shrink-0" />
              <span>{t("escrowPipeline.guaranteeBadge")}</span>
            </div>
            <p className="text-xs min-[360px]:text-sm sm:text-base font-medium text-foreground leading-relaxed">
              {t("escrowPipeline.guaranteeText")}
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. Radical Fee Transparency: Platform Economics ─────────── */}
      <section className="py-12 min-[360px]:py-16 sm:py-24 border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <Coins size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span>{t("platformEconomics.badge")}</span>
            </div>
            <h2 className="mt-2 text-xl min-[360px]:text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("platformEconomics.title")}
            </h2>
            <p className="mt-2.5 sm:mt-3 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground">
              {t("platformEconomics.subtitle")}
            </p>
          </div>

          <div className="grid gap-4 min-[360px]:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Client 0% Fees */}
            <div className="rounded-2xl border border-border bg-card p-4 min-[360px]:p-6 sm:p-7 shadow-xs">
              <div className="mb-4 flex h-10 w-10 min-[360px]:h-11 min-[360px]:w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                <Coins size={20} className="min-[360px]:hidden" />
                <Coins size={22} className="hidden min-[360px]:block" />
              </div>
              <h3 className="text-sm min-[360px]:text-base font-bold text-foreground">
                {t("platformEconomics.clientZeroFees.title")}
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("platformEconomics.clientZeroFees.desc")}
              </p>
            </div>

            {/* 2. Platform Support */}
            <div className="rounded-2xl border border-border bg-card p-4 min-[360px]:p-6 sm:p-7 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 min-[360px]:h-11 min-[360px]:w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                  <Sparkles size={20} className="min-[360px]:hidden" />
                  <Sparkles size={22} className="hidden min-[360px]:block" />
                </div>
                <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-bold text-foreground font-mono">
                  {feePercent}%
                </span>
              </div>
              <h3 className="text-sm min-[360px]:text-base font-bold text-foreground">
                {t("platformEconomics.modestCommission.title")}
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("platformEconomics.modestCommission.desc")}
              </p>
            </div>

            {/* 3. Official Receipts */}
            <div className="rounded-2xl border border-border bg-card p-4 min-[360px]:p-6 sm:p-7 shadow-xs sm:col-span-2 lg:col-span-1">
              <div className="mb-4 flex h-10 w-10 min-[360px]:h-11 min-[360px]:w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                <Receipt size={20} className="min-[360px]:hidden" />
                <Receipt size={22} className="hidden min-[360px]:block" />
              </div>
              <h3 className="text-sm min-[360px]:text-base font-bold text-foreground">
                {t("platformEconomics.instantReceipts.title")}
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("platformEconomics.instantReceipts.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Comparison: Traditional vs MyJudicial ────────────────── */}
      <section className="py-12 min-[360px]:py-16 sm:py-24 border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <Scale size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span>{t("comparison.badge")}</span>
            </div>
            <h2 className="mt-2 text-xl min-[360px]:text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("comparison.title")}
            </h2>
            <p className="mt-2.5 sm:mt-3 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground">
              {t("comparison.subtitle")}
            </p>
          </div>

          {/* Responsive Comparison Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/4">
                      Feature
                    </th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground w-3/8">
                      {t("comparison.traditionalHeader")}
                    </th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-foreground w-3/8 bg-accent/40 border-l border-border">
                      {t("comparison.myjudicialHeader")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {[1, 2, 3, 4, 5].map((rowNum) => {
                    const rowKey = `row${rowNum}` as "row1" | "row2" | "row3" | "row4" | "row5";
                    return (
                      <tr key={rowNum} className="hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-6 font-semibold text-foreground">
                          {t(`comparison.${rowKey}.feature`)}
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                              <X size={13} />
                            </span>
                            <span>{t(`comparison.${rowKey}.traditional`)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-foreground font-medium bg-accent/[0.15] border-l border-border">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                              <Check size={13} />
                            </span>
                            <span>{t(`comparison.${rowKey}.myjudicial`)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="md:hidden divide-y divide-border">
              {[1, 2, 3, 4, 5].map((rowNum) => {
                const rowKey = `row${rowNum}` as "row1" | "row2" | "row3" | "row4" | "row5";
                return (
                  <div key={rowNum} className="p-3.5 min-[360px]:p-5 space-y-2.5 min-[360px]:space-y-3">
                    <h4 className="text-xs min-[360px]:text-sm font-bold text-foreground">
                      {t(`comparison.${rowKey}.feature`)}
                    </h4>
                    <div className="flex items-start gap-2 min-[360px]:gap-2.5 text-xs text-muted-foreground">
                      <span className="flex h-4 w-4 min-[360px]:h-5 min-[360px]:w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mt-0.5">
                        <X size={11} className="min-[360px]:hidden" />
                        <X size={12} className="hidden min-[360px]:block" />
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold block text-foreground/70">
                          {t("comparison.traditionalHeader")}:
                        </span>
                        <span className="break-words">{t(`comparison.${rowKey}.traditional`)}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 min-[360px]:gap-2.5 text-xs text-foreground bg-accent/40 p-2.5 min-[360px]:p-3 rounded-xl border border-border">
                      <span className="flex h-4 w-4 min-[360px]:h-5 min-[360px]:w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5">
                        <Check size={11} className="min-[360px]:hidden" />
                        <Check size={12} className="hidden min-[360px]:block" />
                      </span>
                      <div className="min-w-0">
                        <span className="font-bold block text-foreground">
                          {t("comparison.myjudicialHeader")}:
                        </span>
                        <span className="break-words">{t(`comparison.${rowKey}.myjudicial`)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Pricing FAQs Accordion (8 Practical Questions) ────────── */}
      <section className="py-12 min-[360px]:py-16 sm:py-24 border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <HelpCircle size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span>{t("faqs.badge")}</span>
            </div>
            <h2 className="mt-2 text-xl min-[360px]:text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("faqs.title")}
            </h2>
            <p className="mt-2.5 sm:mt-3 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground">
              {t("faqs.subtitle")}
            </p>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((faqNum) => {
              const qKey = `q${faqNum}` as "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8";
              const aKey = `a${faqNum}` as "a1" | "a2" | "a3" | "a4" | "a5" | "a6" | "a7" | "a8";
              const isOpen = openFaq === faqNum;

              return (
                <div
                  key={faqNum}
                  className={`rounded-2xl border transition-all ${
                    isOpen
                      ? "border-border bg-background shadow-xs ring-1 ring-border"
                      : "border-border bg-background hover:border-border/80"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faqNum)}
                    className="w-full flex items-center justify-between p-3.5 min-[360px]:p-5 text-left text-xs min-[360px]:text-sm sm:text-base font-semibold text-foreground focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="pr-3 min-[360px]:pr-4">{t(`faqs.${qKey}`)}</span>
                    <ChevronDown
                      size={18}
                      className={`text-muted-foreground transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-foreground" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-3.5 min-[360px]:px-5 pb-3.5 min-[360px]:pb-5 text-xs min-[360px]:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                      {t(`faqs.${aKey}`)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
