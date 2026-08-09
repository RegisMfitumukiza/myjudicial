"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

const FAQS = [
  {
    q: "How do bookings work?",
    a: "Browse verified lawyers, select a service and time slot, then confirm your booking. You will receive a confirmation via SMS and email with all the details.",
  },
  {
    q: "How do I pay?",
    a: "We accept MTN MoMo and Airtel Money. Your payment is held in secure escrow and only released to the lawyer after your consultation is completed.",
  },
  {
    q: "Are all lawyers verified?",
    a: "Yes. Every lawyer on MyJudicial is BAR certified, identity-checked, and reviewed by our quality team before appearing on the platform.",
  },
  {
    q: "Can consultations be online?",
    a: "Yes. Many lawyers offer video calls, phone calls, and in-person consultations. You can choose your preferred mode when booking.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. You can cancel or reschedule a booking up to 24 hours before the consultation. Cancellations within 24 hours may incur a fee.",
  },
  {
    q: "Is my payment protected?",
    a: "Absolutely. All payments are held in escrow until your consultation is complete. If the lawyer does not show up, you get a full refund.",
  },
  {
    q: "How does Mobile Money work?",
    a: "When you book, you will receive an MoMo payment prompt on your phone. Simply enter your PIN to confirm. The payment is processed instantly.",
  },
];

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
