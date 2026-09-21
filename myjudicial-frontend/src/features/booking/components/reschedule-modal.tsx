"use client";

import { useState } from "react";
import { X, Calendar, Clock, ArrowRight, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { format, addDays, startOfToday } from "date-fns";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAvailableSlots } from "../hooks/useAvailableSlots";
import { TimeSlotList } from "./time-slot-list";
import { TimeZonePicker } from "./timezone-picker";
import { getLocalizedServiceName } from "@/shared/utils/service-localization";

interface RescheduleModalProps {
  bookingId: string;
  expertId: string;
  serviceName?: string;
  currentStart: string;
  currentEnd: string;
  durationMin?: number;
  isPending: boolean;
  onReschedule: (data: {
    bookingId: string;
    scheduledStart: string;
    scheduledEnd: string;
    reason?: string;
  }) => void;
  onClose: () => void;
}

export function RescheduleModal({
  expertId,
  serviceName,
  currentStart,
  currentEnd,
  durationMin = 60,
  isPending,
  onReschedule,
  onClose,
}: RescheduleModalProps) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [reason, setReason] = useState("");
  const [timezone, setTimezone] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mj_timezone") || "Africa/Kigali";
    }
    return "Africa/Kigali";
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { slots, isLoading: slotsLoading, error: slotsError } = useAvailableSlots(
    step === "select" ? expertId : undefined,
    step === "select" ? dateStr : undefined,
  );

  const dateOptions = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));

  const handleSlotSelect = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!selectedSlot) return;
    onReschedule({
      bookingId: "", // caller sets this
      scheduledStart: selectedSlot.start,
      scheduledEnd: selectedSlot.end,
      reason: reason.trim() || undefined,
    });
  };

  const currentDate = new Date(currentStart);
  const newDate = selectedSlot ? new Date(selectedSlot.start) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-black shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-border/20 bg-white px-6 py-4 dark:border-white/20 dark:bg-black">
          <h2 className="text-[18px] font-bold text-brand-dark dark:text-white">
            {step === "select" ? t("rescheduleBooking") : t("confirmNewTime")}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark/10 text-brand-dark hover:bg-brand-dark/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          {/* Current Booking Info */}
          <div className="mb-6 rounded-xl border border-brand-border/20 bg-brand-dark/5 p-4 dark:border-white/20 dark:bg-white/5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-2">
              {t("currentSchedule")}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-dark/10 dark:bg-white/10">
                <Clock size={18} className="text-brand-dark dark:text-white" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-brand-dark dark:text-white">
                  {currentDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-[12px] text-brand-dark/60 dark:text-white/60">
                  {currentDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  &ndash;{" "}
                  {new Date(currentEnd).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  {serviceName ? ` \u00b7 ${getLocalizedServiceName(serviceName, t)}` : ""}
                  {durationMin ? ` \u00b7 ${durationMin} min` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Step 1: Select Date & Time */}
          {step === "select" && (
            <div className="space-y-6">
              {/* Date Picker */}
              <div>
                <h3 className="text-[14px] font-bold text-brand-dark dark:text-white mb-3 flex items-center gap-2">
                  <Calendar size={16} />
                  {t("pickNewDate")}
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {dateOptions.map((date) => {
                    const isSelected = format(date, "yyyy-MM-dd") === dateStr;
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedSlot(null);
                        }}
                        className={`rounded-lg border p-3 text-center transition-colors ${
                          isSelected
                            ? "border-brand-dark bg-brand-dark text-white dark:border-white dark:bg-white dark:text-black"
                            : "border-brand-border/20 hover:bg-brand-dark/5 dark:border-white/20 dark:hover:bg-white/5"
                        }`}
                      >
                        <p className="text-[11px] font-semibold">{format(date, "EEE")}</p>
                        <p className="text-[16px] font-bold">{format(date, "d")}</p>
                        <p className="text-[10px]">{format(date, "MMM")}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-bold text-brand-dark dark:text-white flex items-center gap-2">
                    <Clock size={16} />
                    {t("availableSlots")}
                  </h3>
                  <TimeZonePicker
                    value={timezone}
                    onChange={(tz) => {
                      setTimezone(tz);
                      localStorage.setItem("mj_timezone", tz);
                    }}
                  />
                </div>
                <TimeSlotList
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelect={handleSlotSelect}
                  isLoading={slotsLoading}
                  error={!!slotsError}
                  timezone={timezone}
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-[13px] font-semibold text-brand-dark dark:text-white mb-2 block">
                  {t("reasonForRescheduling")}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("rescheduleReasonPlaceholder")}
                  maxLength={300}
                  rows={2}
                  className="w-full rounded-lg border border-brand-border/20 bg-white px-4 py-3 text-[13px] text-brand-dark outline-none placeholder:text-brand-dark/30 focus:border-brand-dark dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-white/30 dark:focus:border-white"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-brand-border/20 text-[13px]"
                  disabled={isPending}
                >
                  {tCommon("cancel")}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === "confirm" && selectedSlot && (
            <div className="space-y-6">
              {/* Before / After Comparison */}
              <div className="rounded-xl border border-brand-border/20 bg-white p-4 dark:border-white/20 dark:bg-black">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  {/* Current */}
                  <div className="text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-1">
                      {t("current")}
                    </p>
                    <p className="text-[14px] font-bold text-brand-dark dark:text-white">
                      {currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-[12px] text-brand-dark/60 dark:text-white/60">
                      {currentDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark/10 dark:bg-white/10">
                    <ArrowRight size={14} className="text-brand-dark dark:text-white" />
                  </div>

                  {/* New */}
                  <div className="text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-1">
                      {t("new")}
                    </p>
                    <p className="text-[14px] font-bold text-brand-dark dark:text-white">
                      {newDate!.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-[12px] text-brand-dark/60 dark:text-white/60">
                      {newDate!.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason display */}
              {reason.trim() && (
                <div className="rounded-xl bg-brand-dark/5 p-4 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-1">
                    {t("reason")}
                  </p>
                  <p className="text-[13px] text-brand-dark dark:text-white">{reason}</p>
                </div>
              )}

              {/* Info */}
              <div className="rounded-xl bg-brand-dark/5 p-4 text-center dark:bg-white/5">
                <p className="text-[11px] text-brand-dark/60 dark:text-white/60">
                  {t("otherPartyNotified")}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("select")}
                  className="flex-1 border-brand-border/20 text-[13px]"
                  disabled={isPending}
                >
                  <ArrowLeft className="mr-2" size={14} />
                  {tCommon("back")}
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-brand-dark py-6 text-[14px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("rescheduling")}
                    </>
                  ) : (
                    <>
                      {t("confirmReschedule")}
                      <ArrowRight className="ml-2" size={16} />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
