"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Loader2, Info, Clock, Calendar, Globe } from "lucide-react";
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
import { PageHeader, LoadingSpinner } from "@/shared/components/dashboard";
import { getErrorMessage } from "@/lib/utils";

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
        respectPresenceStatus: settings.respectPresenceStatus,
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
        respectPresenceStatus: settings.respectPresenceStatus,
      });
      setIsDailyLimitEnabled(settings.maxBookingsPerDay !== null);
    }
  };


  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Header */}
      <PageHeader
        title={t("scheduleSettingsTitle")}
        description={t("scheduleSettingsDesc")}
      />

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {t("loadError")}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && <LoadingSpinner />}

      {/* Settings Form */}
      {!isLoading && !error && settings && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Timezone Section */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{t("timezoneTitle")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("timezoneDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">{t("timezoneLabel")}</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData({ ...formData, timezone: value })
                }
              >
                <SelectTrigger id="timezone">
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
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{t("bookingRulesTitle")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("bookingRulesDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Buffer Time */}
              <div className="space-y-2">
                <Label htmlFor="bufferTime">
                  {t("bufferTimeLabel")}
                </Label>
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
                />
                <Alert variant="info" className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t("bufferTimeInfo")}
                  </AlertDescription>
                </Alert>
              </div>

              {/* Advance Notice */}
              <div className="space-y-2">
                <Label htmlFor="advanceNotice">
                  {t("advanceNoticeLabel")}
                </Label>
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
                />
                <Alert variant="info" className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t("advanceNoticeInfo")}
                  </AlertDescription>
                </Alert>
              </div>

              {/* Booking Window */}
              <div className="space-y-2">
                <Label htmlFor="bookingWindow">
                  {t("bookingWindowLabel")}
                </Label>
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
                />
                <Alert variant="info" className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t("bookingWindowInfo")}
                  </AlertDescription>
                </Alert>
              </div>


              {/* Daily Booking Limit */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="dailyLimitToggle">
                      {t("dailyLimitToggleLabel")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
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
                  <div className="space-y-2">
                    <Label htmlFor="dailyLimit">
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
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Behavior Settings */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  {t("behaviorSettingsTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("behaviorSettingsDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="respectPresence">
                  {t("respectPresenceLabel")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("respectPresenceDesc")}
                </p>
              </div>
              <Switch
                id="respectPresence"
                checked={formData.respectPresenceStatus ?? true}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, respectPresenceStatus: checked })
                }
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {t("resetBtn")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
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
