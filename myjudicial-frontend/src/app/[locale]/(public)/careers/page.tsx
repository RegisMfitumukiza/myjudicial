"use client";

import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  Sparkles,
  Scale,
  Code2,
  Users2,
  Headphones,
  Mail,
  MapPin,
  CheckCircle2,
  Briefcase,
  HeartHandshake,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function CareersPage() {
  const t = useTranslations("careersPage");

  const DEPARTMENTS = [
    {
      key: "engineering",
      Icon: Code2,
      tags: ["Next.js", "TypeScript", "PostgreSQL", "AI / LLM Pipelines"],
    },
    {
      key: "legalCompliance",
      Icon: Scale,
      tags: ["Rwanda Bar Association", "Legal Ethics", "Regulatory Compliance"],
    },
    {
      key: "operations",
      Icon: Briefcase,
      tags: ["Marketplace Operations", "Escrow Logistics", "Advocate Onboarding"],
    },
    {
      key: "support",
      Icon: Headphones,
      tags: ["Kinyarwanda", "English", "French", "Customer Trust"],
    },
  ];

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── Hero Section ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[.06] via-background to-background py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-dark/15 bg-brand-dark/5 dark:border-white/15 dark:bg-white/5 px-3.5 py-1 text-xs font-semibold text-brand-dark dark:text-brand-gold">
            <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
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
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark dark:bg-white px-6 py-3 text-sm font-bold text-on-brand dark:text-brand-dark shadow-md transition-all hover:opacity-95 hover:shadow-lg"
            >
              <Mail size={16} />
              <span>{t("cta.sendCv")}</span>
            </a>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-accent"
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
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
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
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <HeartHandshake size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("whyJoin.impact.title")}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("whyJoin.impact.desc")}
              </p>
            </div>

            <div className="flex flex-col rounded-2xl border border-border bg-background p-7 shadow-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Code2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("whyJoin.tech.title")}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
                {t("whyJoin.tech.desc")}
              </p>
            </div>

            <div className="flex flex-col rounded-2xl border border-border bg-background p-7 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
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
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
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
                className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:border-brand-dark/30 hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
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
                      className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80"
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
      <section className="py-16 sm:py-24 border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-brand-dark/20 bg-background p-8 sm:p-10 shadow-lg text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-4">
              <CheckCircle2 size={13} />
              <span>{t("talentPool.badge")}</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t("talentPool.title")}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t("talentPool.subtitle")}
            </p>

            <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-6 max-w-lg mx-auto text-center">
              <p className="text-xs text-muted-foreground">{t("talentPool.instruction")}</p>
              <a
                href={`mailto:${t("talentPool.email")}`}
                className="mt-2 inline-flex items-center gap-2 text-base sm:text-lg font-bold text-brand-dark dark:text-brand-gold hover:underline"
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

      {/* ── Final Action CTA ────────────────────────────────────────── */}
      <section className="bg-brand-dark py-16 sm:py-20 text-on-brand">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-on-brand/80 leading-relaxed">
            {t("cta.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:careers@myjudicial.com?subject=Job%20Application%20-%20MyJudicial"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-brand-dark shadow-lg transition hover:bg-white/90"
            >
              <Mail size={16} />
              <span>{t("cta.sendCv")}</span>
            </a>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-7 py-3 text-sm font-semibold text-on-brand transition hover:bg-white/10"
            >
              <span>{t("cta.explorePlatform")}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
