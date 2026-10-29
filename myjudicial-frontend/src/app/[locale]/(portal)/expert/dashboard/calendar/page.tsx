"use client";

import { useState, useMemo } from "react";
import { Link, useRouter } from "@/i18n/routing";
import {
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/shared/components/ui/button";
import { useGetBookings } from "@/api/generated";
import type { Booking } from "@/api/generated";
import { PageHeader, CalendarSkeleton, ErrorState } from "@/shared/components/dashboard";

type ViewMode = "week" | "month";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-warning/15 border-l-warning text-foreground dark:bg-warning/10",
  RESCHEDULE_REQUESTED: "bg-warning/15 border-l-warning text-foreground dark:bg-warning/10",
  CONFIRMED: "bg-primary/10 border-l-primary text-foreground",
  ACTIVE: "bg-primary/10 border-l-primary text-foreground",
  COMPLETED: "bg-muted border-l-muted-foreground/50 text-muted-foreground",
  CANCELLED: "bg-destructive/10 border-l-destructive/70 text-muted-foreground",
  REFUNDED: "bg-destructive/10 border-l-destructive/70 text-muted-foreground",
};

const FALLBACK_CHIP =
  "bg-muted border-l-transparent text-muted-foreground";

export default function CalendarPage() {
  const router = useRouter();
  const t = useTranslations("expertDashboard_calendar");
  const locale = useLocale();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }

  const { data, isLoading, error } = useGetBookings({ limit: 100 });

  const bookings: Booking[] = data?.status === 200 ? (data.data.data as Booking[]) : [];

  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  function getBookingsForDay(date: Date): Booking[] {
    return bookings.filter((b) => {
      const start = new Date(b.scheduledStart);
      return isSameDay(start, date);
    }).sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
  }

  function prevPeriod() {
    if (viewMode === "week") {
      setCurrentDate((d) => addDays(d, -7));
    } else {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    }
  }

  function nextPeriod() {
    if (viewMode === "week") {
      setCurrentDate((d) => addDays(d, 7));
    } else {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  const today = new Date();

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <CalendarSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <ErrorState title={t("failedToLoad")} />
      </div>
    );
  }

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Header */}
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5">
              <button
                onClick={() => setViewMode("week")}
                className={
                  viewMode === "week"
                    ? "rounded-md bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                    : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {t("week")}
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={
                  viewMode === "month"
                    ? "rounded-md bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                    : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {t("month")}
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={goToday}>
              {t("today")}
            </Button>
          </div>
        }
      />

      {/* Navigation */}
      <div className="mb-4 mt-6 flex items-center justify-between">
        <Button variant="outline" size="icon-sm" onClick={prevPeriod} aria-label={t("previousPeriod")}>
          <ChevronLeft />
        </Button>
        <p className="text-sm font-semibold text-foreground capitalize">
          {viewMode === "week"
            ? `${weekStart.toLocaleDateString(locale, { month: "short", day: "numeric" })} – ${addDays(weekStart, 6).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}`
            : currentDate.toLocaleDateString(locale, { month: "long", year: "numeric" })
          }
        </p>
        <Button variant="outline" size="icon-sm" onClick={nextPeriod} aria-label={t("nextPeriod")}>
          <ChevronRight />
        </Button>
      </div>

      {/* Week View */}
      {viewMode === "week" && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <div className="min-w-[560px] grid grid-cols-7 gap-px bg-border">
            {weekDays.map((day, i) => {
              const dayBookings = getBookingsForDay(day);
              const isToday = isSameDay(day, today);
              return (
                <div key={i} className="min-h-[200px] bg-card p-2">
                  <div className={`mb-2 flex items-center justify-between`}>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isToday ? "text-primary" : "text-muted-foreground"
                    }`}>
                      {day.toLocaleDateString(locale, { weekday: "short" })}
                    </span>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isToday ? "bg-primary text-on-brand" : "text-foreground"
                    }`}>
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayBookings.map((b) => (
                      <Link
                        key={b.id}
                        href={`/expert/dashboard/bookings/${b.id}`}
                        className={`block rounded-md border-l-2 px-2 py-1 text-[10px] font-medium transition-opacity hover:opacity-80 ${
                          STATUS_COLORS[b.status] ?? FALLBACK_CHIP
                        }`}
                      >
                        <p className="truncate font-semibold">{formatTime(b.scheduledStart)}</p>
                        <p className="truncate">{b.citizen?.firstName ?? t("defaultClient")}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === "month" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-7 gap-px bg-border">
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="bg-card px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {day.toLocaleDateString(locale, { weekday: "short" })}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-border">
              {monthDays.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} className="bg-card" />;
                const dayBookings = getBookingsForDay(day);
                const isToday = isSameDay(day, today);
                return (
                  <div key={i} className="min-h-[100px] bg-card p-1.5">
                    <div className={`mb-1 flex items-center justify-end`}>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                        isToday ? "bg-primary text-on-brand" : "text-foreground"
                      }`}>
                        {day.getDate()}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {dayBookings.slice(0, 3).map((b) => (
                        <Link
                          key={b.id}
                          href={`/expert/dashboard/bookings/${b.id}`}
                          className={`block truncate rounded border-l-2 px-1 py-0.5 text-[9px] font-medium transition-opacity hover:opacity-80 ${
                            STATUS_COLORS[b.status] ?? FALLBACK_CHIP
                          }`}
                        >
                          {formatTime(b.scheduledStart)} {b.citizen?.firstName ?? ""}
                        </Link>
                      ))}
                      {dayBookings.length > 3 && (
                        <p className="text-center text-[9px] text-muted-foreground">{t("moreBookings", { count: dayBookings.length - 3 })}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
