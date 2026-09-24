"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, Building2, Landmark, Wallet, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export default function PartnersClient() {
  const t = useTranslations("partnersPage");

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <Building2 size={14} className="text-brand-dark dark:text-white shrink-0" />
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

      {/* Categories */}
      <section className="bg-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* Legal */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-xs">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-foreground shadow-2xs">
                <Landmark size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("categories.legal.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("categories.legal.desc")}</p>
              <ul className="mt-6 space-y-3">
                {t.raw("categories.legal.items").map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground">
                    <Building2 size={16} className="text-muted-foreground shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Financial */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-xs">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-foreground shadow-2xs">
                <Wallet size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("categories.financial.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("categories.financial.desc")}</p>
              <ul className="mt-6 space-y-3">
                {t.raw("categories.financial.items").map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground">
                    <Wallet size={16} className="text-muted-foreground shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* NGOs */}
            <div className="rounded-2xl border border-border bg-card p-8 shadow-xs">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-foreground shadow-2xs">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground">{t("categories.ngo.title")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("categories.ngo.desc")}</p>
              <ul className="mt-6 space-y-3">
                {t.raw("categories.ngo.items").map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3 text-sm font-semibold text-foreground">
                    <Users size={16} className="text-muted-foreground shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section (Clean Card Standard) */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-xs">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{t("cta.title")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">{t("cta.subtitle")}</p>
            <div className="mt-8 flex items-center justify-center">
              <Link
                href="/contact"
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
