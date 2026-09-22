"use client";

import { useState } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Save, Globe, Check } from "lucide-react";
import { useGetAuthMe, usePatchAuthMe, getGetAuthMeQueryKey } from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";

const LANGUAGES: {
  value: "en" | "fr" | "rw";
  label: string;
  native: string;
  description: string;
}[] = [
  { value: "en", label: "English", native: "English", description: "Default / International" },
  { value: "fr", label: "French", native: "Français", description: "Langue officielle" },
  { value: "rw", label: "Kinyarwanda", native: "Ikinyarwanda", description: "Ururimi rw'igihugu" },
];

export function LanguageSettingsCard() {
  const t = useTranslations("expertDashboard_language-settings-card");
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetAuthMe();
  const { mutate: patchMe, isPending: isSaving } = usePatchAuthMe();

  const [language, setLanguage] = useState<"en" | "fr" | "rw">((currentLocale as "en" | "fr" | "rw") || "en");
  const [syncedData, setSyncedData] = useState(data);
  if (data !== syncedData) {
    setSyncedData(data);
    if (data?.status === 200) {
      const userLang = (data.data.data.preferredLanguage as "en" | "fr" | "rw") ?? currentLocale ?? "en";
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
          router.replace(pathname, { locale: language });
        },
        onError: () => {
          toast.error(t("failedToSave"));
        },
      }
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Globe size={18} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("languageTitle")}</h2>
          <p className="text-xs text-muted-foreground">{t("languageDesc")}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LANGUAGES.map((l) => {
            const isSelected = language === l.value;
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => setLanguage(l.value)}
                className={`relative flex flex-col items-start justify-between rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                    : "border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/40"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{l.native}</span>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-xs font-medium text-muted-foreground">{l.label}</span>
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">{l.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Changes will take effect across the entire interface immediately.
        </p>
        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          size="sm"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {t("saveChanges")}
        </Button>
      </div>
    </div>
  );
}
