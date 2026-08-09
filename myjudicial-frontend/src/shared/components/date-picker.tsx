"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getWeekendRange(now: Date): { start: Date; end: Date; label: string } {
  const day = now.getDay();
  const diffToSat = day === 0 ? -1 : 6 - day;
  const sat = new Date(now);
  sat.setDate(now.getDate() + diffToSat);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  return { start: sat, end: sun, label: `${formatDate(sat)} \u2013 ${formatDate(sun)}` };
}

function getMonthDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface DatePickerProps {
  value: string;
  onChange: (label: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const weekend = getWeekendRange(today);

  function selectDate(d: Date) {
    onChange(formatDateFull(d));
    setOpen(false);
  }

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const days = getMonthDays(year, month);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</span>
        <span className={`block text-[11px] ${value ? "font-semibold text-brand-dark dark:text-gray-100" : "text-slate-500 dark:text-gray-400"}`}>
          {value || "Add time"}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-2 flex w-[580px] overflow-hidden rounded-xl border border-brand-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
            {/* Left — Quick selects */}
            <div className="flex w-[200px] flex-col gap-2 border-r border-brand-border p-4 dark:border-gray-700">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Quick Select</p>
              {[
                { label: "Today", sub: formatDate(today), date: today },
                { label: "Tomorrow", sub: formatDate(tomorrow), date: tomorrow },
                { label: "This weekend", sub: weekend.label, date: weekend.start },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => selectDate(opt.date)}
                  className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors ${
                    value === formatDateFull(opt.date)
                      ? "border-brand-blue bg-brand-blue/5"
                      : "border-brand-border hover:border-brand-dark dark:hover:border-gray-100"
                  }`}
                >
                  <span className="text-sm font-bold text-brand-dark dark:text-gray-100">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground">{opt.sub}</span>
                </button>
              ))}
            </div>

            {/* Right — Calendar */}
            <div className="flex flex-1 flex-col p-4">
              <div className="mb-3 flex items-center justify-between">
                <button onClick={prevMonth} className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-brand-dark dark:hover:bg-gray-800 dark:hover:text-gray-100">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-brand-dark dark:text-gray-100">
                  {MONTHS[month]} {year}
                </span>
                <button onClick={nextMonth} className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-brand-dark dark:hover:bg-gray-800 dark:hover:text-gray-100">
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={`day-header-${i}`} className="py-1">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 text-center">
                {days.map((d, i) => {
                  if (d === null) return <span key={`e-${i}`} />;
                  const date = new Date(year, month, d);
                  const isPast = date < new Date(new Date().toDateString());
                  const isToday = isSameDay(date, today);
                  const isSelected = value === formatDateFull(date);
                  return (
                    <button
                      key={d}
                      disabled={isPast && !isToday}
                      onClick={() => selectDate(date)}
                      className={`rounded-full py-1.5 text-[13px] transition-colors ${
                        isSelected
                          ? "bg-brand-dark text-white font-bold dark:bg-gray-100 dark:text-gray-900"
                          : isToday
                          ? "font-bold text-brand-dark dark:text-gray-100"
                          : isPast
                          ? "text-gray-300 cursor-not-allowed dark:text-gray-600"
                          : "text-brand-dark/70 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
