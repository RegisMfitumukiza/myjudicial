"use client";

import { useState } from "react";
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { useGetAuthMe, usePatchAuthMe, getGetAuthMeQueryKey } from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";

const LANGUAGES: { value: "en" | "fr" | "rw"; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "rw", label: "Kinyarwanda" },
];

export function LanguageSettingsCard() {
  const t = useTranslations("expertDashboard_language-settings-card");
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetAuthMe();
  const { mutate: patchMe, isPending: isSaving } = usePatchAuthMe();

  const [language, setLanguage] = useState<"en" | "fr" | "rw">(currentLocale as "en" | "fr" | "rw");
  // Adjust local state when the fetched user changes, without an effect —
  // calling setState directly during render (guarded by comparing against
  // the previous data) avoids the extra commit an effect-based sync would cause.
  const [syncedData, setSyncedData] = useState(data);
  if (data !== syncedData) {
    setSyncedData(data);
    if (data?.status === 200) {
      const userLang = (data.data.data.preferredLanguage as "en" | "fr" | "rw") ?? "en";
      setLanguage(userLang);
    }
  }

  function handleSave() {
    patchMe(
      { data: { preferredLanguage: language } },
      {
        onSuccess: () => {
          toast.success(t("settingsSaved"));
          queryClient.invalidateQueries({ queryKey: getGetAuthMeQueryKey() });
          
          // Update the locale in the URL
          router.replace(pathname, { locale: language });
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t("failedToSave"));
        },
      }
    );
  }

  return (
    <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-sm font-semibold text-brand-dark dark:text-gray-100">{t("languageTitle")}</h2>
      {isLoading ? (
        <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      ) : (
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as "en" | "fr" | "rw")}
          className="h-11 w-full rounded-xl border border-brand-border/20 bg-white px-4 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      )}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
        {t("languageDesc")}
      </p>

      <button
        onClick={handleSave}
        disabled={isSaving || isLoading}
        className="mt-4 flex items-center gap-2 rounded-lg bg-brand-blue px-6 py-2 text-sm font-medium text-white hover:bg-brand-blue/90 disabled:opacity-60"
      >
        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {t("saveChanges")}
      </button>
    </div>
  );
}
