"use client";

import { format } from "date-fns";
import { Clock, Loader2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface TimeSlot {
  start: string;
  end: string;
}

interface TimeSlotListProps {
  slots: TimeSlot[];
  selectedSlot?: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
  isLoading?: boolean;
  error?: boolean;
  layout?: "grid" | "list";
  timezone?: string;
}

function formatSlotTime(isoString: string, timezone?: string): string {
  const date = new Date(isoString);
  if (timezone) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    });
  }
  return format(date, "h:mm a");
}

export function TimeSlotList({
  slots,
  selectedSlot,
  onSelect,
  isLoading = false,
  error = false,
  layout = "grid",
  timezone,
}: TimeSlotListProps) {
  const t = useTranslations("booking");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-brand-dark/50 dark:text-white/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-6 w-6 text-brand-alert mb-2" />
        <p className="text-[13px] text-brand-alert">{t("failedToLoadSlots")}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-brand-border/20 bg-brand-dark/5 p-8 text-center dark:border-white/20 dark:bg-white/5">
        <p className="text-[13px] text-brand-dark/60 dark:text-white/60">
          {t("noAvailableSlots")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className={layout === "grid" ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "grid grid-cols-3 gap-2 sm:grid-cols-1"}>
        {slots.map((slot) => {
          const isSelected = selectedSlot?.start === slot.start;
          return (
            <button
              key={slot.start}
              type="button"
              onClick={() => onSelect(slot)}
              className={`rounded-lg border py-2 text-xs font-semibold transition-colors ${
                isSelected
                  ? "border-brand-dark bg-brand-dark text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-brand-border/20 text-brand-dark hover:border-brand-dark/30 hover:bg-brand-dark/5 dark:border-white/20 dark:text-white dark:hover:border-white/40"
              }`}
            >
              {formatSlotTime(slot.start, timezone)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
