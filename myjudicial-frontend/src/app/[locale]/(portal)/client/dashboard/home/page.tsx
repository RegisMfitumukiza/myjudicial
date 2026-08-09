"use client";

import { useMemo } from "react";
import { Link } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import {
  CalendarDays, Clock, Search, ArrowRight,
  CreditCard, Star, Video, ChevronRight, Loader2, AlertCircle,
  FileText, MessageSquare,
} from "lucide-react";
import { useGetBookings } from "@/api/generated";
import { useTranslations } from "next-intl";

const JOINABLE_WINDOW_MS = 15 * 60 * 1000; // can join 15 min before start

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function ClientHomePage() {
  const { data: session } = useSession();
  const t = useTranslations("clientDashboard_home");
  const firstName = (session?.user as any)?.firstName
    || session?.user?.name?.split(" ")[0]
    || "Client";

  const { data: bookingsData, isLoading: bookingsLoading } = useGetBookings({ page: 1, limit: 20 });

  const bookings = useMemo(() => {
    if (bookingsData?.status === 200) return bookingsData.data.data || [];
    return [];
  }, [bookingsData]);

  const isLoading = bookingsLoading;
  const now = new Date();

  const upcomingConsultation = useMemo(() => {
    return bookings
      .filter(b => new Date(b.scheduledStart) > now && ["CONFIRMED", "ACTIVE"].includes(b.status))
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())[0] || null;
  }, [bookings]);

  const recentConsultations = useMemo(() => {
    return bookings
      .filter(b => ["COMPLETED", "ACTIVE", "CONFIRMED"].includes(b.status))
      .sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime())
      .slice(0, 3);
  }, [bookings]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter(b => b.status === "COMPLETED").length;
    const upcoming = bookings.filter(b => ["CONFIRMED", "ACTIVE"].includes(b.status) && new Date(b.scheduledStart) > now).length;
    return { total, completed, upcoming };
  }, [bookings, now]);

  const pendingPayment = useMemo(() => {
    return bookings.find(b => b.status === "PENDING" && b.paymentStatus === "FAILED") || null;
  }, [bookings]);

  const pendingReview = useMemo(() => {
    return bookings.find(b => b.status === "COMPLETED" && !(b as any).hasReview && !(b as any).review) || null;
  }, [bookings]);

  const activeSession = useMemo(() => {
    return bookings
      .filter(b => b.status === "ACTIVE")
      .sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime())[0] || null;
  }, [bookings]);

  const lastConsultedExpert = useMemo(() => {
    const completed = bookings
      .filter(b => b.status === "COMPLETED" && b.expert)
      .sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime())[0];
    if (!completed) return null;
    return {
      expertId: completed.expert?.id || completed.expertId,
      name: completed.expert?.displayName || "Legal Expert",
      service: completed.service?.name || "Consultation",
      date: completed.scheduledStart,
    };
  }, [bookings]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  return (
    <div className="px-6 py-8 lg:px-8 max-w-[960px] mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-brand-dark dark:text-white">
          {t("welcomeBack", { firstName })}
        </h1>
        <p className="mt-1 text-[15px] text-brand-dark/50 dark:text-white/50">
          {t("manageConsultationsDesc")}
        </p>
      </div>

      {/* Action Required */}
      {(pendingPayment || pendingReview) && (
        <div className="mb-8">
          <div className="space-y-3">
            {pendingPayment && (
              <Link
                href={`/client/dashboard/consultations/${pendingPayment.id}`}
                className="flex items-center gap-4 rounded-xl border border-yellow-200 bg-yellow-50/50 p-4 transition-shadow hover:shadow-md dark:border-yellow-800/30 dark:bg-yellow-950/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/40">
                  <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-brand-dark dark:text-white">
                    {t("completePayment", { serviceName: pendingPayment.service?.name || t("consultation") })}
                  </p>
                  <p className="text-[12px] text-brand-dark/50 dark:text-white/50">
                    {t("withExpertAmount", { 
                      expertName: pendingPayment.expert?.displayName || t("expert"), 
                      amount: pendingPayment.service?.flatFee?.toLocaleString() ?? "0" 
                    })}
                  </p>
                </div>
                <ChevronRight size={16} className="text-brand-dark/30 dark:text-white/30" />
              </Link>
            )}
            {pendingReview && (
              <Link
                href={`/client/dashboard/consultations/${pendingReview.id}/review`}
                className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 transition-shadow hover:shadow-md dark:border-blue-800/30 dark:bg-blue-950/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                  <Star size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-brand-dark dark:text-white">
                    {t("leaveReview", { expertName: pendingReview.expert?.displayName || t("yourExpert") })}
                  </p>
                  <p className="text-[12px] text-brand-dark/50 dark:text-white/50">
                    {t("serviceCompletedDate", {
                      serviceName: pendingReview.service?.name || t("consultationCapitalized"),
                      date: formatDate(pendingReview.scheduledStart)
                    })}
                  </p>
                </div>
                <ChevronRight size={16} className="text-brand-dark/30 dark:text-white/30" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <Link
          href="/experts"
          className="flex flex-col items-center gap-2 rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-white/10 dark:bg-black"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 dark:bg-white/10">
            <Search size={18} className="text-brand-dark dark:text-white" />
          </div>
          <span className="text-[13px] font-semibold text-brand-dark dark:text-white">{t("bookLawyer")}</span>
        </Link>
        <Link
          href="/client/dashboard/messages"
          className="flex flex-col items-center gap-2 rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-white/10 dark:bg-black"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 dark:bg-white/10">
            <MessageSquare size={18} className="text-brand-dark dark:text-white" />
          </div>
          <span className="text-[13px] font-semibold text-brand-dark dark:text-white">{t("messages")}</span>
        </Link>
        <Link
          href="/client/dashboard/consultations"
          className="flex flex-col items-center gap-2 rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-white/10 dark:bg-black"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 dark:bg-white/10">
            <CalendarDays size={18} className="text-brand-dark dark:text-white" />
          </div>
          <span className="text-[13px] font-semibold text-brand-dark dark:text-white">{t("consultations")}</span>
        </Link>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="mb-8 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-dark/40 dark:text-white/40">{t("total")}</p>
            <p className="mt-1 text-[22px] font-bold text-brand-dark dark:text-white">{stats.total}</p>
            <p className="text-[11px] text-brand-dark/40 dark:text-white/40">{t("consultations").toLowerCase()}</p>
          </div>
          <div className="rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-dark/40 dark:text-white/40">{t("completed")}</p>
            <p className="mt-1 text-[22px] font-bold text-brand-dark dark:text-white">{stats.completed}</p>
            <p className="text-[11px] text-brand-dark/40 dark:text-white/40">{t("consultations").toLowerCase()}</p>
          </div>
          <div className="rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-dark/40 dark:text-white/40">{t("upcoming")}</p>
            <p className="mt-1 text-[22px] font-bold text-brand-dark dark:text-white">{stats.upcoming}</p>
            <p className="text-[11px] text-brand-dark/40 dark:text-white/40">{t("consultations").toLowerCase()}</p>
          </div>
        </div>
      )}

      {/* Upcoming Consultation */}
      <div className="mb-8">
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-widest text-brand-dark/40 dark:text-white/40">
          {t("upcomingConsultation")}
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-brand-border/20 bg-white py-12 shadow-sm dark:border-white/10 dark:bg-black">
            <Loader2 className="h-6 w-6 animate-spin text-brand-dark/30 dark:text-white/30" />
          </div>
        ) : upcomingConsultation ? (
          (() => {
            const startsInMs = new Date(upcomingConsultation.scheduledStart).getTime() - Date.now();
            const canJoin = upcomingConsultation.status === "ACTIVE" || startsInMs <= JOINABLE_WINDOW_MS;
            return (
              <div className="rounded-xl border border-brand-border/20 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[18px] font-bold text-brand-dark dark:text-white">
                      {upcomingConsultation.service?.name || t("consultationCapitalized")}
                    </p>
                    <p className="mt-1 text-[14px] text-brand-dark/60 dark:text-white/60">
                      {t("withExpert", { expertName: upcomingConsultation.expert?.displayName || t("legalExpert") })}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-brand-dark/50 dark:text-white/50">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatDate(upcomingConsultation.scheduledStart)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {formatTime(upcomingConsultation.scheduledStart)} — {formatTime(upcomingConsultation.scheduledEnd)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={canJoin ? `/client/dashboard/consultations/${upcomingConsultation.id}/join` : "#"}
                    onClick={(e) => { if (!canJoin) e.preventDefault(); }}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-opacity ${
                      canJoin
                        ? "bg-brand-dark text-white hover:opacity-90 dark:bg-white dark:text-black"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                    }`}
                  >
                    <Video size={15} />
                    {canJoin ? t("join") : t("notYetTime")}
                  </Link>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="rounded-xl border border-dashed border-brand-border/20 bg-white py-10 text-center dark:border-white/10 dark:bg-black">
            <CalendarDays className="mx-auto mb-2 h-8 w-8 text-brand-dark/20 dark:text-white/20" />
            <p className="text-[13px] text-brand-dark/50 dark:text-white/50">{t("noUpcomingConsultations")}</p>
          </div>
        )}
      </div>

      {/* Recent Consultations */}
      {recentConsultations.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/40 dark:text-white/40">
              {t("recentConsultations")}
            </h2>
            <Link
              href="/client/dashboard/consultations"
              className="text-[12px] font-semibold text-brand-dark/50 hover:text-brand-dark dark:text-white/50 dark:hover:text-white"
            >
              {t("viewAll")}
            </Link>
          </div>
          <div className="space-y-2">
            {recentConsultations.map((b) => (
              <Link
                key={b.id}
                href={`/client/dashboard/consultations/${b.id}`}
                className="flex items-center gap-4 rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-black"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 dark:bg-white/10">
                  <FileText size={18} className="text-brand-dark dark:text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-brand-dark dark:text-white truncate">
                      {b.service?.name || t("consultationCapitalized")}
                    </p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[b.status] || STATUS_COLORS.PENDING}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-brand-dark/50 dark:text-white/50">
                    {t("expertDate", { expertName: b.expert?.displayName || t("expert"), date: formatDate(b.scheduledStart) })}
                  </p>
                </div>
                <ChevronRight size={16} className="text-brand-dark/30 dark:text-white/30 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Active Video Session or Quick Rebook */}
      <div className="mb-8">
        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-brand-border/20 bg-white py-10 shadow-sm dark:border-white/10 dark:bg-black">
            <Loader2 className="h-5 w-5 animate-spin text-brand-dark/30 dark:text-white/30" />
          </div>
        ) : activeSession ? (
          <div>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-widest text-brand-dark/40 dark:text-white/40">
              {t("activeSession")}
            </h2>
            <div className="rounded-xl border border-green-200 bg-green-50/50 p-6 shadow-sm dark:border-green-800/30 dark:bg-green-950/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40">
                    <Video size={22} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[16px] font-bold text-brand-dark dark:text-white">
                        {activeSession.service?.name || t("consultationCapitalized")}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        {t("live")}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] text-brand-dark/60 dark:text-white/60">
                      {t("withExpert", { expertName: activeSession.expert?.displayName || t("legalExpert") })}
                    </p>
                    <p className="mt-1 text-[12px] text-brand-dark/40 dark:text-white/40">
                      {t("startedTimeAmount", { time: formatTime(activeSession.scheduledStart), amount: activeSession.service?.flatFee?.toLocaleString() ?? "0" })}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/client/dashboard/consultations/${activeSession.id}/join`}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                >
                  <Video size={15} />
                  {t("joinNow")}
                </Link>
              </div>
            </div>
          </div>
        ) : lastConsultedExpert ? (
          <div>
            <h2 className="mb-3 text-[13px] font-bold uppercase tracking-widest text-brand-dark/40 dark:text-white/40">
              {t("quickRebook")}
            </h2>
            <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-dark/10 dark:bg-white/10 text-[15px] font-bold text-brand-dark dark:text-white">
                  {(lastConsultedExpert.name || "E").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-brand-dark dark:text-white">
                    {lastConsultedExpert.name}
                  </p>
                  <p className="text-[12px] text-brand-dark/50 dark:text-white/50">
                    {t("lastConsultationDateService", { date: formatDate(lastConsultedExpert.date), serviceName: lastConsultedExpert.service })}
                  </p>
                </div>
                <Link
                  href={`/lawyers/${lastConsultedExpert.expertId}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-dark px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
                >
                  {t("rebook")} <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
