"use client";

import { useMemo, useState } from "react";
import { CalendarClock, History, XCircle, Video } from "lucide-react";
import { useGetBookings } from "@/api/generated";
import type { Booking } from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/shared/components/ui/button";
import { JOINABLE_EARLY_WINDOW_MS, OVERTIME_GRACE_WINDOW_MS } from "@/features/booking/constants";
import {
  PageHeader,
  EmptyState,
  SkeletonList,
  ErrorState,
  StatusBadge,
  type StatusTone,
} from "@/shared/components/dashboard";

type Tab = "upcoming" | "past" | "cancelled";

const STATUS_TONE: Record<"Upcoming" | "Completed" | "Cancelled", StatusTone> = {
  Upcoming: "active",
  Completed: "success",
  Cancelled: "destructive",
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
  const locale = useLocale();
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
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        className="capitalize"
      />

      <div className="mb-6 mt-6 shrink-0">
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5 max-w-full overflow-x-auto scrollbar-none">
          {TABS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`shrink-0 ${
                activeTab === key
                  ? "rounded-md bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                  : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              }`}
            >
              {t(labelKey)}
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary dark:bg-white/10 dark:text-white">
                {grouped[key].length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={3} itemClassName="h-24" />
      ) : isError ? (
        <ErrorState message={t("failedToLoad")} />
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
                className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/20">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{clientName}</p>
                    <p className="text-xs text-muted-foreground">{c.service?.name ?? t("serviceFallback")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">
                      {scheduled.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {scheduled.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <StatusBadge tone={STATUS_TONE[statusRaw]}>{status}</StatusBadge>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Video size={14} />
                    <span>{t("videoConsult")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="xs" asChild>
                      <Link href={`/expert/dashboard/bookings/${c.id}`}>
                        {t("viewDetails")}
                      </Link>
                    </Button>
                    {(() => {
                      const nowMs = Date.now();
                      const startMs = new Date(c.scheduledStart).getTime();
                      const endMs = new Date(c.scheduledEnd).getTime();
                      const isTooEarly = nowMs < startMs - JOINABLE_EARLY_WINDOW_MS;
                      const isPastWindow = nowMs > endMs + OVERTIME_GRACE_WINDOW_MS;
                      const isEnded = Boolean((c as any).actualEndTime || (c as any).completedAt);
                      const canJoin = (c.status === "CONFIRMED" || c.status === "ACTIVE") && !isTooEarly && !isPastWindow && !isEnded;

                      if (canJoin) {
                        return (
                          <Button size="xs" asChild>
                            <Link href={`/expert/dashboard/consultations/${c.id}/join`}>
                              <Video size={12} className="mr-1" /> {t("joinRoom")}
                            </Link>
                          </Button>
                        );
                      }
                      if (isPastWindow && !c.deliveredAt && (c.status === "CONFIRMED" || c.status === "ACTIVE")) {
                        return (
                          <Button size="xs" variant="outline" className="text-emerald-700 border-emerald-600/30 hover:bg-emerald-50 dark:text-emerald-300" asChild>
                            <Link href={`/expert/dashboard/bookings/${c.id}`}>
                              {t("viewDetails")}
                            </Link>
                          </Button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Icon}
          title={t("noTitle", { tab: t(`tab${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}` as any) })}
          description={
            activeTab === "upcoming"
              ? t("noUpcoming")
              : activeTab === "past"
                ? t("noPast")
                : t("noCancelled")
          }
        />
      )}
    </div>
  );
}
