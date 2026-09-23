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
  HelpCircle,
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
      {/* ── 1. Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[0.04] via-background to-background py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-dark/15 bg-brand-dark/5 dark:border-white/15 dark:bg-white/5 px-3.5 py-1 text-xs font-semibold text-brand-dark dark:text-brand-gold">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark dark:bg-white px-6 py-3 text-sm font-bold text-on-brand dark:text-brand-dark shadow-md transition-all hover:opacity-95 hover:shadow-lg"
            >
              {t("cta.button")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent"
            >
              {t("cta.secondary")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Pricing Pillars ──────────────────────────────────────── */}
      <section className="py-16 sm:py-20 border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
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
            <div className="flex flex-col rounded-2xl border border-border bg-background p-6 sm:p-7 shadow-sm transition-all hover:border-brand-dark/30 hover:shadow-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
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
            <div className="flex flex-col rounded-2xl border border-border bg-background p-6 sm:p-7 shadow-sm transition-all hover:border-brand-dark/30 hover:shadow-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <CreditCard size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("pillars.transparentPlatformFee.title")}
              </h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("pillars.transparentPlatformFee.desc")}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col rounded-2xl border border-border bg-background p-6 sm:p-7 shadow-sm transition-all hover:border-brand-dark/30 hover:shadow-md sm:col-span-2 lg:col-span-1">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
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

      {/* ── 3. What You See Before You Book (Pre-Commitment Transparency) ── */}
      <section className="py-16 sm:py-20 border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
              {t("beforeBooking.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("beforeBooking.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("beforeBooking.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Item 1 */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-brand-dark/30">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <BadgeCheck size={22} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t("beforeBooking.item1.title")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("beforeBooking.item1.desc")}
              </p>
            </div>

            {/* Item 2 */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-brand-dark/30">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Clock size={22} />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t("beforeBooking.item2.title")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("beforeBooking.item2.desc")}
              </p>
            </div>

            {/* Item 3 */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-brand-dark/30">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Banknote size={22} />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t("beforeBooking.item3.title")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("beforeBooking.item3.desc")}
              </p>
            </div>

            {/* Item 4 */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-brand-dark/30">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <CalendarCheck size={22} />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {t("beforeBooking.item4.title")}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("beforeBooking.item4.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Escrow Security Pipeline ─────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <Lock size={12} />
              <span>{t("escrowPipeline.badge")}</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("escrowPipeline.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("escrowPipeline.subtitle")}
            </p>
          </div>

          {/* 4 Step Timeline */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((stepNum) => {
              const stepKey = `step${stepNum}` as "step1" | "step2" | "step3" | "step4";
              return (
                <div
                  key={stepNum}
                  className="relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark text-on-brand dark:bg-white dark:text-brand-dark text-xs font-bold">
                      {t(`escrowPipeline.${stepKey}.step`)}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Stage {stepNum}
                    </span>
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

          {/* Money Back Guarantee Banner */}
          <div className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                {t("escrowPipeline.guaranteeBadge")}
              </h4>
              <p className="mt-0.5 text-xs sm:text-sm text-emerald-700/90 dark:text-emerald-400/90 leading-relaxed">
                {t("escrowPipeline.guaranteeText")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Typical Market Benchmarks ────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
              {t("benchmarks.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("benchmarks.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("benchmarks.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((itemNum) => {
              const itemKey = `item${itemNum}` as "item1" | "item2" | "item3";
              const isPopular = itemNum === 2;

              return (
                <div
                  key={itemNum}
                  className={`relative flex flex-col rounded-3xl p-6 sm:p-8 transition-all ${
                    isPopular
                      ? "border-2 border-brand-dark bg-card shadow-xl dark:border-brand-gold/60"
                      : "border border-border bg-background shadow-sm hover:border-border/80"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-dark dark:bg-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-brand dark:text-brand-dark">
                      Recommended
                    </span>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-2">
                    <Clock size={14} />
                    <span>{t(`benchmarks.${itemKey}.duration`)}</span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">
                    {t(`benchmarks.${itemKey}.title`)}
                  </h3>

                  <div className="mt-4 mb-3">
                    <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                      {t(`benchmarks.${itemKey}.range`)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                    {t(`benchmarks.${itemKey}.desc`)}
                  </p>

                  <div className="mt-auto border-t border-border pt-5 space-y-2.5 mb-6">
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground">
                      <Check size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{t(`benchmarks.${itemKey}.feature1`)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground">
                      <Check size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{t(`benchmarks.${itemKey}.feature2`)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground">
                      <Check size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{t(`benchmarks.${itemKey}.feature3`)}</span>
                    </div>
                  </div>

                  <Link
                    href="/search"
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
                      isPopular
                        ? "bg-brand-dark text-on-brand dark:bg-white dark:text-brand-dark hover:opacity-90"
                        : "border border-border bg-card text-foreground hover:bg-accent"
                    }`}
                  >
                    <span>{t("cta.button")}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. Comparison: Traditional vs MyJudicial ────────────────── */}
      <section className="py-16 sm:py-24 border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
              {t("comparison.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("comparison.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("comparison.subtitle")}
            </p>
          </div>

          {/* Responsive Comparison (Desktop Table + Mobile Cards) */}
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
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-brand-dark dark:text-brand-gold w-3/8 bg-brand-dark/5 dark:bg-white/5">
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
                            <X size={16} className="text-rose-500 shrink-0" />
                            <span>{t(`comparison.${rowKey}.traditional`)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-foreground font-medium bg-brand-dark/[0.02] dark:bg-white/[0.02]">
                          <div className="flex items-center gap-2.5">
                            <Check size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
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
                      <X size={15} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-foreground/70">
                          {t("comparison.traditionalHeader")}:
                        </span>
                        <span>{t(`comparison.${rowKey}.traditional`)}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-foreground bg-brand-dark/5 dark:bg-white/5 p-3 rounded-xl">
                      <Check size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-brand-dark dark:text-brand-gold">
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
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
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
                  className="rounded-2xl border border-border bg-background overflow-hidden transition-colors"
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
                        isOpen ? "rotate-180" : ""
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

      {/* ── 8. Bottom CTA ───────────────────────────────────────────── */}
      <section className="bg-brand-dark py-16 sm:py-20 text-on-brand">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-on-brand/80 leading-relaxed">
            {t("cta.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-brand-dark shadow-lg transition hover:bg-white/90"
            >
              {t("cta.button")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-7 py-3 text-sm font-semibold text-on-brand transition hover:bg-white/10"
            >
              {t("cta.secondary")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
