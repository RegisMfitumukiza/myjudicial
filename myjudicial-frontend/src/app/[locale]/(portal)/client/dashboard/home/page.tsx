"use client";

import { useMemo, useState } from "react";
import { useTimeOfDay, TIME_GREETING_KEY } from "@/shared/hooks/useTimeOfDay";
import { Link } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  Clock,
  ArrowRight,
  Star,
  Video,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Bookmark,
  CreditCard,
  Lock,
  MessageSquare,
  Upload,
  UserCheck,
  CalendarCheck2,
} from "lucide-react";
import { useGetBookings, useGetChatConversations } from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";
import { ContactEmailPopover } from "@/shared/components/contact-email-popover";

const JOINABLE_WINDOW_MS = 15 * 60 * 1000; // Can join 15 min before scheduled start

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  REFUNDED:  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function ClientHomePage() {
  const { data: session } = useSession();
  const t = useTranslations("clientDashboard_home");
  const locale = useLocale();

  const firstName =
    (session?.user as unknown as { firstName?: string })?.firstName ||
    session?.user?.name?.split(" ")[0] ||
    "Client";
  const timeOfDay = useTimeOfDay();
  const greetingKey = TIME_GREETING_KEY[timeOfDay];

  const { data: bookingsData, isLoading: bookingsLoading } = useGetBookings({
    page: 1,
    limit: 30,
  });

  const { data: convData } = useGetChatConversations(
    { limit: 10 },
    { query: { refetchInterval: 30_000 } }
  );

  const bookings = useMemo(() => {
    if (bookingsData?.status === 200) return bookingsData.data.data || [];
    return [];
  }, [bookingsData]);

  const conversations = useMemo(() => {
    if (convData?.status === 200) return convData.data.data || [];
    return [];
  }, [convData]);

  const isLoading = bookingsLoading;
  const now = useMemo(() => new Date(), []);
  const nowTime = now.getTime();

  // ─── Time-Aware Consultation Lifecycle ───
  // 1. Live session: explicitly ACTIVE, or CONFIRMED within [-15m before start, scheduledEnd]
  const liveSession = useMemo(() => {
    return (
      bookings.find((b) => {
        if (b.status === "ACTIVE") return true;
        if (b.status === "CONFIRMED") {
          const s = new Date(b.scheduledStart).getTime();
          const e = new Date(b.scheduledEnd).getTime();
          return nowTime >= s - JOINABLE_WINDOW_MS && nowTime <= e;
        }
        return false;
      }) || null
    );
  }, [bookings, nowTime]);

  // 2. Future upcoming consultation: CONFIRMED and nowTime < scheduledStart - 15m
  const upcomingSession = useMemo(() => {
    const future = bookings.filter((b) => {
      if (b.status !== "CONFIRMED") return false;
      const s = new Date(b.scheduledStart).getTime();
      return nowTime < s - JOINABLE_WINDOW_MS;
    });
    if (future.length === 0) return null;
    return [...future].sort(
      (a, b) =>
        new Date(a.scheduledStart).getTime() -
        new Date(b.scheduledStart).getTime()
    )[0];
  }, [bookings, nowTime]);

  // 3. Consultation ended awaiting summary: CONFIRMED and nowTime > scheduledEnd
  const awaitingSummarySession = useMemo(() => {
    const pastUnclosed = bookings.filter((b) => {
      if (b.status !== "CONFIRMED") return false;
      const e = new Date(b.scheduledEnd).getTime();
      return nowTime > e;
    });
    if (pastUnclosed.length === 0) return null;
    return [...pastUnclosed].sort(
      (a, b) =>
        new Date(b.scheduledEnd).getTime() - new Date(a.scheduledEnd).getTime()
    )[0];
  }, [bookings, nowTime]);

  // Priority 1: Pending payment
  const pendingPayment = useMemo(() => {
    return (
      bookings.find(
        (b) =>
          b.status === "PENDING" &&
          (b.paymentStatus === "PENDING" || b.paymentStatus === "FAILED")
      ) || null
    );
  }, [bookings]);

  // Priority 2: Pending review
  const pendingReview = useMemo(() => {
    return (
      bookings.find(
        (b) =>
          b.status === "COMPLETED" &&
          !(b as unknown as { hasReview?: boolean }).hasReview &&
          !(b as unknown as { review?: unknown }).review
      ) || null
    );
  }, [bookings]);

  const pendingActionCount =
    (pendingPayment ? 1 : 0) + (pendingReview ? 1 : 0);

  // My Legal Counsel: Extract previous advocates worked with (Returning clients)
  const myLegalCounsel = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        specialty: string;
        lastSeen: string;
        conversationId?: string;
      }
    >();

    for (const b of bookings) {
      if (!b.expert) continue;
      const expId = b.expert.id || b.expertId;
      if (!expId || map.has(expId)) continue;
      const expName = b.expert.displayName || "Legal Advocate";
      const specialty =
        (b.expert as unknown as { practiceAreas?: string[] }).practiceAreas?.[0] ||
        b.service?.name ||
        t("legalExpert");

      // Match conversation if available
      const conv = conversations.find((c) =>
        c.participants.some(
          (p) =>
            p.user.id === (b.expert as unknown as { userId?: string }).userId ||
            `${p.user.firstName} ${p.user.lastName}`
              .toLowerCase()
              .includes(expName.toLowerCase())
        )
      );

      map.set(expId, {
        id: expId,
        name: expName,
        specialty,
        lastSeen: b.scheduledStart,
        conversationId: conv?.id,
      });
    }

    // Return ALL unique counsels; the UI will show 3 and "View All" if more
    return Array.from(map.values());
  }, [bookings, conversations, t]);

  // How many to show before collapsing into "View All"
  const COUNSEL_VISIBLE = 3;
  const [showAllCounsel, setShowAllCounsel] = useState(false);
  const visibleCounsel = showAllCounsel
    ? myLegalCounsel
    : myLegalCounsel.slice(0, COUNSEL_VISIBLE);

  // Latest message from counsel preview (Airbnb/Upwork style)
  const latestCounselMessage = useMemo(() => {
    const withMessages = conversations.filter(
      (c) => !!c.lastMessageText && !!c.lastMessageAt
    );
    if (withMessages.length === 0) return null;

    const sorted = [...withMessages].sort(
      (a, b) =>
        new Date(b.lastMessageAt!).getTime() -
        new Date(a.lastMessageAt!).getTime()
    );

    const latest = sorted[0];
    const participant =
      latest.participants.find((p) => p.user.id !== session?.user?.id)?.user ||
      latest.participants[0]?.user;
    const name = participant
      ? `${participant.firstName} ${participant.lastName}`
      : "Counsel";

    return {
      conversationId: latest.id,
      name,
      text: latest.lastMessageText!,
      time: latest.lastMessageAt!,
    };
  }, [conversations, session?.user?.id]);

  // Recent Consultations (deduplicating the current spotlight card)
  const recentConsultations = useMemo(() => {
    const spotlightId =
      liveSession?.id || upcomingSession?.id || awaitingSummarySession?.id;
    return bookings
      .filter(
        (b) =>
          b.id !== spotlightId &&
          ["COMPLETED", "ACTIVE", "CONFIRMED"].includes(b.status)
      )
      .sort(
        (a, b) =>
          new Date(b.scheduledStart).getTime() -
          new Date(a.scheduledStart).getTime()
      )
      .slice(0, 4);
  }, [bookings, liveSession, upcomingSession, awaitingSummarySession]);

  function formatDate(iso: string) {
    const d = new Date(iso);
    const diffDays = Math.ceil((d.getTime() - nowTime) / 86400000);
    if (diffDays === 0) return t("today");
    if (diffDays === 1) return t("tomorrow");
    return d.toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: locale !== "fr" && locale !== "rw",
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0">
      {/* ─── Command Center Welcome Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b border-brand-border/15 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-dark dark:text-white break-words">
            {t(greetingKey, { firstName })}
          </h1>
          <p className="mt-1 text-[14px] text-brand-dark/60 dark:text-white/60">
            {t("manageConsultationsDesc")}
          </p>
        </div>

        {/* Client Action Center Status Pill (No redundant search CTA) */}
        <div className="shrink-0">
          {pendingActionCount === 0 ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-1.5 text-[12px] font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2
                size={15}
                className="text-emerald-600 dark:text-emerald-400"
              />
              <span>{t("allCaughtUp")}</span>
              <span className="text-emerald-600/70 dark:text-emerald-400/70">
                • {t("noPendingActions")}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50/80 px-3.5 py-1.5 text-[12px] font-semibold text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertCircle
                size={15}
                className="text-amber-600 dark:text-amber-400"
              />
              <span>{t("actionsRequired")}</span>
              <span className="text-amber-600/70 dark:text-amber-400/70">
                • {t("pendingActionsCount", { count: pendingActionCount })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Action Alerts (Pending Payment / Review) ─── */}
      {(pendingPayment || pendingReview) && (
        <div className="mb-6 sm:mb-8 space-y-3">
          {pendingPayment && (
            <Link
              href={`/client/dashboard/consultations/${pendingPayment.id}`}
              className="flex items-center gap-3.5 rounded-xl border border-yellow-200 bg-yellow-50/70 p-4 transition-shadow hover:shadow-md dark:border-yellow-800/30 dark:bg-yellow-950/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/40">
                <AlertCircle
                  size={18}
                  className="text-yellow-600 dark:text-yellow-400"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-brand-dark dark:text-white truncate">
                  {t("completePayment", {
                    serviceName:
                      pendingPayment.service?.name || t("consultation"),
                  })}
                </p>
                <p className="text-[11px] text-brand-dark/50 dark:text-white/50 truncate">
                  {t("withExpertAmount", {
                    expertName:
                      pendingPayment.expert?.displayName || t("expert"),
                    amount:
                      pendingPayment.service?.flatFee?.toLocaleString() ?? "0",
                  })}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-brand-dark/30 dark:text-white/30 shrink-0"
              />
            </Link>
          )}

          {pendingReview && (
            <Link
              href={`/client/dashboard/consultations/${pendingReview.id}/review`}
              className="flex items-center gap-3.5 rounded-xl border border-blue-200 bg-blue-50/70 p-4 transition-shadow hover:shadow-md dark:border-blue-800/30 dark:bg-blue-950/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                <Star
                  size={18}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-brand-dark dark:text-white truncate">
                  {t("leaveReview", {
                    expertName:
                      pendingReview.expert?.displayName || t("yourExpert"),
                  })}
                </p>
                <p className="text-[11px] text-brand-dark/50 dark:text-white/50 truncate">
                  {t("serviceCompletedDate", {
                    serviceName:
                      pendingReview.service?.name ||
                      t("consultationCapitalized"),
                    date: formatDate(pendingReview.scheduledStart),
                  })}
                </p>
              </div>
              <ChevronRight
                size={16}
                className="text-brand-dark/30 dark:text-white/30 shrink-0"
              />
            </Link>
          )}
        </div>
      )}

      {/* ─── Main 2-Column Command Center Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ── LEFT COLUMN: Primary Workspace (Span 8) ── */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8 min-w-0">
          {/* ── Spotlight Consultation Card (Time-Aware Lifecycle) ── */}
          {isLoading ? (
            <div className="rounded-2xl border border-brand-border/20 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-black">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-dark/30 dark:text-white/30" />
            </div>
          ) : liveSession ? (
            /* CASE 1: Live Now / Ready to Join */
            <div className="rounded-2xl border-2 border-green-500/50 bg-green-50/70 p-5 sm:p-6 shadow-md dark:border-green-500/40 dark:bg-green-950/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/50">
                    <Video
                      size={24}
                      className="text-green-600 dark:text-green-400 animate-pulse"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[17px] font-bold text-brand-dark dark:text-white">
                        {liveSession.service?.name || t("consultationCapitalized")}
                      </p>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                        {t("liveNow")}
                      </span>
                    </div>
                    <p className="mt-1 text-[14px] text-brand-dark/70 dark:text-white/70">
                      {t("withExpert", {
                        expertName:
                          liveSession.expert?.displayName || t("legalExpert"),
                      })}
                    </p>
                    <p className="mt-1 text-[12px] text-brand-dark/50 dark:text-white/50">
                      {formatTime(liveSession.scheduledStart)} —{" "}
                      {formatTime(liveSession.scheduledEnd)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/client/dashboard/consultations/${liveSession.id}/join`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-[14px] font-bold text-white shadow-md hover:bg-green-700 transition-all dark:bg-green-500 dark:hover:bg-green-600 shrink-0"
                >
                  <Video size={16} />
                  {t("joinNow")}
                </Link>
              </div>
            </div>
          ) : upcomingSession ? (
            /* CASE 2: Scheduled Future Consultation */
            <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-brand-dark dark:text-white" />
                  <h2 className="text-[15px] font-bold text-brand-dark dark:text-white">
                    {t("upcomingConsultation")}
                  </h2>
                </div>
                <Link
                  href="/client/dashboard/consultations"
                  className="text-[12px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
                >
                  {t("viewAll")}
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-dark/10 font-bold text-brand-dark dark:bg-white/10 dark:text-white text-[15px]">
                    {(upcomingSession.expert?.displayName || "Advocate")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[16px] font-bold text-brand-dark dark:text-white">
                        {upcomingSession.service?.name ||
                          t("consultationCapitalized")}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          STATUS_COLORS[upcomingSession.status] ||
                          STATUS_COLORS.CONFIRMED
                        }`}
                      >
                        {t(`status.${upcomingSession.status}` as Parameters<typeof t>[0], {
                          default: upcomingSession.status,
                        })}
                      </span>
                    </div>
                    <p className="text-[13px] text-brand-dark/70 dark:text-white/70 mt-0.5">
                      {t("withExpert", {
                        expertName:
                          upcomingSession.expert?.displayName ||
                          t("legalExpert"),
                      })}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12px] text-brand-dark/60 dark:text-white/60">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <CalendarDays
                          size={14}
                          className="text-brand-dark/40 dark:text-white/40"
                        />
                        {formatDate(upcomingSession.scheduledStart)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Clock
                          size={14}
                          className="text-brand-dark/40 dark:text-white/40"
                        />
                        {formatTime(upcomingSession.scheduledStart)} —{" "}
                        {formatTime(upcomingSession.scheduledEnd)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 sm:self-center">
                  <Link
                    href={`/client/dashboard/consultations/${upcomingSession.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-border/30 bg-brand-dark/[0.04] px-4 py-2.5 text-[13px] font-semibold text-brand-dark hover:bg-brand-dark/[0.08] transition-colors dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
                  >
                    {t("notYetTime")}
                  </Link>
                </div>
              </div>

              {/* Pre-consultation Case Document Preparation */}
              <div className="mt-4 pt-3.5 border-t border-brand-border/15 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
                <span className="text-brand-dark/70 dark:text-white/70 flex items-center gap-1.5 font-medium">
                  <Upload size={14} className="text-brand-dark/40 dark:text-white/40" />
                  {t("uploadCaseDocuments")}
                </span>
                <Link
                  href={`/client/dashboard/consultations/${upcomingSession.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-brand-dark hover:underline dark:text-white"
                >
                  <span>{t("casePreparation")}</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          ) : awaitingSummarySession ? (
            /* CASE 3: Consultation Window Ended (Awaiting Advocate Summary) */
            <div className="rounded-2xl border border-amber-300/80 bg-amber-50/50 p-5 sm:p-6 shadow-sm dark:border-amber-700/40 dark:bg-amber-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 text-[15px] font-bold">
                    {(awaitingSummarySession.expert?.displayName || "Advocate")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[16px] font-bold text-brand-dark dark:text-white">
                        {awaitingSummarySession.service?.name ||
                          t("consultationCapitalized")}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                        {t("consultationEnded")}
                      </span>
                    </div>
                    <p className="text-[13px] text-brand-dark/70 dark:text-white/70 mt-0.5">
                      {t("withExpert", {
                        expertName:
                          awaitingSummarySession.expert?.displayName ||
                          t("legalExpert"),
                      })}
                    </p>
                    <p className="mt-1 text-[12px] text-amber-800/80 dark:text-amber-300/80 font-medium">
                      {t("awaitingSummary")}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 sm:self-center">
                  <Link
                    href={`/client/dashboard/consultations/${awaitingSummarySession.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white px-4 py-2 text-[13px] font-semibold text-amber-900 shadow-sm hover:bg-amber-50 transition-colors dark:border-amber-700 dark:bg-black dark:text-amber-200 dark:hover:bg-amber-950/40"
                  >
                    {t("viewSummary")}
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* CASE 4: Zero upcoming consultations empty state */
            <div className="rounded-2xl border border-brand-border/20 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-black text-center">
              <CalendarDays className="mx-auto mb-2 h-9 w-9 text-brand-dark/25 dark:text-white/25" />
              <p className="text-[14px] font-semibold text-brand-dark dark:text-white">
                {t("noUpcomingConsultations")}
              </p>
              <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50 max-w-sm mx-auto">
                {t("noUpcomingDesc")}
              </p>
            </div>
          )}

          {/* ── Middle Section: Returning vs New Clients ── */}
          {myLegalCounsel.length > 0 ? (
            /* RETURNING CLIENT: My Legal Counsel (Fast Re-engagement) */
            <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-bold text-brand-dark dark:text-white">
                    {t("myLegalCounsel")}
                  </h3>
                  <p className="text-[12px] text-brand-dark/50 dark:text-white/50">
                    {t("myLegalCounselDesc")}
                  </p>
                </div>
                {myLegalCounsel.length > COUNSEL_VISIBLE && (
                  <Link
                    href="/client/dashboard/consultations"
                    className="text-[12px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
                  >
                    {t("viewAll")} ({myLegalCounsel.length})
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleCounsel.map((counsel) => (
                  <div
                    key={counsel.id}
                    className="rounded-xl border border-brand-border/15 p-4 flex flex-col justify-between dark:border-white/10 bg-brand-dark/[0.01] dark:bg-white/[0.01]"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-dark/10 dark:bg-white/10 text-[13px] font-bold text-brand-dark dark:text-white">
                          {counsel.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-brand-dark dark:text-white truncate">
                            {counsel.name}
                          </p>
                          <p className="text-[11px] text-brand-dark/50 dark:text-white/50 truncate">
                            {counsel.specialty}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3.5 pt-3 border-t border-brand-border/10 dark:border-white/10 flex items-center gap-2">
                      <Link
                        href={
                          counsel.conversationId
                            ? `/client/dashboard/messages?conversationId=${counsel.conversationId}`
                            : "/client/dashboard/messages"
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-brand-border/30 bg-white py-1.5 text-[11px] font-semibold text-brand-dark hover:bg-brand-dark/[0.04] dark:border-white/15 dark:bg-black dark:text-white transition-colors"
                      >
                        <MessageSquare size={13} />
                        {t("messageAdvocate")}
                      </Link>
                      <Link
                        href={`/lawyers/${counsel.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-dark py-1.5 text-[11px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black transition-opacity"
                      >
                        <CalendarCheck2 size={13} />
                        {t("bookAgain")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show More / Show Less toggle — only if there are more than COUNSEL_VISIBLE */}
              {myLegalCounsel.length > COUNSEL_VISIBLE && (
                <div className="mt-3 pt-3 border-t border-brand-border/10 dark:border-white/10 text-center">
                  <button
                    onClick={() => setShowAllCounsel((v: boolean) => !v)}
                    className="text-[12px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white inline-flex items-center gap-1"
                  >
                    {showAllCounsel
                      ? t("showLessCounsel")
                      : t("showAllCounsel", { count: myLegalCounsel.length })}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* NEW CLIENT: 3-Step Client Journey Onboarding Guide */
            <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
              <div className="mb-4">
                <h3 className="text-[16px] font-bold text-brand-dark dark:text-white">
                  {t("onboardingTitle")}
                </h3>
                <p className="text-[13px] text-brand-dark/60 dark:text-white/60">
                  {t("onboardingSubtitle")}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="rounded-xl border border-brand-border/15 p-4 dark:border-white/10 bg-brand-dark/[0.01] dark:bg-white/[0.01]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 mb-3">
                    <UserCheck size={18} />
                  </div>
                  <p className="text-[13px] font-bold text-brand-dark dark:text-white">
                    {t("onboardingStep1Title")}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-brand-dark/60 dark:text-white/60">
                    {t("onboardingStep1Desc")}
                  </p>
                </div>

                <div className="rounded-xl border border-brand-border/15 p-4 dark:border-white/10 bg-brand-dark/[0.01] dark:bg-white/[0.01]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mb-3">
                    <ShieldCheck size={18} />
                  </div>
                  <p className="text-[13px] font-bold text-brand-dark dark:text-white">
                    {t("onboardingStep2Title")}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-brand-dark/60 dark:text-white/60">
                    {t("onboardingStep2Desc")}
                  </p>
                </div>

                <div className="rounded-xl border border-brand-border/15 p-4 dark:border-white/10 bg-brand-dark/[0.01] dark:bg-white/[0.01]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 mb-3">
                    <Video size={18} />
                  </div>
                  <p className="text-[13px] font-bold text-brand-dark dark:text-white">
                    {t("onboardingStep3Title")}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-brand-dark/60 dark:text-white/60">
                    {t("onboardingStep3Desc")}
                  </p>
                </div>
              </div>

              {/* Honest AI Legal Assistant Intake Banner */}
              <div className="mt-4 pt-4 border-t border-brand-border/15 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-brand-dark dark:text-white" />
                  <p className="text-[13px] text-brand-dark/70 dark:text-white/70">
                    {t("aiIntakeDesc")}
                  </p>
                </div>
                <Link
                  href="/ai"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-dark px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black transition-opacity shrink-0"
                >
                  <Sparkles size={13} />
                  {t("aiIntakeAction")}
                </Link>
              </div>
            </div>
          )}

          {/* ── Personal Workspace Quick Access ── */}
          <div className="space-y-3">
            <h3 className="text-[15px] font-bold text-brand-dark dark:text-white">
              {t("workspaceQuickAccess")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/client/dashboard/documents"
                className="group flex flex-col justify-between rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm hover:border-brand-dark/40 hover:shadow-md transition-all dark:border-white/10 dark:bg-black dark:hover:border-white/30"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/5 text-brand-dark group-hover:bg-brand-dark group-hover:text-white transition-colors dark:bg-white/10 dark:text-white dark:group-hover:bg-white dark:group-hover:text-black mb-3">
                    <FileText size={18} />
                  </div>
                  <p className="text-[14px] font-bold text-brand-dark dark:text-white">
                    {t("myDocuments")}
                  </p>
                  <p className="text-[12px] text-brand-dark/50 dark:text-white/50 mt-1 line-clamp-2">
                    {t("myDocumentsDesc")}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-brand-dark/70 group-hover:text-brand-dark dark:text-white/70 dark:group-hover:text-white">
                  <span>{t("viewAll")}</span>
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </div>
              </Link>

              <Link
                href="/client/dashboard/saved-experts"
                className="group flex flex-col justify-between rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm hover:border-brand-dark/40 hover:shadow-md transition-all dark:border-white/10 dark:bg-black dark:hover:border-white/30"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/5 text-brand-dark group-hover:bg-brand-dark group-hover:text-white transition-colors dark:bg-white/10 dark:text-white dark:group-hover:bg-white dark:group-hover:text-black mb-3">
                    <Bookmark size={18} />
                  </div>
                  <p className="text-[14px] font-bold text-brand-dark dark:text-white">
                    {t("savedLawyers")}
                  </p>
                  <p className="text-[12px] text-brand-dark/50 dark:text-white/50 mt-1 line-clamp-2">
                    {t("savedLawyersDesc")}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-brand-dark/70 group-hover:text-brand-dark dark:text-white/70 dark:group-hover:text-white">
                  <span>{t("viewAll")}</span>
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </div>
              </Link>

              <Link
                href="/client/dashboard/payments"
                className="group flex flex-col justify-between rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm hover:border-brand-dark/40 hover:shadow-md transition-all dark:border-white/10 dark:bg-black dark:hover:border-white/30"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/5 text-brand-dark group-hover:bg-brand-dark group-hover:text-white transition-colors dark:bg-white/10 dark:text-white dark:group-hover:bg-white dark:group-hover:text-black mb-3">
                    <CreditCard size={18} />
                  </div>
                  <p className="text-[14px] font-bold text-brand-dark dark:text-white">
                    {t("billingPayments")}
                  </p>
                  <p className="text-[12px] text-brand-dark/50 dark:text-white/50 mt-1 line-clamp-2">
                    {t("billingPaymentsDesc")}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[12px] font-semibold text-brand-dark/70 group-hover:text-brand-dark dark:text-white/70 dark:group-hover:text-white">
                  <span>{t("viewAll")}</span>
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </div>
              </Link>
            </div>
          </div>

          {/* ── Recent Consultations List ── */}
          {recentConsultations.length > 0 && (
            <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-brand-dark dark:text-white">
                  {t("recentConsultations")}
                </h3>
                <Link
                  href="/client/dashboard/consultations"
                  className="text-[12px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
                >
                  {t("viewAll")} ({bookings.length})
                </Link>
              </div>
              <div className="divide-y divide-brand-border/10 dark:divide-white/10">
                {recentConsultations.map((b) => (
                  <Link
                    key={b.id}
                    href={`/client/dashboard/consultations/${b.id}`}
                    className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 dark:bg-white/10 text-brand-dark dark:text-white">
                      <FileText size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold text-brand-dark dark:text-white truncate">
                          {b.service?.name || t("consultationCapitalized")}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            STATUS_COLORS[b.status] || STATUS_COLORS.PENDING
                          }`}
                        >
                          {t(`status.${b.status}` as Parameters<typeof t>[0], {
                            default: b.status,
                          })}
                        </span>
                      </div>
                      <p className="text-[12px] text-brand-dark/50 dark:text-white/50 truncate">
                        {t("expertDate", {
                          expertName: b.expert?.displayName || t("expert"),
                          date: formatDate(b.scheduledStart),
                        })}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-brand-dark/30 dark:text-white/30 shrink-0"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: Sidebar Overview & Trust (Span 4) ── */}
        <div className="lg:col-span-4 space-y-5 min-w-0">
          {/* Latest from Counsel (Upwork / Airbnb Style Message Preview) */}
          {latestCounselMessage && (
            <div className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare
                    size={16}
                    className="text-brand-dark dark:text-white"
                  />
                  <h3 className="text-[14px] font-bold text-brand-dark dark:text-white">
                    {t("latestFromCounsel")}
                  </h3>
                </div>
                <Link
                  href="/client/dashboard/messages"
                  className="text-[11px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
                >
                  {t("viewAll")}
                </Link>
              </div>
              <div className="rounded-xl border border-brand-border/15 p-3.5 bg-brand-dark/[0.01] dark:border-white/10 dark:bg-white/[0.01]">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-brand-dark dark:text-white truncate">
                    {latestCounselMessage.name}
                  </p>
                  <span className="text-[10px] text-brand-dark/40 dark:text-white/40">
                    {formatDate(latestCounselMessage.time)}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-brand-dark/70 dark:text-white/70 line-clamp-2">
                  {latestCounselMessage.text}
                </p>
                <div className="mt-3 pt-2.5 border-t border-brand-border/10 dark:border-white/10 flex justify-end">
                  <Link
                    href={`/client/dashboard/messages?conversationId=${latestCounselMessage.conversationId}`}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-blue hover:underline"
                  >
                    <span>{t("replyToCounsel")}</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Platform Security & Trust Guarantee (Real, Verified Policies) */}
          <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-transparent p-5 shadow-sm dark:border-emerald-800/30 dark:from-emerald-950/30">
            <div className="flex items-center gap-2.5 mb-2.5">
              <ShieldCheck
                size={20}
                className="text-emerald-600 dark:text-emerald-400"
              />
              <h3 className="text-[14px] font-bold text-brand-dark dark:text-white">
                {t("escrowProtectionTitle")}
              </h3>
            </div>
            <p className="text-[12px] leading-relaxed text-brand-dark/70 dark:text-white/70 mb-4">
              {t("escrowProtectionBody")}
            </p>
            <div className="border-t border-emerald-200/60 pt-3.5 space-y-3 dark:border-emerald-800/30">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2
                    size={15}
                    className="text-emerald-600 dark:text-emerald-400 shrink-0"
                  />
                  <span className="text-[13px] font-bold text-brand-dark dark:text-white">
                    {t("barAssociationTitle")}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-brand-dark/60 dark:text-white/60">
                  {t("barAssociationBody")}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Lock
                    size={14}
                    className="text-emerald-600 dark:text-emerald-400 shrink-0"
                  />
                  <span className="text-[13px] font-bold text-brand-dark dark:text-white">
                    {t("confidentialityTitle")}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-brand-dark/60 dark:text-white/60">
                  {t("confidentialityBody")}
                </p>
              </div>
            </div>
          </div>

          {/* Client Support Card with Production-Grade Popover & FAQs */}
          <div className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 dark:bg-white/10 text-brand-dark dark:text-white">
                <HelpCircle size={18} />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-brand-dark dark:text-white">
                  {t("needHelpTitle")}
                </h3>
                <p className="text-[12px] text-brand-dark/50 dark:text-white/50">
                  {t("needHelpSubtitle")}
                </p>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-brand-dark/60 dark:text-white/60 mb-3.5">
              {t("needHelpBody")}
            </p>
            <div className="flex flex-col gap-2">
              <ContactEmailPopover
                email="support@myjudicial.com"
                className="w-full justify-center"
              />
              <Link
                href="/faqs"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-border/25 bg-brand-dark/[0.02] py-2 px-3 text-[12px] font-semibold text-brand-dark/80 hover:bg-brand-dark/[0.06] transition-colors dark:border-white/15 dark:bg-white/[0.02] dark:text-white/80 dark:hover:bg-white/[0.06]"
              >
                <HelpCircle size={14} />
                {t("viewFaqs")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
