"use client";

import { LanguageSettingsCard } from "@/features/settings/components/language-settings-card";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { Palette, User, Bell, Star, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("clientDashboard");
  return (
    <div className="mx-auto max-w-[900px] space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-[22px] font-bold text-brand-dark dark:text-gray-100">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("settings.subtitle")}</p>
      </div>

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

        {/* Account & Activity Shortcuts */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-1">Account & Activity</h2>
          <p className="text-xs text-muted-foreground mb-4">Quick access to personal info, notifications, and reviews</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/client/dashboard/profile"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Profile</p>
                  <p className="text-xs text-muted-foreground">Personal details</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </Link>

            <Link
              href="/client/dashboard/notifications"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Notifications</p>
                  <p className="text-xs text-muted-foreground">Activity & alerts</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </Link>

            <Link
              href="/client/dashboard/reviews"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Star size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">My Reviews</p>
                  <p className="text-xs text-muted-foreground">Past feedback</p>
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
