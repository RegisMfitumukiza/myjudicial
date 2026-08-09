"use client";

import { useState } from "react";
import { ChevronDown, Mail, Phone, LifeBuoy } from "lucide-react";
import { useTranslations } from "next-intl";

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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-brand-border/20 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-brand-dark dark:text-gray-100">{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${openIdx === i ? "rotate-180" : ""}`}
                />
              </button>
              {openIdx === i && (
                <div className="border-t border-brand-border/10 px-5 py-4 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300">
            <LifeBuoy size={20} />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-brand-dark dark:text-gray-100">{t("contactSupport")}</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("contactSubtitle")}
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <Mail size={14} className="text-gray-400" />
              support@myjudicial.rw
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <Phone size={14} className="text-gray-400" />
              +250 788 000 000
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}