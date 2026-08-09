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
      toast.error(error?.message || t("settingsUpdateFailed"));
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
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{t("scheduleSettingsTitle")}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {t("scheduleSettingsDesc")}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {t("loadError")}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )}

      {/* Settings Form */}
      {!isLoading && !error && settings && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Timezone Section */}
          <div className="rounded-lg border border-brand-border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10">
                <Globe className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <h2 className="font-semibold text-brand-dark">{t("timezoneTitle")}</h2>
                <p className="text-sm text-slate-600">
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
          <div className="rounded-lg border border-brand-border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10">
                <Clock className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <h2 className="font-semibold text-brand-dark">{t("bookingRulesTitle")}</h2>
                <p className="text-sm text-slate-600">
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
                <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  <p className="text-sm text-blue-900">
                    {t("bufferTimeInfo")}
                  </p>
                </div>
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
                <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  <p className="text-sm text-blue-900">
                    {t("advanceNoticeInfo")}
                  </p>
                </div>
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
                <div className="flex items-start gap-2 rounded-md bg-blue-50 p-3">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  <p className="text-sm text-blue-900">
                    {t("bookingWindowInfo")}
                  </p>
                </div>
              </div>


              {/* Daily Booking Limit */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="dailyLimitToggle">
                      {t("dailyLimitToggleLabel")}
                    </Label>
                    <p className="text-sm text-slate-600">
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
          <div className="rounded-lg border border-brand-border bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10">
                <Settings className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <h2 className="font-semibold text-brand-dark">
                  {t("behaviorSettingsTitle")}
                </h2>
                <p className="text-sm text-slate-600">
                  {t("behaviorSettingsDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="respectPresence">
                  {t("respectPresenceLabel")}
                </Label>
                <p className="text-sm text-slate-600">
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
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={updateMutation.isPending}
            >
              {t("resetBtn")}
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
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
