"use client";

import { ChevronRight, Clock, AlertCircle } from "lucide-react";
import { PracticeSession } from "@/features/experts/dashboard-types";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/routing";
import { Button } from "@/shared/components/ui/button";

interface BookingQueueProps {
  sessions: PracticeSession[];
}

export function BookingQueue({ sessions }: BookingQueueProps) {
  const t = useTranslations("expertDashboard");
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold tracking-tight text-foreground">{t("priorityQueue")}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-alert px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
            {t("live")}
          </span>
        </div>
        <Button asChild variant="outline" size="xs">
          <Link href="/expert/dashboard/bookings">
            {t("viewAll")} <ChevronRight size={13} aria-hidden="true" />
          </Link>
        </Button>
      </div>
      {sessions.length === 0 ? (
        <p className="mt-6 py-4 text-center text-sm text-muted-foreground">
          {t("noBookings")}
        </p>
      ) : (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {[t("columns.client"), t("columns.case"), t("columns.time"), t("columns.status")].map((h, i) => (
                <th key={i} className="pb-2 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sessions.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-muted/50">
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {s.client.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.client}</p>
                      <p className="text-xs text-muted-foreground">{s.clientCode}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    {s.caseNature}
                  </span>
                </td>
                <td className={`py-3 text-xs font-semibold ${s.urgent ? "text-destructive" : "text-muted-foreground"}`}>
                  <span className="flex items-center gap-1">
                    <Clock size={11} aria-hidden="true" />
                    {s.timeLabel}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`flex items-center gap-1 text-xs font-semibold uppercase ${
                    s.status === "URGENT" ? "text-destructive" :
                    s.status === "CONFIRMED" ? "text-primary" :
                    "text-warning"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      s.status === "URGENT" ? "bg-destructive" :
                      s.status === "CONFIRMED" ? "bg-primary" :
                      "bg-warning"
                    }`} aria-hidden="true" />
                    {s.status === "URGENT" ? "Urgent" : s.status === "CONFIRMED" ? t("casesPaid", { defaultValue: "Confirmed" }) : t("casesAwaitingPayment", { defaultValue: "Pending" })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {sessions.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertCircle size={12} aria-hidden="true" />
          {t("urgentAttention", { count: sessions.filter((s) => s.urgent).length })}
        </div>
      )}
    </div>
  );
}
