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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("availableFunds")}</p>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {availableFundsRwf.toLocaleString()}
          </span>
          <span className="text-sm font-normal text-muted-foreground">RWF</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Wallet size={12} aria-hidden="true" />
          {pendingEscrowRwf.toLocaleString()} RWF {t("pendingEscrow")}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("activeBookings")}</p>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock size={15} aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{activeBookings}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {pendingBookings} {t("pendingBookings", { count: pendingBookings })}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("clientRating")}</p>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Star size={15} aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
          {clientRating !== null ? clientRating.toFixed(1) : "—"}
        </p>
        <p className="mt-1 text-xs text-primary">
          {reviewCount > 0 ? t("basedOnReviews", { count: reviewCount }) : t("noReviewsYet")}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sun
              size={15}
              aria-hidden="true"
              className={available ? "text-primary" : "text-muted-foreground"}
            />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("availability")}</p>
          </div>
          <Switch
            checked={available}
            disabled={isTogglingAvailable}
            onCheckedChange={(next) => onToggleAvailable(next)}
            aria-label={available ? tDashboard("onlineAvailable") : tDashboard("offline")}
          />
        </div>

        <p className={`mt-2 text-2xl font-semibold tabular-nums ${available ? "text-primary" : "text-muted-foreground"}`}>
          {available ? tDashboard("onlineAvailable") : tDashboard("offline")}
        </p>

        {nextBooking ? (
          <div className="mt-3 rounded-lg bg-primary/10 p-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{t("nextBooking")}</p>
            <p className="text-xs font-medium text-primary">
              {formatNextAppointment(nextBooking.scheduledStart)}
            </p>
            <p className="mt-0.5 text-[10px] text-primary/80">
              {nextBooking.service.name}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            {available
              ? availableSlotsToday > 0
                ? t("slotsRemainingToday", { count: availableSlotsToday })
                : t("noMoreSlotsToday")
              : t("goOnlineToAccept")}
          </p>
        )}
      </div>
    </div>
  );
}
