"use client";

import { LanguageSettingsCard } from "@/features/settings/components/language-settings-card";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { PageHeader } from "@/shared/components/dashboard";
import { Palette, Key, Clock, CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("expertDashboard");
  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-4xl">
      <PageHeader
        title={t("settingsTitle")}
        description={t("settingsDesc")}
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
              <h2 className="text-base font-semibold text-foreground">Appearance</h2>
              <p className="text-xs text-muted-foreground">Customize your visual theme and interface mode</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-foreground">Theme Mode</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Operational & Account Shortcuts */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-1">Additional Settings</h2>
          <p className="text-xs text-muted-foreground mb-4">Quick access to specialized account and schedule configuration</p>
          
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
                  <p className="text-sm font-medium text-foreground">Schedule Settings</p>
                  <p className="text-xs text-muted-foreground">Notice periods, buffers, and daily caps</p>
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
                  <p className="text-sm font-medium text-foreground">Date Overrides</p>
                  <p className="text-xs text-muted-foreground">Custom hours and vacation blackouts</p>
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
                  <p className="text-sm font-medium text-foreground">Account & Security</p>
                  <p className="text-xs text-muted-foreground">Password changes and active logged-in device sessions</p>
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
