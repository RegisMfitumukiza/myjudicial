"use client";

import { ChevronRight, Clock, AlertCircle } from "lucide-react";
import { PracticeSession } from "@/features/experts/dashboard-types";
import { useTranslations } from "next-intl";

interface BookingQueueProps {
  sessions: PracticeSession[];
}

export function BookingQueue({ sessions }: BookingQueueProps) {
  const t = useTranslations("expertDashboard");
  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t("priorityQueue")}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-alert px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            {t("live")}
          </span>
        </div>
        <button className="flex items-center gap-1 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:shadow-sm dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800">
          {t("viewAll")} <ChevronRight size={13} />
        </button>
      </div>
      {sessions.length === 0 ? (
        <p className="mt-6 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noBookings")}
        </p>
      ) : (
      <div className="mt-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              {[t("columns.client"), t("columns.case"), t("columns.time"), t("columns.status")].map((h, i) => (
                <th key={i} className="pb-2 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {sessions.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 text-xs font-bold text-brand-blue">
                      {s.client.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.client}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{s.clientCode}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 dark:border-gray-600 dark:text-gray-400">
                    {s.caseNature}
                  </span>
                </td>
                <td className={`py-3 text-xs font-semibold ${s.urgent ? "text-brand-alert" : "text-gray-500 dark:text-gray-400"}`}>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {s.timeLabel}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`flex items-center gap-1 text-xs font-bold uppercase ${
                    s.status === "URGENT" ? "text-brand-alert" :
                    s.status === "CONFIRMED" ? "text-green-600 dark:text-green-400" :
                    "text-gray-400 dark:text-gray-500"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      s.status === "URGENT" ? "bg-brand-alert" :
                      s.status === "CONFIRMED" ? "bg-green-500" :
                      "bg-gray-300 dark:bg-gray-600"
                    }`} />
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {sessions.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertCircle size={12} />
          {t("urgentAttention", { count: sessions.filter((s) => s.urgent).length })}
        </div>
      )}
    </div>
  );
}
