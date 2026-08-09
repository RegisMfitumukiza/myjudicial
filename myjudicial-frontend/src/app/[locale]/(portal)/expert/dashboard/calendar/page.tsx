"use client";

import { useState, useMemo } from "react";
import { Link, useRouter } from "@/i18n/routing";
import {
  ChevronLeft, ChevronRight, Clock, Video, Loader2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetBookings } from "@/api/generated";
import type { Booking } from "@/api/generated";

type ViewMode = "week" | "month";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 border-l-amber-500 text-amber-800 dark:bg-amber-900/20 dark:border-l-amber-400 dark:text-amber-300",
  CONFIRMED: "bg-blue-100 border-l-blue-500 text-blue-800 dark:bg-blue-900/20 dark:border-l-blue-400 dark:text-blue-300",
  ACTIVE: "bg-green-100 border-l-green-500 text-green-800 dark:bg-green-900/20 dark:border-l-green-400 dark:text-green-300",
  COMPLETED: "bg-gray-100 border-l-gray-400 text-gray-600 dark:bg-gray-800 dark:border-l-gray-500 dark:text-gray-400",
  CANCELLED: "bg-red-50 border-l-red-400 text-red-600 dark:bg-red-900/10 dark:border-l-red-500 dark:text-red-400",
  REFUNDED: "bg-purple-50 border-l-purple-400 text-purple-600 dark:bg-purple-900/10 dark:border-l-purple-500 dark:text-purple-400",
};

export default function CalendarPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

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
      <div className="flex h-full items-center justify-center bg-white dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-brand-dark/50 dark:text-white/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-black px-6">
        <AlertCircle className="h-10 w-10 text-brand-alert mb-4" />
        <p className="text-brand-alert font-medium">Failed to load calendar</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View your consultation schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-brand-border/20 dark:border-gray-700">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-xs font-semibold ${
                viewMode === "week"
                  ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-xs font-semibold ${
                viewMode === "month"
                  ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Month
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs">
            Today
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={prevPeriod} className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border/20 hover:bg-brand-canvas dark:border-gray-700">
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
          {viewMode === "week"
            ? `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()} - ${MONTH_NAMES[addDays(weekStart, 6).getMonth()]} ${addDays(weekStart, 6).getDate()}, ${weekStart.getFullYear()}`
            : `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
          }
        </p>
        <button onClick={nextPeriod} className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border/20 hover:bg-brand-canvas dark:border-gray-700">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Week View */}
      {viewMode === "week" && (
        <div className="grid grid-cols-7 gap-px rounded-xl border border-brand-border/20 bg-brand-border/10 dark:border-gray-700 dark:bg-gray-700">
          {weekDays.map((day, i) => {
            const dayBookings = getBookingsForDay(day);
            const isToday = isSameDay(day, today);
            return (
              <div key={i} className="min-h-[200px] bg-white p-2 dark:bg-gray-900">
                <div className={`mb-2 flex items-center justify-between`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isToday ? "text-brand-blue" : "text-gray-400 dark:text-gray-500"
                  }`}>
                    {DAY_NAMES[day.getDay()]}
                  </span>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    isToday ? "bg-brand-dark text-white dark:bg-white dark:text-black" : "text-gray-600 dark:text-gray-400"
                  }`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayBookings.map((b) => (
                    <Link
                      key={b.id}
                      href={`/expert/dashboard/bookings/${b.id}`}
                      className={`block rounded-md border-l-2 px-2 py-1 text-[10px] font-medium transition-colors hover:opacity-80 ${
                        STATUS_COLORS[b.status] ?? "bg-gray-50 border-l-gray-300 text-gray-500"
                      }`}
                    >
                      <p className="truncate font-semibold">{formatTime(b.scheduledStart)}</p>
                      <p className="truncate">{b.citizen?.firstName ?? "Client"}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {viewMode === "month" && (
        <div className="rounded-xl border border-brand-border/20 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="grid grid-cols-7 gap-px bg-brand-border/10 dark:bg-gray-700">
            {DAY_NAMES.map((d) => (
              <div key={d} className="bg-white px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-900 dark:text-gray-500">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-brand-border/10 dark:bg-gray-700">
            {monthDays.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} className="bg-white dark:bg-gray-900" />;
              const dayBookings = getBookingsForDay(day);
              const isToday = isSameDay(day, today);
              return (
                <div key={i} className="min-h-[100px] bg-white p-1.5 dark:bg-gray-900">
                  <div className={`mb-1 flex items-center justify-end`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isToday ? "bg-brand-dark text-white dark:bg-white dark:text-black" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map((b) => (
                      <Link
                        key={b.id}
                        href={`/expert/dashboard/bookings/${b.id}`}
                        className={`block truncate rounded border-l-2 px-1 py-0.5 text-[9px] font-medium transition-colors hover:opacity-80 ${
                          STATUS_COLORS[b.status] ?? "bg-gray-50 border-l-gray-300 text-gray-500"
                        }`}
                      >
                        {formatTime(b.scheduledStart)} {b.citizen?.firstName ?? ""}
                      </Link>
                    ))}
                    {dayBookings.length > 3 && (
                      <p className="text-center text-[9px] text-gray-400">+{dayBookings.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
