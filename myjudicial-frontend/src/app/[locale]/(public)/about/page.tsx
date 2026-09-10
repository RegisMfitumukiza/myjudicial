"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, ShieldCheck, Scale, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePublicStats } from "@/lib/api/landing";

export default function AboutPage() {
  const t = useTranslations("about");
  const { data: stats } = usePublicStats();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-dark/[.06] to-background py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 bg-brand-dark/5 px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-dark/70">
              {t("hero.badge")}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
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

      {/* Mission & Vision */}
      <section id="mission" className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("mission.title")}</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {t("mission.text")}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("mission.visionTitle")}</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {t("mission.visionText")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("story.title")}</h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
            <p>{t("story.text1")}</p>
            <p>{t("story.text2")}</p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
            {t("values.title")}
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10">
                <Users size={24} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("values.access.title")}</h3>
              <p className="mt-2 text-muted-foreground">{t("values.access.text")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10">
                <Scale size={24} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("values.transparency.title")}</h3>
              <p className="mt-2 text-muted-foreground">{t("values.transparency.text")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10">
                <ShieldCheck size={24} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("values.trust.title")}</h3>
              <p className="mt-2 text-muted-foreground">{t("values.trust.text")}</p>
            </div>
          </div>
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
              {t("cta.findLawyer")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/sign-up"
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
