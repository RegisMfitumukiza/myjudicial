"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, Globe, Palette, Clock, RotateCcw, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function LiveStorageInspector() {
  const t = useTranslations("legalPages.cookies.inspector");
  const [mounted, setMounted] = useState(false);
  const [themePref, setThemePref] = useState<string>("system");
  const [langPref, setLangPref] = useState<string>("en");
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [timezone, setTimezone] = useState<string>("Africa/Kigali");
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    try {
      // 1. Theme
      const savedTheme = localStorage.getItem("theme") || "system";
      setThemePref(savedTheme);

      // 2. Language Cookie / LocalStorage
      const cookieMatch = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
      const cookieLang = cookieMatch ? decodeURIComponent(cookieMatch[1]) : "";
      const localLang = localStorage.getItem("mj_lang");
      setLangPref(cookieLang || localLang || "en");

      // 3. Auth Session Token Presence
      const hasAuthCookie = /authjs\.session-token|__Secure-authjs\.session-token/.test(
        document.cookie
      );
      setHasSession(hasAuthCookie);

      // 4. Detected Timezone
      const tz =
        localStorage.getItem("mj_timezone") ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "Africa/Kigali";
      setTimezone(tz);
    } catch {
      // In private browsing mode or when storage is restricted
    }
  }, []);

  const handleResetPreferences = () => {
    setIsResetting(true);
    try {
      localStorage.removeItem("theme");
      localStorage.removeItem("mj_timezone");
      setThemePref("system");
      toast.success(t("resetSuccess"));
    } catch {
      toast.error("Could not clear preferences.");
    } finally {
      setTimeout(() => setIsResetting(false), 800);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-accent/30 p-5 shadow-2xs sm:p-6">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              <Sparkles size={10} />
              <span>{t("badge")}</span>
            </div>
            <h3 className="mt-1 text-sm font-bold text-foreground sm:text-base">
              {t("title")}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetPreferences}
          disabled={isResetting}
          className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:bg-accent hover:text-foreground transition disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isResetting ? (
            <Check size={13} className="text-emerald-500" />
          ) : (
            <RotateCcw size={13} className="text-muted-foreground" />
          )}
          <span>{t("resetBtn")}</span>
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {t("description")}
      </p>

      {/* Grid of Live Values */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Active Session */}
        <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ShieldCheck size={14} className="text-primary dark:text-white" />
            <span>{t("sessionLabel")}</span>
          </div>
          <p className="mt-2 text-xs font-bold text-foreground">
            {mounted ? (hasSession ? t("sessionAuth") : t("sessionGuest")) : "..."}
          </p>
        </div>

        {/* Language Cookie */}
        <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Globe size={14} className="text-primary dark:text-white" />
            <span>{t("langLabel")}</span>
          </div>
          <p className="mt-2 text-xs font-mono font-bold text-foreground uppercase tracking-wide">
            {mounted ? langPref : "..."}
          </p>
        </div>

        {/* Visual Theme */}
        <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Palette size={14} className="text-primary dark:text-white" />
            <span>{t("themeLabel")}</span>
          </div>
          <p className="mt-2 text-xs font-mono font-bold capitalize text-foreground">
            {mounted ? themePref : "..."}
          </p>
        </div>

        {/* Client Timezone */}
        <div className="rounded-xl border border-border/70 bg-background/60 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Clock size={14} className="text-primary dark:text-white" />
            <span>{t("timezoneLabel")}</span>
          </div>
          <p className="mt-2 text-xs font-mono font-medium text-foreground truncate">
            {mounted ? timezone : "..."}
          </p>
        </div>

        {/* Third-Party Ad Trackers */}
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 shadow-2xs sm:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>{t("trackersLabel")}</span>
          </div>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span>{t("trackersValue")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
