"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { 
  Calendar as CalendarIcon, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  Clock,
  AlertCircle,
  Loader2,
  Settings
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Switch } from "@/shared/components/ui/switch";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
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
import { Link } from "@/i18n/routing";
import {
  SkeletonList,
  ErrorState,
  PageHeader,
} from "@/shared/components/dashboard";
import { getErrorMessage } from "@/lib/utils";
import {
  getExpertsAvailabilityWithBlocks,
  patchExpertsAvailabilityWithBlocks,
  type TimeBlock as APITimeBlock,
  type ScheduleSlotWithBlocks,
  type ExpertAvailabilityWithBlocks
} from "@/api/availability-time-blocks";

// Types
interface TimeBlock {
  start: string; // HH:MM
  end: string;   // HH:MM
  id: string;    // Temporary ID for UI state
}

interface DaySchedule {
  dayOfWeek: string;
  isAvailable: boolean;
  timeBlocks: TimeBlock[];
}

type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

// Default schedule: 9-5 weekdays, weekends off
function defaultSchedule(): DaySchedule[] {
  return DAYS.map((day) => ({
    dayOfWeek: day,
    isAvailable: day !== "SATURDAY" && day !== "SUNDAY",
    timeBlocks: day !== "SATURDAY" && day !== "SUNDAY" 
      ? [{ id: crypto.randomUUID(), start: "09:00", end: "17:00" }]
      : [],
  }));
}

// Templates
const TEMPLATES = {
  STANDARD: "Standard 9-5",
  PART_TIME: "Part-time (Mon/Wed/Fri)",
  EVENING: "Evening hours (6pm-9pm)",
  WEEKEND: "Weekend only",
  LUNCH_BREAK: "With lunch break (9-12, 2-5)",
};

export default function AvailabilityCalendarPage() {
  const queryClient = useQueryClient();
  const t = useTranslations("expertDashboard_availability");
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule());
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Fetch availability
  const { data: rawData, isLoading, isError, refetch } = useQuery({
    queryKey: ["expertsAvailabilityWithBlocks"],
    queryFn: getExpertsAvailabilityWithBlocks,
  });
  const data = (rawData as any)?.data?.data ?? (rawData as any)?.data ?? [];

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: patchExpertsAvailabilityWithBlocks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expertsAvailabilityWithBlocks"] });
      toast.success(t("saveSuccess"));
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, t("saveError")));
    },
  });

  // Hydrate schedule from API
  useEffect(() => {
    if (hydrated || !data) return;
    const existing: ExpertAvailabilityWithBlocks[] = data;
    
    if (existing.length === 0) {
      setHydrated(true);
      return;
    }

    setSchedule(
      DAYS.map((day) => {
        const record = existing.find((r) => r.dayOfWeek === day);
        if (!record) {
          return {
            dayOfWeek: day,
            isAvailable: false,
            timeBlocks: [],
          };
        }

        // Check if using time blocks format
        if (record.usesTimeBlocks && record.timeBlocks) {
          return {
            dayOfWeek: day,
            isAvailable: record.isAvailable,
            timeBlocks: record.timeBlocks.map((b: APITimeBlock) => ({
              ...b,
              id: crypto.randomUUID()
            })),
          };
        }

        // Legacy single time block
        return {
          dayOfWeek: day,
          isAvailable: record.isAvailable,
          timeBlocks: record.isAvailable
            ? [{ id: crypto.randomUUID(), start: record.startTime, end: record.endTime }]
            : [],
        };
      })
    );
    setHydrated(true);
  }, [data, hydrated]);

  const getDaySchedule = (day: DayOfWeek): DaySchedule => {
    return schedule.find(s => s.dayOfWeek === day) || {
      dayOfWeek: day,
      isAvailable: false,
      timeBlocks: []
    };
  };

  const updateDaySchedule = (day: DayOfWeek, updates: Partial<DaySchedule>) => {
    setSchedule(prev => prev.map(s => 
      s.dayOfWeek === day ? { ...s, ...updates } : s
    ));
  };

  const toggleDayAvailability = (day: DayOfWeek) => {
    const daySchedule = getDaySchedule(day);
    const newIsAvailable = !daySchedule.isAvailable;
    
    updateDaySchedule(day, {
      isAvailable: newIsAvailable,
      timeBlocks: newIsAvailable && daySchedule.timeBlocks.length === 0
        ? [{ id: crypto.randomUUID(), start: "09:00", end: "17:00" }]
        : daySchedule.timeBlocks
    });
  };

  const addTimeBlock = (day: DayOfWeek, start: string, end: string) => {
    const daySchedule = getDaySchedule(day);
    const newBlock: TimeBlock = { id: crypto.randomUUID(), start, end };
    const updatedBlocks = [...daySchedule.timeBlocks, newBlock].sort((a, b) => 
      a.start.localeCompare(b.start)
    );
    
    updateDaySchedule(day, { timeBlocks: updatedBlocks });
  };

  const removeTimeBlock = (day: DayOfWeek, blockId: string) => {
    const daySchedule = getDaySchedule(day);
    updateDaySchedule(day, {
      timeBlocks: daySchedule.timeBlocks.filter(b => b.id !== blockId)
    });
  };

  const updateTimeBlock = (day: DayOfWeek, blockId: string, updates: Partial<TimeBlock>) => {
    const daySchedule = getDaySchedule(day);
    updateDaySchedule(day, {
      timeBlocks: daySchedule.timeBlocks.map(b => 
        b.id === blockId ? { ...b, ...updates } : b
      ).sort((a, b) => a.start.localeCompare(b.start))
    });
  };

  const copyDayToWeek = (sourceDay: DayOfWeek) => {
    const sourceSchedule = getDaySchedule(sourceDay);
    setSchedule(prev => prev.map(s => ({
      ...s,
      isAvailable: sourceSchedule.isAvailable,
      timeBlocks: sourceSchedule.timeBlocks.map(b => ({
        ...b,
        id: crypto.randomUUID() // New IDs for copies
      }))
    })));
    toast.success(t("copiedToWeek", { day: t(sourceDay.toLowerCase() as any) }));
  };

  const applyTemplate = (template: keyof typeof TEMPLATES) => {
    let newSchedule: DaySchedule[] = [];
    
    switch (template) {
      case "STANDARD":
        newSchedule = DAYS.map(day => ({
          dayOfWeek: day,
          isAvailable: !["SATURDAY", "SUNDAY"].includes(day),
          timeBlocks: !["SATURDAY", "SUNDAY"].includes(day)
            ? [{ id: crypto.randomUUID(), start: "09:00", end: "17:00" }]
            : []
        }));
        break;
      case "PART_TIME":
        newSchedule = DAYS.map(day => ({
          dayOfWeek: day,
          isAvailable: ["MONDAY", "WEDNESDAY", "FRIDAY"].includes(day),
          timeBlocks: ["MONDAY", "WEDNESDAY", "FRIDAY"].includes(day)
            ? [{ id: crypto.randomUUID(), start: "09:00", end: "17:00" }]
            : []
        }));
        break;
      case "EVENING":
        newSchedule = DAYS.map(day => ({
          dayOfWeek: day,
          isAvailable: !["SATURDAY", "SUNDAY"].includes(day),
          timeBlocks: !["SATURDAY", "SUNDAY"].includes(day)
            ? [{ id: crypto.randomUUID(), start: "18:00", end: "21:00" }]
            : []
        }));
        break;
      case "WEEKEND":
        newSchedule = DAYS.map(day => ({
          dayOfWeek: day,
          isAvailable: ["SATURDAY", "SUNDAY"].includes(day),
          timeBlocks: ["SATURDAY", "SUNDAY"].includes(day)
            ? [{ id: crypto.randomUUID(), start: "09:00", end: "17:00" }]
            : []
        }));
        break;
      case "LUNCH_BREAK":
        newSchedule = DAYS.map(day => ({
          dayOfWeek: day,
          isAvailable: !["SATURDAY", "SUNDAY"].includes(day),
          timeBlocks: !["SATURDAY", "SUNDAY"].includes(day)
            ? [
                { id: crypto.randomUUID(), start: "09:00", end: "12:00" },
                { id: crypto.randomUUID(), start: "14:00", end: "17:00" }
              ]
            : []
        }));
        break;
    }
    
    setSchedule(newSchedule);
    setShowTemplateModal(false);
    toast.success(t("templateApplied"));
  };

  const calculateTotalHours = (): number => {
    return schedule.reduce((total, day) => {
      if (!day.isAvailable) return total;
      return total + day.timeBlocks.reduce((dayTotal, block) => {
        const [startH, startM] = block.start.split(':').map(Number);
        const [endH, endM] = block.end.split(':').map(Number);
        const minutes = (endH * 60 + endM) - (startH * 60 + startM);
        return dayTotal + minutes / 60;
      }, 0);
    }, 0);
  };

  const handleSave = async () => {
    const payload: { schedule: ScheduleSlotWithBlocks[] } = {
      schedule: schedule.map(day => ({
        dayOfWeek: day.dayOfWeek as ScheduleSlotWithBlocks["dayOfWeek"],
        isAvailable: day.isAvailable,
        timeBlocks: day.timeBlocks.length > 0 
          ? day.timeBlocks.map(({ start, end }) => ({ start, end }))
          : undefined,
      }))
    };

    saveMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <SkeletonList count={7} itemClassName="h-16 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <ErrorState
          title={t("loadErrorV2")}
          message={t("loadErrorV2Desc")}
          retryLabel={t("tryAgain")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Header */}
      <PageHeader
        title={t("calendarTitle")}
        description={t("calendarSubtitle")}
        className="mb-6 shrink-0"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateModal(true)}
            >
              <Settings className="mr-2 h-4 w-4" />
              {t("templates")}
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("saveSchedule")}
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t("totalHoursWeek")}</p>
              <p className="text-2xl font-bold text-foreground">
                {calculateTotalHours().toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t("availableDays")}</p>
              <p className="text-2xl font-bold text-foreground">
                {schedule.filter(d => d.isAvailable).length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">{t("timeBlocks")}</p>
              <p className="text-2xl font-bold text-foreground">
                {schedule.reduce((sum, d) => sum + d.timeBlocks.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <Alert variant="info" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t("infoAlert")}{" "}
          <Link href="/expert/dashboard/schedule-settings" className="font-semibold underline">
            {t("adjustSettings")}
          </Link>
        </AlertDescription>
      </Alert>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-4">
          {DAYS.map(day => {
            const daySchedule = getDaySchedule(day);
            return (
              <DayCard
                key={day}
                day={day}
                schedule={daySchedule}
                onToggle={() => toggleDayAvailability(day)}
                onAddBlock={() => {
                  setSelectedDay(day);
                  setShowAddBlockModal(true);
                }}
                onRemoveBlock={(blockId) => removeTimeBlock(day, blockId)}
                onUpdateBlock={(blockId, updates) => updateTimeBlock(day, blockId, updates)}
                onCopyToWeek={() => copyDayToWeek(day)}
                t={t}
              />
            );
          })}
        </div>
      </div>

      {/* Add Time Block Modal */}
      <AddTimeBlockModal
        open={showAddBlockModal}
        onClose={() => {
          setShowAddBlockModal(false);
          setSelectedDay(null);
        }}
        onAdd={(start, end) => {
          if (selectedDay) {
            addTimeBlock(selectedDay, start, end);
            setShowAddBlockModal(false);
            setSelectedDay(null);
          }
        }}
        dayLabel={selectedDay ? t(selectedDay.toLowerCase() as any) : ""}
        t={t}
      />

      {/* Template Modal */}
      <TemplateModal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onApply={applyTemplate}
        t={t}
      />
    </div>
  );
}

// Day Card Component
interface DayCardProps {
  day: DayOfWeek;
  schedule: DaySchedule;
  onToggle: () => void;
  onAddBlock: () => void;
  onRemoveBlock: (blockId: string) => void;
  onUpdateBlock: (blockId: string, updates: Partial<TimeBlock>) => void;
  onCopyToWeek: () => void;
  t: any;
}

function DayCard({
  day,
  schedule,
  onToggle,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
  onCopyToWeek,
  t,
}: DayCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Switch checked={schedule.isAvailable} onCheckedChange={onToggle} />
          <div>
            <h3 className="font-semibold text-foreground">
              {t(day.toLowerCase() as any)}
            </h3>
            {schedule.isAvailable && schedule.timeBlocks.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {schedule.timeBlocks.length} {schedule.timeBlocks.length === 1 ? t("blockSingular") : t("blockPlural")}
              </p>
            )}
          </div>
        </div>
        
        {schedule.isAvailable && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCopyToWeek} title={t("copyToWeek")} aria-label={t("copyToWeek")}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={onAddBlock} aria-label={t("addTimeBlockTitle")}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {schedule.isAvailable && (
        <div className="mt-4 space-y-2">
          {schedule.timeBlocks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("noTimeBlocks")}
            </p>
          ) : (
            schedule.timeBlocks.map(block => (
              <TimeBlockItem
                key={block.id}
                block={block}
                onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                onRemove={() => onRemoveBlock(block.id)}
                t={t}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Time Block Item Component
interface TimeBlockItemProps {
  block: TimeBlock;
  onUpdate: (updates: Partial<TimeBlock>) => void;
  onRemove: () => void;
  t: any;
}

function TimeBlockItem({ block, onUpdate, onRemove, t }: TimeBlockItemProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Input
        type="time"
        value={block.start}
        onChange={(e) => onUpdate({ start: e.target.value })}
        className="h-8 w-24 text-sm"
      />
      <span className="text-sm text-muted-foreground">{t("to")}</span>
      <Input
        type="time"
        value={block.end}
        onChange={(e) => onUpdate({ end: e.target.value })}
        className="h-8 w-24 text-sm"
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label={t("removeBlock")}
        className="ml-auto"
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  );
}

// Add Time Block Modal
interface AddTimeBlockModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (start: string, end: string) => void;
  dayLabel: string;
  t: any;
}

function AddTimeBlockModal({ open, onClose, onAdd, dayLabel, t }: AddTimeBlockModalProps) {
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  const handleAdd = () => {
    if (end <= start) {
      toast.error(t("endBeforeStartError"));
      return;
    }
    onAdd(start, end);
    setStart("09:00");
    setEnd("17:00");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addTimeBlockTitle")}</DialogTitle>
          <DialogDescription>{dayLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start">{t("startTimeLabel")}</Label>
            <Input
              id="start"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">{t("endTimeLabel")}</Label>
            <Input
              id="end"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addBlockBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Template Modal
interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (template: keyof typeof TEMPLATES) => void;
  t: any;
}

const TEMPLATE_KEYS: Record<keyof typeof TEMPLATES, string> = {
  STANDARD: "templateStandard",
  PART_TIME: "templatePartTime",
  EVENING: "templateEvening",
  WEEKEND: "templateWeekend",
  LUNCH_BREAK: "templateLunchBreak",
};

function TemplateModal({ open, onClose, onApply, t }: TemplateModalProps) {
  const [selected, setSelected] = useState<keyof typeof TEMPLATES>("STANDARD");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("applyTemplateTitle")}</DialogTitle>
          <DialogDescription>
            {t("applyTemplateDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>{t("templateLabel")}</Label>
          <Select value={selected} onValueChange={(v) => setSelected(v as keyof typeof TEMPLATES)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TEMPLATES) as Array<keyof typeof TEMPLATES>).map(key => (
                <SelectItem key={key} value={key}>
                  {t(TEMPLATE_KEYS[key] as any)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("templateReplaceNotice")}
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={() => onApply(selected)}>
            {t("applyTemplateBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
