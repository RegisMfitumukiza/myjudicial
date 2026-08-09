"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import FaqSection from "@/shared/components/landing/faq-section";

export default function FaqsClient() {
  const t = useTranslations("faqsPage");

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

      {/* FAQ Section from shared components */}
      <div className="-mt-16 sm:-mt-24">
        <FaqSection />
      </div>

      {/* CTA */}
      <section className="border-t border-border bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-dark/10">
            <MessageSquare size={32} className="text-brand-dark" />
          </div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            {t("cta.subtitle")}
          </p>
          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-8 py-3.5 text-sm font-bold text-on-brand shadow-lg transition hover:bg-brand-dark/90"
            >
              {t("cta.contact")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
