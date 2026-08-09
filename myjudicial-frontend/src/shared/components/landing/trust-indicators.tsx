"use client";

import { ShieldCheck, CheckCircle2, Lock, CreditCard, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TrustIndicators() {
  const t = useTranslations("public");
  
  const TRUST_ITEMS = [
    { icon: ShieldCheck, label: t("trustIndicators.item1") },
    { icon: CheckCircle2, label: t("trustIndicators.item2") },
    { icon: Lock, label: t("trustIndicators.item3") },
    { icon: CreditCard, label: t("trustIndicators.item4") },
    { icon: MessageSquare, label: t("trustIndicators.item5") },
  ];

  return (
    <section className="border-y border-border bg-brand-dark/[.03] py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon size={16} className="shrink-0 text-brand-dark/60" />
              <span className="whitespace-nowrap font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
