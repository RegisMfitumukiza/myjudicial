"use client";

import { useState } from "react";
import { LanguageSettingsCard } from "@/features/settings/components/language-settings-card";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import {
  Palette,
  User,
  Bell,
  Star,
  ArrowRight,
  FileText,
  CreditCard,
  Shield,
  Clock,
  Coins,
  Scale,
  Check,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function SettingsPage() {
  const t = useTranslations("clientDashboard.settings");

  /* Notification preferences local state */
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [chatNotifs, setChatNotifs] = useState(true);

  const handleToggle = (
    channel: "email" | "sms" | "chat",
    current: boolean,
    setter: (val: boolean) => void
  ) => {
    const next = !current;
    setter(next);
    toast.success(
      next
        ? `${channel.toUpperCase()} alerts enabled`
        : `${channel.toUpperCase()} alerts muted`
    );
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-6 p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <div>
        <h1 className="text-xl sm:text-[22px] font-bold text-brand-dark dark:text-gray-100 break-words">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Preferences */}
        <LanguageSettingsCard />

        {/* Appearance & Interface Theme */}
        <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/5 dark:bg-white/10 text-brand-dark dark:text-white">
              <Palette size={19} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-brand-dark dark:text-white">
                {t("appearance")}
              </h2>
              <p className="text-xs text-brand-dark/60 dark:text-white/60">
                {t("appearanceDesc")}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-brand-border/10 dark:border-white/10 pt-4">
            <div>
              <p className="text-sm font-semibold text-brand-dark dark:text-white">
                {t("themeMode")}
              </p>
              <p className="text-xs text-brand-dark/60 dark:text-white/60">
                {t("themeModeDesc")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Notification Delivery Channels */}
        <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/5 dark:bg-white/10 text-brand-dark dark:text-white">
              <Bell size={19} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-brand-dark dark:text-white">
                {t("notificationsCard")}
              </h2>
              <p className="text-xs text-brand-dark/60 dark:text-white/60">
                {t("notificationsCardDesc")}
              </p>
            </div>
          </div>

          <div className="divide-y divide-brand-border/10 dark:divide-white/10 border-t border-brand-border/10 dark:border-white/10">
            {/* Email Notifications */}
            <div className="flex items-center justify-between py-3.5">
              <div className="pr-4">
                <p className="text-sm font-semibold text-brand-dark dark:text-white">
                  {t("channelEmail")}
                </p>
                <p className="text-xs text-brand-dark/60 dark:text-white/60">
                  {t("channelEmailDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("email", emailNotifs, setEmailNotifs)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emailNotifs ? "bg-brand-dark dark:bg-white" : "bg-gray-200 dark:bg-gray-700"
                }`}
                role="switch"
                aria-checked={emailNotifs}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-black shadow ring-0 transition duration-200 ease-in-out ${
                    emailNotifs ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* SMS & Mobile Alerts */}
            <div className="flex items-center justify-between py-3.5">
              <div className="pr-4">
                <p className="text-sm font-semibold text-brand-dark dark:text-white">
                  {t("channelSms")}
                </p>
                <p className="text-xs text-brand-dark/60 dark:text-white/60">
                  {t("channelSmsDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("sms", smsNotifs, setSmsNotifs)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  smsNotifs ? "bg-brand-dark dark:bg-white" : "bg-gray-200 dark:bg-gray-700"
                }`}
                role="switch"
                aria-checked={smsNotifs}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-black shadow ring-0 transition duration-200 ease-in-out ${
                    smsNotifs ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* In-Platform Chat Alerts */}
            <div className="flex items-center justify-between py-3.5">
              <div className="pr-4">
                <p className="text-sm font-semibold text-brand-dark dark:text-white">
                  {t("channelChat")}
                </p>
                <p className="text-xs text-brand-dark/60 dark:text-white/60">
                  {t("channelChatDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("chat", chatNotifs, setChatNotifs)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  chatNotifs ? "bg-brand-dark dark:bg-white" : "bg-gray-200 dark:bg-gray-700"
                }`}
                role="switch"
                aria-checked={chatNotifs}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-black shadow ring-0 transition duration-200 ease-in-out ${
                    chatNotifs ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Regional & Court Jurisdiction Defaults */}
        <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/5 dark:bg-white/10 text-brand-dark dark:text-white">
              <Scale size={19} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-brand-dark dark:text-white">
                {t("regionalDefaults")}
              </h2>
              <p className="text-xs text-brand-dark/60 dark:text-white/60">
                {t("regionalDefaultsDesc")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-brand-border/10 dark:border-white/10">
            <div className="rounded-xl border border-brand-border/15 p-4 dark:border-white/10 bg-brand-dark/[0.01] dark:bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={15} className="text-brand-dark/60 dark:text-white/60" />
                <span className="text-xs font-semibold uppercase text-brand-dark/50 dark:text-white/50">
                  {t("currentTimezone")}
                </span>
              </div>
              <p className="text-sm font-bold text-brand-dark dark:text-white">
                {t("timeValue")}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                <Check size={12} />
                <span>Rwanda Court Standard Time (CAT)</span>
              </div>
            </div>

            <div className="rounded-xl border border-brand-border/15 p-4 dark:border-white/10 bg-brand-dark/[0.01] dark:bg-white/[0.01]">
              <div className="flex items-center gap-2 mb-1">
                <Coins size={15} className="text-brand-dark/60 dark:text-white/60" />
                <span className="text-xs font-semibold uppercase text-brand-dark/50 dark:text-white/50">
                  {t("currentCurrency")}
                </span>
              </div>
              <p className="text-sm font-bold text-brand-dark dark:text-white">
                {t("currencyValue")}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                <Check size={12} />
                <span>AzamPay MoMo Escrow Compatible</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account & Activity Shortcuts */}
        <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
          <h2 className="text-[15px] font-bold text-brand-dark dark:text-white mb-1">
            {t("accountActivity")}
          </h2>
          <p className="text-xs text-brand-dark/60 dark:text-white/60 mb-4">
            {t("accountActivityDesc")}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/client/dashboard/profile"
              className="flex items-center justify-between p-4 rounded-xl border border-brand-border/20 hover:border-brand-dark/40 hover:bg-brand-dark/[0.02] dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/10 text-brand-dark dark:text-white">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-dark dark:text-white">
                    {t("shortcuts.profile")}
                  </p>
                  <p className="text-xs text-brand-dark/50 dark:text-white/50">
                    {t("shortcuts.profileDesc")}
                  </p>
                </div>
              </div>
              <ArrowRight size={14} className="text-brand-dark/40 dark:text-white/40" />
            </Link>

            <Link
              href="/client/dashboard/documents"
              className="flex items-center justify-between p-4 rounded-xl border border-brand-border/20 hover:border-brand-dark/40 hover:bg-brand-dark/[0.02] dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/10 text-brand-dark dark:text-white">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-dark dark:text-white">
                    {t("shortcuts.documents")}
                  </p>
                  <p className="text-xs text-brand-dark/50 dark:text-white/50">
                    {t("shortcuts.documentsDesc")}
                  </p>
                </div>
              </div>
              <ArrowRight size={14} className="text-brand-dark/40 dark:text-white/40" />
            </Link>

            <Link
              href="/client/dashboard/payments"
              className="flex items-center justify-between p-4 rounded-xl border border-brand-border/20 hover:border-brand-dark/40 hover:bg-brand-dark/[0.02] dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/10 text-brand-dark dark:text-white">
                  <CreditCard size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-dark dark:text-white">
                    {t("shortcuts.payments")}
                  </p>
                  <p className="text-xs text-brand-dark/50 dark:text-white/50">
                    {t("shortcuts.paymentsDesc")}
                  </p>
                </div>
              </div>
              <ArrowRight size={14} className="text-brand-dark/40 dark:text-white/40" />
            </Link>

            <Link
              href="/client/dashboard/notifications"
              className="flex items-center justify-between p-4 rounded-xl border border-brand-border/20 hover:border-brand-dark/40 hover:bg-brand-dark/[0.02] dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/10 text-brand-dark dark:text-white">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-dark dark:text-white">
                    {t("shortcuts.notifications")}
                  </p>
                  <p className="text-xs text-brand-dark/50 dark:text-white/50">
                    {t("shortcuts.notificationsDesc")}
                  </p>
                </div>
              </div>
              <ArrowRight size={14} className="text-brand-dark/40 dark:text-white/40" />
            </Link>

            <Link
              href="/client/dashboard/reviews"
              className="flex items-center justify-between p-4 rounded-xl border border-brand-border/20 hover:border-brand-dark/40 hover:bg-brand-dark/[0.02] dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/10 text-brand-dark dark:text-white">
                  <Star size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-dark dark:text-white">
                    {t("shortcuts.reviews")}
                  </p>
                  <p className="text-xs text-brand-dark/50 dark:text-white/50">
                    {t("shortcuts.reviewsDesc")}
                  </p>
                </div>
              </div>
              <ArrowRight size={14} className="text-brand-dark/40 dark:text-white/40" />
            </Link>

            <Link
              href="/client/dashboard/security"
              className="flex items-center justify-between p-4 rounded-xl border border-brand-border/20 hover:border-brand-dark/40 hover:bg-brand-dark/[0.02] dark:border-white/10 dark:hover:border-white/30 dark:hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/10 text-brand-dark dark:text-white">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-dark dark:text-white">
                    {t("shortcuts.security")}
                  </p>
                  <p className="text-xs text-brand-dark/50 dark:text-white/50">
                    {t("shortcuts.securityDesc")}
                  </p>
                </div>
              </div>
              <ArrowRight size={14} className="text-brand-dark/40 dark:text-white/40" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
