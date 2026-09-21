"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Hourglass,
  Layers,
  XCircle,
} from "lucide-react";
import { useGetBookings, type Booking } from "@/api/generated";
import {
  PageHeader,
  EmptyState,
  SkeletonList,
  ErrorState,
  StatusBadge,
  StatCard,
} from "@/shared/components/dashboard";

const ACTIVE_STATUSES = new Set(["PENDING", "CONFIRMED", "ACTIVE"]);
const COMPLETED_STATUS = "COMPLETED";

type Tab = "active" | "completed" | "cancelled";

function caseRef(id: string): string {
  return `BK-${id.slice(0, 6).toUpperCase()}`;
}

export default function CasesPage() {
  const t = useTranslations("expertDashboard");
  const locale = useLocale();
  const { data, isLoading, isError, refetch } = useGetBookings({ limit: 100 });
  const [activeTab, setActiveTab] = useState<Tab>("active");

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatScheduled(iso: string): string {
    return `${formatDate(iso)} at ${formatTime(iso)}`;
  }

  const bookings: Booking[] = useMemo(
    () => (data?.status === 200 ? data.data.data : []),
    [data]
  );

  const grouped = useMemo(() => {
    const result: Record<Tab, Booking[]> = { active: [], completed: [], cancelled: [] };
    for (const b of bookings) {
      if (ACTIVE_STATUSES.has(b.status)) result.active.push(b);
      else if (b.status === COMPLETED_STATUS) result.completed.push(b);
      else result.cancelled.push(b);
    }
    result.active.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    result.completed.sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());
    result.cancelled.sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());
    return result;
  }, [bookings]);

  const items = grouped[activeTab];
  const awaitingDecision = grouped.active.filter((b) => b.status === "PENDING").length;

  const TABS: { key: Tab; label: string }[] = [
    { key: "active", label: t("casesTabsActive") },
    { key: "completed", label: t("casesTabsCompleted") },
    { key: "cancelled", label: t("casesTabsCancelled") },
  ];

  function renderRow(b: Booking) {
    const clientName = b.citizen ? `${b.citizen.firstName} ${b.citizen.lastName}` : "Client";
    const initials = clientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
    const awaitingPayment = b.paymentStatus === "PENDING" || b.paymentStatus === "FAILED";
    const rescheduleRequested = Boolean(b.pendingRescheduleStart && b.status !== "CANCELLED");

    return (
      <Link
        key={b.id}
        href={`/expert/dashboard/bookings/${b.id}`}
        className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/20">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{caseRef(b.id)}</p>
            <p className="text-sm font-semibold text-foreground">{clientName}</p>
            <p className="flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
              <span>{b.service?.name ?? "Consultation"}</span>
              <span aria-hidden="true">&middot;</span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3 w-3" aria-hidden="true" />
                {formatScheduled(b.scheduledStart)}
              </span>
            </p>
          </div>
          {(activeTab === "active") && (
            <StatusBadge tone={awaitingPayment ? "pending" : "active"} className="px-2 py-0.5 text-[10px]">
              {awaitingPayment ? t("casesAwaitingPayment") : t("casesPaid")}
            </StatusBadge>
          )}
          {rescheduleRequested && (
            <StatusBadge tone="warning" className="px-2 py-0.5 text-[10px]">
              <CalendarClock className="h-2.5 w-2.5" aria-hidden="true" />
              {t("casesRescheduleRequested")}
            </StatusBadge>
          )}
          <StatusBadge
            tone={activeTab === "active" ? "active" : activeTab === "completed" ? "success" : "destructive"}
          >
            {activeTab === "active" ? t("casesTabsActive") : activeTab === "completed" ? t("casesTabsCompleted") : t("casesTabsCancelled")}
          </StatusBadge>
        </div>
      </Link>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <PageHeader
        title={t("casesTitle")}
        description={t("casesDesc")}
        actions={
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={
                  activeTab === key
                    ? "rounded-md bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                    : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {label}
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary dark:bg-white/10 dark:text-white">
                  {grouped[key].length}
                </span>
              </button>
            ))}
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("casesStatActive")} value={grouped.active.length} icon={Layers} />
        <StatCard label={t("casesStatAwaiting")} value={awaitingDecision} icon={Hourglass} />
        <StatCard label={t("casesStatCompleted")} value={grouped.completed.length} icon={CheckCircle2} />
        <StatCard label={t("casesStatTotal")} value={bookings.length} icon={Briefcase} />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <SkeletonList count={3} itemClassName="h-24" />
        ) : isError ? (
          <ErrorState
            title={t("casesLoadFailed")}
            message={t("casesLoadFailedDesc")}
            onRetry={() => refetch()}
            retryLabel={t("casesRetry")}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={activeTab === "active" ? Hourglass : activeTab === "completed" ? CheckCircle2 : XCircle}
            title={
              activeTab === "active"
                ? t("casesEmptyActive")
                : activeTab === "completed"
                  ? t("casesEmptyCompleted")
                  : t("casesEmptyCancelled")
            }
            description={activeTab === "active" ? t("casesEmptyActiveDesc") : undefined}
          />
        ) : (
          <div className="space-y-4">{items.map(renderRow)}</div>
        )}
      </div>
    </div>
  );
}