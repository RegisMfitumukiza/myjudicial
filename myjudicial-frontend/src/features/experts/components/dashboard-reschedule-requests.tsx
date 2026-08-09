"use client";

import { Link } from "@/i18n/routing";
import { CalendarClock, ArrowRight } from "lucide-react";
import type { Booking } from "@/api/generated";
import { useTranslations } from "next-intl";

interface RescheduleRequestsCardProps {
  bookings: Booking[];
}

export function RescheduleRequestsCard({ bookings }: RescheduleRequestsCardProps) {
  const t = useTranslations("expertDashboard");
  if (bookings.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-5 dark:border-amber-700 dark:bg-amber-950/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">
            {t("title", { count: bookings.length })}
          </h3>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-800 dark:text-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          {t("actionNeeded")}
        </span>
      </div>

      <div className="space-y-3">
        {bookings.map((b) => {
          const clientName = b.citizen
            ? `${b.citizen.firstName} ${b.citizen.lastName}`
            : t("defaultClientName");
          const pendingDate = new Date(b.pendingRescheduleStart!);
          const currentDate = new Date(b.scheduledStart);

          return (
            <Link
              key={b.id}
              href={`/expert/dashboard/bookings/${b.id}`}
              className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3 transition-colors hover:bg-amber-50 dark:border-amber-800 dark:bg-black dark:hover:bg-amber-950/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-dark dark:text-white truncate">
                  {clientName}
                </p>
                <p className="text-xs text-brand-dark/50 dark:text-white/50">
                  {b.service?.name ?? t("defaultServiceName")}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-brand-dark/60 dark:text-white/60">
                  <span>{currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <ArrowRight size={10} />
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    {t("proposedTime", {
                      date: pendingDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
                      time: pendingDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                    })}
                  </span>
                </div>
              </div>
              <ArrowRight size={16} className="text-amber-500 dark:text-amber-400 shrink-0 ml-3" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
