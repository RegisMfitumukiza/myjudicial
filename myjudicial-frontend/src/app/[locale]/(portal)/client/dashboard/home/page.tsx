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
  CalendarPlus,
  Download,
  ExternalLink,
  BadgeCheck,
} from "lucide-react";
import { useGetBookings, useGetChatConversations, useGetFiles } from "@/api/generated";
import { useQuery } from "@tanstack/react-query";
import { getSavedExperts } from "@/lib/api/saved-experts";
import { downloadICS } from "@/features/booking/lib/ics";
import { JOINABLE_EARLY_WINDOW_MS, OVERTIME_GRACE_WINDOW_MS, SPOTLIGHT_MAX_AWAITING_MS } from "@/features/booking/constants";
import { useTranslations, useLocale } from "next-intl";
import { ContactEmailPopover } from "@/shared/components/contact-email-popover";
import { SkeletonCard } from "@/shared/components/dashboard/loading";

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  REFUNDED:  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

interface MilestoneLabels {
  step1: string;
  step1Desc: string;
  step2: string;
  step2Desc: string;
  step3: string;
  step3Desc: string;
  step4: string;
  step4Desc: string;
}

function CaseMilestoneTracker({
  currentStep,
  variant,
  labels,
}: {
  currentStep: 1 | 2 | 3 | 4;
  variant: "live" | "upcoming" | "awaiting" | "completed";
  labels: MilestoneLabels;
}) {
  const steps = [
    { step: 1, title: labels.step1, desc: labels.step1Desc },
    { step: 2, title: labels.step2, desc: labels.step2Desc },
    { step: 3, title: labels.step3, desc: labels.step3Desc },
    { step: 4, title: labels.step4, desc: labels.step4Desc },
  ];

  return (
    <div className="w-full pt-3 pb-1">
      <div className="relative">
        {/* Background connecting track */}
        <div className="absolute top-3.5 left-8 right-8 sm:left-12 sm:right-12 h-0.5 bg-brand-border/25 dark:bg-white/10 -translate-y-1/2 z-0" />

        {/* Active filled progress track */}
        <div
          className={`absolute top-3.5 left-8 sm:left-12 h-0.5 -translate-y-1/2 z-0 transition-all duration-500 ${
            variant === "awaiting"
              ? "bg-gradient-to-r from-emerald-500 via-emerald-500 to-amber-500"
              : variant === "live"
              ? "bg-emerald-500"
              : "bg-brand-dark dark:bg-white"
          }`}
          style={{
            width:
              currentStep === 1
                ? "12%"
                : currentStep === 2
                ? "37%"
                : currentStep === 3
                ? "70%"
                : "calc(100% - 32px)",
          }}
        />

        {/* 4 Steps Columns */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 relative z-10">
          {steps.map((s) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <div
                key={s.step}
                className="flex flex-col items-center text-center px-0.5 sm:px-1"
              >
                {/* Circle node */}
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shadow-sm ring-4 ${
                    isCompleted
                      ? "bg-emerald-600 text-white ring-emerald-50 dark:ring-emerald-950/40"
                      : isCurrent
                      ? variant === "awaiting"
                        ? "bg-amber-600 text-white ring-amber-100 dark:ring-amber-950 animate-pulse"
                        : variant === "live"
                        ? "bg-green-600 text-white ring-green-100 dark:ring-green-950 animate-pulse"
                        : "bg-brand-dark dark:bg-white text-white dark:text-black ring-brand-dark/10 dark:ring-white/10"
                      : "bg-white dark:bg-zinc-900 border-2 border-brand-border/40 dark:border-white/20 text-brand-dark/70 dark:text-white/70 ring-white dark:ring-black"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={15} className="shrink-0" />
                  ) : (
                    <span>{s.step}</span>
                  )}
                </div>

                {/* Title label: responsive, no truncate, wrapping smoothly */}
                <span
                  className={`mt-2 text-[11px] sm:text-[12px] leading-tight font-bold break-words whitespace-normal max-w-full ${
                    isCompleted
                      ? "text-emerald-700 dark:text-emerald-400"
                      : isCurrent
                      ? variant === "awaiting"
                        ? "text-amber-900 dark:text-amber-200"
                        : variant === "live"
                        ? "text-green-900 dark:text-green-300"
                        : "text-brand-dark dark:text-white"
                      : "text-brand-dark/75 dark:text-white/75"
                  }`}
                >
                  {s.title}
                </span>

                {/* Descriptive Subtitle (explains purpose of step, visible on sm+) */}
                <span
                  className={`hidden sm:block mt-0.5 text-[10px] leading-tight break-words max-w-full ${
                    isCompleted
                      ? "text-emerald-600/80 dark:text-emerald-400/70"
                      : isCurrent
                      ? variant === "awaiting"
                        ? "text-amber-800/80 dark:text-amber-300/80 font-medium"
                        : "text-brand-dark/60 dark:text-white/60 font-medium"
                      : "text-brand-dark/50 dark:text-white/50"
                  }`}
                >
                  {s.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ClientHomePage() {
  const { data: session } = useSession();
  const t = useTranslations("clientDashboard_home");
  const locale = useLocale();

  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false);
  const [showAllCounsel, setShowAllCounsel] = useState(false);
  const COUNSEL_VISIBLE = 3;

  const firstName =
    (session?.user as unknown as { firstName?: string })?.firstName ||
    session?.user?.name?.split(" ")[0] ||
    "Client";
  const timeOfDay = useTimeOfDay();
  const greetingKey = TIME_GREETING_KEY[timeOfDay];

  const milestoneLabels = useMemo(() => ({
    step1: t("milestoneFunded"),
    step1Desc: t("step1Desc"),
    step2: t("milestoneSession"),
    step2Desc: t("step2Desc"),
    step3: t("milestoneSummary"),
    step3Desc: t("step3Desc"),
    step4: t("milestoneRelease"),
    step4Desc: t("step4Desc"),
  }), [t]);

  // 1. Bookings data
  const { data: bookingsData, isLoading: bookingsLoading } = useGetBookings({
    page: 1,
    limit: 30,
  });

  // 2. Chat conversations data
  const { data: convData } = useGetChatConversations(
    { limit: 10 },
    { query: { refetchInterval: 30_000 } }
  );

  // 3. User files data (Dynamic telemetry for Quick Access)
  const { data: filesData } = useGetFiles(undefined, {
    query: { refetchInterval: 60_000 },
  });

  // 4. Saved experts data (Dynamic telemetry for Quick Access)
  const { data: savedExpertsData } = useQuery({
    queryKey: ["saved-experts"],
    queryFn: getSavedExperts,
    staleTime: 60_000,
  });

  const bookings = useMemo(() => {
    if (bookingsData?.status === 200) return bookingsData.data.data || [];
    return [];
  }, [bookingsData]);

  const conversations = useMemo(() => {
    if (convData?.status === 200) return convData.data.data || [];
    return [];
  }, [convData]);

  const filesCount = filesData?.status === 200 ? filesData.data.data.length : 0;
  const savedCount = savedExpertsData?.length ?? 0;

  const billingSummary = useMemo(() => {
    const paidBookings = bookings.filter(
      (b) => b.paymentStatus === "PAID" || b.paymentStatus === "AUTHORIZED" || b.escrowLockedAt
    );
    const totalSpent = paidBookings.reduce(
      (sum, b) => sum + (b.service?.flatFee || 0),
      0
    );
    return {
      count: paidBookings.length,
      totalSpent,
    };
  }, [bookings]);

  const isLoading = bookingsLoading;
  const now = useMemo(() => new Date(), []);
  const nowTime = now.getTime();

  // Local Kigali Time (CAT UTC+2)
  const kigaliTime = useMemo(() => {
    return new Date().toLocaleTimeString(locale, {
      timeZone: "Africa/Kigali",
      hour: "numeric",
      minute: "2-digit",
      hour12: locale !== "fr" && locale !== "rw",
    });
  }, [locale]);

  // ─── Time-Aware Consultation Lifecycle ───
  // 1. Live session: explicitly ACTIVE (within overtime grace) or CONFIRMED within [-15m before start, scheduledEnd + 30m grace]
  const liveSession = useMemo(() => {
    return (
      bookings.find((b) => {
        if ((b as any).actualEndTime) return false;
        const s = new Date(b.scheduledStart).getTime();
        const e = new Date(b.scheduledEnd).getTime();
        if (b.status === "ACTIVE") {
          return nowTime <= e + OVERTIME_GRACE_WINDOW_MS;
        }
        if (b.status === "CONFIRMED") {
          return nowTime >= s - JOINABLE_EARLY_WINDOW_MS && nowTime <= e + OVERTIME_GRACE_WINDOW_MS;
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
      return nowTime < s - JOINABLE_EARLY_WINDOW_MS;
    });
    if (future.length === 0) return null;
    return [...future].sort(
      (a, b) =>
        new Date(a.scheduledStart).getTime() -
        new Date(b.scheduledStart).getTime()
    )[0];
  }, [bookings, nowTime]);

  // 3. Consultation ended awaiting summary: CONFIRMED/ACTIVE past window or with actualEndTime, but not COMPLETED/CANCELLED
  const awaitingSummarySession = useMemo(() => {
    const pastUnclosed = bookings.filter((b) => {
      if (b.status !== "CONFIRMED" && b.status !== "ACTIVE") return false;
      const endTimestamp = (b as any).actualEndTime
        ? new Date((b as any).actualEndTime).getTime()
        : new Date(b.scheduledEnd).getTime();
      const elapsed = nowTime - endTimestamp;
      return elapsed > 0 && elapsed <= SPOTLIGHT_MAX_AWAITING_MS;
    });
    if (pastUnclosed.length === 0) return null;
    return [...pastUnclosed].sort((a, b) => {
      const endA = (a as any).actualEndTime ? new Date((a as any).actualEndTime).getTime() : new Date(a.scheduledEnd).getTime();
      const endB = (b as any).actualEndTime ? new Date((b as any).actualEndTime).getTime() : new Date(b.scheduledEnd).getTime();
      return endB - endA;
    })[0];
  }, [bookings, nowTime]);

  // Active Escrow Deposit: Booking in progress or awaiting summary with locked escrow
  const activeEscrowBooking = useMemo(() => {
    return (
      bookings.find(
        (b) =>
          ["CONFIRMED", "ACTIVE"].includes(b.status) &&
          (b.paymentStatus === "PAID" || !!b.escrowLockedAt)
      ) || null
    );
  }, [bookings]);

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

  // My Legal Counsel: Extract unique previous advocates worked with
  const myLegalCounsel = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        specialty: string;
        lastSeen: string;
        conversationId?: string;
        fee?: number;
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
        fee: b.service?.flatFee,
      });
    }

    return Array.from(map.values());
  }, [bookings, conversations, t]);

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

  function formatEndedTime(endIso: string) {
    const endTime = new Date(endIso).getTime();
    const elapsedMs = Math.max(0, nowTime - endTime);
    const elapsedMin = Math.floor(elapsedMs / (60 * 1000));
    const elapsedHours = Math.floor(elapsedMs / (60 * 60 * 1000));

    if (elapsedMin < 5) {
      return t("endedJustNow");
    }
    if (elapsedMin < 60) {
      return t("endedMinutesAgo", { count: elapsedMin });
    }

    const endDate = new Date(endIso);
    const nowDate = new Date(nowTime);

    // Compute calendar day difference using local midnight
    const startOfNow = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
    const startOfEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
    const calendarDays = Math.round((startOfNow - startOfEnd) / (24 * 60 * 60 * 1000));

    if (calendarDays === 0) {
      return t("endedHoursAgo", { count: Math.max(1, elapsedHours) });
    }
    if (calendarDays === 1) {
      return t("endedYesterdayAt", { time: formatTime(endIso) });
    }
    if (calendarDays < 7) {
      return t("endedDaysAgo", { count: calendarDays });
    }
    return t("endedOnDate", { date: formatDate(endIso) });
  }

  function getGoogleCalendarUrl(booking: {
    id: string;
    expertName: string;
    serviceName: string;
    scheduledStart: string;
    scheduledEnd: string;
  }) {
    const formatGCal = (iso: string) =>
      new Date(iso).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(
      `Consultation with ${booking.expertName} - ${booking.serviceName}`
    );
    const details = encodeURIComponent(
      `Legal consultation on MyJudicial platform.\nBooking ID: ${booking.id}\nVideo Room: https://myjudicial.com/bookings/${booking.id}/join`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGCal(
      booking.scheduledStart
    )}/${formatGCal(booking.scheduledEnd)}&details=${details}&location=Online%20(MyJudicial%20Video)`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0">
      {/* â”€â”€â”€ Command Center Welcome Header with Local CAT Timezone â”€â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b border-brand-border/15 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-dark dark:text-white break-words">
            {t(greetingKey, { firstName })}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[13px] text-brand-dark/60 dark:text-white/60">
            <span>{t("manageConsultationsDesc")}</span>
            <span className="hidden sm:inline text-brand-dark/30 dark:text-white/30">â€¢</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-brand-dark/80 dark:text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{t("kigaliTimeLabel")}: {kigaliTime}</span>
            </span>
          </div>
        </div>

        {/* Client Action Center Status Pill */}
        <div className="shrink-0">
          {pendingActionCount === 0 ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3.5 py-1.5 text-[12px] font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2
                size={15}
                className="text-emerald-600 dark:text-emerald-400"
              />
              <span>{t("allCaughtUp")}</span>
              <span className="text-emerald-600/70 dark:text-emerald-400/70">
                â€¢ {t("noPendingActions")}
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
                â€¢ {t("pendingActionsCount", { count: pendingActionCount })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€â”€ Action Alerts (Pending Payment / Review) â”€â”€â”€ */}
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

      {/* â”€â”€â”€ Main 2-Column Command Center Grid â”€â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* â”€â”€ LEFT COLUMN: Primary Workspace (Span 8) â”€â”€ */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8 min-w-0">
          {/* â”€â”€ Spotlight Consultation Card (Time-Aware Lifecycle + Milestone Tracker) â”€â”€ */}
          {isLoading ? (
            <SkeletonCard className="rounded-2xl p-6" />
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
                      {formatTime(liveSession.scheduledStart)} â€”{" "}
                      {formatTime(liveSession.scheduledEnd)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/client/dashboard/consultations/${liveSession.id}/join`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-[14px] font-bold text-white shadow-md hover:bg-green-700 transition-all dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    <Video size={16} />
                    {t("joinNow")}
                  </Link>
                </div>
              </div>

              {/* Step Milestone Tracker */}
              <div className="mt-5 pt-4 border-t border-green-600/15 dark:border-green-400/15">
                <CaseMilestoneTracker currentStep={2} variant="live" labels={milestoneLabels} />
              </div>
            </div>
          ) : upcomingSession ? (
            /* CASE 2: Scheduled Future Consultation + Calendar Sync */
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
                        {formatTime(upcomingSession.scheduledStart)} â€”{" "}
                        {formatTime(upcomingSession.scheduledEnd)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 sm:self-center">
                  {/* 1-Click Calendar Sync Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setCalendarDropdownOpen(!calendarDropdownOpen)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-brand-border/30 bg-white px-3 py-2 text-[12px] font-semibold text-brand-dark hover:bg-brand-dark/[0.04] transition-colors dark:border-white/15 dark:bg-black dark:text-white"
                      title={t("addToCalendar")}
                    >
                      <CalendarPlus size={14} />
                      <span className="hidden sm:inline">{t("addToCalendar")}</span>
                    </button>
                    {calendarDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setCalendarDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-1.5 w-52 z-40 rounded-xl border border-brand-border/20 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-gray-900">
                          <a
                            href={getGoogleCalendarUrl({
                              id: upcomingSession.id,
                              expertName: upcomingSession.expert?.displayName || "Advocate",
                              serviceName: upcomingSession.service?.name || "Consultation",
                              scheduledStart: upcomingSession.scheduledStart,
                              scheduledEnd: upcomingSession.scheduledEnd,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setCalendarDropdownOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-brand-dark hover:bg-brand-dark/[0.04] dark:text-white dark:hover:bg-white/10"
                          >
                            <ExternalLink size={13} className="text-blue-600" />
                            <span>{t("googleCalendar")}</span>
                          </a>
                          <button
                            onClick={() => {
                              setCalendarDropdownOpen(false);
                              downloadICS({
                                id: upcomingSession.id,
                                expertName: upcomingSession.expert?.displayName || "Advocate",
                                serviceName: upcomingSession.service?.name || "Consultation",
                                start: upcomingSession.scheduledStart,
                                end: upcomingSession.scheduledEnd,
                              });
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-brand-dark hover:bg-brand-dark/[0.04] dark:text-white dark:hover:bg-white/10 text-left"
                          >
                            <Download size={13} className="text-purple-600" />
                            <span>{t("appleOutlookCalendar")}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <Link
                    href={`/client/dashboard/consultations/${upcomingSession.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-border/30 bg-brand-dark/[0.04] px-4 py-2 text-[13px] font-semibold text-brand-dark hover:bg-brand-dark/[0.08] transition-colors dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
                  >
                    {t("notYetTime")}
                  </Link>
                </div>
              </div>

              {/* Case Milestone Progress Tracker */}
              <div className="mt-5 pt-4 border-t border-brand-border/15 dark:border-white/10">
                <CaseMilestoneTracker currentStep={2} variant="upcoming" labels={milestoneLabels} />
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
            /* CASE 3: Consultation Window Ended (Awaiting Advocate Summary + Milestone Tracker) */
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
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 shadow-sm shrink-0">
                        <Clock size={11} className="shrink-0 text-amber-700 dark:text-amber-300" />
                        <span>{formatEndedTime((awaitingSummarySession as any).actualEndTime || awaitingSummarySession.scheduledEnd)}</span>
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

                <div className="flex items-center gap-2 shrink-0 sm:self-center">
                  <Link
                    href={`/client/dashboard/messages?conversationId=${
                      conversations.find((c) =>
                        c.participants.some(
                          (p) =>
                            p.user.id === (awaitingSummarySession.expert as unknown as { userId?: string }).userId
                        )
                      )?.id || ""
                    }`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300/80 bg-white px-3 py-2 text-[12px] font-semibold text-amber-900 shadow-sm hover:bg-amber-50 transition-colors dark:border-amber-700 dark:bg-black dark:text-amber-200 dark:hover:bg-amber-950/40"
                  >
                    <MessageSquare size={13} />
                    <span>{t("messageAdvocateDirect")}</span>
                  </Link>
                  <Link
                    href={`/client/dashboard/consultations/${awaitingSummarySession.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-900 px-4 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-amber-800 transition-colors dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300"
                  >
                    {t("viewSummary")}
                  </Link>
                </div>
              </div>

              {/* Case Milestone Progress Tracker */}
              <div className="mt-5 pt-4 border-t border-amber-300/60 dark:border-amber-700/40">
                <CaseMilestoneTracker currentStep={3} variant="awaiting" labels={milestoneLabels} />
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

          {/* â”€â”€ Middle Section: Returning vs New Clients â”€â”€ */}
          {isLoading ? (
            /* Skeleton placeholder â€” same height as the counsel card */
            <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black animate-pulse">
              <div className="h-4 w-36 bg-brand-dark/10 dark:bg-white/10 rounded mb-2" />
              <div className="h-3 w-52 bg-brand-dark/5 dark:bg-white/5 rounded mb-5" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-brand-border/10 dark:border-white/10 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-brand-dark/10 dark:bg-white/10 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-24 bg-brand-dark/10 dark:bg-white/10 rounded" />
                        <div className="h-2.5 w-16 bg-brand-dark/5 dark:bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-brand-border/10 dark:border-white/10 flex gap-2">
                      <div className="flex-1 h-7 rounded-lg bg-brand-dark/5 dark:bg-white/5" />
                      <div className="flex-1 h-7 rounded-lg bg-brand-dark/10 dark:bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : myLegalCounsel.length > 0 ? (
            /* RETURNING CLIENT: My Legal Counsel (Adaptive Layout) */
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

              {/* Adaptive Layout: Rich horizontal card when exactly 1 counsel, balanced grid when 2+ */}
              {myLegalCounsel.length === 1 ? (
                <div className="rounded-xl border border-brand-border/15 p-5 bg-brand-dark/[0.01] dark:border-white/10 dark:bg-white/[0.01]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-dark/10 dark:bg-white/10 text-[16px] font-bold text-brand-dark dark:text-white shadow-sm">
                        {myLegalCounsel[0].name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-bold text-brand-dark dark:text-white">
                            {myLegalCounsel[0].name}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <BadgeCheck size={12} className="text-blue-600 dark:text-blue-400" />
                            <span>{t("verifiedBarCounsel")}</span>
                          </span>
                        </div>
                        <p className="text-[12px] text-brand-dark/60 dark:text-white/60 mt-0.5">
                          {myLegalCounsel[0].specialty}
                        </p>
                        <p className="text-[11px] text-brand-dark/40 dark:text-white/40 mt-1">
                          {t("lastConsultedOn", {
                            date: formatDate(myLegalCounsel[0].lastSeen),
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={
                          myLegalCounsel[0].conversationId
                            ? `/client/dashboard/messages?conversationId=${myLegalCounsel[0].conversationId}`
                            : "/client/dashboard/messages"
                        }
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-border/30 bg-white px-4 py-2 text-[12px] font-semibold text-brand-dark hover:bg-brand-dark/[0.04] dark:border-white/15 dark:bg-black dark:text-white transition-colors"
                      >
                        <MessageSquare size={14} />
                        {t("messageAdvocate")}
                      </Link>
                      <Link
                        href={`/lawyers/${myLegalCounsel[0].id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-dark px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black transition-opacity"
                      >
                        <CalendarCheck2 size={14} />
                        {t("bookAgain")}
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={`grid gap-3 ${
                    myLegalCounsel.length === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
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
              )}

              {/* Show More / Show Less toggle â€” only if there are more than COUNSEL_VISIBLE */}
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

          {/* â”€â”€ Personal Workspace Quick Access with LIVE Dynamic Counters â”€â”€ */}
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
                  <p className="text-[12px] font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {t("filesStoredCount", { count: filesCount })}
                  </p>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50 mt-1 line-clamp-2">
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
                  <p className="text-[12px] font-medium text-blue-700 dark:text-blue-400 mt-0.5">
                    {t("advocatesSavedCount", { count: savedCount })}
                  </p>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50 mt-1 line-clamp-2">
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
                  <p className="text-[12px] font-medium text-purple-700 dark:text-purple-400 mt-0.5">
                    {t("billingTransactionsCount", {
                      count: billingSummary.count,
                      amount: billingSummary.totalSpent.toLocaleString(),
                    })}
                  </p>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50 mt-1 line-clamp-2">
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

          {/* â”€â”€ Returning Client Multi-Matter Quick Jump â”€â”€ */}
          <div className="rounded-2xl border border-brand-border/20 bg-white p-4 sm:p-5 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-[14px] font-bold text-brand-dark dark:text-white">
                  {t("needAnotherMatter")}
                </h4>
                <p className="text-[12px] text-brand-dark/50 dark:text-white/50">
                  {t("explorePracticeAreas")}
                </p>
              </div>
              <Link
                href="/search"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-dark hover:underline dark:text-white shrink-0"
              >
                <span>{t("viewAll")}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "paLand", specialty: "LAND_LAW" },
                { key: "paCommercial", specialty: "COMMERCIAL_LAW" },
                { key: "paLabor", specialty: "EMPLOYMENT_LAW" },
                { key: "paFamily", specialty: "FAMILY_LAW" },
                { key: "paCriminal", specialty: "CRIMINAL_LAW" },
                { key: "paTax", specialty: "TAX_LAW" },
              ].map((item) => (
                <Link
                  key={item.specialty}
                  href={`/search?specialty=${item.specialty}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border/20 bg-brand-dark/[0.02] px-3 py-1.5 text-[12px] font-medium text-brand-dark hover:border-brand-dark/40 hover:bg-brand-dark/[0.05] transition-colors dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:hover:border-white/30"
                >
                  <span>{t(item.key as Parameters<typeof t>[0])}</span>
                  <ArrowRight size={11} className="opacity-40" />
                </Link>
              ))}
            </div>
          </div>

          {/* â”€â”€ Recent Consultations List â”€â”€ */}
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
                        {b.status === "CONFIRMED" && nowTime > new Date(b.scheduledEnd).getTime() ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 shrink-0">
                            {t("awaitingSummaryBadge")}
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              STATUS_COLORS[b.status] || STATUS_COLORS.PENDING
                            }`}
                          >
                            {t(`status.${b.status}` as Parameters<typeof t>[0], {
                              default: b.status,
                            })}
                          </span>
                        )}
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

        {/* â”€â”€ RIGHT COLUMN: Sidebar Overview & Trust (Span 4) â”€â”€ */}
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

          {/* Active Escrow Financial Shield (Or General Platform Protection) */}
          {activeEscrowBooking ? (
            <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/30 p-5 shadow-sm dark:border-emerald-700/50 dark:from-emerald-950/40 dark:to-emerald-900/20">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck
                    size={18}
                    className="text-emerald-700 dark:text-emerald-400 shrink-0"
                  />
                  <h3 className="text-[13px] sm:text-[14px] font-bold text-emerald-950 dark:text-emerald-200 truncate">
                    {t("activeEscrowShieldTitle")}
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-white shadow-sm shrink-0 whitespace-nowrap">
                  <Lock size={10} className="shrink-0" />
                  <span>{t("escrowSecuredPill")}</span>
                </span>
              </div>

              <div className="mt-3 rounded-xl bg-white/80 p-3.5 backdrop-blur-sm dark:bg-black/60 border border-emerald-200/60 dark:border-emerald-800/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800/70 dark:text-emerald-400/70">
                  {activeEscrowBooking.service?.name || t("consultation")}
                </p>
                <p className="mt-0.5 text-[20px] font-extrabold text-emerald-950 dark:text-emerald-100">
                  {(activeEscrowBooking.service?.flatFee || 0).toLocaleString()} RWF
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-emerald-900/80 dark:text-emerald-300/80">
                  {t("activeEscrowGuaranteed")}
                </p>
              </div>

              <div className="mt-3.5 flex items-center justify-between text-[11px] font-semibold text-emerald-900/80 dark:text-emerald-300/80">
                <Link
                  href="/client/dashboard/payments"
                  className="inline-flex items-center gap-1 text-emerald-800 hover:underline dark:text-emerald-300"
                >
                  <span>{t("viewEscrowReceipt")}</span>
                  <ArrowRight size={11} />
                </Link>
                <a
                  href="https://barreaudurwanda.org.rw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-800/70 hover:underline dark:text-emerald-300/70"
                >
                  <span>{t("verifyBarRoll")}</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          ) : (
            /* General Platform Security Guarantee */
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
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        size={15}
                        className="text-emerald-600 dark:text-emerald-400 shrink-0"
                      />
                      <span className="text-[13px] font-bold text-brand-dark dark:text-white">
                        {t("barAssociationTitle")}
                      </span>
                    </div>
                    <a
                      href="https://barreaudurwanda.org.rw"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      <span>{t("verifyBarRoll")}</span>
                      <ExternalLink size={10} />
                    </a>
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
          )}

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
