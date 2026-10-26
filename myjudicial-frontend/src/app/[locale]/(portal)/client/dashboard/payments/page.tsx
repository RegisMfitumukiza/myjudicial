"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  Receipt,
  ShieldCheck,
  Info,
  ExternalLink,
  Copy,
  Printer,
  X,
  Phone,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useBookings } from "@/features/booking/hooks/useBookings";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";
import { useAuth } from "@/providers/auth-provider";
import type { Booking, PaymentNestedStatus } from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";

function formatRwf(amount: number | string | undefined | null): string {
  const numeric = typeof amount === "number" ? amount : Number(amount ?? 0);
  const clean = isNaN(numeric) ? 0 : Math.round(numeric);
  return `RWF ${clean.toLocaleString("en-RW")}`;
}

export default function PaymentsPage() {
  const t = useTranslations("clientDashboard.payments");
  const locale = useLocale();
  const { user } = useAuth();
  const { isBookingFirst, isLoading: paymentModeLoading } = usePaymentMode();
  const { bookings, isLoading, error } = useBookings();

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | PaymentNestedStatus>("ALL");
  const [dateRange, setDateRange] = useState<"all" | "30d" | "90d" | "12m">("all");
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState<Booking | null>(null);
  const [now] = useState(() => Date.now());

  // Filtered payments list
  const payments = useMemo(() => bookings.filter((b) => b.payment), [bookings]);

  const filteredPayments = useMemo(() => {
    const ms: Record<string, number> = {
      "30d": 30 * 86400000,
      "90d": 90 * 86400000,
      "12m": 365 * 86400000,
    };

    return payments.filter((b) => {
      if (statusFilter !== "ALL" && b.payment?.status !== statusFilter) return false;
      if (dateRange !== "all" && new Date(b.scheduledStart).getTime() < now - ms[dateRange]) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const serviceName = b.service?.name?.toLowerCase() ?? "";
        const expertName = b.expert?.displayName?.toLowerCase() ?? "";
        const txRef = b.payment?.txRef?.toLowerCase() ?? "";
        if (!serviceName.includes(q) && !expertName.includes(q) && !txRef.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [payments, statusFilter, dateRange, search, now]);

  // Financial Telemetry (Coerce strictly to Number to prevent "0200" string concatenation)
  const totalBilled = useMemo(() => {
    return filteredPayments.reduce((sum, b) => sum + Number(b.payment?.amount ?? 0), 0);
  }, [filteredPayments]);

  const totalPaid = useMemo(() => {
    return filteredPayments
      .filter((b) => b.payment?.status === "PAID")
      .reduce((sum, b) => sum + Number(b.payment?.amount ?? 0), 0);
  }, [filteredPayments]);

  const heldInEscrow = useMemo(() => {
    return filteredPayments
      .filter(
        (b) =>
          b.payment?.status === "PAID" &&
          b.status !== "COMPLETED" &&
          b.status !== "CANCELLED"
      )
      .reduce((sum, b) => sum + Number(b.payment?.amount ?? 0), 0);
  }, [filteredPayments]);

  const outstanding = useMemo(() => {
    return filteredPayments
      .filter((b) => b.payment?.status === "PENDING" || b.payment?.status === "AUTHORIZED")
      .reduce((sum, b) => sum + Number(b.payment?.amount ?? 0), 0);
  }, [filteredPayments]);

  const STATUS_CONFIG: Record<
    PaymentNestedStatus,
    { icon: React.ReactNode; badge: string; label: string }
  > = {
    PAID: {
      icon: <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />,
      badge:
        "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300",
      label: t("status.PAID"),
    },
    PENDING: {
      icon: <Clock size={14} className="text-amber-600 dark:text-amber-400" />,
      badge:
        "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300",
      label: t("status.PENDING"),
    },
    AUTHORIZED: {
      icon: <Clock size={14} className="text-amber-600 dark:text-amber-400" />,
      badge:
        "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300",
      label: t("status.AUTHORIZED"),
    },
    FAILED: {
      icon: <XCircle size={14} className="text-red-600 dark:text-red-400" />,
      badge:
        "border border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300",
      label: t("status.FAILED"),
    },
    REFUNDED: {
      icon: <CheckCircle size={14} className="text-blue-600 dark:text-blue-400" />,
      badge:
        "border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300",
      label: t("status.REFUNDED"),
    },
    NOT_REQUIRED: {
      icon: <Clock size={14} className="text-gray-400" />,
      badge:
        "border border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400",
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

  function copyTxRef(ref: string) {
    navigator.clipboard.writeText(ref);
    toast.success("Transaction reference copied to clipboard");
  }

  return (
    <div className="mx-auto max-w-[1120px] space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Header & Escrow Protection Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-brand-dark dark:text-gray-100">
            {t("title")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        {/* Escrow Guarantee Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300 self-start sm:self-auto shrink-0 shadow-xs">
          <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
          <span>{t("escrowBadge")}</span>
        </div>
      </div>

      {/* Post-Confirmation Notice (Non-blocking banner if booking-first mode is active) */}
      {isBookingFirst && !paymentModeLoading && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
          <Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-900 dark:text-blue-200">
            <p className="font-bold">{t("bookingFirstNoticeTitle")}</p>
            <p className="mt-0.5 leading-relaxed text-blue-800/80 dark:text-blue-300/80">
              {t("bookingFirstNoticeDesc")}
            </p>
          </div>
        </div>
      )}

      {/* Shimmer Skeleton Loading State (Fixes the ugly flash of unavailable banner) */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-brand-border/15 bg-gray-100 dark:border-white/10 dark:bg-neutral-900"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl border border-brand-border/15 bg-gray-100 dark:border-white/10 dark:bg-neutral-900" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-950/30">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">{t("failedToLoad")}</p>
        </div>
      ) : payments.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-brand-border/20 bg-white p-10 text-center dark:border-white/10 dark:bg-neutral-900 shadow-xs">
          <CreditCard size={38} className="mx-auto mb-3 text-brand-dark/30 dark:text-white/30" />
          <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
            {t("noPayments")}
          </p>
          <p className="mt-1 text-xs text-brand-dark/60 dark:text-white/60 max-w-sm mx-auto">
            {t("bookConsultationDesc")}
          </p>
          <div className="mt-5">
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-dark px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black shadow-xs"
            >
              <Sparkles size={13} />
              <span>{t("browseLawyers")}</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Industrial Financial Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Paid */}
            <div className="rounded-2xl border border-emerald-200/80 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-brand-dark/60 dark:text-white/60">
                  {t("stats.paid")}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle size={16} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-gray-100">
                {formatRwf(totalPaid)}
              </p>
              <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                Verified client settlement
              </p>
            </div>

            {/* In Escrow */}
            <div className="rounded-2xl border border-blue-200/80 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-brand-dark/60 dark:text-white/60">
                  {t("stats.escrow")}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-gray-100">
                {formatRwf(heldInEscrow)}
              </p>
              <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                Held until session completion
              </p>
            </div>

            {/* Total Billed */}
            <div className="rounded-2xl border border-brand-border/20 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-brand-dark/60 dark:text-white/60">
                  {t("stats.total")}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark/5 text-brand-dark dark:bg-white/10 dark:text-white">
                  <CreditCard size={16} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-gray-100">
                {formatRwf(totalBilled)}
              </p>
              <p className="mt-1 text-[11px] text-brand-dark/50 dark:text-white/50">
                {filteredPayments.length} transactions recorded
              </p>
            </div>

            {/* Pending / Outstanding */}
            <div className="rounded-2xl border border-amber-200/80 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-brand-dark/60 dark:text-white/60">
                  {t("stats.outstanding")}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                  <Clock size={16} />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-gray-100">
                {formatRwf(outstanding)}
              </p>
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                Awaiting authorization
              </p>
            </div>
          </div>

          {/* Payment History Panel */}
          <div className="rounded-2xl border border-brand-border/20 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden dark:border-white/10">
            {/* Header with Search and Filter Bar */}
            <div className="border-b border-brand-border/10 dark:border-white/10 px-5 py-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-bold text-brand-dark dark:text-gray-100">
                  {t("paymentHistory")}
                </h2>
                <span className="rounded-full bg-brand-dark/5 px-2.5 py-0.5 text-xs font-semibold text-brand-dark/70 dark:bg-white/10 dark:text-white/70">
                  {filteredPayments.length === 1
                    ? t("itemsCount", { count: 1 })
                    : t("itemsCountPlural", { count: filteredPayments.length })}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 dark:text-white/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full rounded-xl border border-brand-border/20 bg-brand-dark/[0.015] dark:bg-neutral-800/50 pl-10 pr-4 py-2 text-xs sm:text-sm text-brand-dark dark:text-white placeholder:text-brand-dark/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-brand-dark/30 dark:border-white/10 dark:focus:ring-white/30"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Tabs + Date Range Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        statusFilter === key
                          ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                          : "text-brand-dark/60 dark:text-white/60 hover:bg-brand-dark/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto">
                  <Filter size={13} className="text-brand-dark/40 dark:text-white/40 shrink-0 mr-1" />
                  {DATE_RANGES.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setDateRange(key)}
                      className={`rounded-lg px-2 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                        dateRange === key
                          ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                          : "text-brand-dark/60 dark:text-white/60 hover:bg-brand-dark/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List / Table Content */}
            {filteredPayments.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-brand-dark/50 dark:text-white/50">
                  {t("noMatchFilters")}
                </p>
              </div>
            ) : (
              <div>
                {/* Mobile Card View (< md) */}
                <div className="divide-y divide-brand-border/10 dark:divide-white/10 md:hidden">
                  {filteredPayments.map((booking) => {
                    const status = (booking.payment?.status ?? "NOT_REQUIRED") as PaymentNestedStatus;
                    const cfg = STATUS_CONFIG[status];
                    const amountFormatted = formatRwf(booking.payment?.amount);

                    return (
                      <div key={booking.id} className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-dark/5 text-brand-dark dark:bg-white/10 dark:text-white">
                              <CreditCard size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-brand-dark dark:text-gray-100 break-words leading-tight">
                                {booking.service?.name ?? t("consultation")}
                              </p>
                              <p className="text-xs text-brand-dark/60 dark:text-white/60 mt-0.5">
                                {booking.expert?.displayName ?? t("legalExpert")}
                              </p>
                            </div>
                          </div>

                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${cfg.badge}`}>
                            {cfg.icon}
                            <span>{cfg.label}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-brand-dark/60 dark:text-white/60 pt-1">
                          <span className="text-sm font-bold text-brand-dark dark:text-white">
                            {amountFormatted}
                          </span>
                          <span>
                            {new Date(booking.scheduledStart).toLocaleDateString(locale, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {booking.payment?.txRef && (
                          <div className="flex items-center justify-between pt-1 border-t border-brand-border/5 dark:border-white/5">
                            <button
                              onClick={() => copyTxRef(booking.payment!.txRef)}
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-brand-dark/50 hover:text-brand-dark dark:text-white/50 dark:hover:text-white truncate max-w-[200px]"
                              title="Click to copy reference"
                            >
                              <Copy size={11} />
                              <span>{booking.payment.txRef}</span>
                            </button>

                            <div className="flex items-center gap-2">
                              {booking.payment.status === "PAID" && (
                                <button
                                  onClick={() => setSelectedReceiptBooking(booking)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-brand-border/20 px-2 py-1 text-[11px] font-semibold text-brand-dark hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-neutral-800"
                                >
                                  <Receipt size={12} />
                                  <span>{t("receipt.title")}</span>
                                </button>
                              )}
                              <Link
                                href={`/client/dashboard/consultations/${booking.id}`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                              >
                                <span>Details</span>
                                <ExternalLink size={11} />
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-brand-dark/[0.02] text-xs font-semibold text-brand-dark/60 dark:bg-white/[0.02] dark:text-white/60 border-b border-brand-border/10 dark:border-white/10">
                      <tr>
                        <th className="px-5 py-3.5">Service & Advocate</th>
                        <th className="px-4 py-3.5">Amount</th>
                        <th className="px-4 py-3.5">Date</th>
                        <th className="px-4 py-3.5">Transaction Ref</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/10 dark:divide-white/10">
                      {filteredPayments.map((booking) => {
                        const status = (booking.payment?.status ?? "NOT_REQUIRED") as PaymentNestedStatus;
                        const cfg = STATUS_CONFIG[status];
                        const amountFormatted = formatRwf(booking.payment?.amount);

                        return (
                          <tr
                            key={booking.id}
                            className="hover:bg-brand-dark/[0.015] dark:hover:bg-white/[0.015] transition-colors"
                          >
                            {/* Service & Advocate */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dark/5 text-brand-dark dark:bg-white/10 dark:text-white">
                                  <CreditCard size={15} />
                                </div>
                                <div className="min-w-0 max-w-[220px]">
                                  <p className="text-sm font-semibold text-brand-dark dark:text-gray-100 truncate">
                                    {booking.service?.name ?? t("consultation")}
                                  </p>
                                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50 truncate">
                                    {booking.expert?.displayName ?? t("legalExpert")}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Amount */}
                            <td className="px-4 py-3.5 font-bold text-brand-dark dark:text-gray-100">
                              {amountFormatted}
                            </td>

                            {/* Date */}
                            <td className="px-4 py-3.5 text-xs text-brand-dark/70 dark:text-white/70">
                              {new Date(booking.scheduledStart).toLocaleDateString(locale, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>

                            {/* Transaction Ref */}
                            <td className="px-4 py-3.5 text-xs">
                              {booking.payment?.txRef ? (
                                <button
                                  onClick={() => copyTxRef(booking.payment!.txRef)}
                                  className="inline-flex items-center gap-1 font-mono text-[11px] text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
                                  title="Click to copy reference"
                                >
                                  <Copy size={11} />
                                  <span className="truncate max-w-[130px]">{booking.payment.txRef}</span>
                                </button>
                              ) : (
                                <span className="text-brand-dark/30 dark:text-white/30">—</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.badge}`}
                              >
                                {cfg.icon}
                                <span>{cfg.label}</span>
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {booking.payment?.status === "PAID" && (
                                  <button
                                    onClick={() => setSelectedReceiptBooking(booking)}
                                    title={t("receipt.viewReceipt")}
                                    className="inline-flex items-center gap-1 rounded-lg border border-brand-border/20 px-2.5 py-1 text-xs font-semibold text-brand-dark hover:bg-brand-dark/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                                  >
                                    <Receipt size={13} />
                                    <span>{t("receipt.title")}</span>
                                  </button>
                                )}
                                <Link
                                  href={`/client/dashboard/consultations/${booking.id}`}
                                  className="p-1.5 rounded-lg text-brand-dark/50 hover:bg-brand-dark/5 hover:text-brand-dark dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
                                  title="View Consultation Matter"
                                >
                                  <ExternalLink size={15} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Rwanda Escrow Protection & Supported Payment Channels Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Escrow Guarantee Notice */}
            <div className="flex items-start gap-3 rounded-2xl border border-brand-border/20 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-neutral-900">
              <ShieldCheck size={20} className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
                  {t("escrowNoticeTitle")}
                </p>
                <p className="mt-1 text-xs text-brand-dark/60 dark:text-white/60 leading-relaxed">
                  {t("escrowNoticeDesc")}
                </p>
              </div>
            </div>

            {/* Supported Mobile Money Channels */}
            <div className="flex items-start gap-3 rounded-2xl border border-brand-border/20 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-neutral-900">
              <Smartphone size={20} className="mt-0.5 text-brand-dark dark:text-white shrink-0" />
              <div className="w-full">
                <p className="text-sm font-bold text-brand-dark dark:text-gray-100">
                  {t("supportedMethods.title")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    <Phone size={10} />
                    <span>{t("supportedMethods.mtnMomo")}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                    <Phone size={10} />
                    <span>{t("supportedMethods.airtelMoney")}</span>
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-brand-dark/50 dark:text-white/50">
                  {t("supportedMethods.secureGateway")}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Official Payment Receipt Modal (Printable / PDF) */}
      {selectedReceiptBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 border border-brand-border/20 dark:border-white/10 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-border/10 dark:border-white/10 px-6 py-4 bg-brand-dark/[0.02] dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-brand-dark dark:text-white" />
                <h3 className="text-sm sm:text-base font-bold text-brand-dark dark:text-white">
                  {t("receipt.officialReceipt")}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceiptBooking(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-5 text-xs text-brand-dark dark:text-gray-200">
              {/* Receipt Header Telemetry */}
              <div className="flex items-center justify-between border-b border-brand-border/10 pb-4 dark:border-white/10">
                <div>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50 uppercase tracking-wider font-semibold">
                    {t("receipt.receiptNumber")}
                  </p>
                  <p className="font-mono font-bold text-sm text-brand-dark dark:text-white mt-0.5">
                    REC-{selectedReceiptBooking.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50 uppercase tracking-wider font-semibold">
                    {t("receipt.datePaid")}
                  </p>
                  <p className="font-medium text-sm text-brand-dark dark:text-white mt-0.5">
                    {new Date(
                      selectedReceiptBooking.payment?.paidAt || selectedReceiptBooking.scheduledStart
                    ).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50 uppercase tracking-wider font-semibold">
                    {t("receipt.service")}
                  </p>
                  <p className="font-bold text-brand-dark dark:text-white mt-0.5">
                    {selectedReceiptBooking.service?.name ?? t("consultation")}
                  </p>
                  <p className="text-[11px] text-brand-dark/60 dark:text-white/60">
                    Duration: {selectedReceiptBooking.service?.durationMin ?? 30} mins
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50 uppercase tracking-wider font-semibold">
                    {t("receipt.legalExpert")}
                  </p>
                  <p className="font-bold text-brand-dark dark:text-white mt-0.5">
                    {selectedReceiptBooking.expert?.displayName ?? t("legalExpert")}
                  </p>
                  <p className="text-[11px] text-brand-dark/60 dark:text-white/60 truncate">
                    {selectedReceiptBooking.expert?.officeAddress || "Kigali, Rwanda"}
                  </p>
                </div>
              </div>

              {/* Payer Details */}
              <div className="rounded-xl border border-brand-border/15 bg-brand-dark/[0.015] p-3.5 dark:border-white/10 dark:bg-neutral-800/40">
                <p className="text-[11px] text-brand-dark/50 dark:text-white/50 uppercase tracking-wider font-semibold">
                  {t("receipt.client")}
                </p>
                <p className="font-bold text-brand-dark dark:text-white mt-0.5">
                  {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : "Verified Citizen"}
                </p>
                <p className="text-[11px] text-brand-dark/60 dark:text-white/60">
                  {user?.email || "citizen@myjudicial.rw"}
                </p>
              </div>

              {/* Transaction & Escrow Reference */}
              <div className="space-y-1.5 font-mono text-[11px] border-t border-brand-border/10 pt-3 dark:border-white/10">
                <div className="flex justify-between">
                  <span className="text-brand-dark/50 dark:text-white/50">{t("receipt.txRef")}:</span>
                  <span className="font-bold text-brand-dark dark:text-white">
                    {selectedReceiptBooking.payment?.txRef}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-dark/50 dark:text-white/50">{t("receipt.paymentMethod")}:</span>
                  <span className="text-brand-dark dark:text-white">{t("receipt.mobileMoney")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-dark/50 dark:text-white/50">{t("receipt.escrowStatus")}:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedReceiptBooking.status === "COMPLETED"
                      ? t("receipt.escrowReleased")
                      : t("receipt.escrowLocked")}
                  </span>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="rounded-xl bg-brand-dark/[0.03] p-4 space-y-2 dark:bg-neutral-800/60 border border-brand-border/15 dark:border-white/10">
                <div className="flex justify-between text-xs text-brand-dark/70 dark:text-white/70">
                  <span>{t("receipt.serviceFee")}</span>
                  <span>{formatRwf(selectedReceiptBooking.payment?.amount)}</span>
                </div>
                <div className="flex justify-between text-xs text-brand-dark/70 dark:text-white/70">
                  <span>{t("receipt.escrowFee")}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">RWF 0 (Included)</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-brand-border/10 pt-2 text-brand-dark dark:text-white">
                  <span>{t("receipt.totalPaid")}</span>
                  <span className="text-base text-brand-dark dark:text-white">
                    {formatRwf(selectedReceiptBooking.payment?.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-brand-border/10 dark:border-white/10 px-6 py-4 bg-brand-dark/[0.02] dark:bg-white/[0.02]">
              <button
                onClick={() => setSelectedReceiptBooking(null)}
                className="rounded-xl border border-brand-border/20 px-4 py-2 text-xs font-semibold text-brand-dark/70 hover:bg-brand-dark/[0.04] dark:border-white/10 dark:text-white/70"
              >
                {t("receipt.close")}
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-dark px-4 py-2 text-xs font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black shadow-xs"
              >
                <Printer size={13} />
                <span>{t("receipt.print")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
