"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Save, Copy, Clock, CalendarCheck } from "lucide-react";
import {
  useGetExpertsAvailability,
  usePatchExpertsAvailability,
  getGetExpertsAvailabilityQueryKey,
} from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/shared/components/ui/switch";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  PageHeader,
  SkeletonList,
  ErrorState,
} from "@/shared/components/dashboard";
import { ScheduleNavigationTabs } from "@/features/experts/components/schedule-navigation-tabs";
import { getErrorMessage } from "@/lib/utils";
import { useTranslations } from "next-intl";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

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
  const tHub = useTranslations("expertDashboard_scheduleHub");
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

  const scheduleMetrics = useMemo(() => {
    let totalMinutes = 0;
    let activeDays = 0;
    schedule.forEach((d) => {
      if (d.isAvailable && d.startTime && d.endTime) {
        activeDays++;
        const [sh, sm] = d.startTime.split(":").map(Number);
        const [eh, em] = d.endTime.split(":").map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff > 0) totalMinutes += diff;
      }
    });
    return {
      hours: Math.round((totalMinutes / 60) * 10) / 10,
      activeDays,
    };
  }, [schedule]);

  function updateDay(day: (typeof DAYS)[number], patch: Partial<DaySchedule>) {
    setSchedule((prev) => prev.map((d) => (d.dayOfWeek === day ? { ...d, ...patch } : d)));
  }

  function handleApplyMonToWeekdays() {
    const monday = schedule.find((s) => s.dayOfWeek === "MONDAY");
    if (!monday) return;
    const weekdays = new Set(["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
    setSchedule((prev) =>
      prev.map((d) =>
        weekdays.has(d.dayOfWeek)
          ? { ...d, startTime: monday.startTime, endTime: monday.endTime, isAvailable: monday.isAvailable }
          : d
      )
    );
    toast.success(tHub("appliedMonToWeekdays"));
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
          toast.error(getErrorMessage(error, t("saveError")));
        },
      }
    );
  }

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0 max-w-6xl mx-auto">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        className="mb-4 shrink-0"
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isLoading || isError}
            className="rounded-xl shadow-xs"
          >
            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            <span>{t("saveSchedule")}</span>
          </Button>
        }
      />

      {/* Shared Schedule Hub Tabs */}
      <ScheduleNavigationTabs />

      {isLoading ? (
        <SkeletonList count={7} itemClassName="h-14" />
      ) : isError ? (
        <ErrorState
          title={t("loadError")}
          message={t("loadErrorDesc")}
          retryLabel={t("tryAgain")}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-4">
          {/* Summary & Fast Actions Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4 rounded-xl border border-border/80 bg-muted/40 text-foreground">
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>{tHub("totalWeeklyHours", { hours: scheduleMetrics.hours })}</span>
              </div>
              <span className="hidden sm:inline text-border">•</span>
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                <span>{tHub("daysActive", { count: scheduleMetrics.activeDays })}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyMonToWeekdays}
              className="text-xs font-medium rounded-lg border-border/80 h-8 self-start sm:self-auto gap-1.5"
            >
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{tHub("applyMonToWeekdays")}</span>
            </Button>
          </div>

          {/* Schedule List Card */}
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <div className="divide-y divide-border/70">
              {schedule.map((d) => (
                <div
                  key={d.dayOfWeek}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-[140px]">
                    <Switch
                      checked={d.isAvailable}
                      onCheckedChange={(checked) => updateDay(d.dayOfWeek, { isAvailable: checked })}
                      className="shrink-0"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {t(d.dayOfWeek.toLowerCase() as any)}
                    </span>
                  </div>

                  {d.isAvailable ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm pl-12 sm:pl-0">
                      <Input
                        type="time"
                        value={d.startTime}
                        onChange={(e) => updateDay(d.dayOfWeek, { startTime: e.target.value })}
                        className="h-8.5 w-28 min-[380px]:w-32 px-2.5 rounded-lg text-xs sm:text-sm bg-background border-border/80"
                      />
                      <span className="text-xs text-muted-foreground font-medium px-1">{t("to")}</span>
                      <Input
                        type="time"
                        value={d.endTime}
                        onChange={(e) => updateDay(d.dayOfWeek, { endTime: e.target.value })}
                        className="h-8.5 w-28 min-[380px]:w-32 px-2.5 rounded-lg text-xs sm:text-sm bg-background border-border/80"
                      />
                      <span className="hidden md:inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Available
                      </span>
                    </div>
                  ) : (
                    <div className="pl-12 sm:pl-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {t("unavailable")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
