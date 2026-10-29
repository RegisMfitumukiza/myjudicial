"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Loader2, Info, Clock, Globe, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  getScheduleSettings,
  updateScheduleSettings,
  type UpdateScheduleSettingsDto,
} from "@/api/schedule-settings";
import { PageHeader, FormSectionSkeleton } from "@/shared/components/dashboard";
import { ScheduleNavigationTabs } from "@/features/experts/components/schedule-navigation-tabs";
import { getErrorMessage, cn } from "@/lib/utils";

// Common timezone options
const TIMEZONES = [
  { value: "Africa/Kigali", label: "Africa/Kigali (EAT)" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT)" },
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET)" },
  { value: "America/New_York", label: "America/New York (EST)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PST)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
  { value: "UTC", label: "UTC" },
];

export default function ScheduleSettingsPage() {
  const t = useTranslations("expertDashboard_schedulesettings");
  const tHub = useTranslations("expertDashboard_scheduleHub");
  const queryClient = useQueryClient();

  // Fetch settings
  const {
    data: settingsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["scheduleSettings"],
    queryFn: getScheduleSettings,
  });

  const settings = settingsResponse?.data?.data;

  // Local state for form
  const [formData, setFormData] = useState<UpdateScheduleSettingsDto>({});
  const [isDailyLimitEnabled, setIsDailyLimitEnabled] = useState(false);

  // Initialize form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        timezone: settings.timezone,
        bufferTimeMinutes: settings.bufferTimeMinutes,
        advanceNoticeHours: settings.advanceNoticeHours,
        maxDaysInAdvance: settings.maxDaysInAdvance,
        maxBookingsPerDay: settings.maxBookingsPerDay,
        respectPresenceStatus: settings.respectPresenceStatus ?? false,
      });
      setIsDailyLimitEnabled(settings.maxBookingsPerDay !== null);
    }
  }, [settings]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateScheduleSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduleSettings"] });
      toast.success(t("settingsUpdatedSuccess"));
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, t("settingsUpdateFailed")));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      maxBookingsPerDay: isDailyLimitEnabled ? formData.maxBookingsPerDay : null,
    };

    updateMutation.mutate(payload);
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        timezone: settings.timezone,
        bufferTimeMinutes: settings.bufferTimeMinutes,
        advanceNoticeHours: settings.advanceNoticeHours,
        maxDaysInAdvance: settings.maxDaysInAdvance,
        maxBookingsPerDay: settings.maxBookingsPerDay,
        respectPresenceStatus: settings.respectPresenceStatus ?? false,
      });
      setIsDailyLimitEnabled(settings.maxBookingsPerDay !== null);
    }
  };

  const noticePresets = [
    { value: 2, label: tHub("presetSameDay") },
    { value: 24, label: tHub("preset24h") },
    { value: 48, label: tHub("preset48h") },
    { value: 72, label: tHub("preset72h") },
  ];

  const bufferPresets = [
    { value: 0, label: tHub("presetNone") },
    { value: 10, label: tHub("preset10m") },
    { value: 15, label: tHub("preset15m") },
    { value: 30, label: tHub("preset30m") },
  ];

  const windowPresets = [
    { value: 14, label: tHub("preset14d") },
    { value: 30, label: tHub("preset30d") },
    { value: 60, label: tHub("preset60d") },
    { value: 90, label: tHub("preset90d") },
  ];

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0 max-w-6xl mx-auto">
      <PageHeader
        title={t("scheduleSettingsTitle")}
        description={t("scheduleSettingsDesc")}
        className="mb-4 shrink-0"
      />

      {/* Shared Schedule Hub Tabs */}
      <ScheduleNavigationTabs />

      {isLoading ? (
        <FormSectionSkeleton fields={4} />
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("loadError")}</AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Timezone Section */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm sm:text-base">
                  {t("timezoneTitle")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("timezoneDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <Label htmlFor="timezone" className="text-xs font-semibold">{t("timezoneLabel")}</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData({ ...formData, timezone: value })
                }
              >
                <SelectTrigger id="timezone" className="rounded-xl border-border/80 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Booking Rules Section */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm sm:text-base">{t("bookingRulesTitle")}</h2>
                <p className="text-xs text-muted-foreground">
                  {t("bookingRulesDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Advance Notice with Presets */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="advanceNotice" className="text-xs sm:text-sm font-semibold">
                    {t("advanceNoticeLabel")}
                  </Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {formData.advanceNoticeHours ?? 24} hours
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {noticePresets.map((preset) => {
                    const isSelected = formData.advanceNoticeHours === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, advanceNoticeHours: preset.value })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                            : "bg-muted/40 border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 max-w-xs pt-1">
                  <Input
                    id="advanceNotice"
                    type="number"
                    min="0"
                    max="168"
                    value={formData.advanceNoticeHours ?? 24}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        advanceNoticeHours: e.target.value === "" ? undefined : parseInt(e.target.value),
                      })
                    }
                    className="h-8.5 rounded-lg text-xs sm:text-sm"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">hours</span>
                </div>

                <Alert variant="info" className="mt-2 text-xs">
                  <Info className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs leading-relaxed">
                    {t("advanceNoticeInfo")}
                  </AlertDescription>
                </Alert>
              </div>

              {/* Buffer Time with Presets */}
              <div className="space-y-2.5 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bufferTime" className="text-xs sm:text-sm font-semibold">
                    {t("bufferTimeLabel")}
                  </Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {formData.bufferTimeMinutes ?? 15} minutes
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {bufferPresets.map((preset) => {
                    const isSelected = formData.bufferTimeMinutes === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, bufferTimeMinutes: preset.value })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                            : "bg-muted/40 border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 max-w-xs pt-1">
                  <Input
                    id="bufferTime"
                    type="number"
                    min="0"
                    max="120"
                    value={formData.bufferTimeMinutes ?? 15}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bufferTimeMinutes: e.target.value === "" ? undefined : parseInt(e.target.value),
                      })
                    }
                    className="h-8.5 rounded-lg text-xs sm:text-sm"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">min</span>
                </div>

                <Alert variant="info" className="mt-2 text-xs">
                  <Info className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs leading-relaxed">
                    {t("bufferTimeInfo")}
                  </AlertDescription>
                </Alert>
              </div>

              {/* Booking Window with Presets */}
              <div className="space-y-2.5 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bookingWindow" className="text-xs sm:text-sm font-semibold">
                    {t("bookingWindowLabel")}
                  </Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {formData.maxDaysInAdvance ?? 60} days
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {windowPresets.map((preset) => {
                    const isSelected = formData.maxDaysInAdvance === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, maxDaysInAdvance: preset.value })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                            : "bg-muted/40 border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 max-w-xs pt-1">
                  <Input
                    id="bookingWindow"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.maxDaysInAdvance ?? 60}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDaysInAdvance: e.target.value === "" ? undefined : parseInt(e.target.value),
                      })
                    }
                    className="h-8.5 rounded-lg text-xs sm:text-sm"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">days</span>
                </div>

                <Alert variant="info" className="mt-2 text-xs">
                  <Info className="h-3.5 w-3.5" />
                  <AlertDescription className="text-xs leading-relaxed">
                    {t("bookingWindowInfo")}
                  </AlertDescription>
                </Alert>
              </div>

              {/* Daily Booking Limit */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dailyLimitToggle" className="text-xs sm:text-sm font-semibold">
                      {t("dailyLimitToggleLabel")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("dailyLimitToggleDesc")}
                    </p>
                  </div>
                  <Switch
                    id="dailyLimitToggle"
                    checked={isDailyLimitEnabled}
                    onCheckedChange={(checked) => {
                      setIsDailyLimitEnabled(checked);
                      if (!checked) {
                        setFormData({ ...formData, maxBookingsPerDay: null });
                      } else {
                        setFormData({ ...formData, maxBookingsPerDay: 5 });
                      }
                    }}
                  />
                </div>

                {isDailyLimitEnabled && (
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="dailyLimit" className="text-xs font-medium">
                      {t("dailyLimitLabel")}
                    </Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.maxBookingsPerDay ?? 5}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxBookingsPerDay: e.target.value === "" ? undefined : parseInt(e.target.value),
                        })
                      }
                      className="h-8.5 rounded-lg text-xs sm:text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Behavior Settings */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm sm:text-base">
                  {t("behaviorSettingsTitle")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("behaviorSettingsDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label htmlFor="respectPresence" className="text-xs sm:text-sm font-semibold cursor-pointer">
                  {t("respectPresenceLabel")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("respectPresenceDesc")}
                </p>
              </div>
              <Switch
                id="respectPresence"
                checked={formData.respectPresenceStatus ?? false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, respectPresenceStatus: checked })
                }
              />
            </div>

            <Alert variant="warning" className="mt-4 text-xs bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs leading-relaxed">
                {tHub("pauseIntakeWarning")}
              </AlertDescription>
            </Alert>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto rounded-xl text-xs sm:text-sm border-border/80"
            >
              {t("resetBtn")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto rounded-xl text-xs sm:text-sm shadow-xs"
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("saveChangesBtn")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
