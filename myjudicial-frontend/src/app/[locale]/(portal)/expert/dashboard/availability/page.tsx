"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, Save, Copy, Clock, CalendarCheck, Sparkles, SunMedium, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
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
  SkeletonList,
  ErrorState,
} from "@/shared/components/dashboard";
import { ScheduleNavigationTabs } from "@/features/experts/components/schedule-navigation-tabs";
import { getErrorMessage, cn } from "@/lib/utils";
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

  const hasSavedSchedule = Boolean(data?.status === 200 && (data.data.data?.length ?? 0) > 0);

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

  const isDirty = useMemo(() => {
    if (!hasSavedSchedule || data?.status !== 200) return true;
    const existing = data.data.data;
    if (existing.length !== schedule.length) return true;
    return schedule.some((d) => {
      const rec = existing.find((r) => r.dayOfWeek === d.dayOfWeek);
      if (!rec) return true;
      return (
        rec.isAvailable !== d.isAvailable ||
        rec.startTime !== d.startTime ||
        rec.endTime !== d.endTime
      );
    });
  }, [hasSavedSchedule, data, schedule]);

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

  const hasWeekendActive = useMemo(() => {
    return schedule.some(
      (d) => (d.dayOfWeek === "SATURDAY" || d.dayOfWeek === "SUNDAY") && d.isAvailable
    );
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

  function handleApplyTemplate(type: "standard" | "monSat" | "fullWeek" | "weekendOnly") {
    let newSchedule: DaySchedule[] = [];
    if (type === "standard") {
      newSchedule = DAYS.map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: day !== "SATURDAY" && day !== "SUNDAY",
      }));
      toast.success(tHub("appliedTemplate", { template: tHub("templateStandard") }));
    } else if (type === "monSat") {
      newSchedule = DAYS.map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: day === "SATURDAY" ? "13:00" : "17:00",
        isAvailable: day !== "SUNDAY",
      }));
      toast.success(tHub("appliedTemplate", { template: tHub("templateMonSat") }));
    } else if (type === "fullWeek") {
      newSchedule = DAYS.map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      }));
      toast.success(tHub("appliedTemplate", { template: tHub("templateFullWeek") }));
    } else if (type === "weekendOnly") {
      newSchedule = DAYS.map((day) => ({
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "16:00",
        isAvailable: day === "SATURDAY" || day === "SUNDAY",
      }));
      toast.success(tHub("appliedTemplate", { template: tHub("templateWeekendOnly") }));
    }
    setSchedule(newSchedule);
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
    <div className="p-2.5 min-[360px]:p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 min-w-0 max-w-6xl mx-auto">
      {/* Header with Live Schedule Status Badge */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground break-words">
              {t("title")}
            </h1>
            {!isLoading && (
              !hasSavedSchedule ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {t("notActivated")}
                </span>
              ) : isDirty ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 px-2.5 py-0.5 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {t("unsavedChanges")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium">
                  <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                  {t("activeSchedule")}
                </span>
              )
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">{t("subtitle")}</p>
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || isLoading || isError}
          className={cn(
            "rounded-xl shadow-xs transition-all h-9 px-4 font-semibold text-xs gap-2 shrink-0",
            !hasSavedSchedule
              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md ring-2 ring-primary/40 ring-offset-2"
              : isDirty
              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              : "bg-background hover:bg-muted text-muted-foreground border border-border"
          )}
        >
          {isSaving ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : !hasSavedSchedule ? (
            <Save className="h-4 w-4" />
          ) : isDirty ? (
            <Save className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>
            {!hasSavedSchedule
              ? t("saveAndActivate")
              : isDirty
              ? t("saveChanges")
              : t("saved")}
          </span>
        </Button>
      </div>

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
          {/* First-time Activation Banner when Schedule is not yet saved in DB */}
          {!hasSavedSchedule && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-4 sm:p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-foreground">
                        {t("firstTimeBannerTitle")}
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white dark:text-black">
                        {t("draftPreview")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      {t("firstTimeBannerDesc")}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md gap-2 ring-2 ring-primary/40 ring-offset-2"
                >
                  {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                  <span>{t("saveAndActivate")}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Quick Schedule Templates Bar */}
          <div className="p-3 sm:p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-foreground">
                  Schedule Templates
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyTemplate("standard")}
                  className="text-xs h-7.5 rounded-lg border-border/80 px-2.5 font-medium"
                >
                  {tHub("templateStandard")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyTemplate("monSat")}
                  className="text-xs h-7.5 rounded-lg border-border/80 px-2.5 font-medium bg-amber-500/5 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                >
                  {tHub("templateMonSat")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyTemplate("fullWeek")}
                  className="text-xs h-7.5 rounded-lg border-border/80 px-2.5 font-medium"
                >
                  {tHub("templateFullWeek")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyTemplate("weekendOnly")}
                  className="text-xs h-7.5 rounded-lg border-border/80 px-2.5 font-medium"
                >
                  {tHub("templateWeekendOnly")}
                </Button>
              </div>
            </div>

            {/* Weekend Highlight or Tip Banner */}
            {hasWeekendActive ? (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>{tHub("weekendBadge")}:</strong> Your public profile is open to receive client bookings on Saturdays or Sundays.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/60 text-muted-foreground border border-border/60 text-xs">
                <SunMedium className="h-4 w-4 text-amber-500 shrink-0" />
                <span>{tHub("weekendAdvice")}</span>
              </div>
            )}
          </div>

          {/* Summary & Fast Weekday Copy Banner */}
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
              {schedule.map((d) => {
                const isWeekend = d.dayOfWeek === "SATURDAY" || d.dayOfWeek === "SUNDAY";

                return (
                  <div
                    key={d.dayOfWeek}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 transition-colors",
                      isWeekend ? "bg-amber-500/[0.02] dark:bg-amber-400/[0.02]" : "hover:bg-muted/20"
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-[170px]">
                      <Switch
                        checked={d.isAvailable}
                        onCheckedChange={(checked) => updateDay(d.dayOfWeek, { isAvailable: checked })}
                        className="shrink-0"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {t(d.dayOfWeek.toLowerCase() as any)}
                        </span>
                        {isWeekend && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                            Weekend
                          </span>
                        )}
                      </div>
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Action Bar for Unsaved Changes or Activation */}
      {!isLoading && !isError && isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-foreground text-background shadow-2xl border border-border/40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{!hasSavedSchedule ? t("notActivatedFloatingText") : t("unsavedFloatingText")}</span>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="h-8 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-3 text-xs gap-1.5"
          >
            {isSaving ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            <span>{!hasSavedSchedule ? t("saveAndActivate") : t("saveChanges")}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
