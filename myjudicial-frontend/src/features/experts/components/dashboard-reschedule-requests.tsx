"use client";

import { Link } from "@/i18n/routing";
import { CalendarClock, ArrowRight } from "lucide-react";
import type { Booking } from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";

interface RescheduleRequestsCardProps {
  bookings: Booking[];
}

export function RescheduleRequestsCard({ bookings }: RescheduleRequestsCardProps) {
  const t = useTranslations("expertDashboard_dashboard-reschedule-requests");
  const locale = useLocale();
  if (bookings.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 sm:p-5 min-w-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock size={18} className="text-warning shrink-0" aria-hidden="true" />
          <h3 className="text-base font-semibold tracking-tight text-warning">
            {t("title", { count: bookings.length })}
          </h3>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning shrink-0">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />
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
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {clientName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {b.service?.name ?? t("defaultServiceName")}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{currentDate.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" })}</span>
                  <ArrowRight size={10} aria-hidden="true" />
                  <span className="font-semibold text-warning">
                    {t("proposedTime", {
                      date: pendingDate.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" }),
                      time: pendingDate.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })
                    })}
                  </span>
                </div>
              </div>
              <ArrowRight size={16} className="ml-3 shrink-0 text-warning" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
