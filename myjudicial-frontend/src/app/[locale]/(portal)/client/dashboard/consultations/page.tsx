"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { CalendarDays, Clock, Loader2, AlertCircle, ArrowRight, MapPin, Phone, Video, FileText, CheckCircle } from "lucide-react";
import { useBookings } from "@/features/booking/hooks/useBookings";
import type { Booking, BookingStatus } from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";


const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white",
  CONFIRMED: "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white",
  ACTIVE: "bg-brand-dark text-white dark:bg-white dark:text-black",
  COMPLETED: "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white",
  CANCELLED: "bg-brand-dark/5 text-brand-dark/50 dark:bg-white/5 dark:text-white/50",
  REFUNDED: "bg-brand-dark/5 text-brand-dark/50 dark:bg-white/5 dark:text-white/50",
};

export default function ConsultationsPage() {
  const t = useTranslations("clientDashboard.consultations");
  const TABS = [
    { key: "all", label: t("tabs.all") },
    { key: "upcoming", label: t("tabs.upcoming") },
    { key: "pending", label: t("tabs.pending") },
    { key: "past", label: t("tabs.past") },
    { key: "cancelled", label: t("tabs.cancelled") },
  ];

  const [activeTab, setActiveTab] = useState<string>("all");
  const { bookings, isLoading, error } = useBookings();

  const nowMs = Date.now();
  const filtered = activeTab === "all"
    ? bookings
    : bookings.filter((b) => {
        const isCancelled = b.status === "CANCELLED" || b.status === "REFUNDED";
        if (activeTab === "cancelled") return isCancelled;
        if (isCancelled) return false;

        if (activeTab === "pending") return b.status === "PENDING";

        const isPast = b.status === "COMPLETED" || new Date(b.scheduledEnd).getTime() < nowMs;
        if (activeTab === "past") return isPast;
        if (activeTab === "upcoming") return !isPast && (b.status === "CONFIRMED" || b.status === "ACTIVE");

        return false;
      });

  const locale = useLocale();

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="mx-auto w-full max-w-[900px] p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
        <div className="mb-6">
          <h1 className="text-xl sm:text-[24px] font-bold text-brand-dark dark:text-white break-words">{t("title")}</h1>
          <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50">
            {t("subtitle")}
          </p>
        </div>

        <div className="mb-6 flex gap-1 border-b border-brand-border/20 pb-1 dark:border-white/10 max-w-full overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-[13px] font-semibold transition-colors rounded-t-lg ${
                activeTab === tab.key
                  ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                  : "text-brand-dark/60 hover:text-brand-dark hover:bg-brand-dark/5 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-brand-dark/50 dark:text-white/50" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <AlertCircle className="h-10 w-10 text-brand-dark/30 dark:text-white/30 mb-4" />
            <p className="text-brand-dark/60 dark:text-white/60 font-medium">{t("failedToLoad")}</p>
            <p className="mt-1 text-[13px] text-brand-dark/40 dark:text-white/40">{error.message}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <CalendarDays className="h-12 w-12 text-brand-dark/20 dark:text-white/20 mb-4" />
            <h2 className="text-[16px] font-bold text-brand-dark dark:text-white mb-2">
              {bookings.length === 0 ? t("noConsultationsYet") : t("noMatchingConsultations")}
            </h2>
            <p className="text-[13px] text-brand-dark/50 dark:text-white/50 mb-6 max-w-sm text-center">
              {bookings.length === 0
                ? t("findLawyerDesc")
                : t("noMatchFilterDesc")}
            </p>
            {bookings.length === 0 && (
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-[13px] font-semibold text-white hover:opacity-90 transition-opacity dark:bg-white dark:text-black"
              >
                {t("findLawyers")} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking) => (
              <ConsultationCard key={booking.id} booking={booking} formatDate={formatDate} formatTime={formatTime} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConsultationCard({
  booking,
  formatDate,
  formatTime,
}: {
  booking: Booking;
  formatDate: (iso: string) => string;
  formatTime: (iso: string) => string;
}) {
  const t = useTranslations("clientDashboard.consultations");
  const deliveryMode = (booking as any).service?.deliveryMode ?? "VIDEO";

  return (
    <Link
      href={`/client/dashboard/consultations/${booking.id}`}
      className="block rounded-2xl border border-brand-border/20 bg-white p-5 shadow-md hover:shadow-lg transition-shadow dark:border-white/20 dark:bg-black"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
            <h3 className="text-[15px] font-bold text-brand-dark dark:text-white">
            {booking.expert?.displayName ?? t("legalExpert")}
            </h3>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[booking.status] ?? "bg-brand-dark/10 text-brand-dark"}`}>
              {t(`status.${booking.status}` as any, { default: booking.status })}
            </span>
            {booking.issueReportedAt && !["COMPLETED", "REFUNDED", "CANCELLED"].includes(booking.status) && (
              <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/25">
                <AlertCircle size={10} />
                {t("disputeUnderReview")}
              </span>
            )}
            <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-brand-dark/5 px-2.5 py-0.5 text-[10px] font-medium text-brand-dark/70 dark:bg-white/10 dark:text-white/70">
              {deliveryMode === "IN_PERSON" ? (
                <>
                  <MapPin size={10} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{t("modeInPerson")}</span>
                </>
              ) : deliveryMode === "PHONE" ? (
                <>
                  <Phone size={10} className="text-blue-600 dark:text-blue-400" />
                  <span>{t("modePhone")}</span>
                </>
              ) : deliveryMode === "EMAIL" ? (
                <>
                  <FileText size={10} className="text-indigo-600 dark:text-indigo-400" />
                  <span>{t("modeDocument")}</span>
                </>
              ) : (
                <>
                  <Video size={10} className="text-brand-dark/60 dark:text-white/60" />
                  <span>{t("modeVideo")}</span>
                </>
              )}
            </span>
          </div>
          <p className="text-[13px] text-brand-dark/60 dark:text-white/60 mb-1">
            {booking.service?.name ?? t("consultationLabel")}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-brand-dark/50 dark:text-white/50">
            <span className="flex items-center gap-1">
              <CalendarDays size={12} />
              {formatDate(booking.scheduledStart)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatTime(booking.scheduledStart)}
            </span>
            {deliveryMode === "IN_PERSON" && (booking as any).expert?.officeAddress && (
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                <MapPin size={12} />
                <span className="truncate max-w-[240px]">{(booking as any).expert.officeAddress}</span>
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[15px] font-bold text-brand-dark dark:text-white">
            RWF {booking.service?.flatFee?.toLocaleString() ?? "—"}
          </p>
          {booking.paymentStatus === "PENDING" && booking.status === "PENDING" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              {t("awaitingPaymentBadge")}
            </span>
          ) : booking.paymentStatus === "PAID" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 mt-1">
              <CheckCircle size={10} />
              {t("paymentPaidBadge")}
            </span>
          ) : booking.paymentStatus && booking.paymentStatus !== "NOT_REQUIRED" ? (
            <p className="text-[10px] text-brand-dark/40 dark:text-white/40 mt-0.5">
              {t(`paymentStatus.${booking.paymentStatus}` as any, { default: booking.paymentStatus })}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
