"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, Check, ShieldCheck, CreditCard, Lock, Scale } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PricingPage() {
  const t = useTranslations("pricingPage");

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-dark/[.06] to-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-5 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 bg-brand-dark/5 px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-dark/70">
              {t("hero.badge")}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.18] sm:leading-[1.14] text-balance">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 sm:mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground sm:text-3xl">
            {t("howItWorks.title")}
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10">
                <Scale size={24} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("howItWorks.points.fixedFees.title")}</h3>
              <p className="mt-2 text-muted-foreground">{t("howItWorks.points.fixedFees.text")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10">
                <CreditCard size={24} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("howItWorks.points.platformFee.title")}</h3>
              <p className="mt-2 text-muted-foreground">{t("howItWorks.points.platformFee.text")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10">
                <ShieldCheck size={24} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("howItWorks.points.escrow.title")}</h3>
              <p className="mt-2 text-muted-foreground">{t("howItWorks.points.escrow.text")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Tier 1: Free */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-8 shadow-sm">
              <h3 className="text-lg font-bold text-foreground">{t("tiers.free.name")}</h3>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold text-foreground">
                {t("tiers.free.price")}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t("tiers.free.desc")}</p>
              <ul className="mb-8 mt-8 flex-1 space-y-4">
                {t.raw("tiers.free.features").map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check size={18} className="shrink-0 text-brand-dark" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/search"
                className="block w-full rounded-xl border-2 border-brand-dark px-4 py-3 text-center text-sm font-bold text-brand-dark transition hover:bg-brand-dark hover:text-on-brand"
              >
                {t("tiers.free.cta")}
              </Link>
            </div>

            {/* Tier 2: Consultation (Highlighted) */}
            <div className="relative flex flex-col rounded-3xl border-2 border-brand-dark bg-brand-dark p-8 shadow-xl">
              <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-green-500 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                Most Popular
              </div>
              <h3 className="text-lg font-bold text-on-brand">{t("tiers.consultation.name")}</h3>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold text-white">
                {t("tiers.consultation.price")}
              </div>
              <p className="mt-2 text-sm text-on-brand/70">{t("tiers.consultation.desc")}</p>
              <ul className="mb-8 mt-8 flex-1 space-y-4">
                {t.raw("tiers.consultation.features").map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check size={18} className="shrink-0 text-green-400" />
                    <span className="text-sm text-white">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/search"
                className="block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-brand-dark transition hover:bg-white/90"
              >
                {t("tiers.consultation.cta")}
              </Link>
            </div>

            {/* Tier 3: Lawyer */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-8 shadow-sm">
              <h3 className="text-lg font-bold text-foreground">{t("tiers.lawyer.name")}</h3>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold text-foreground">
                {t("tiers.lawyer.price")}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t("tiers.lawyer.desc")}</p>
              <ul className="mb-8 mt-8 flex-1 space-y-4">
                {t.raw("tiers.lawyer.features").map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check size={18} className="shrink-0 text-brand-dark" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="block w-full rounded-xl border-2 border-brand-dark px-4 py-3 text-center text-sm font-bold text-brand-dark transition hover:bg-brand-dark hover:text-on-brand"
              >
                {t("tiers.lawyer.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Escrow Explanation */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Lock size={32} className="text-green-600" />
          </div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
              {t("escrow.badge")}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("escrow.title")}</h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t("escrow.text")}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-brand sm:text-4xl">{t("cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-on-brand/70">{t("cta.subtitle")}</p>
          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand-dark shadow-lg transition hover:bg-white/90"
            >
              {t("cta.button")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
