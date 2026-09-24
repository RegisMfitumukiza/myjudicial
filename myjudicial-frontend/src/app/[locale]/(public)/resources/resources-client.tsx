"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ResourcesClient() {
  const t = useTranslations("resourcesPage");

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <BookOpen size={14} className="text-brand-dark dark:text-white shrink-0" />
            <span>{t("hero.badge")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-foreground shadow-2xs">
            <Clock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t("comingSoon.title")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("comingSoon.desc")}
          </p>
        </div>
      </section>

      {/* Categories Outline */}
      <section className="bg-muted/20 py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">{t("categories.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["family", "commercial", "property", "employment", "immigration", "tax"].map((cat) => (
              <div key={cat} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-2xs">
                <BookOpen className="text-foreground shrink-0" size={22} />
                <span className="font-semibold text-foreground">{t(`categories.${cat}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-xs">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{t("cta.title")}</h2>
            <div className="mt-8 flex items-center justify-center">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-8 py-3.5 text-sm font-bold shadow-xs transition"
              >
                <span>{t("cta.button")}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
