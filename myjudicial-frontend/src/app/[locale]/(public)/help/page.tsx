"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, Search, BookOpen, Calendar, CreditCard, UserCog, Briefcase, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

export default function HelpPage() {
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

          {/* Search bar */}
          <div className="mx-auto mt-10 max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("hero.searchPlaceholder")}
                className="h-14 w-full rounded-2xl border border-border bg-card pl-12 pr-4 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Topics Grid */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">{t("topics.title")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map(({ key, Icon }) => (
              <Link
                key={key}
                href="/faqs"
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-dark/30 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 transition-colors group-hover:bg-brand-dark group-hover:text-on-brand">
                  <Icon size={24} className="text-brand-dark transition-colors group-hover:text-on-brand" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{t(`topics.${key}.title`)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(`topics.${key}.desc`)}</p>
                <div className="mt-6 flex items-center gap-1 text-sm font-semibold text-brand-dark opacity-0 transition-opacity group-hover:opacity-100">
                  Read Articles <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-brand sm:text-3xl">{t("cta.title")}</h2>
          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/contact"
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
