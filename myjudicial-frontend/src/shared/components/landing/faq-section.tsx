"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";


function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-foreground transition-colors hover:text-brand-dark"
      >
        {q}
        <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-6 text-muted-foreground">{a}</p>
      )}
    </div>
  );
}

export default function FaqSection() {
  const t = useTranslations("expertDashboard_faq-section");
  
  const FAQS = [
    { q: t("faq1q"), a: t("faq1a") },
    { q: t("faq2q"), a: t("faq2a") },
    { q: t("faq3q"), a: t("faq3a") },
    { q: t("faq4q"), a: t("faq4a") },
    { q: t("faq5q"), a: t("faq5a") },
    { q: t("faq6q"), a: t("faq6a") },
    { q: t("faq7q"), a: t("faq7a") },
  ];

  return (
    <section className="bg-muted/30 py-12 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-dark">{t("faqTag")}</p>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{t("faqTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("faqSubtitle")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-5 sm:px-6 shadow-sm">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} {...faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
