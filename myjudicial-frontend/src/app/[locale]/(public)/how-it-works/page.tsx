"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, Search, FileText, CalendarCheck, Shield, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

export default function HowItWorksPage() {
  const t = useTranslations("howItWorksPage");

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

      {/* Steps */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-bold text-foreground sm:text-3xl">
            {t("steps.title")}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10">
                <Search size={24} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("steps.step1.title")}</h3>
              <p className="mt-2 text-muted-foreground">{t("steps.step1.text")}</p>
            </div>
            <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10">
                <FileText size={24} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("steps.step2.title")}</h3>
              <p className="mt-2 text-muted-foreground">{t("steps.step2.text")}</p>
            </div>
            <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10">
                <CalendarCheck size={24} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("steps.step3.title")}</h3>
              <p className="mt-2 text-muted-foreground">{t("steps.step3.text")}</p>
            </div>
            <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10">
                <Shield size={24} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("steps.step4.title")}</h3>
              <p className="mt-2 text-muted-foreground">{t("steps.step4.text")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Security */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <Lock size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("payment.title")}</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {t("payment.text")}
          </p>
          <p className="mt-6 text-sm font-semibold text-brand-dark">
            {t("payment.momo")}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-brand sm:text-4xl">{t("cta.title")}</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand-dark shadow-lg transition hover:bg-white/90"
            >
              {t("cta.startNow")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-sm font-bold text-on-brand transition hover:bg-white/10"
            >
              {t("cta.contactSupport")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
