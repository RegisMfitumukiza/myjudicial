"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Loader2, Save } from "lucide-react";
import {
  useGetExpertsAvailability,
  usePatchExpertsAvailability,
  getGetExpertsAvailabilityQueryKey,
} from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/shared/components/ui/switch";
import { useTranslations } from "next-intl";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

type DaySchedule = { dayOfWeek: (typeof DAYS)[number]; startTime: string; endTime: string; isAvailable: boolean };

function defaultSchedule(): DaySchedule[] {
  return DAYS.map((day) => ({
    dayOfWeek: day,
    startTime: "09:00",
    endTime: "17:00",
    isAvailable: day !== "SATURDAY" && day !== "SUNDAY",
  }));
}

export default function AvailabilityPage() {
  const t = useTranslations("expertDashboard_availability");
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetExpertsAvailability();
  const { mutate: saveAvailability, isPending: isSaving } = usePatchExpertsAvailability();
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated || data?.status !== 200) return;
    const existing = data.data.data;
    if (existing.length === 0) {
      setHydrated(true);
      return;
    }
    setSchedule(
      DAYS.map((day) => {
        const record = existing.find((r) => r.dayOfWeek === day);
        return record
          ? { dayOfWeek: day, startTime: record.startTime, endTime: record.endTime, isAvailable: record.isAvailable }
          : { dayOfWeek: day, startTime: "09:00", endTime: "17:00", isAvailable: false };
      })
    );
    setHydrated(true);
  }, [data, hydrated]);

  function updateDay(day: (typeof DAYS)[number], patch: Partial<DaySchedule>) {
    setSchedule((prev) => prev.map((d) => (d.dayOfWeek === day ? { ...d, ...patch } : d)));
  }

  function handleSave() {
    saveAvailability(
      { data: { schedule } },
      {
        onSuccess: () => {
          toast.success(t("saveSuccess"));
          queryClient.invalidateQueries({ queryKey: getGetExpertsAvailabilityQueryKey() });
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t("saveError"));
        },
      }
    );
  }

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <div className="mb-6 flex shrink-0 items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-brand-dark dark:text-white">{t("title")}</h1>
          <p className="mt-1 text-sm text-brand-dark/60 dark:text-white/60">
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading || isError}
          className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90 disabled:opacity-60"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {t("saveSchedule")}
        </button>
      </div>

      <div className="rounded-xl border border-brand-border/20 bg-white p-2 shadow-md dark:border-white/20 dark:bg-black">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {DAYS.map((d) => (
              <div key={d} className="h-12 animate-pulse rounded-lg bg-brand-dark/5 dark:bg-white/5" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-brand-alert" />
            <p className="text-sm font-medium text-brand-dark dark:text-white">
              {t("loadError")}
            </p>
            <p className="text-sm text-brand-dark/60 dark:text-white/60">
              {t("loadErrorDesc")}
            </p>
            <button
              onClick={() => refetch()}
              className="rounded-lg border border-brand-border/30 px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-dark/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              {t("tryAgain")}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-brand-border/10 dark:divide-white/10">
            {schedule.map((d) => (
              <div key={d.dayOfWeek} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <Switch
                  checked={d.isAvailable}
                  onCheckedChange={(checked) => updateDay(d.dayOfWeek, { isAvailable: checked })}
                />
                <span className="w-24 shrink-0 text-sm font-semibold text-brand-dark dark:text-white">
                  {t(d.dayOfWeek.toLowerCase() as any)}
                </span>
                {d.isAvailable ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time"
                      value={d.startTime}
                      onChange={(e) => updateDay(d.dayOfWeek, { startTime: e.target.value })}
                      className="rounded-lg border border-brand-border/30 bg-white px-2 py-1 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                    />
                    <span className="text-brand-dark/40 dark:text-white/40">{t("to")}</span>
                    <input
                      type="time"
                      value={d.endTime}
                      onChange={(e) => updateDay(d.dayOfWeek, { endTime: e.target.value })}
                      className="rounded-lg border border-brand-border/30 bg-white px-2 py-1 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-brand-dark/40 dark:text-white/40">{t("unavailable")}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
