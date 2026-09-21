"use client";

import { LanguageSettingsCard } from "@/features/settings/components/language-settings-card";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { PageHeader } from "@/shared/components/dashboard";
import { Palette, Key, Clock, CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("expertDashboard_settings");
  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-4xl">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="space-y-6">
        {/* Language Preferences */}
        <LanguageSettingsCard />

        {/* Appearance */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">{t("appearanceTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t("appearanceDesc")}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-foreground">{t("themeMode")}</p>
              <p className="text-xs text-muted-foreground">{t("themeDesc")}</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Operational & Account Shortcuts */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-1">{t("additionalSettings")}</h2>
          <p className="text-xs text-muted-foreground mb-4">{t("additionalSettingsDesc")}</p>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/expert/dashboard/schedule-settings"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t("scheduleSettingsTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("scheduleSettingsDesc")}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </Link>

            <Link
              href="/expert/dashboard/availability-overrides"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t("dateOverridesTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("dateOverridesDesc")}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </Link>

            <Link
              href="/expert/dashboard/profile#account"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all sm:col-span-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Key size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t("accountSecurityTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("accountSecurityDesc")}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
