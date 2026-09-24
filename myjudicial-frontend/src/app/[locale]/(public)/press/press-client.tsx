"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, Newspaper, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PressClient() {
  const t = useTranslations("comingSoonPage");

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      <section className="bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <Newspaper size={14} className="text-brand-dark dark:text-white shrink-0" />
            <span>{t("press.hero.badge")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("press.hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("press.hero.subtitle")}
          </p>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-accent text-foreground shadow-2xs">
            <Clock size={40} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t("press.comingSoon.title")}</h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("press.comingSoon.desc")}
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-xs">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{t("cta.title")}</h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-8 py-3.5 text-sm font-bold shadow-xs transition"
              >
                <span>{t("cta.button1")}</span> <ArrowRight size={16} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-accent px-8 py-3.5 text-sm font-semibold text-foreground shadow-2xs transition"
              >
                <span>{t("cta.button2")}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
