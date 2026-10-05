"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { CreditCard, CheckCircle, Clock, XCircle, Loader2, AlertCircle, Search, Filter, Receipt, CalendarDays } from "lucide-react";
import { useBookings } from "@/features/booking/hooks/useBookings";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";
import type { PaymentNestedStatus } from "@/api/generated";
import { useTranslations } from "next-intl";

function fmt(n: number) {
  return n.toLocaleString("en-RW");
}

export default function PaymentsPage() {
  const t = useTranslations("clientDashboard.payments");
  const { isBookingFirst, isLoading: paymentModeLoading } = usePaymentMode();

  const STATUS_CONFIG: Record<PaymentNestedStatus, { icon: React.ReactNode; badge: string; label: string }> = {
    PAID: {
      icon: <CheckCircle size={15} className="text-green-600" />,
      badge: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      label: t("status.PAID"),
    },
    PENDING: {
      icon: <Clock size={15} className="text-orange-500" />,
      badge: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      label: t("status.PENDING"),
    },
    AUTHORIZED: {
      icon: <Clock size={15} className="text-orange-500" />,
      badge: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      label: t("status.AUTHORIZED"),
    },
    FAILED: {
      icon: <XCircle size={15} className="text-red-500" />,
      badge: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      label: t("status.FAILED"),
    },
    REFUNDED: {
      icon: <CheckCircle size={15} className="text-blue-500" />,
      badge: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      label: t("status.REFUNDED"),
    },
    NOT_REQUIRED: {
      icon: <Clock size={15} className="text-gray-400" />,
      badge: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
      label: t("status.NOT_REQUIRED"),
    },
  };

  const STATUS_FILTERS: { key: "ALL" | PaymentNestedStatus; label: string }[] = [
    { key: "ALL", label: t("filters.ALL") },
    { key: "PAID", label: t("filters.PAID") },
    { key: "PENDING", label: t("filters.PENDING") },
    { key: "FAILED", label: t("filters.FAILED") },
    { key: "REFUNDED", label: t("filters.REFUNDED") },
  ];

  const DATE_RANGES = [
    { key: "all", label: t("dateRanges.all") },
    { key: "30d", label: t("dateRanges.30d") },
    { key: "90d", label: t("dateRanges.90d") },
    { key: "12m", label: t("dateRanges.12m") },
  ] as const;


  const { bookings, isLoading, error } = useBookings();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PaymentNestedStatus>("ALL");
  const [dateRange, setDateRange] = useState<"all" | "30d" | "90d" | "12m">("all");

  const payments = useMemo(() => bookings.filter((b) => b.payment), [bookings]);

  const filteredPayments = useMemo(() => {
    const now = Date.now();
    const ms: Record<string, number> = { "30d": 30 * 86400000, "90d": 90 * 86400000, "12m": 365 * 86400000 };

    return payments.filter((b) => {
      if (statusFilter !== "ALL" && b.payment?.status !== statusFilter) return false;
      if (dateRange !== "all" && new Date(b.scheduledStart).getTime() < now - ms[dateRange]) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = `${b.service?.name ?? ""} ${b.expert?.displayName ?? ""} ${b.payment?.txRef ?? ""}`.toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [payments, statusFilter, dateRange, search]);

  const total = filteredPayments.reduce((sum, b) => sum + (b.payment?.amount ?? 0), 0);
  const paid = filteredPayments.filter((b) => b.payment?.status === "PAID").reduce((sum, b) => sum + (b.payment?.amount ?? 0), 0);
  const outstanding = total - paid;

  const statCards = [
    { label: t("stats.total"), value: `RWF ${fmt(total)}`, color: "text-brand-dark dark:text-gray-100", bg: "bg-brand-dark/5", border: "border-brand-border dark:border-gray-700" },
    { label: t("stats.paid"), value: `RWF ${fmt(paid)}`, color: "text-brand-green", bg: "bg-brand-green/10", border: "border-brand-green/30" },
    { label: t("stats.outstanding"), value: `RWF ${fmt(outstanding)}`, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  ];

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <div>
        <h1 className="text-xl sm:text-[22px] font-bold text-brand-dark dark:text-gray-100 break-words">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("subtitle")}
        </p>
      </div>

      {isBookingFirst || paymentModeLoading ? (
        <div className="rounded-xl border border-brand-border/20 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("paymentsDisabled")}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t("paymentsDisabledDesc")}</p>
          <Link href="/client/dashboard/consultations" className="mt-4 inline-block text-sm font-semibold text-brand-blue hover:underline">
            {t("viewConsultations")}
          </Link>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-brand-dark/50 dark:text-white/50" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24">
          <AlertCircle className="h-10 w-10 text-brand-alert mb-4" />
          <p className="text-brand-alert font-medium">{t("failedToLoad")}</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-brand-border/20 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <CreditCard className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t("noPayments")}</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t("bookConsultationDesc")}</p>
          <Link href="/search" className="mt-4 inline-block text-sm font-semibold text-brand-blue hover:underline">
            {t("browseLawyers")}
          </Link>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {statCards.map(({ label, value, color, bg, border }) => (
              <div key={label} className={`rounded-xl border ${border} bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-md min-w-0 flex flex-col justify-between`}>
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${bg} shrink-0`}>
                  <CreditCard size={18} className={color} />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-gray-100 truncate">{value}</p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-brand-border/20 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md">
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-gray-700 px-5 py-4">
              <h2 className="text-sm font-bold text-brand-dark dark:text-gray-100">{t("paymentHistory")}</h2>
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {filteredPayments.length === 1 ? t("itemsCount", { count: 1 }) : t("itemsCountPlural", { count: filteredPayments.length })}
              </span>
            </div>

            {/* Filter controls */}
            <div className="border-b border-brand-border/10 dark:border-gray-700 px-5 py-3 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full rounded-lg border border-brand-border/20 dark:border-gray-700 bg-brand-canvas dark:bg-gray-800 pl-9 pr-3 py-2 text-[13px] text-brand-dark dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-dark/30 dark:focus:ring-white/30"
                />
              </div>

              {/* Status tabs + date range */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-1">
                  {STATUS_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                        statusFilter === key
                          ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <Filter size={13} className="text-gray-400" />
                  {DATE_RANGES.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setDateRange(key)}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                        dateRange === key
                          ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment list */}
            {filteredPayments.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("noMatchFilters")}</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border dark:divide-gray-700">
                {filteredPayments.map((booking) => {
                  const status = (booking.payment?.status ?? "NOT_REQUIRED") as PaymentNestedStatus;
                  const cfg = STATUS_CONFIG[status];
                  return (
                    <Link
                      key={booking.id}
                      href={`/client/dashboard/consultations/${booking.id}`}
                      className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-brand-canvas dark:hover:bg-gray-800"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-gray-800">
                        <CreditCard size={16} className="text-brand-dark dark:text-gray-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">
                          {booking.service?.name ?? t("consultation")} &middot; {booking.expert?.displayName ?? t("legalExpert")}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                          <span className="font-semibold text-brand-dark dark:text-gray-100">
                            {booking.payment?.currency ?? "RWF"} {fmt(booking.payment?.amount ?? 0)}
                          </span>
                          <span>&middot;</span>
                          <span>{new Date(booking.scheduledStart).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                          <span>&middot;</span>
                          <span className="font-mono">{booking.payment?.txRef}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {booking.payment?.status === "PAID" && (
                          <span className="text-gray-300 dark:text-gray-600">
                            <Receipt size={15} />
                          </span>
                        )}
                        {cfg.icon}
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
