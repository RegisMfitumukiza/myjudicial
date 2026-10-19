"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Loader2, ArrowRight } from "lucide-react";
import { format, addDays } from "date-fns";
import { useAvailableSlots } from "../hooks/useAvailableSlots";
import { useTranslations, useLocale } from "next-intl";

interface AvailabilityPreviewProps {
  expertId: string;
  timezone?: string;
  onBookClick?: () => void;
}

export function AvailabilityPreview({ expertId, timezone, onBookClick }: AvailabilityPreviewProps) {
  const t = useTranslations("expertDashboard_availability-preview");
  const tBooking = useTranslations("booking");
  const tHub = useTranslations("expertDashboard_scheduleHub");
  const locale = useLocale();
  const [searchDate, setSearchDate] = useState(0);
  const dateStr = format(addDays(new Date(), searchDate), "yyyy-MM-dd");
  const { slots, isLoading } = useAvailableSlots(
    expertId,
    dateStr,
    undefined,
  );

  const nextSlot = slots.length > 0 ? slots[0] : null;
  const nextSlotTime = nextSlot
    ? new Date(nextSlot.start).toLocaleTimeString(locale, {
        hour: "numeric",
        minute: "2-digit",
        ...(timezone ? { timeZone: timezone } : {}),
      })
    : null;
  const nextSlotDate = nextSlot ? format(new Date(nextSlot.start), "EEE, MMM d") : null;

  useEffect(() => {
    if (!isLoading && !nextSlot && searchDate < 14) {
      setSearchDate((prev) => prev + 1);
    }
  }, [isLoading, nextSlot, searchDate]);

  if (isLoading && searchDate === 0) {
    return (
      <div className="flex items-center gap-2 text-brand-dark/50 dark:text-white/50">
        <Loader2 size={14} className="animate-spin" />
        <span className="text-[13px]">{t("checkingAvailability")}</span>
      </div>
    );
  }

  if (!nextSlot && searchDate < 14) {
    return (
      <div className="flex items-center gap-2 text-brand-dark/50 dark:text-white/50">
        <Loader2 size={14} className="animate-spin" />
        <span className="text-[13px]">{t("scanningNext14Days", { searchDate })}</span>
      </div>
    );
  }

  if (!nextSlot) {
    return (
      <div className="flex items-center gap-2 text-brand-dark/50 dark:text-white/50">
        <Calendar size={14} />
        <span className="text-[13px]">{t("noAvailabilityIn14Days")}</span>
      </div>
    );
  }

  const isWeekendSlot = nextSlot
    ? new Date(nextSlot.start).getDay() === 0 || new Date(nextSlot.start).getDay() === 6
    : false;

  return (
    <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-3 rounded-xl border border-brand-border/20 bg-brand-dark/5 p-3 sm:p-3.5 dark:border-white/20 dark:bg-white/5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-dark/10 dark:bg-white/10">
          <Calendar size={18} className="text-brand-dark dark:text-white shrink-0" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[11px] sm:text-[12px] text-brand-dark/60 dark:text-white/60">{t("nextAvailable")}</p>
            {isWeekendSlot && (
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                {tHub("weekendBadgeShort")}
              </span>
            )}
          </div>
          <p className="text-[13px] sm:text-[14px] font-bold text-brand-dark dark:text-white break-words">
            {tBooking("dateAtTime", { date: nextSlotDate ?? "", time: nextSlotTime ?? "" })}
          </p>
        </div>
      </div>
      {onBookClick && (
        <button
          onClick={onBookClick}
          className="w-full min-[380px]:w-auto shrink-0 whitespace-nowrap justify-center flex items-center gap-1.5 rounded-lg bg-brand-dark px-3 py-2 text-[12px] font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all dark:bg-white dark:text-black cursor-pointer"
        >
          <span>{t("bookNow")}</span>
          <ArrowRight size={12} className="shrink-0" />
        </button>
      )}
    </div>
  );
}
