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
  FileText,
  Coins,
  Receipt,
  Sparkles,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function PricingClient() {
  const t = useTranslations("pricingPage");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── 1. Hero Section & Trust Rails ────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[0.04] via-background to-background py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Exactly ONE Unified Platform Hero Badge per platform design system */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-xs">
            <ShieldCheck size={14} className="text-brand-dark dark:text-white shrink-0" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-6 py-3 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
            >
              {t("cta.button")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-accent px-6 py-3 text-sm font-semibold text-foreground transition-all shadow-2xs"
            >
              {t("cta.secondary")}
            </Link>
          </div>

          {/* Authentic Payment Rails & Trust Badges Strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-6 border-t border-border/60 pt-8 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 shadow-xs">
              <Smartphone size={15} className="text-amber-500 shrink-0" />
              <span>{t("hero.trustBadges.momo")}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 shadow-xs">
              <Smartphone size={15} className="text-rose-500 shrink-0" />
              <span>{t("hero.trustBadges.airtel")}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 shadow-xs">
              <CreditCard size={15} className="text-blue-500 shrink-0" />
              <span>{t("hero.trustBadges.cards")}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 shadow-xs">
              <Scale size={15} className="text-emerald-500 shrink-0" />
              <span>{t("hero.trustBadges.bar")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Pricing Pillars (Core Financial Guarantees) ───────────── */}
      <section className="py-16 sm:py-20 border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {t("pillars.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("pillars.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("pillars.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Pillar 1 */}
            <div className="flex flex-col rounded-2xl border border-border bg-background p-6 sm:p-7 shadow-xs transition-all hover:border-border/80 hover:shadow-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-foreground">
                <Scale size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("pillars.advocateRates.title")}
              </h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("pillars.advocateRates.desc")}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col rounded-2xl border border-border bg-background p-6 sm:p-7 shadow-xs transition-all hover:border-border/80 hover:shadow-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-foreground">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("pillars.transparentPlatformFee.title")}
              </h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("pillars.transparentPlatformFee.desc")}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col rounded-2xl border border-border bg-background p-6 sm:p-7 shadow-xs transition-all hover:border-border/80 hover:shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-foreground">
                <Banknote size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("pillars.noRetainers.title")}
              </h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("pillars.noRetainers.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. What You See Before You Book (Open Editorial Layout + Booking Card) ─── */}
      <section className="py-16 sm:py-24 border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left 7 cols: Open Editorial Feature List (Spacious & Breathable) */}
            <div className="lg:col-span-7">
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
                {t("beforeBooking.badge")}
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {t("beforeBooking.title")}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                {t("beforeBooking.subtitle")}
              </p>

              {/* Unboxed, Generously Spaced Feature Breakdown */}
              <div className="mt-10 space-y-7">
                {/* Feature 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                    <BadgeCheck size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {t("beforeBooking.item1.title")}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-lg">
                      {t("beforeBooking.item1.desc")}
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                    <Clock size={20} className="text-brand-dark dark:text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {t("beforeBooking.item2.title")}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-lg">
                      {t("beforeBooking.item2.desc")}
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                    <Banknote size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {t("beforeBooking.item3.title")}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-lg">
                      {t("beforeBooking.item3.desc")}
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                    <CalendarCheck size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {t("beforeBooking.item4.title")}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-lg">
                      {t("beforeBooking.item4.desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Authentic Pre-Booking Card Mockup */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border-2 border-border/80 bg-card p-6 shadow-xl transition-all">
                {/* Header: Verified Advocate Badge */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground font-bold">
                      JH
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-foreground">
                          {t("beforeBooking.mockup.lawyerName")}
                        </h4>
                        <BadgeCheck size={14} className="text-brand-dark dark:text-white" />
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {t("beforeBooking.mockup.barRoll")}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Live
                  </span>
                </div>

                {/* Pre-Booking Transparency Fields */}
                <div className="mt-5 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-semibold text-foreground">
                      {t("beforeBooking.mockup.service")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Format</span>
                    <span className="font-semibold text-foreground">
                      {t("beforeBooking.mockup.duration")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Appointment</span>
                    <span className="font-semibold text-foreground">
                      {t("beforeBooking.mockup.date")}
                    </span>
                  </div>
                </div>

                {/* Pricing Box with Escrow Badge */}
                <div className="mt-6 rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
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
      <section className="py-16 sm:py-24 border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {t("escrowPipeline.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("escrowPipeline.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("escrowPipeline.subtitle")}
            </p>
          </div>

          {/* 4 Connected Stages with Desktop Track Line */}
          <div className="relative">
            <div className="hidden lg:block absolute top-12 left-10 right-10 h-0.5 bg-border -z-0" />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
              {[1, 2, 3, 4].map((stepNum) => {
                const stepKey = `step${stepNum}` as "step1" | "step2" | "step3" | "step4";
                return (
                  <div
                    key={stepNum}
                    className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-border/90"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-foreground font-mono">
                        {t(`escrowPipeline.${stepKey}.step`)}
                      </span>
                      {stepNum === 4 ? (
                        <span className="flex h-7 px-2.5 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          100% Secure
                        </span>
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-border" />
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      {t(`escrowPipeline.${stepKey}.title`)}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {t(`escrowPipeline.${stepKey}.desc`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 100% Money-Back Guarantee Banner */}
          <div className="mt-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8 text-center max-w-3xl mx-auto shadow-xs">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3">
              <ShieldCheck size={15} />
              <span>{t("escrowPipeline.guaranteeBadge")}</span>
            </div>
            <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
              {t("escrowPipeline.guaranteeText")}
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. Radical Fee Transparency: Platform Economics ─────────── */}
      <section className="py-16 sm:py-24 border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {t("platformEconomics.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("platformEconomics.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("platformEconomics.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Client 0% Fees */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-foreground">
                <Coins size={22} className="text-emerald-500" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t("platformEconomics.clientZeroFees.title")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("platformEconomics.clientZeroFees.desc")}
              </p>
            </div>

            {/* 2. Platform Support */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-foreground">
                <Sparkles size={22} className="text-brand-dark dark:text-white" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t("platformEconomics.modestCommission.title")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("platformEconomics.modestCommission.desc")}
              </p>
            </div>

            {/* 3. Official Receipts */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs sm:col-span-2 lg:col-span-1">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-foreground">
                <Receipt size={22} className="text-blue-500" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t("platformEconomics.instantReceipts.title")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("platformEconomics.instantReceipts.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Comparison: Traditional vs MyJudicial ────────────────── */}
      <section className="py-16 sm:py-24 border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {t("comparison.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("comparison.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
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
                  <div key={rowNum} className="p-5 space-y-3">
                    <h4 className="text-sm font-bold text-foreground">
                      {t(`comparison.${rowKey}.feature`)}
                    </h4>
                    <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mt-0.5">
                        <X size={12} />
                      </span>
                      <div>
                        <span className="font-semibold block text-foreground/70">
                          {t("comparison.traditionalHeader")}:
                        </span>
                        <span>{t(`comparison.${rowKey}.traditional`)}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-foreground bg-accent/40 p-3 rounded-xl border border-border">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mt-0.5">
                        <Check size={12} />
                      </span>
                      <div>
                        <span className="font-bold block text-foreground">
                          {t("comparison.myjudicialHeader")}:
                        </span>
                        <span>{t(`comparison.${rowKey}.myjudicial`)}</span>
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
      <section className="py-16 sm:py-24 border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {t("faqs.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("faqs.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("faqs.subtitle")}
            </p>
          </div>

          <div className="space-y-3">
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
                    className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-foreground focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="pr-4">{t(`faqs.${qKey}`)}</span>
                    <ChevronDown
                      size={18}
                      className={`text-muted-foreground transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-foreground" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                      {t(`faqs.${aKey}`)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 8. Bottom CTA (Elevated Surface - Harmonizes with Footer) ── */}
      <section className="relative overflow-hidden border-t border-border bg-gradient-to-b from-card/80 to-background py-16 sm:py-20 text-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("cta.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-7 py-3 text-sm font-bold shadow-md transition-all active:scale-[0.98]"
            >
              {t("cta.button")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-accent px-7 py-3 text-sm font-semibold text-foreground transition shadow-2xs"
            >
              {t("cta.secondary")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
