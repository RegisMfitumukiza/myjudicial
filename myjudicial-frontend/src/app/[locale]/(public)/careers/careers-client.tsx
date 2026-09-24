"use client";

import { Link } from "@/i18n/routing";
import {
  Sparkles,
  HeartHandshake,
  Code2,
  Users2,
  Scale,
  BrainCircuit,
  Headphones,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function CareersClient() {
  const t = useTranslations("careersPage");

  const DEPARTMENTS = [
    {
      key: "engineering",
      Icon: Code2,
      tags: ["TypeScript", "Next.js", "NestJS", "PostgreSQL", "LiveKit"],
    },
    {
      key: "legal",
      Icon: Scale,
      tags: ["RBA Roll", "Ethics & Compliance", "Legal Ops", "ADR"],
    },
    {
      key: "ai",
      Icon: BrainCircuit,
      tags: ["NLP", "Rwanda Law KG", "Retrieval-Augmented Gen", "Privacy"],
    },
    {
      key: "ops",
      Icon: Headphones,
      tags: ["Kinyarwanda", "English", "French", "Customer Trust"],
    },
  ];

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <Sparkles size={14} className="text-brand-dark dark:text-white shrink-0" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:careers@myjudicial.com?subject=Spontaneous%20Application%20-%20MyJudicial"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-6 py-3 text-sm font-bold shadow-sm transition-all active:scale-[0.98]"
            >
              <Mail size={16} />
              <span>{t("cta.sendCv")}</span>
            </a>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent shadow-2xs"
            >
              <span>{t("cta.explorePlatform")}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Build With Us ───────────────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {t("whyJoin.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("whyJoin.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("whyJoin.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-border bg-background p-7 shadow-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                <HeartHandshake size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("whyJoin.impact.title")}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("whyJoin.impact.desc")}
              </p>
            </div>

            <div className="flex flex-col rounded-2xl border border-border bg-background p-7 shadow-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                <Code2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("whyJoin.tech.title")}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("whyJoin.tech.desc")}
              </p>
            </div>

            <div className="flex flex-col rounded-2xl border border-border bg-background p-7 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                <Users2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("whyJoin.culture.title")}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("whyJoin.culture.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Disciplines We Hire For ─────────────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {t("departments.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("departments.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("departments.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {DEPARTMENTS.map(({ key, Icon, tags }) => (
              <div
                key={key}
                className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:border-border/90 hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {t(`departments.${key}.title`)}
                  </h3>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {t(`departments.${key}.desc`)}
                </p>

                <div className="mt-auto flex flex-wrap gap-2 pt-2 border-t border-border/50">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80 font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Spontaneous Applications & Talent Pool Card ──────────────── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold text-foreground mb-4 shadow-2xs">
              <CheckCircle2 size={13} />
              <span>{t("talentPool.badge")}</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("talentPool.title")}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t("talentPool.subtitle")}
            </p>

            <div className="mt-8 rounded-2xl border border-border bg-background p-6 max-w-lg mx-auto text-center shadow-2xs">
              <p className="text-xs text-muted-foreground">{t("talentPool.instruction")}</p>
              <a
                href={`mailto:${t("talentPool.email")}`}
                className="mt-2 inline-flex items-center gap-2 text-base sm:text-lg font-bold text-foreground hover:underline"
              >
                <Mail size={18} />
                <span>{t("talentPool.email")}</span>
              </a>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <MapPin size={13} className="shrink-0" />
              <span>{t("talentPool.locationNotice")}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
