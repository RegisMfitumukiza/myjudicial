"use client";

import { useState } from "react";
import { ChevronDown, Mail, Phone, LifeBuoy } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/shared/components/dashboard";

export default function HelpPage() {
  const t = useTranslations("expertDashboard_help");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const FAQS = [
    { q: t("faq1q"), a: t("faq1a") },
    { q: t("faq2q"), a: t("faq2a") },
    { q: t("faq3q"), a: t("faq3a") },
  ];

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-foreground">{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "text-muted-foreground transition-transform",
                    openIdx === i && "rotate-180"
                  )}
                  aria-hidden="true"
                />
              </button>
              {openIdx === i && (
                <div className="border-t border-border px-5 py-4">
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LifeBuoy size={20} aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">{t("contactSupport")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("contactSubtitle")}</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail size={14} aria-hidden="true" />
              support@myjudicial.rw
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone size={14} aria-hidden="true" />
              +250 788 000 000
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
