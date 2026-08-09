"use client";

import { Receipt, Construction } from "lucide-react";
import { useTranslations } from "next-intl";

export default function BillingPage() {
  const t = useTranslations("expertDashboard");
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-dark/5 dark:bg-white/5">
        <Receipt size={36} className="text-brand-dark/30 dark:text-white/30" />
      </div>
      <h2 className="text-xl font-bold text-brand-dark dark:text-white">{t("billingTitle")}</h2>
      <p className="mt-2 max-w-sm text-sm text-brand-dark/50 dark:text-white/50">
        {t("billingDesc")}
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-full bg-brand-dark/5 px-4 py-2 text-xs font-medium text-brand-dark/60 dark:bg-white/5 dark:text-white/60">
        <Construction size={14} />
        {t("comingSoon")}
      </div>
    </div>
  );
}
