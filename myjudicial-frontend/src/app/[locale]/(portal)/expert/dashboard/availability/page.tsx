"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Copy,
  Clock,
  CalendarCheck,
  Sparkles,
  SunMedium,
  CheckCircle2,
  SlidersHorizontal,
  Info,
} from "lucide-react";
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

type DayOfWeek = (typeof DAYS)[number];
type DaySchedule = { dayOfWeek: DayOfWeek; startTime: string; endTime: string; isAvailable: boolean };
type TemplatePreset = "standard" | "monSat" | "fullWeek" | "weekendOnly" | "custom";

function defaultSchedule(): DaySchedule[] {
  return DAYS.map((day) => ({
    dayOfWeek: day,
    startTime: "09:00",
    endTime: "17:00",
    isAvailable: day !== "SATURDAY" && day !== "SUNDAY",
  }));
}

function getEffectiveDbSchedule(dbRecords: DaySchedule[] | undefined): DaySchedule[] {
  return DAYS.map((day) => {
    const rec = dbRecords?.find((r) => r.dayOfWeek === day);
    return rec
      ? { dayOfWeek: day, startTime: rec.startTime, endTime: rec.endTime, isAvailable: rec.isAvailable }
      : { dayOfWeek: day, startTime: "09:00", endTime: "17:00", isAvailable: false };
  });
}

function isScheduleEqual(a: DaySchedule[], b: DaySchedule[]): boolean {
  return DAYS.every((day) => {
    const dayA = a.find((d) => d.dayOfWeek === day);
    const dayB = b.find((d) => d.dayOfWeek === day);
    if (!dayA || !dayB) return false;
    if (dayA.isAvailable !== dayB.isAvailable) return false;
    if (dayA.isAvailable) {
      if (dayA.startTime !== dayB.startTime || dayA.endTime !== dayB.endTime) return false;
    }
    return true;
  });
}

function matchesStandard(sched: DaySchedule[]): boolean {
  return sched.every((d) => {
    if (d.dayOfWeek === "SATURDAY" || d.dayOfWeek === "SUNDAY") {
      return !d.isAvailable;
    }
    return d.isAvailable && d.startTime === "09:00" && d.endTime === "17:00";
  });
}

function matchesMonSat(sched: DaySchedule[]): boolean {
  return sched.every((d) => {
    if (d.dayOfWeek === "SUNDAY") return !d.isAvailable;
    if (d.dayOfWeek === "SATURDAY") {
      return d.isAvailable && d.startTime === "09:00" && d.endTime === "13:00";
    }
    return d.isAvailable && d.startTime === "09:00" && d.endTime === "17:00";
  });
}

function matchesFullWeek(sched: DaySchedule[]): boolean {
  return sched.every((d) => {
    return d.isAvailable && d.startTime === "09:00" && d.endTime === "17:00";
  });
}

function matchesWeekendOnly(sched: DaySchedule[]): boolean {
  return sched.every((d) => {
    if (d.dayOfWeek === "SATURDAY" || d.dayOfWeek === "SUNDAY") {
      return d.isAvailable && d.startTime === "10:00" && d.endTime === "16:00";
    }
    return !d.isAvailable;
  });
}

export default function AvailabilityPage() {
  const t = useTranslations("expertDashboard_availability");
  const tHub = useTranslations("expertDashboard_scheduleHub");
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useGetExpertsAvailability();
  const { mutate: saveAvailability, isPending: isSaving } = usePatchExpertsAvailability();
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule());
  const [hydrated, setHydrated] = useState(false);

  // Normalize DB schedule: missing records are treated as isAvailable: false
  const savedDbSchedule = useMemo(() => {
    if (data?.status !== 200 || !data.data?.data) return null;
    return getEffectiveDbSchedule(data.data.data as DaySchedule[]);
  }, [data]);

  // Expert has an active saved schedule if DB exists and at least one day is available
  const hasSavedSchedule = useMemo(() => {
    if (!savedDbSchedule) return false;
    return savedDbSchedule.some((d) => d.isAvailable);
  }, [savedDbSchedule]);

  // Hydrate local state from DB on first load or when query completes
  useEffect(() => {
    if (hydrated || !savedDbSchedule) return;
    if (hasSavedSchedule) {
      setSchedule(savedDbSchedule);
    }
    setHydrated(true);
  }, [savedDbSchedule, hasSavedSchedule, hydrated]);

  // Is current local state dirty compared to DB
  const isDirty = useMemo(() => {
    if (!savedDbSchedule) return false;
    return !isScheduleEqual(schedule, savedDbSchedule);
  }, [schedule, savedDbSchedule]);

  // Detect which preset matches the editor currently
  const currentPreset: TemplatePreset = useMemo(() => {
    if (matchesStandard(schedule)) return "standard";
    if (matchesMonSat(schedule)) return "monSat";
    if (matchesFullWeek(schedule)) return "fullWeek";
    if (matchesWeekendOnly(schedule)) return "weekendOnly";
    return "custom";
  }, [schedule]);

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

  const liveDaysSummary = useMemo(() => {
    if (!savedDbSchedule) return "";
    const active = savedDbSchedule.filter((d) => d.isAvailable);
    if (active.length === 0) return "";
    return active
      .map((d) => `${t(d.dayOfWeek.toLowerCase() as any)} (${d.startTime}–${d.endTime})`)
      .join(", ");
  }, [savedDbSchedule, t]);

  const hasWeekendActive = useMemo(() => {
    return schedule.some(
      (d) => (d.dayOfWeek === "SATURDAY" || d.dayOfWeek === "SUNDAY") && d.isAvailable
    );
  }, [schedule]);

  function updateDay(day: DayOfWeek, patch: Partial<DaySchedule>) {
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

  function handleSave(scheduleToSave?: DaySchedule[] | React.MouseEvent) {
    const toSave = Array.isArray(scheduleToSave) ? scheduleToSave : schedule;
    saveAvailability(
      { data: { schedule: toSave } },
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

  function handleApplyTemplate(type: "standard" | "monSat" | "fullWeek" | "weekendOnly") {
    let newSchedule: DaySchedule[] = [];
    let templateName = "";

    if (type === "standard") {
      newSchedule = DAYS.map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: day !== "SATURDAY" && day !== "SUNDAY",
      }));
      templateName = tHub("templateStandard");
    } else if (type === "monSat") {
      newSchedule = DAYS.map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: day === "SATURDAY" ? "13:00" : "17:00",
        isAvailable: day !== "SUNDAY",
      }));
      templateName = tHub("templateMonSat");
    } else if (type === "fullWeek") {
      newSchedule = DAYS.map((day) => ({
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isAvailable: true,
      }));
      templateName = tHub("templateFullWeek");
    } else if (type === "weekendOnly") {
      newSchedule = DAYS.map((day) => ({
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "16:00",
        isAvailable: day === "SATURDAY" || day === "SUNDAY",
      }));
      templateName = tHub("templateWeekendOnly");
    }

    setSchedule(newSchedule);

    toast.info(tHub("templateLoadedHint", { template: templateName }), {
      action: {
        label: tHub("saveNow"),
        onClick: () => handleSave(newSchedule),
      },
      duration: 6000,
    });
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

          {/* Quick Schedule Presets Bar */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-foreground">
                    {tHub("presetsTitle")}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  {tHub("presetsSubtitle")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant={currentPreset === "standard" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleApplyTemplate("standard")}
                  className={cn(
                    "text-xs h-7.5 rounded-lg px-2.5 font-medium transition-all",
                    currentPreset === "standard"
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "border-border/80 hover:bg-muted/60"
                  )}
                >
                  {currentPreset === "standard" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {tHub("templateStandard")}
                </Button>
                <Button
                  type="button"
                  variant={currentPreset === "monSat" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleApplyTemplate("monSat")}
                  className={cn(
                    "text-xs h-7.5 rounded-lg px-2.5 font-medium transition-all",
                    currentPreset === "monSat"
                      ? "bg-amber-600 text-white dark:bg-amber-500 dark:text-black font-semibold shadow-xs"
                      : "border-border/80 bg-amber-500/5 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                  )}
                >
                  {currentPreset === "monSat" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {tHub("templateMonSat")}
                </Button>
                <Button
                  type="button"
                  variant={currentPreset === "fullWeek" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleApplyTemplate("fullWeek")}
                  className={cn(
                    "text-xs h-7.5 rounded-lg px-2.5 font-medium transition-all",
                    currentPreset === "fullWeek"
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "border-border/80 hover:bg-muted/60"
                  )}
                >
                  {currentPreset === "fullWeek" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {tHub("templateFullWeek")}
                </Button>
                <Button
                  type="button"
                  variant={currentPreset === "weekendOnly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleApplyTemplate("weekendOnly")}
                  className={cn(
                    "text-xs h-7.5 rounded-lg px-2.5 font-medium transition-all",
                    currentPreset === "weekendOnly"
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "border-border/80 hover:bg-muted/60"
                  )}
                >
                  {currentPreset === "weekendOnly" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {tHub("templateWeekendOnly")}
                </Button>

                {currentPreset === "custom" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted text-foreground border border-border">
                    <SlidersHorizontal className="h-3 w-3 text-primary" />
                    {tHub("customPreset")}
                  </span>
                )}
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

          {/* Client Visibility & Weekday Copy Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-4 rounded-xl border border-border/80 bg-muted/40 text-foreground">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{tHub("totalWeeklyHours", { hours: scheduleMetrics.hours })}</span>
                </div>
                <span className="hidden sm:inline text-border">•</span>
                <div className="flex items-center gap-1.5">
                  <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                  <span>{tHub("daysActive", { count: scheduleMetrics.activeDays })}</span>
                </div>
                <span className="hidden sm:inline text-border">•</span>
                <div className="flex items-center gap-1.5">
                  {isDirty ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-[11px] font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {t("unsavedChanges")}
                    </span>
                  ) : hasSavedSchedule ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-medium">
                      <CheckCircle2 size={11} className="text-emerald-600 dark:text-emerald-400" />
                      {t("activeSchedule")}
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="text-[11px] sm:text-xs text-muted-foreground/90">
                {!hasSavedSchedule ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {tHub("clientVisibilityNone")}
                  </span>
                ) : isDirty ? (
                  <span>
                    <strong>{tHub("clientVisibilityTitle")}:</strong> {tHub("clientVisibilityUnsaved")}{" "}
                    {liveDaysSummary && (
                      <span className="text-foreground/80">({tHub("clientVisibilityLive")} {liveDaysSummary})</span>
                    )}
                  </span>
                ) : (
                  <span>
                    <strong>{tHub("clientVisibilityTitle")}:</strong> {tHub("clientVisibilityLive")} {liveDaysSummary}
                  </span>
                )}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyMonToWeekdays}
              className="text-xs font-medium rounded-lg border-border/80 h-8 shrink-0 self-start sm:self-auto gap-1.5"
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
