"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BlogPage() {
  const t = useTranslations("comingSoonPage");

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-brand-dark/[.06] to-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 bg-brand-dark/5 px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-dark/70">
              {t("blog.hero.badge")}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("blog.hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("blog.hero.subtitle")}
          </p>
        </div>
      </section>

      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-muted/50">
            <Clock size={40} className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t("blog.comingSoon.title")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("blog.comingSoon.desc")}
          </p>
        </div>
      </section>

      <section className="bg-brand-dark py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-brand sm:text-4xl">{t("cta.title")}</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand-dark shadow-lg transition hover:bg-white/90"
            >
              {t("cta.button1")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-sm font-bold text-on-brand transition hover:bg-white/10"
            >
              {t("cta.button2")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
