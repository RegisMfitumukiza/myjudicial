"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, ShieldCheck, Scale, Users, Landmark, Wallet, ShieldAlert, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePublicStats } from "@/lib/api/landing";

export default function AboutPage() {
  const t = useTranslations("about");
  const { data: stats } = usePublicStats();

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-brand-dark/[.06] to-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-5 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 bg-brand-dark/5 dark:border-white/10 dark:bg-white/5 px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
              {t("hero.badge")}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.18] sm:leading-[1.14] text-balance">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 sm:mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {stats && (
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 border-t border-border pt-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{stats.verifiedExperts.toLocaleString()}+</p>
                <p className="text-sm text-muted-foreground">{t("hero.stats.verifiedExperts")}</p>
              </div>
              <div className="hidden h-12 w-px bg-border sm:block" />
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{stats.completedConsultations.toLocaleString()}+</p>
                <p className="text-sm text-muted-foreground">{t("hero.stats.completedConsultations")}</p>
              </div>
              <div className="hidden h-12 w-px bg-border sm:block" />
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{stats.totalClients.toLocaleString()}+</p>
                <p className="text-sm text-muted-foreground">{t("hero.stats.totalClients")}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Mission & Vision ────────────────────────────────────────── */}
      <section id="mission" className="bg-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t("mission.title")}</h2>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground">
                {t("mission.text")}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t("mission.visionTitle")}</h2>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground">
                {t("mission.visionText")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Story ──────────────────────────────────────────────── */}
      <section className="bg-muted/20 py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("story.title")}</h2>
          <div className="mt-6 space-y-4 text-base sm:text-lg leading-relaxed text-muted-foreground">
            <p>{t("story.text1")}</p>
            <p>{t("story.text2")}</p>
          </div>
        </div>
      </section>

      {/* ── Core Values ─────────────────────────────────────────────── */}
      <section className="bg-card py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            {t("values.title")}
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("values.access.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t("values.access.text")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Scale size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("values.transparency.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t("values.transparency.text")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("values.trust.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t("values.trust.text")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Institutional Ecosystem & Partners (Integrated) ──────────── */}
      <section id="ecosystem" className="bg-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
              {t("ecosystem.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("ecosystem.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("ecosystem.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Landmark size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("ecosystem.legal.title")}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("ecosystem.legal.desc")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-7 shadow-sm">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Wallet size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("ecosystem.financial.title")}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("ecosystem.financial.desc")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-7 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Building2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("ecosystem.regulatory.title")}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("ecosystem.regulatory.desc")}
              </p>
            </div>
          </div>

          {/* Institutional Inquiries Link */}
          <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-foreground">{t("ecosystem.partnerCta")}</h4>
              <p className="text-sm text-muted-foreground mt-0.5">{t("ecosystem.partnerCtaDesc")}</p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-5 py-2.5 text-xs font-bold text-on-brand shadow-sm transition hover:opacity-90 shrink-0"
            >
              <span>{t("cta.joinLawyer")}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Regulatory Notice / Bar Disclaimer Banner ─────────────────── */}
      <section className="bg-muted/40 py-10 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3.5 rounded-xl border border-border/80 bg-background p-4 sm:p-5 shadow-xs">
            <ShieldAlert size={20} className="text-brand-dark dark:text-brand-gold shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {t("disclaimer.title")}
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {t("disclaimer.text")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final Action CTA ────────────────────────────────────────── */}
      <section className="bg-brand-dark py-16 sm:py-24 text-on-brand">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-brand sm:text-4xl">{t("cta.title")}</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand-dark shadow-lg transition hover:bg-white/90"
            >
              {t("cta.findLawyer")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/sign-up?role=EXPERT"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-sm font-bold text-on-brand transition hover:bg-white/10"
            >
              {t("cta.joinLawyer")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
