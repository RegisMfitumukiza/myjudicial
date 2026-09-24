"use client";

import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  ShieldCheck,
  Scale,
  Users,
  Landmark,
  Wallet,
  ShieldAlert,
  Building2,
  Target,
  Compass,
  Lock,
  MapPin,
  Languages,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePublicStats } from "@/lib/api/landing";

export default function AboutClient() {
  const t = useTranslations("about");
  const { data: stats } = usePublicStats();

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-brand-dark/[.06] to-background py-16 sm:py-20 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-5 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 bg-brand-dark/5 dark:border-white/10 dark:bg-white/5 px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
              {t("hero.badge")}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.18] sm:leading-[1.14] text-balance">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 sm:mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
            {t("hero.subtitle")}
          </p>

          {/* Institutional Trust Pillars */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 pt-8 border-t border-border">
            <div className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-2xs">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <ShieldCheck size={18} />
              </div>
              <p className="text-sm font-bold text-foreground sm:text-base">
                {stats && stats.verifiedExperts > 0
                  ? `${stats.verifiedExperts}+ Advocates`
                  : t("hero.stats.barCertified")}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("hero.stats.barCertifiedDesc")}</p>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-2xs">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Lock size={18} />
              </div>
              <p className="text-sm font-bold text-foreground sm:text-base">{t("hero.stats.escrowProtected")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("hero.stats.escrowProtectedDesc")}</p>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-2xs">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <MapPin size={18} />
              </div>
              <p className="text-sm font-bold text-foreground sm:text-base">{t("hero.stats.nationwide")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("hero.stats.nationwideDesc")}</p>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-4 text-center shadow-2xs">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Languages size={18} />
              </div>
              <p className="text-sm font-bold text-foreground sm:text-base">{t("hero.stats.languages")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("hero.stats.languagesDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ────────────────────────────────────────── */}
      <section id="mission" className="bg-background py-16 sm:py-20 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-7 sm:p-8 shadow-xs relative overflow-hidden">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Target size={22} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t("mission.title")}</h2>
              <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-muted-foreground">
                {t("mission.text")}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-7 sm:p-8 shadow-xs relative overflow-hidden">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Compass size={22} />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t("mission.visionTitle")}</h2>
              <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-muted-foreground">
                {t("mission.visionText")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Story (Challenge & Digital Infrastructure) ───────────── */}
      <section className="bg-muted/20 py-16 sm:py-20 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("story.title")}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground">
              {t("story.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* The Legal Challenge */}
            <div className="rounded-2xl border border-border bg-background p-6 sm:p-7 shadow-xs">
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <span>{t("story.challengeTitle")}</span>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                {t("story.text1")}
              </p>
            </div>

            {/* The Digital Infrastructure */}
            <div className="rounded-2xl border border-border bg-background p-6 sm:p-7 shadow-xs">
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>{t("story.solutionTitle")}</span>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                {t("story.text2")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Values ─────────────────────────────────────────────── */}
      <section className="bg-background py-16 sm:py-20 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("values.title")}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Users size={20} />
              </div>
              <h3 className="text-base font-bold text-foreground">{t("values.access.title")}</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{t("values.access.text")}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Scale size={20} />
              </div>
              <h3 className="text-base font-bold text-foreground">{t("values.transparency.title")}</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{t("values.transparency.text")}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-foreground">{t("values.trust.title")}</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{t("values.trust.text")}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Lock size={20} />
              </div>
              <h3 className="text-base font-bold text-foreground">{t("values.compliance.title")}</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{t("values.compliance.text")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Institutional Ecosystem & Partners ──────────────────────── */}
      <section id="ecosystem" className="bg-muted/20 py-16 sm:py-20 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
              {t("ecosystem.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("ecosystem.title")}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground">
              {t("ecosystem.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Landmark size={22} />
              </div>
              <h3 className="text-base font-bold text-foreground">{t("ecosystem.legal.title")}</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("ecosystem.legal.desc")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Wallet size={22} />
              </div>
              <h3 className="text-base font-bold text-foreground">{t("ecosystem.financial.title")}</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("ecosystem.financial.desc")}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-xs sm:col-span-2 lg:col-span-1">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Building2 size={22} />
              </div>
              <h3 className="text-base font-bold text-foreground">{t("ecosystem.regulatory.title")}</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("ecosystem.regulatory.desc")}
              </p>
            </div>
          </div>

          {/* Institutional Inquiries Link (Fixed CTA & Proper Route) */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <h4 className="text-base font-bold text-foreground">{t("ecosystem.partnerCta")}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t("ecosystem.partnerCtaDesc")}</p>
            </div>
            <Link
              href="/contact?type=institutional"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-5 py-2.5 text-xs font-bold text-on-brand shadow-xs transition hover:opacity-90 shrink-0"
            >
              <span>{t("ecosystem.partnerAction")}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Regulatory Notice / Bar Disclaimer Banner ─────────────────── */}
      <section className="bg-background py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3.5 rounded-xl border border-border/80 bg-muted/30 p-4 sm:p-5 shadow-2xs">
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
    </div>
  );
}
