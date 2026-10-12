"use client";

import { LanguageSettingsCard } from "@/features/settings/components/language-settings-card";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { Palette, User, Bell, Star, ArrowRight, FileText, CreditCard, Shield } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("clientDashboard.settings");
  return (
    <div className="mx-auto max-w-[900px] space-y-6 p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <div>
        <h1 className="text-xl sm:text-[22px] font-bold text-brand-dark dark:text-gray-100 break-words">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
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
              <h2 className="text-base font-semibold text-foreground">{t("appearance")}</h2>
              <p className="text-xs text-muted-foreground">{t("appearanceDesc")}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-foreground">{t("themeMode")}</p>
              <p className="text-xs text-muted-foreground">{t("themeModeDesc")}</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Account & Activity Shortcuts */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-1">{t("accountActivity")}</h2>
          <p className="text-xs text-muted-foreground mb-4">{t("accountActivityDesc")}</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/client/dashboard/profile"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t("shortcuts.profile")}</p>
                  <p className="text-xs text-muted-foreground">{t("shortcuts.profileDesc")}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </Link>

            <Link
              href="/client/dashboard/documents"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t("shortcuts.documents")}</p>
                  <p className="text-xs text-muted-foreground">{t("shortcuts.documentsDesc")}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </Link>

            <Link
              href="/client/dashboard/payments"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t("shortcuts.payments")}</p>
                  <p className="text-xs text-muted-foreground">{t("shortcuts.paymentsDesc")}</p>
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
                  <p className="text-sm font-medium text-foreground">{t("shortcuts.notifications")}</p>
                  <p className="text-xs text-muted-foreground">{t("shortcuts.notificationsDesc")}</p>
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
                  <p className="text-sm font-medium text-foreground">{t("shortcuts.reviews")}</p>
                  <p className="text-xs text-muted-foreground">{t("shortcuts.reviewsDesc")}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </Link>

            <Link
              href="/client/dashboard/security"
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t("shortcuts.security")}</p>
                  <p className="text-xs text-muted-foreground">{t("shortcuts.securityDesc")}</p>
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
