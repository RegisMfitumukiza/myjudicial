"use client";

import { useMemo, useState } from "react";
import { CalendarClock, History, XCircle, Video } from "lucide-react";
import { useGetBookings } from "@/api/generated";
import type { Booking } from "@/api/generated";
import { useTranslations } from "next-intl";

type Tab = "upcoming" | "past" | "cancelled";

const STATUS_STYLE: Record<string, string> = {
  Upcoming: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Completed: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Cancelled: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const TAB_ICON: Record<Tab, React.ElementType> = {
  upcoming: CalendarClock,
  past: History,
  cancelled: XCircle,
};

const TABS: { key: Tab; labelKey: string }[] = [
  { key: "upcoming", labelKey: "tabUpcoming" },
  { key: "past", labelKey: "tabPast" },
  { key: "cancelled", labelKey: "tabCancelled" },
];

function displayStatus(status: Booking["status"]): "Upcoming" | "Completed" | "Cancelled" {
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED" || status === "REFUNDED") return "Cancelled";
  return "Upcoming";
}

export default function ConsultationsPage() {
  const t = useTranslations("expertDashboard_consultations");
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const { data, isLoading, isError } = useGetBookings({ limit: 100 });
  const bookings = data?.status === 200 ? data.data.data : [];

  const grouped = useMemo(() => {
    const result: Record<Tab, Booking[]> = { upcoming: [], past: [], cancelled: [] };
    for (const b of bookings) {
      if (b.status === "PENDING" || b.status === "CONFIRMED" || b.status === "ACTIVE") result.upcoming.push(b);
      else if (b.status === "COMPLETED") result.past.push(b);
      else result.cancelled.push(b);
    }
    return result;
  }, [bookings]);

  const items = grouped[activeTab];
  const Icon = TAB_ICON[activeTab];

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <div className="mb-6 shrink-0">
        <h1 className="text-[22px] font-bold text-brand-dark capitalize">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <div className="mb-6 flex gap-6 border-b border-brand-border/10 dark:border-gray-700">
        {TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 text-sm font-medium transition ${
              activeTab === key
                ? "border-b-2 border-brand-blue text-brand-blue"
                : "text-gray-500 hover:text-brand-dark dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {t(labelKey)}
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
              {grouped[key].length}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-brand-border/20 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {t("failedToLoad")}
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col gap-4">
          {items.map((c) => {
            const clientName = c.citizen ? `${c.citizen.firstName} ${c.citizen.lastName}` : t("clientFallback");
            const initials = clientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const statusRaw = displayStatus(c.status);
            const statusMap: Record<"Upcoming" | "Completed" | "Cancelled", string> = {
              Upcoming: t("statusUpcoming"),
              Completed: t("statusCompleted"),
              Cancelled: t("statusCancelled"),
            };
            const status = statusMap[statusRaw];
            const scheduled = new Date(c.scheduledStart);

            return (
              <div
                key={c.id}
                className="rounded-xl border border-brand-border/20 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue text-sm font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">{clientName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.service?.name ?? t("serviceFallback")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-brand-dark dark:text-gray-100">
                      {scheduled.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {scheduled.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[statusRaw]}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3 border-t border-brand-border/10 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <Video size={14} />
                  <span>{t("videoConsult")}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-brand-border/20 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 shadow-sm dark:bg-gray-800">
            <Icon size={28} className="text-gray-400" />
          </div>
          <h2 className="mb-1 text-base font-bold text-brand-dark dark:text-gray-100">
            {t("noTitle", { tab: t(`tab${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` as any) })}
          </h2>
          <p className="max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
            {activeTab === "upcoming"
              ? t("noUpcoming")
              : activeTab === "past"
                ? t("noPast")
                : t("noCancelled")}
          </p>
        </div>
      )}
    </div>
  );
}
