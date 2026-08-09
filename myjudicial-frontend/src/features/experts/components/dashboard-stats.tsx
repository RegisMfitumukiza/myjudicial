"use client";

import { Clock, Star, Sun, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const tCommon = useTranslations("common");
  
  function formatNextAppointment(scheduledStart: string): string {
    const target = new Date(scheduledStart);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    
    if (diffMin < 0) return tCommon("startingNow") || "Starting now";
    if (diffMin < 60) return tCommon("inMinutes", { minutes: diffMin }) || `In ${diffMin} min`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return tCommon("inHours", { hours: diffHr }) || `In ${diffHr} hour${diffHr === 1 ? "" : "s"}`;
    return target.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  }
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-brand-blue/20 bg-gradient-to-br from-brand-blue/5 to-white p-5 shadow-sm dark:border-brand-blue/30 dark:from-brand-blue/10 dark:to-gray-900 transition-all duration-200 hover:shadow-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t("availableFunds")}</p>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {availableFundsRwf.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-gray-400">RWF</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
          <Wallet size={12} />
          {pendingEscrowRwf.toLocaleString()} RWF {t("pendingEscrow")}
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("activeBookings")}</p>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
            <Clock size={15} />
          </span>
        </div>
        <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">{activeBookings}</p>
        <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          {pendingBookings} {t("pendingBookings", { count: pendingBookings })}
        </p>
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("clientRating")}</p>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500 dark:bg-amber-900/30">
            <Star size={15} />
          </span>
        </div>
        <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
          {clientRating !== null ? clientRating.toFixed(1) : "—"}
        </p>
        <p className="mt-2 text-xs font-medium text-brand-blue">
          {reviewCount > 0 ? t("basedOnReviews", { count: reviewCount }) : t("noReviewsYet")}
        </p>
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-3">
          <Sun size={15} className={available ? "text-green-500" : "text-gray-400"} />
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t("availability")}</p>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${available ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
            {available ? "🟢 Online" : "⚫ Offline"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={available}
            disabled={isTogglingAvailable}
            onClick={() => onToggleAvailable(!available)}
            className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors disabled:opacity-60 ${
              available ? "bg-green-500" : "bg-gray-200 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                available ? "translate-x-[18px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        
        {/* Next Appointment */}
        {nextBooking ? (
          <div className="mt-3 rounded-lg bg-blue-50 p-2.5 dark:bg-blue-950/30">
            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">{t("nextBooking")}</p>
            <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
              {formatNextAppointment(nextBooking.scheduledStart)}
            </p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
              {nextBooking.service.name}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
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
