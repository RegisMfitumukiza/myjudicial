"use client";

import { Clock, Star, Sun, Wallet } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

import { Switch } from "@/shared/components/ui/switch";

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
    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{t("availableFunds")}</p>
          <div className="mt-2 flex items-baseline gap-1.5 min-w-0">
            <span className="text-xl sm:text-2xl font-semibold tabular-nums text-foreground truncate">
              {availableFundsRwf.toLocaleString()}
            </span>
            <span className="text-sm font-normal text-muted-foreground shrink-0">RWF</span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground truncate">
          <Wallet size={12} className="shrink-0" aria-hidden="true" />
          <span className="truncate">{pendingEscrowRwf.toLocaleString()} RWF {t("pendingEscrow")}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{t("activeBookings")}</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Clock size={15} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-semibold tabular-nums text-foreground">{activeBookings}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground truncate">
          {pendingBookings} {t("pendingBookings", { count: pendingBookings })}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{t("clientRating")}</p>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Star size={15} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-semibold tabular-nums text-foreground">
            {clientRating !== null ? clientRating.toFixed(1) : "—"}
          </p>
        </div>
        <p className="mt-1 text-xs text-primary truncate">
          {reviewCount > 0
            ? t("basedOnReviews", { count: reviewCount, plural: reviewCount === 1 ? "" : "s" })
            : t("noReviewsYet")}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sun
                size={15}
                aria-hidden="true"
                className={`shrink-0 ${available ? "text-primary" : "text-muted-foreground"}`}
              />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{t("availability")}</p>
            </div>
            <Switch
              checked={available}
              disabled={isTogglingAvailable}
              onCheckedChange={(next) => onToggleAvailable(next)}
              aria-label={available ? tDashboard("onlineAvailable") : tDashboard("offline")}
            />
          </div>

          <p className={`mt-2 text-xl sm:text-2xl font-semibold tabular-nums truncate ${available ? "text-primary" : "text-muted-foreground"}`}>
            {available ? tDashboard("onlineAvailable") : tDashboard("offline")}
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
          <p className="mt-3 text-xs text-muted-foreground truncate">
            {available
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
