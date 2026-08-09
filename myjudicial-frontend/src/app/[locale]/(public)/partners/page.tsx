"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, Building2, Landmark, Wallet, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PartnersPage() {
  const t = useTranslations("partnersPage");

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

      {/* Categories */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            
            {/* Legal */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-brand-dark/10">
                <Landmark size={28} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("categories.legal.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("categories.legal.desc")}</p>
              <ul className="mt-6 space-y-3">
                {t.raw("categories.legal.items").map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground">
                    <Building2 size={16} className="text-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Financial */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-brand-dark/10">
                <Wallet size={28} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("categories.financial.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("categories.financial.desc")}</p>
              <ul className="mt-6 space-y-3">
                {t.raw("categories.financial.items").map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground">
                    <Wallet size={16} className="text-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* NGO */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-brand-dark/10">
                <Users size={28} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("categories.ngo.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("categories.ngo.desc")}</p>
              <ul className="mt-6 space-y-3">
                {t.raw("categories.ngo.items").map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground">
                    <Users size={16} className="text-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-on-brand sm:text-4xl">{t("cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-on-brand/70">{t("cta.subtitle")}</p>
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
