"use client";

import { usePlatformSettings } from "@/features/settings/hooks/useSocialLinks";
import { useLocale } from "next-intl";
import { AlertTriangle } from "lucide-react";

const DEFAULT_MAINTENANCE_NOTICES: Record<string, string> = {
  fr: "Nous procédons actuellement à une maintenance de la plateforme. Certains services peuvent connaître des interruptions temporaires.",
  rw: "Ubu turimo gukora isuzuma n'isanwa ry'urubuga. Serivisi zimwe na zimwe zirashobora guhagarara by'agateganyo.",
  en: "We are currently conducting platform maintenance. Some services may experience temporary interruptions.",
};

const BADGE_LABELS: Record<string, string> = {
  fr: "Maintenance",
  rw: "Isuzuma",
  en: "Maintenance",
};

export function MaintenanceBanner() {
  const { settings } = usePlatformSettings();
  const locale = useLocale();

  if (!settings.maintenanceMode) {
    return null;
  }

  const notice =
    settings.maintenanceNotice?.trim() ||
    DEFAULT_MAINTENANCE_NOTICES[locale] ||
    DEFAULT_MAINTENANCE_NOTICES.en;

  const badge = BADGE_LABELS[locale] || BADGE_LABELS.en;

  return (
    <aside
      role="alert"
      aria-live="polite"
      className="sticky top-0 z-[100] w-full border-b border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/40 backdrop-blur-md px-3 py-2 text-xs text-amber-900 dark:text-amber-200 transition-all"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <span className="font-semibold uppercase tracking-wider text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
          {badge}
        </span>
        <span className="line-clamp-2 sm:line-clamp-1 break-words">{notice}</span>
      </div>
    </aside>
  );
}
