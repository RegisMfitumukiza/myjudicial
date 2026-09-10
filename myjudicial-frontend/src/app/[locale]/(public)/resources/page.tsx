"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ResourcesPage() {
  const t = useTranslations("resourcesPage");

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-dark/[.06] to-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
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
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <Clock size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t("comingSoon.title")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("comingSoon.desc")}
          </p>
        </div>
      </section>

      {/* Categories Outline */}
      <section className="bg-muted/30 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">{t("categories.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["family", "commercial", "property", "employment", "immigration", "tax"].map((cat) => (
              <div key={cat} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6 opacity-70">
                <BookOpen className="text-muted-foreground" size={24} />
                <span className="font-semibold text-foreground">{t(`categories.${cat}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-brand sm:text-4xl">{t("cta.title")}</h2>
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
