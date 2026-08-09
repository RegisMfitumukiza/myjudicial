"use client";

import { LanguageSettingsCard } from "@/features/settings/components/language-settings-card";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("clientDashboard");
  return (
    <div className="mx-auto max-w-[1080px] space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-[22px] font-bold text-brand-dark dark:text-gray-100">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("settings.subtitle")}</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <LanguageSettingsCard />
      </div>
    </div>
  );
}
