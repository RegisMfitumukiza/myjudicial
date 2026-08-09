"use client";

import { useState } from "react";
import { Clock, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUpdateAvailability } from "../hooks/useUpdateAvailability";
import type { DayOfWeek, ExpertAvailability } from "../hooks/useAvailability";
import { useTranslations } from "next-intl";

interface WeeklyScheduleProps {
  availability: ExpertAvailability[];
}

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

interface DaySchedule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export function WeeklySchedule({ availability }: WeeklyScheduleProps) {
  const t = useTranslations("experts");
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => {
    // Initialize schedule from availability or defaults
    return DAYS.map((day) => {
      const existing = availability.find((a) => a.dayOfWeek === day);
      return {
        dayOfWeek: day,
        startTime: existing?.startTime || "09:00",
        endTime: existing?.endTime || "17:00",
        isAvailable: existing?.isAvailable ?? false,
      };
    });
  });

  const [hasChanges, setHasChanges] = useState(false);
  const updateAvailability = useUpdateAvailability();

  const handleToggleDay = (day: DayOfWeek) => {
    setSchedule((prev) =>
      prev.map((s) =>
        s.dayOfWeek === day ? { ...s, isAvailable: !s.isAvailable } : s
      )
    );
    setHasChanges(true);
  };

  const handleTimeChange = (
    day: DayOfWeek,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((s) => (s.dayOfWeek === day ? { ...s, [field]: value } : s))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateAvailability.mutateAsync({ schedule });
      setHasChanges(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-4">
      {/* Save Button */}
      {hasChanges && (
        <Alert className="border-brand-blue/20 bg-brand-blue/5">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">{t("weeklySchedule.unsavedChanges")}</span>
            <Button size="sm" onClick={handleSave} disabled={updateAvailability.isPending}>
              {updateAvailability.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("weeklySchedule.saveSchedule")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Schedule Grid */}
      <div className="space-y-3">
        {schedule.map((day) => (
          <div
            key={day.dayOfWeek}
            className="flex items-center gap-4 rounded-lg border border-brand-border bg-white p-4"
          >
            {/* Day Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={day.isAvailable}
                onChange={() => handleToggleDay(day.dayOfWeek)}
                className="h-5 w-5 rounded border-brand-border"
              />
              <span className="w-28 font-medium text-brand-dark">
                {t(`expertDashboard_availability.${day.dayOfWeek.toLowerCase()}` as any)}
              </span>
            </div>

            {/* Time Inputs */}
            <div className="flex flex-1 items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <Input
                  type="time"
                  value={day.startTime}
                  onChange={(e) =>
                    handleTimeChange(day.dayOfWeek, "startTime", e.target.value)
                  }
                  disabled={!day.isAvailable}
                  className="w-32"
                />
              </div>
              <span className="text-slate-500">{t("weeklySchedule.to")}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={day.endTime}
                  onChange={(e) =>
                    handleTimeChange(day.dayOfWeek, "endTime", e.target.value)
                  }
                  disabled={!day.isAvailable}
                  className="w-32"
                />
              </div>
            </div>

            {/* Status */}
            {!day.isAvailable && (
              <span className="text-sm text-slate-500">{t("weeklySchedule.unavailable")}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
