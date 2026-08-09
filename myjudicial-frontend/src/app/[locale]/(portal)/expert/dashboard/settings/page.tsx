"use client";

import { LanguageSettingsCard } from "@/features/settings/components/language-settings-card";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("expertDashboard");
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">{t("settingsTitle")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("settingsDesc")}</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <LanguageSettingsCard />
      </div>
    </div>
  );
}
