"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
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
import { getErrorMessage } from "@/lib/utils";
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
          toast.error(getErrorMessage(error, t("saveError")));
        },
      }
    );
  }

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        className="mb-6 shrink-0"
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || isLoading || isError}
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            {t("saveSchedule")}
          </Button>
        }
      />

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
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="divide-y divide-border">
            {schedule.map((d) => (
              <div key={d.dayOfWeek} className="flex flex-wrap items-center gap-4 px-4 py-3">
                <Switch
                  checked={d.isAvailable}
                  onCheckedChange={(checked) => updateDay(d.dayOfWeek, { isAvailable: checked })}
                />
                <span className="w-24 shrink-0 text-sm font-semibold text-foreground">
                  {t(d.dayOfWeek.toLowerCase() as any)}
                </span>
                {d.isAvailable ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Input
                      type="time"
                      value={d.startTime}
                      onChange={(e) => updateDay(d.dayOfWeek, { startTime: e.target.value })}
                      className="h-8 w-32 px-2"
                    />
                    <span className="text-muted-foreground">{t("to")}</span>
                    <Input
                      type="time"
                      value={d.endTime}
                      onChange={(e) => updateDay(d.dayOfWeek, { endTime: e.target.value })}
                      className="h-8 w-32 px-2"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{t("unavailable")}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
