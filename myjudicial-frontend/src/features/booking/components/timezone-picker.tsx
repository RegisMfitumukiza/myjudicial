"use client";

import { Globe } from "lucide-react";
import { TIMEZONE_OPTIONS } from "../constants";

interface TimeZonePickerProps {
  value: string;
  onChange: (tz: string) => void;
  className?: string;
}

export function TimeZonePicker({ value, onChange, className = "" }: TimeZonePickerProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe size={14} className="text-brand-dark/50 dark:text-white/50" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-brand-border/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-brand-dark outline-none focus:border-brand-dark dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white"
      >
        {TIMEZONE_OPTIONS.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  );
}
