"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Plus, Trash2, Edit, Loader2, CalendarDays, Info } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
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
import { PageHeader, LoadingSpinner } from "@/shared/components/dashboard";
import { getErrorMessage } from "@/lib/utils";
import {
  getOverrides,
  createOverride,
  deleteOverride,
  bulkCreateOverrides,
  type AvailabilityOverride,
  type CreateOverrideDto,
  type OverrideType,
} from "@/api/availability-overrides";

export default function AvailabilityOverridesPage() {
  const t = useTranslations("expertDashboard_overrides");
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedOverride, setSelectedOverride] = useState<AvailabilityOverride | null>(null);

  // Format current month for API
  const monthParam = format(currentMonth, "yyyy-MM");

  // Fetch overrides for current month
  const {
    data: overridesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["availabilityOverrides", monthParam],
    queryFn: () => getOverrides({ month: monthParam }),
  });

  const overrides = overridesResponse?.data?.data || [];

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

  // Check if date has override
  const hasOverride = (date: Date) => {
    return overrides.some((o) => isSameDay(parseISO(o.date), date));
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const existingOverride = getOverrideForDate(date);
    if (existingOverride) {
      setSelectedOverride(existingOverride);
    } else {
      setSelectedDate(date);
      setShowCreateModal(true);
    }
  };

  // Navigate months
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Header */}
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        actions={
          <Button onClick={() => setShowBulkModal(true)} className="w-full sm:w-auto">
            <CalendarDays className="mr-2 h-4 w-4" />
            {t("vacationModeBtn")}
          </Button>
        }
      />

      {/* Info Alert */}
      <Alert variant="info">
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t("infoAlert")}
        </AlertDescription>
      </Alert>

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

      {/* Calendar */}
      {!isLoading && !error && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm overflow-x-auto">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("overridesCount", { count: overrides.length })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                {t("previousBtn")}
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                {t("nextBtn")}
              </Button>
            </div>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={{
              override: overrides.map((o) => parseISO(o.date)),
            }}
            modifiersClassNames={{
              override: "bg-destructive/15 text-destructive font-bold",
            }}
            className="rounded-md border border-border"
          />

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-destructive/15 border border-destructive/30"></div>
              <span className="text-muted-foreground">{t("hasOverrideLegend")}</span>
            </div>
          </div>
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addOverrideTitle")}</DialogTitle>
          <DialogDescription>
            {selectedDate && format(selectedDate, "MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">{t("overrideTypeLabel")}</Label>
            <Select value={overrideType} onValueChange={(v) => setOverrideType(v as OverrideType)}>
              <SelectTrigger id="type">
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
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">{t("startTimeLabel")}</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">{t("endTimeLabel")}</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </>
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
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("cancelBtn")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("overrideDetailsTitle")}</DialogTitle>
          <DialogDescription>
            {format(parseISO(override.date), "MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">{t("typeLabel")}</Label>
            <p className="text-sm font-medium">{getTypeLabel(override.overrideType)}</p>
          </div>

          {override.overrideType === "CUSTOM_HOURS" && override.startTime && override.endTime && (
            <div>
              <Label className="text-xs text-muted-foreground">{t("hoursLabel")}</Label>
              <p className="text-sm font-medium">
                {override.startTime} - {override.endTime}
              </p>
            </div>
          )}

          {override.overrideType === "REDUCED_CAPACITY" && override.maxBookings && (
            <div>
              <Label className="text-xs text-muted-foreground">{t("maxBookingsLabel")}</Label>
              <p className="text-sm font-medium">{override.maxBookings} {t("bookingsCount")}</p>
            </div>
          )}

          {override.reason && (
            <div>
              <Label className="text-xs text-muted-foreground">{t("reasonLabel")}</Label>
              <p className="text-sm">{override.reason}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {t("closeBtn")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onDelete(override.id)}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2 className="mr-2 h-4 w-4" />
            {t("deleteBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Create Modal Component
function BulkCreateModal({
  open,
  onClose,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const t = useTranslations("expertDashboard_overrides");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error(t("selectDateRangeError"));
      return;
    }

    onSubmit({
      fromDate: format(dateRange.from, "yyyy-MM-dd"),
      toDate: format(dateRange.to, "yyyy-MM-dd"),
      overrideType: "CLOSED",
      ...(reason && { reason }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("vacationModeTitle")}</DialogTitle>
          <DialogDescription>
            {t("vacationModeDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("dateRangeLabel")}</Label>
            <Calendar
              mode="range"
              required
              selected={dateRange as { from: Date; to?: Date }}
              onSelect={setDateRange as any}
              numberOfMonths={1}
              className="rounded-md border border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulkReason">{t("reasonOptionalLabel")}</Label>
            <Textarea
              id="bulkReason"
              placeholder={t("bulkReasonPlaceholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {dateRange.from && dateRange.to && (
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t("blocksCount", { count: Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1 })}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("cancelBtn")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("blockDatesBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
