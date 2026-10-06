import { useMemo } from "react";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

/**
 * Returns the current time-of-day bucket based on local clock hours.
 *
 * | Period    | Hours          |
 * |-----------|----------------|
 * | morning   | 05:00 – 11:59  |
 * | afternoon | 12:00 – 16:59  |
 * | evening   | 17:00 – 20:59  |
 * | night     | 21:00 – 04:59  |
 */
export function useTimeOfDay(): TimeOfDay {
  return useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  }, []);
}

/** The i18n key suffix that maps to each time-of-day bucket. */
export const TIME_GREETING_KEY: Record<TimeOfDay, "greetingMorning" | "greetingAfternoon" | "greetingEvening" | "greetingNight"> = {
  morning: "greetingMorning",
  afternoon: "greetingAfternoon",
  evening: "greetingEvening",
  night: "greetingNight",
};
