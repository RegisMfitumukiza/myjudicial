"use client";

import { usePlatformSettings } from "@/features/settings/hooks/useSocialLinks";
import { AlertTriangle } from "lucide-react";

export function MaintenanceBanner() {
  const { settings } = usePlatformSettings();

  if (!settings.maintenanceMode) {
    return null;
  }

  const notice =
    settings.maintenanceNotice?.trim() ||
    "We are currently conducting platform maintenance. Some services may experience temporary interruptions.";

  return (
    <aside
      role="alert"
      aria-live="polite"
      className="sticky top-0 z-[100] w-full border-b border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/40 backdrop-blur-md px-3 py-2 text-xs text-amber-900 dark:text-amber-200 transition-all"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-center font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <span className="font-semibold uppercase tracking-wider text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
          Maintenance
        </span>
        <span className="line-clamp-2 sm:line-clamp-1 break-words">{notice}</span>
      </div>
    </aside>
  );
}
