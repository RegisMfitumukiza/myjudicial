"use client";

import { Store, Construction } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/shared/components/dashboard";

export default function StorePage() {
  const t = useTranslations("expertDashboard");
  return (
    <div className="p-6 lg:p-8">
      <EmptyState
        icon={Store}
        title={t("storeTitle")}
        description={t("storeDesc")}
        className="py-24"
        action={
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
            <Construction size={14} aria-hidden="true" />
            {t("comingSoon")}
          </span>
        }
      />
    </div>
  );
}
