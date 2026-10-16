"use client";

import { ArrowRight, Clock, Star, Sun, Wallet } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  availableFundsRwf: number;
  pendingEscrowRwf: number;
  activeBookings: number;
  pendingBookings: number;
  clientRating: number | null;
  reviewCount: number;
  available: boolean;
  onToggleAvailable: (next: boolean) => void;
  isTogglingAvailable?: boolean;
  nextBooking?: { scheduledStart: string; service: { name: string } } | null;
  availableSlotsToday?: number;
  hasConfiguredSchedule?: boolean;
}

export function DashboardStats({
  availableFundsRwf,
  pendingEscrowRwf,
  activeBookings,
  pendingBookings,
  clientRating,
  reviewCount,
  available,
  onToggleAvailable,
  isTogglingAvailable,
  nextBooking,
  availableSlotsToday = 0,
  hasConfiguredSchedule = true,
}: DashboardStatsProps) {
  const t = useTranslations("expertDashboard.stats");
  const tDashboard = useTranslations("expertDashboard");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  function formatNextAppointment(scheduledStart: string): string {
    const target = new Date(scheduledStart);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);

    if (diffMin < 0) return tCommon("startingNow") || "Starting now";
    if (diffMin < 60) return tCommon("inMinutes", { minutes: diffMin }) || `In ${diffMin} min`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return tCommon("inHours", { hours: diffHr }) || `In ${diffHr} hour${diffHr === 1 ? "" : "s"}`;
    return target.toLocaleDateString(locale, { month: "short", day: "numeric" });
  }

  return (
    <div className="grid grid-cols-1 min-[340px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 min-[1440px]:p-5 shadow-sm min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground break-words leading-tight line-clamp-1">{t("availableFunds")}</p>
          <div className="mt-2 flex items-baseline gap-1.5 min-w-0">
            <span className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground truncate">
              {availableFundsRwf.toLocaleString()}
            </span>
            <span className="text-sm font-normal text-muted-foreground shrink-0">RWF</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground min-w-0">
          <Wallet size={12} className="shrink-0" aria-hidden="true" />
          <span className="break-words line-clamp-1">{pendingEscrowRwf.toLocaleString()} RWF {t("pendingEscrow")}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 min-[1440px]:p-5 shadow-sm min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5 min-w-0">
            <p className="min-w-0 flex-1 text-xs font-medium uppercase tracking-normal text-muted-foreground break-words leading-tight line-clamp-2">
              {t("activeBookings")}
            </p>
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock size={14} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-semibold tabular-nums text-foreground">{activeBookings}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground break-words line-clamp-1">
          {pendingBookings} {t("pendingBookings", { count: pendingBookings })}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 min-[1440px]:p-5 shadow-sm min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5 min-w-0">
            <p className="min-w-0 flex-1 text-xs font-medium uppercase tracking-normal text-muted-foreground break-words leading-tight line-clamp-2">
              {t("clientRating")}
            </p>
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Star size={14} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-semibold tabular-nums text-foreground">
            {clientRating !== null ? clientRating.toFixed(1) : "—"}
          </p>
        </div>
        <p className="mt-1 text-xs text-primary break-words line-clamp-1">
          {reviewCount > 0
            ? t("basedOnReviews", { count: reviewCount, plural: reviewCount === 1 ? "" : "s" })
            : t("noReviewsYet")}
        </p>
      </div>

      <div
        className={cn(
          "rounded-xl border shadow-sm min-w-0 flex flex-col justify-between transition-colors",
          !hasConfiguredSchedule
            ? "border-amber-500/40 bg-amber-500/[0.04] p-3.5 sm:p-4 min-[1440px]:p-5"
            : "border-border bg-card p-3.5 sm:p-4 min-[1440px]:p-5"
        )}
      >
        <div>
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Sun
                size={14}
                aria-hidden="true"
                className={`shrink-0 ${
                  !hasConfiguredSchedule
                    ? "text-amber-600 dark:text-amber-400"
                    : available
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              <p
                className="text-xs font-medium uppercase tracking-normal text-muted-foreground break-words leading-tight line-clamp-1"
                title={t("availability")}
              >
                {t("availability")}
              </p>
              {!hasConfiguredSchedule && (
                <span className="hidden min-[400px]:inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {t("notConfigured")}
                </span>
              )}
            </div>

            {!hasConfiguredSchedule ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleAvailable(true)}
                className="h-7 px-2 text-xs font-semibold rounded-lg border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 hover:text-amber-800 gap-1 shrink-0"
              >
                <span>{t("configureSchedule")}</span>
                <ArrowRight size={11} />
              </Button>
            ) : (
              <Switch
                checked={available}
                disabled={isTogglingAvailable}
                onCheckedChange={(next) => onToggleAvailable(next)}
                className="shrink-0"
                aria-label={available ? tDashboard("onlineAvailable") : tDashboard("offline")}
              />
            )}
          </div>

          <p
            className={cn(
              "mt-2 text-xl sm:text-2xl font-semibold tabular-nums truncate",
              !hasConfiguredSchedule
                ? "text-amber-600 dark:text-amber-400 font-bold"
                : available
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {!hasConfiguredSchedule
              ? t("scheduleNotSet")
              : available
              ? tDashboard("onlineAvailable")
              : tDashboard("offline")}
          </p>
        </div>

        {nextBooking ? (
          <div className="mt-3 rounded-lg bg-primary/10 p-2.5 min-w-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary truncate">{t("nextBooking")}</p>
            <p className="text-xs font-medium text-primary truncate">
              {formatNextAppointment(nextBooking.scheduledStart)}
            </p>
            <p className="mt-0.5 text-[10px] text-primary/80 truncate">
              {nextBooking.service.name}
            </p>
          </div>
        ) : (
          <p
            className={cn(
              "mt-3 text-xs break-words line-clamp-2 leading-relaxed",
              !hasConfiguredSchedule
                ? "text-amber-700 dark:text-amber-300/90 font-medium"
                : "text-muted-foreground"
            )}
          >
            {!hasConfiguredSchedule
              ? t("setHoursToActivate")
              : available
              ? availableSlotsToday > 0
                ? t("slotsRemainingToday", {
                    count: availableSlotsToday,
                    plural: availableSlotsToday === 1 ? "" : "s",
                  })
                : t("noMoreSlotsToday")
              : t("goOnlineToAccept")}
          </p>
        )}
      </div>
    </div>
  );
}
