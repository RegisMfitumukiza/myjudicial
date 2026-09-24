"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, Search, BookOpen, Calendar, CreditCard, UserCog, Briefcase, Shield, HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function HelpClient() {
  const t = useTranslations("helpPage");

  const TOPICS = [
    { key: "gettingStarted", Icon: BookOpen },
    { key: "booking", Icon: Calendar },
    { key: "payments", Icon: CreditCard },
    { key: "account", Icon: UserCog },
    { key: "lawyers", Icon: Briefcase },
    { key: "trust", Icon: Shield },
  ];

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <HelpCircle size={14} className="text-brand-dark dark:text-white shrink-0" />
            <span>{t("hero.badge")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-10 max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("hero.searchPlaceholder")}
                className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Topics Grid */}
      <section className="bg-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">{t("topics.title")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map(({ key, Icon }) => (
              <Link
                key={key}
                href="/faqs"
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-border/90 hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{t(`topics.${key}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(`topics.${key}.desc`)}</p>
                <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {t("readArticles")} <ArrowRight size={14} />
                </div>
              </Link>
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
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-8 py-3.5 text-sm font-bold shadow-xs transition"
              >
                <span>{t("cta.button")}</span> <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
