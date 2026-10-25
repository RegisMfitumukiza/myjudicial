"use client";

import { useState, useMemo } from "react";
import { useTimeOfDay, TIME_GREETING_KEY } from "@/shared/hooks/useTimeOfDay";
import { Link, useRouter } from "@/i18n/routing";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  Clock,
  Search,
  ArrowRight,
  Star,
  Video,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  Sparkles,
  ShieldCheck,
  Scale,
  Building2,
  Briefcase,
  Users,
  CheckCircle2,
  HelpCircle,
  Send,
  Mail,
} from "lucide-react";
import { useGetBookings } from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";

const JOINABLE_WINDOW_MS = 15 * 60 * 1000; // can join 15 min before start

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  REFUNDED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function ClientHomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("clientDashboard_home");
  const locale = useLocale();

  const [aiQuery, setAiQuery] = useState("");

  const firstName =
    (session?.user as unknown as { firstName?: string })?.firstName ||
    session?.user?.name?.split(" ")[0] ||
    "Client";
  const timeOfDay = useTimeOfDay();
  const greetingKey = TIME_GREETING_KEY[timeOfDay];

  const { data: bookingsData, isLoading: bookingsLoading } = useGetBookings({
    page: 1,
    limit: 20,
  });

  const bookings = useMemo(() => {
    if (bookingsData?.status === 200) return bookingsData.data.data || [];
    return [];
  }, [bookingsData]);

  const isLoading = bookingsLoading;
  const now = useMemo(() => new Date(), []);

  const activeSession = useMemo(() => {
    return (
      bookings
        .filter((b) => b.status === "ACTIVE")
        .sort(
          (a, b) =>
            new Date(b.scheduledStart).getTime() -
            new Date(a.scheduledStart).getTime()
        )[0] || null
    );
  }, [bookings]);

  const upcomingConsultation = useMemo(() => {
    return (
      bookings
        .filter(
          (b) =>
            new Date(b.scheduledStart) > now &&
            ["CONFIRMED", "ACTIVE"].includes(b.status)
        )
        .sort(
          (a, b) =>
            new Date(a.scheduledStart).getTime() -
            new Date(b.scheduledStart).getTime()
        )[0] || null
    );
  }, [bookings, now]);

  const recentConsultations = useMemo(() => {
    return bookings
      .filter((b) => ["COMPLETED", "ACTIVE", "CONFIRMED"].includes(b.status))
      .sort(
        (a, b) =>
          new Date(b.scheduledStart).getTime() -
          new Date(a.scheduledStart).getTime()
      )
      .slice(0, 3);
  }, [bookings]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter((b) => b.status === "COMPLETED").length;
    const upcoming = bookings.filter(
      (b) =>
        ["CONFIRMED", "ACTIVE"].includes(b.status) &&
        new Date(b.scheduledStart) > now
    ).length;
    return { total, completed, upcoming };
  }, [bookings, now]);

  const pendingPayment = useMemo(() => {
    return (
      bookings.find(
        (b) =>
          b.status === "PENDING" &&
          (b.paymentStatus === "PENDING" || b.paymentStatus === "FAILED")
      ) || null
    );
  }, [bookings]);

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

  const lastConsultedExpert = useMemo(() => {
    const completed = bookings
      .filter((b) => b.status === "COMPLETED" && b.expert)
      .sort(
        (a, b) =>
          new Date(b.scheduledStart).getTime() -
          new Date(a.scheduledStart).getTime()
      )[0];
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
    if (diffDays <= 0) return t("today");
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

  const handleAiSubmit = (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = (customQuery !== undefined ? customQuery : aiQuery).trim();
    if (!q) return;
    try {
      localStorage.setItem("mj_ai_case_draft", q);
    } catch {
      // storage unavailable
    }
    router.push(`/ai?q=${encodeURIComponent(q)}`);
  };

  const practiceAreas = [
    {
      title: t("landLaw"),
      href: "/search?specialty=LAND_LAW",
      icon: Building2,
      desc: t("tagLand"),
    },
    {
      title: t("commercialLaw"),
      href: "/search?specialty=COMMERCIAL_LAW",
      icon: Briefcase,
      desc: t("tagContract"),
    },
    {
      title: t("familyLaw"),
      href: "/search?specialty=FAMILY_LAW",
      icon: Users,
      desc: t("tagFamily"),
    },
    {
      title: t("employmentLaw"),
      href: "/search?specialty=EMPLOYMENT_LAW",
      icon: Scale,
      desc: t("tagLabor"),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0">
      {/* Command Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b border-brand-border/15 dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-dark dark:text-white break-words">
            {t(greetingKey, { firstName })}
          </h1>
          <p className="mt-1 text-[14px] text-brand-dark/60 dark:text-white/60">
            {t("manageConsultationsDesc")}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:opacity-90 dark:bg-white dark:text-black transition-opacity"
          >
            <Search size={15} />
            {t("bookLawyer")}
          </Link>
          <Link
            href="/ai"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-border/30 bg-white px-4 py-2.5 text-[13px] font-semibold text-brand-dark shadow-sm hover:bg-brand-dark/[0.04] dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/[0.05] transition-colors"
          >
            <Sparkles size={15} />
            {t("aiAssistant")}
          </Link>
        </div>
      </div>

      {/* PRIORITY 1: Active Video Session (Live Now) */}
      {activeSession && (
        <div className="mb-6 sm:mb-8">
          <div className="rounded-2xl border-2 border-green-500/40 bg-green-50/70 p-5 sm:p-6 shadow-md dark:border-green-500/30 dark:bg-green-950/30">
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
                      {activeSession.service?.name || t("consultationCapitalized")}
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                      {t("live")}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] text-brand-dark/70 dark:text-white/70">
                    {t("withExpert", {
                      expertName:
                        activeSession.expert?.displayName || t("legalExpert"),
                    })}
                  </p>
                  <p className="mt-1 text-[12px] text-brand-dark/50 dark:text-white/50">
                    {t("startedTimeAmount", {
                      time: formatTime(activeSession.scheduledStart),
                      amount:
                        activeSession.service?.flatFee?.toLocaleString() ?? "0",
                    })}
                  </p>
                </div>
              </div>
              <Link
                href={`/client/dashboard/consultations/${activeSession.id}/join`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-[14px] font-bold text-white shadow-md hover:bg-green-700 transition-all dark:bg-green-500 dark:hover:bg-green-600 shrink-0"
              >
                <Video size={16} />
                {t("joinNow")}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Command Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Primary Workflows (Span 8) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8 min-w-0">
          {/* Spotlight: Upcoming Consultation or Friendly Empty State */}
          <div className="rounded-2xl border border-brand-border/20 bg-white p-5 sm:p-6 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-brand-dark dark:text-white" />
                <h2 className="text-[15px] font-bold text-brand-dark dark:text-white">
                  {t("upcomingConsultation")}
                </h2>
              </div>
              {upcomingConsultation && (
                <Link
                  href="/client/dashboard/consultations"
                  className="text-[12px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
                >
                  {t("viewAll")}
                </Link>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-brand-dark/30 dark:text-white/30" />
              </div>
            ) : upcomingConsultation ? (
              (() => {
                const startsInMs =
                  new Date(upcomingConsultation.scheduledStart).getTime() -
                  now.getTime();
                const canJoin =
                  upcomingConsultation.status === "ACTIVE" ||
                  startsInMs <= JOINABLE_WINDOW_MS;
                return (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-dark/10 font-bold text-brand-dark dark:bg-white/10 dark:text-white text-[15px]">
                        {(
                          upcomingConsultation.expert?.displayName || "Advocate"
                        )
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-[16px] font-bold text-brand-dark dark:text-white">
                          {upcomingConsultation.service?.name ||
                            t("consultationCapitalized")}
                        </p>
                        <p className="text-[13px] text-brand-dark/70 dark:text-white/70">
                          {t("withExpert", {
                            expertName:
                              upcomingConsultation.expert?.displayName ||
                              t("legalExpert"),
                          })}
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[12px] text-brand-dark/60 dark:text-white/60">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <CalendarDays
                              size={14}
                              className="text-brand-dark/40 dark:text-white/40"
                            />
                            {formatDate(upcomingConsultation.scheduledStart)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <Clock
                              size={14}
                              className="text-brand-dark/40 dark:text-white/40"
                            />
                            {formatTime(upcomingConsultation.scheduledStart)} —{" "}
                            {formatTime(upcomingConsultation.scheduledEnd)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                      {canJoin ? (
                        <Link
                          href={`/client/dashboard/consultations/${upcomingConsultation.id}/join`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-green-700 transition-colors"
                        >
                          <Video size={15} />
                          {t("join")}
                        </Link>
                      ) : (
                        <Link
                          href={`/client/dashboard/consultations/${upcomingConsultation.id}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-border/30 bg-brand-dark/[0.04] px-4 py-2.5 text-[13px] font-semibold text-brand-dark hover:bg-brand-dark/[0.08] transition-colors dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
                        >
                          {t("notYetTime")}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-6 sm:py-8 text-center border border-dashed border-brand-border/25 rounded-xl bg-brand-dark/[0.01] dark:border-white/10 dark:bg-white/[0.01]">
                <CalendarDays className="mx-auto mb-2 h-9 w-9 text-brand-dark/25 dark:text-white/25" />
                <p className="text-[14px] font-semibold text-brand-dark dark:text-white">
                  {t("noUpcomingConsultations")}
                </p>
                <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50 max-w-md mx-auto">
                  {t("noUpcomingDesc")}
                </p>
                <div className="mt-4">
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:opacity-90 dark:bg-white dark:text-black transition-opacity"
                  >
                    <Search size={15} />
                    {t("findAdvocate")}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Interactive AI Case Triage Intake Box */}
          <div className="rounded-2xl border border-brand-border/20 bg-gradient-to-br from-brand-dark/[0.02] to-transparent p-5 sm:p-6 shadow-sm dark:border-white/10 dark:from-white/[0.02]">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white dark:bg-white dark:text-black shadow-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-brand-dark dark:text-white">
                  {t("aiIntakeTitle")}
                </h3>
                <p className="text-[13px] text-brand-dark/60 dark:text-white/60">
                  {t("aiIntakeDesc")}
                </p>
              </div>
            </div>

            <form onSubmit={(e) => handleAiSubmit(e)} className="mt-4 space-y-3">
              <div className="relative">
                <textarea
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAiSubmit();
                    }
                  }}
                  rows={3}
                  placeholder={t("aiIntakePlaceholder")}
                  className="w-full resize-none rounded-xl border border-brand-border/30 bg-white p-3.5 pr-12 text-[13px] leading-relaxed text-brand-dark placeholder:text-brand-dark/40 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark dark:border-white/15 dark:bg-black dark:text-white dark:placeholder:text-white/40 dark:focus:border-white dark:focus:ring-white"
                />
                <button
                  type="submit"
                  disabled={!aiQuery.trim()}
                  className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-dark text-white disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 dark:bg-white dark:text-black transition-opacity"
                  aria-label={t("analyzeCase")}
                >
                  <Send size={14} />
                </button>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-dark/40 dark:text-white/40 mb-2">
                  {t("aiSuggestedQueries")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    t("tagLand"),
                    t("tagContract"),
                    t("tagLabor"),
                    t("tagFamily"),
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleAiSubmit(undefined, chip)}
                      className="rounded-lg border border-brand-border/25 bg-white px-3 py-1.5 text-[12px] font-medium text-brand-dark/80 hover:border-brand-dark/50 hover:bg-brand-dark/[0.03] transition-colors dark:border-white/15 dark:bg-black dark:text-white/80 dark:hover:border-white/40 dark:hover:bg-white/[0.03]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Practice Areas Discovery Grid */}
          <div className="space-y-3">
            <div>
              <h3 className="text-[16px] font-bold text-brand-dark dark:text-white">
                {t("practiceAreasTitle")}
              </h3>
              <p className="text-[13px] text-brand-dark/50 dark:text-white/50">
                {t("practiceAreasSubtitle")}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {practiceAreas.map((pa) => {
                const Icon = pa.icon;
                return (
                  <Link
                    key={pa.title}
                    href={pa.href}
                    className="group flex items-start gap-3.5 rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm hover:border-brand-dark/40 hover:shadow-md transition-all dark:border-white/10 dark:bg-black dark:hover:border-white/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/5 group-hover:bg-brand-dark group-hover:text-white text-brand-dark dark:bg-white/10 dark:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[14px] font-bold text-brand-dark dark:text-white truncate">
                          {pa.title}
                        </p>
                        <ArrowRight
                          size={14}
                          className="text-brand-dark/30 group-hover:text-brand-dark group-hover:translate-x-0.5 transition-all dark:text-white/30 dark:group-hover:text-white"
                        />
                      </div>
                      <p className="text-[12px] text-brand-dark/50 dark:text-white/50 line-clamp-1 mt-0.5">
                        {pa.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Consultations List */}
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
                  {t("viewAll")}
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
                          {t(`status.${b.status}` as Parameters<typeof t>[0], { default: b.status })}
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

        {/* Right Column: Platform Overview & Legal Trust Sidebar (Span 4) */}
        <div className="lg:col-span-4 space-y-6 min-w-0">
          {/* Platform Overview Metrics */}
          <div className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-brand-dark dark:text-white">
                {t("yourOverview")}
              </h3>
              <Link
                href="/client/dashboard/consultations"
                className="text-[12px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white"
              >
                {t("viewAll")}
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-brand-dark/[0.03] p-3 text-center dark:bg-white/[0.03]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-dark/40 dark:text-white/40">
                  {t("upcoming")}
                </p>
                <p className="mt-1 text-[20px] font-extrabold text-brand-dark dark:text-white">
                  {stats.upcoming}
                </p>
              </div>
              <div className="rounded-xl bg-brand-dark/[0.03] p-3 text-center dark:bg-white/[0.03]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-dark/40 dark:text-white/40">
                  {t("completed")}
                </p>
                <p className="mt-1 text-[20px] font-extrabold text-brand-dark dark:text-white">
                  {stats.completed}
                </p>
              </div>
              <div className="rounded-xl bg-brand-dark/[0.03] p-3 text-center dark:bg-white/[0.03]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-dark/40 dark:text-white/40">
                  {t("total")}
                </p>
                <p className="mt-1 text-[20px] font-extrabold text-brand-dark dark:text-white">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          {/* Action Required: Payment or Review Pending */}
          {(pendingPayment || pendingReview) && (
            <div className="space-y-3">
              {pendingPayment && (
                <Link
                  href={`/client/dashboard/consultations/${pendingPayment.id}`}
                  className="flex items-center gap-3.5 rounded-xl border border-yellow-200 bg-yellow-50/60 p-4 transition-shadow hover:shadow-md dark:border-yellow-800/30 dark:bg-yellow-950/20"
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
                          pendingPayment.service?.flatFee?.toLocaleString() ??
                          "0",
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
                  className="flex items-center gap-3.5 rounded-xl border border-blue-200 bg-blue-50/60 p-4 transition-shadow hover:shadow-md dark:border-blue-800/30 dark:bg-blue-950/20"
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
                          pendingReview.expert?.displayName ||
                          t("yourExpert"),
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

          {/* Quick Rebook (if returning client) */}
          {lastConsultedExpert && !activeSession && (
            <div className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-brand-dark/40 dark:text-white/40 mb-3">
                {t("quickRebook")}
              </h3>
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-dark/10 dark:bg-white/10 text-[14px] font-bold text-brand-dark dark:text-white">
                  {(lastConsultedExpert.name || "E")
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-brand-dark dark:text-white truncate">
                    {lastConsultedExpert.name}
                  </p>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50 truncate">
                    {t("lastConsultationDateService", {
                      date: formatDate(lastConsultedExpert.date),
                      serviceName: lastConsultedExpert.service,
                    })}
                  </p>
                </div>
                <Link
                  href={`/lawyers/${lastConsultedExpert.expertId}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-brand-dark px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black shrink-0 transition-opacity"
                >
                  {t("rebook")} <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}

          {/* Escrow Protection & Rwanda Bar Verification Guarantee */}
          <div className="rounded-2xl border border-brand-border/20 bg-gradient-to-br from-emerald-500/[0.04] to-transparent p-5 shadow-sm dark:border-white/10 dark:from-emerald-500/[0.02]">
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
            <div className="border-t border-brand-border/15 pt-3.5 dark:border-white/10">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2
                  size={16}
                  className="text-brand-dark dark:text-white"
                />
                <span className="text-[13px] font-bold text-brand-dark dark:text-white">
                  {t("barAssociationTitle")}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-brand-dark/60 dark:text-white/60">
                {t("barAssociationBody")}
              </p>
            </div>
          </div>

          {/* Dedicated Platform Support */}
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
                  support@myjudicial.com
                </p>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-brand-dark/60 dark:text-white/60 mb-3.5">
              {t("needHelpBody")}
            </p>
            <a
              href="mailto:support@myjudicial.com"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-border/30 bg-brand-dark/[0.03] py-2 px-3 text-[12px] font-semibold text-brand-dark hover:bg-brand-dark/[0.08] transition-colors dark:border-white/15 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/[0.08]"
            >
              <Mail size={14} />
              support@myjudicial.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
