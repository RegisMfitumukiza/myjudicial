"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CalendarDays,
  Info,
  ChevronLeft,
  ChevronRight,
  Clock,
  Ban,
  Users,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { PageHeader, CalendarSkeleton } from "@/shared/components/dashboard";
import { ScheduleNavigationTabs } from "@/features/experts/components/schedule-navigation-tabs";
import { getErrorMessage, cn } from "@/lib/utils";
import {
  getOverrides,
  createOverride,
  deleteOverride,
  bulkCreateOverrides,
  type AvailabilityOverride,
  type CreateOverrideDto,
  type BulkCreateOverridesDto,
  type OverrideType,
} from "@/api/availability-overrides";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function AvailabilityOverridesPage() {
  const t = useTranslations("expertDashboard_overrides");
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedOverride, setSelectedOverride] = useState<AvailabilityOverride | null>(null);

  // Format current month for API (YYYY-MM)
  const monthParam = format(currentMonth, "yyyy-MM");

  // Fetch overrides for current month
  const {
    data: overridesResponse,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["availabilityOverrides", monthParam],
    queryFn: () => getOverrides({ month: monthParam }),
    placeholderData: keepPreviousData,
  });

  const overrides = overridesResponse?.data?.data || [];

  // Sort overrides by date ascending
  const sortedOverrides = useMemo(() => {
    return [...overrides].sort((a, b) => a.date.localeCompare(b.date));
  }, [overrides]);

  // Compute calendar days grid (Monday start)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Create override mutation
  const createMutation = useMutation({
    mutationFn: createOverride,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["availabilityOverrides"] });
      setShowCreateModal(false);
      setSelectedDate(undefined);
      const message = response.data.data.warning || t("overrideCreatedSuccess");
      toast.success(message);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, t("overrideCreateFailed")));
    },
  });

  // Delete override mutation
  const deleteMutation = useMutation({
    mutationFn: deleteOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availabilityOverrides"] });
      setSelectedOverride(null);
      toast.success(t("overrideDeletedSuccess"));
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, t("overrideDeleteFailed")));
    },
  });

  // Bulk create mutation
  const bulkMutation = useMutation({
    mutationFn: bulkCreateOverrides,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["availabilityOverrides"] });
      setShowBulkModal(false);
      const message = response.data.data.warning || t("datesBlockedSuccess", { count: response.data.data.count });
      toast.success(message);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, t("overridesCreateFailed")));
    },
  });

  // Get override for specific date
  const getOverrideForDate = (date: Date) => {
    return overrides.find((o) => isSameDay(parseISO(o.date), date));
  };

  // Handle day click
  const handleDayClick = (day: Date) => {
    const existing = getOverrideForDate(day);
    if (existing) {
      setSelectedOverride(existing);
    } else {
      setSelectedDate(day);
      setShowCreateModal(true);
    }
  };

  // Month navigation
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0 max-w-6xl mx-auto space-y-5">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        className="mb-4 shrink-0"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedDate(new Date());
                setShowCreateModal(true);
              }}
              className="rounded-xl border-border/80 text-xs sm:text-sm font-semibold gap-2 h-10 px-4 hover:bg-muted"
            >
              <Plus className="h-4 w-4 text-primary" />
              <span>{t("addOverrideTitle")}</span>
            </Button>
            <Button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="rounded-xl text-xs sm:text-sm font-semibold gap-2 h-10 px-4 shadow-sm"
            >
              <CalendarDays className="h-4 w-4" />
              <span>{t("vacationModeBtn")}</span>
            </Button>
          </div>
        }
      />

      {/* Shared Schedule Hub Tabs */}
      <ScheduleNavigationTabs />

      {/* Info Alert */}
      <Alert variant="info" className="text-xs bg-muted/40 border-border/70 py-2.5">
        <Info className="h-4 w-4 shrink-0" />
        <AlertDescription className="text-xs leading-relaxed text-muted-foreground">
          {t("infoAlert")}
        </AlertDescription>
      </Alert>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{t("loadError")}</AlertDescription>
        </Alert>
      )}

      {/* Initial Loading State */}
      {isLoading && !overridesResponse && <CalendarSkeleton />}

      {/* Full-Width Expansive Calendar Card */}
      {(!isLoading || overridesResponse) && !error && (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          {/* Calendar Header Controls */}
          <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground inline-flex items-center gap-1.5">
                    {isFetching && (
                      <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
                    )}
                    <span>{t("overridesCount", { count: overrides.length })}</span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click any date to schedule or modify an exception
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  goToPreviousMonth();
                }}
                className="h-9 w-9 p-0 rounded-xl border-border/80 hover:bg-muted"
                aria-label={t("previousBtn")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  goToToday();
                }}
                className="h-9 px-3.5 rounded-xl border-border/80 text-xs font-semibold hover:bg-muted"
              >
                {t("todayBtn")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  goToNextMonth();
                }}
                className="h-9 w-9 p-0 rounded-xl border-border/80 hover:bg-muted"
                aria-label={t("nextBtn")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Legend Bar */}
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-medium" title="Expert is unavailable for the entire day">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>{t("legendClosed")}</span>
                <span className="text-[11px] text-muted-foreground font-normal hidden sm:inline">(Day off)</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-medium" title="Special working hours replace regular schedule">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                <span>{t("legendCustom")}</span>
                <span className="text-[11px] text-muted-foreground font-normal hidden sm:inline">(Special times)</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium" title="Limit max client consultations for this date">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>{t("legendReduced")}</span>
                <span className="text-[11px] text-muted-foreground font-normal hidden sm:inline">(Max bookings cap)</span>
              </div>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/20 text-center">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Full-Width 7-Column Calendar Grid */}
          <div className="grid grid-cols-7 bg-border/40 gap-px">
            {calendarDays.map((day) => {
              const inCurrentMonth = isSameMonth(day, currentMonth);
              const dayIsToday = isToday(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const override = getOverrideForDate(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[82px] sm:min-h-[105px] p-1.5 sm:p-2.5 flex flex-col justify-between transition-all select-none group cursor-pointer",
                    inCurrentMonth ? "bg-card hover:bg-muted/30" : "bg-muted/15 opacity-40 hover:opacity-75",
                    isWeekend && inCurrentMonth && "bg-amber-500/[0.015] dark:bg-amber-400/[0.015]",
                    dayIsToday && inCurrentMonth && "ring-1 ring-inset ring-primary/40 bg-primary/[0.02]"
                  )}
                >
                  {/* Day Header Row */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-semibold rounded-full flex items-center justify-center transition-colors",
                        dayIsToday
                          ? "h-6 w-6 bg-primary text-primary-foreground font-bold shadow-2xs"
                          : inCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Subtle Hover Add Icon when no override */}
                    {!override && inCurrentMonth && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/60 hover:text-foreground">
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Override Badge Content */}
                  <div className="mt-1 flex-1 flex flex-col justify-end">
                    {override && (
                      <div
                        className={cn(
                          "px-1.5 py-1 sm:px-2 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold border flex items-center gap-1.5 shadow-2xs transition-transform group-hover:scale-[1.02]",
                          override.overrideType === "CLOSED" &&
                            "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
                          override.overrideType === "CUSTOM_HOURS" &&
                            "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
                          override.overrideType === "REDUCED_CAPACITY" &&
                            "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25"
                        )}
                        title={override.reason || undefined}
                      >
                        {override.overrideType === "CLOSED" && (
                          <>
                            <Ban className="h-3 w-3 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span className="truncate">
                              {override.reason || t("legendClosed")}
                            </span>
                          </>
                        )}
                        {override.overrideType === "CUSTOM_HOURS" && (
                          <>
                            <Clock className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                            <span className="truncate font-mono">
                              {override.startTime}-{override.endTime}
                            </span>
                          </>
                        )}
                        {override.overrideType === "REDUCED_CAPACITY" && (
                          <>
                            <Users className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
                            <span className="truncate">
                              Max {override.maxBookings}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Overrides Breakdown List */}
      {(!isLoading || overridesResponse) && !error && (
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                {t("activeOverridesTitle")}
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </span>
          </div>

          {sortedOverrides.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2.5">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {t("noOverridesInMonth")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDate(new Date());
                  setShowCreateModal(true);
                }}
                className="mt-3 text-xs rounded-lg gap-1.5"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>{t("addOverrideTitle")}</span>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {sortedOverrides.map((override) => {
                const dateObj = parseISO(override.date);

                return (
                  <div
                    key={override.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 hover:bg-muted/20 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl shrink-0",
                          override.overrideType === "CLOSED" &&
                            "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                          override.overrideType === "CUSTOM_HOURS" &&
                            "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          override.overrideType === "REDUCED_CAPACITY" &&
                            "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {override.overrideType === "CLOSED" && <Ban className="h-4 w-4" />}
                        {override.overrideType === "CUSTOM_HOURS" && <Clock className="h-4 w-4" />}
                        {override.overrideType === "REDUCED_CAPACITY" && <Users className="h-4 w-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold text-foreground">
                            {format(dateObj, "EEEE, MMMM d, yyyy")}
                          </p>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                              override.overrideType === "CLOSED" &&
                                "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
                              override.overrideType === "CUSTOM_HOURS" &&
                                "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
                              override.overrideType === "REDUCED_CAPACITY" &&
                                "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25"
                            )}
                          >
                            {override.overrideType === "CLOSED" && t("closedFullDay")}
                            {override.overrideType === "CUSTOM_HOURS" &&
                              `${override.startTime} - ${override.endTime}`}
                            {override.overrideType === "REDUCED_CAPACITY" &&
                              `Max ${override.maxBookings} ${t("bookingsCount")}`}
                          </span>
                        </div>
                        {override.reason && (
                          <p className="text-xs text-muted-foreground mt-0.5 break-words">
                            {override.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOverride(override)}
                        className="h-8 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        {t("overrideDetailsTitle")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(override.id)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title={t("deleteBtn")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Override Modal */}
      <CreateOverrideModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedDate(undefined);
        }}
        selectedDate={selectedDate}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* View Override Modal */}
      <ViewOverrideModal
        open={!!selectedOverride}
        onClose={() => setSelectedOverride(null)}
        override={selectedOverride}
        onDelete={(id) => deleteMutation.mutate(id)}
        isDeleting={deleteMutation.isPending}
      />

      {/* Bulk Create Modal */}
      <BulkCreateModal
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSubmit={(data) => bulkMutation.mutate(data)}
        isLoading={bulkMutation.isPending}
      />
    </div>
  );
}

// Create Override Modal Component
function CreateOverrideModal({
  open,
  onClose,
  selectedDate,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onSubmit: (data: CreateOverrideDto) => void;
  isLoading: boolean;
}) {
  const t = useTranslations("expertDashboard_overrides");
  const [overrideType, setOverrideType] = useState<OverrideType>("CLOSED");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [maxBookings, setMaxBookings] = useState(3);
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!selectedDate) return;

    const data: CreateOverrideDto = {
      date: format(selectedDate, "yyyy-MM-dd"),
      overrideType,
      ...(overrideType === "CUSTOM_HOURS" && { startTime, endTime }),
      ...(overrideType === "REDUCED_CAPACITY" && { maxBookings }),
      ...(reason && { reason }),
    };

    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("addOverrideTitle")}</DialogTitle>
          <DialogDescription>
            {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("overrideTypeLabel")}</Label>
            <Select value={overrideType} onValueChange={(v) => setOverrideType(v as OverrideType)}>
              <SelectTrigger id="type" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLOSED">{t("closedFullDay")}</SelectItem>
                <SelectItem value="CUSTOM_HOURS">{t("customHours")}</SelectItem>
                <SelectItem value="REDUCED_CAPACITY">{t("reducedCapacity")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {overrideType === "CUSTOM_HOURS" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startTime">{t("startTimeLabel")}</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">{t("endTimeLabel")}</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}

          {overrideType === "REDUCED_CAPACITY" && (
            <div className="space-y-2">
              <Label htmlFor="maxBookings">{t("maxBookingsLabel")}</Label>
              <Input
                id="maxBookings"
                type="number"
                min="1"
                max="50"
                value={maxBookings}
                onChange={(e) => setMaxBookings(parseInt(e.target.value))}
                className="rounded-xl"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">{t("reasonOptionalLabel")}</Label>
            <Textarea
              id="reason"
              placeholder={t("reasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-xl">
            {t("cancelBtn")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="rounded-xl shadow-xs">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("addOverrideBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// View Override Modal Component
function ViewOverrideModal({
  open,
  onClose,
  override,
  onDelete,
  isDeleting,
}: {
  open: boolean;
  onClose: () => void;
  override: AvailabilityOverride | null;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const t = useTranslations("expertDashboard_overrides");
  if (!override) return null;

  const getTypeLabel = (type: OverrideType) => {
    switch (type) {
      case "CLOSED":
        return t("closedFullDay");
      case "CUSTOM_HOURS":
        return t("customHours");
      case "REDUCED_CAPACITY":
        return t("reducedCapacity");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("overrideDetailsTitle")}</DialogTitle>
          <DialogDescription>
            {format(parseISO(override.date), "EEEE, MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t("typeLabel")}</Label>
              <p className="text-sm font-semibold text-foreground">{getTypeLabel(override.overrideType)}</p>
            </div>

            {override.overrideType === "CUSTOM_HOURS" && override.startTime && override.endTime && (
              <div>
                <Label className="text-xs text-muted-foreground">{t("hoursLabel")}</Label>
                <p className="text-sm font-semibold text-foreground font-mono">
                  {override.startTime} - {override.endTime}
                </p>
              </div>
            )}

            {override.overrideType === "REDUCED_CAPACITY" && override.maxBookings && (
              <div>
                <Label className="text-xs text-muted-foreground">{t("maxBookingsLabel")}</Label>
                <p className="text-sm font-semibold text-foreground">
                  {override.maxBookings} {t("bookingsCount")}
                </p>
              </div>
            )}

            {override.reason && (
              <div>
                <Label className="text-xs text-muted-foreground">{t("reasonLabel")}</Label>
                <p className="text-sm text-foreground">{override.reason}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
          <Button
            variant="destructive"
            onClick={() => onDelete(override.id)}
            disabled={isDeleting}
            className="rounded-xl"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2 className="mr-1.5 h-4 w-4" />
            {t("deleteBtn")}
          </Button>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            {t("closeBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Create (Vacation Mode) Modal Component
function BulkCreateModal({
  open,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BulkCreateOverridesDto) => void;
  isLoading: boolean;
}) {
  const t = useTranslations("expertDashboard_overrides");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!fromDate || !toDate) {
      toast.error(t("selectDateRangeError"));
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      toast.error("Start date must be before or equal to end date");
      return;
    }

    onSubmit({
      fromDate,
      toDate,
      overrideType: "CLOSED",
      ...(reason && { reason }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("vacationModeTitle")}</DialogTitle>
          <DialogDescription>{t("vacationModeDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="fromDate">Start Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">End Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulkReason">{t("reasonOptionalLabel")}</Label>
            <Textarea
              id="bulkReason"
              placeholder={t("bulkReasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-xl">
            {t("cancelBtn")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="rounded-xl shadow-xs">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("blockDatesBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
