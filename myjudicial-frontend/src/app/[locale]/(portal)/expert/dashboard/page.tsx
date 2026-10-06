"use client";

import { useMemo } from "react";
import { useTimeOfDay, TIME_GREETING_KEY } from "@/shared/hooks/useTimeOfDay";
import { useSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { Activity, Banknote, CalendarCheck, CheckCircle2, MessageSquare, Star } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  EmptyState,
  SkeletonCard,
  StatCard,
  StatusBadge,
} from "@/shared/components/dashboard";
import { getErrorMessage } from "@/lib/utils";
import {
  useGetExpertsStatistics,
  useGetExpertsEarnings,
  useGetExpertsCompliance,
  useGetBookings,
  useGetExpertsAvailability,
  useGetExpertsServices,
  usePatchExpertsAvailabilityPresence,
  getGetExpertsAvailabilityQueryKey,
} from "@/api/generated";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardStats } from "@/features/experts/components/dashboard-stats";
import { RevenueChart } from "@/features/experts/components/dashboard-revenue-chart";
import { BookingQueue } from "@/features/experts/components/dashboard-booking-queue";
import { RegulatoryAlerts } from "@/features/experts/components/dashboard-regulatory-alerts";
import { RescheduleRequestsCard } from "@/features/experts/components/dashboard-reschedule-requests";
import { ProfileCompletionBanner, ProfileCompletionCard } from "@/features/experts/components/profile-completion-banner";
import { CompactPhotoReminder } from "@/features/experts/components/ProfilePhotoReminder";
import { VerificationPrompt } from "@/features/experts/components/VerificationPrompt";
import { useProfileCompletionStatus } from "@/features/experts/hooks/useExpertProfile";
import type { RevenueDay, PracticeSession, RegulatoryAlert } from "@/features/experts/dashboard-types";

const ACTIVE_QUEUE_STATUSES = new Set(["PENDING", "CONFIRMED", "ACTIVE"]);

export default function ExpertDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("expertDashboard");
  const tBookings = useTranslations("expertDashboard_bookings");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const firstName = session?.user?.name?.split(" ")[0] || "Practitioner";
  const timeOfDay = useTimeOfDay();
  const greetingKey = TIME_GREETING_KEY[timeOfDay];
  const queryClient = useQueryClient();

  const { isIncomplete, isLoading: profileLoading } = useProfileCompletionStatus();

  function formatRelativeTime(iso: string | undefined): string {
    if (!iso) return "—";
    const target = new Date(iso).getTime();
    const diffMs = target - Date.now();
    const diffMin = Math.round(diffMs / 60000);

    if (diffMin < 0) return tCommon("inProgress") || "In progress";
    if (diffMin < 60) return tCommon("inMinutes", { minutes: diffMin }) || `In ${diffMin} min`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return tCommon("inHours", { hours: diffHr }) || `In ${diffHr} hour${diffHr === 1 ? "" : "s"}`;
    return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });
  }

  // Only fire profile-dependent queries once we know the ExpertProfile record exists.
  // Without this guard every query throws NotFoundError on the backend (→ HTTP 404)
  // for any user who hasn't completed onboarding yet.
  const profileEnabled = !profileLoading && !isIncomplete;

  const { data: statsRes, isLoading: statsLoading } = useGetExpertsStatistics(
    { query: { enabled: profileEnabled } }
  );
  const { data: earningsRes, isLoading: earningsLoading } = useGetExpertsEarnings(
    { query: { enabled: profileEnabled } }
  );
  const { data: complianceRes, isLoading: complianceLoading } = useGetExpertsCompliance(
    { query: { enabled: profileEnabled } }
  );
  const { data: bookingsRes, isLoading: bookingsLoading } = useGetBookings(
    { limit: 50 },
    { query: { enabled: profileEnabled } }
  );
  const { data: availabilityRes } = useGetExpertsAvailability(
    { query: { enabled: profileEnabled } }
  );
  const { data: servicesRes } = useGetExpertsServices(
    { query: { enabled: profileEnabled } }
  );
  
  // Custom hook for onboarding progress (including photo status)
  const { data: onboardingRes } = useQuery({
    queryKey: ["experts", "onboarding"],
    queryFn: async () => {
      return await apiFetch<{
        data: {
          photoStatus: {
            hasPhoto: boolean;
            needsPhoto: boolean;
            urgency: 'low' | 'medium' | 'high';
            message: string;
          };
        };
      }>("/experts/onboarding", { method: "GET" });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const { mutate: updatePresence, isPending: isTogglingAvailable } = usePatchExpertsAvailabilityPresence();

  const stats = statsRes?.status === 200 ? statsRes.data.data : null;
  const earnings = earningsRes?.status === 200 ? earningsRes.data.data : null;
  const compliance = complianceRes?.status === 200 ? complianceRes.data.data : null;
  const bookings = bookingsRes?.status === 200 ? bookingsRes.data.data : [];
  const availability = availabilityRes?.status === 200 ? availabilityRes.data.data : [];
  const services = servicesRes?.status === 200 ? servicesRes.data.data : [];
  const onboarding = onboardingRes?.data ?? null;

  const isOnline = availability[0]?.presenceStatus === "ONLINE";

  // Photo status from onboarding data
  const photoStatus = onboarding?.photoStatus || {
    hasPhoto: false,
    needsPhoto: true,
    urgency: 'low' as const,
    message: t('photoStatusLow')
  };

  function handleToggleAvailable(next: boolean) {
    updatePresence(
      { data: { presenceStatus: next ? "ONLINE" : "OFFLINE" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetExpertsAvailabilityQueryKey() });
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, t("profileUpdateFailed")));
        },
      }
    );
  }

  const queueSessions: PracticeSession[] = useMemo(() => {
    return bookings
      .filter((b) => ACTIVE_QUEUE_STATUSES.has(b.status))
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
      .slice(0, 5)
      .map((b) => {
        const startsInMs = new Date(b.scheduledStart).getTime() - Date.now();
        const urgent = startsInMs >= 0 && startsInMs <= 2 * 60 * 60 * 1000;
        return {
          id: b.id,
          client: b.citizen ? `${b.citizen.firstName} ${b.citizen.lastName}` : "Client",
          clientCode: `BK-${b.id.slice(0, 6).toUpperCase()}`,
          avatarUrl: "",
          caseNature: b.service?.name ?? "Consultation",
          timeLabel: formatRelativeTime(b.scheduledStart),
          urgent,
          status: urgent ? "URGENT" : b.status === "PENDING" ? "PENDING" : "CONFIRMED",
        } satisfies PracticeSession;
      });
  }, [bookings]);

  // Get next upcoming booking
  const nextBooking = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((b) => new Date(b.scheduledStart) > now && ACTIVE_QUEUE_STATUSES.has(b.status))
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())[0] || null;
  }, [bookings]);

  const revenueData: RevenueDay[] = useMemo(() => {
    if (!earnings) return [];
    return [...earnings.recentTransactions]
      .filter((t) => t.completedAt)
      .reverse()
      .map((t) => ({
        day: new Date(t.completedAt as string).toLocaleDateString(locale, { day: "numeric", month: "short" }),
        amountRwf: t.amount,
      }));
  }, [earnings]);

  const highestTransactionRwf = useMemo(
    () => (earnings ? earnings.recentTransactions.reduce((max, t) => Math.max(max, t.amount), 0) : 0),
    [earnings]
  );

  const alerts: RegulatoryAlert[] = useMemo(() => {
    if (!compliance) return [];
    const result: RegulatoryAlert[] = [];
    if (compliance.isExpired) {
      result.push({
        id: "credentials-expired",
        severity: "critical",
        title: t("alerts.credentialsExpired"),
        message: compliance.statusMessage,
      });
    } else if (compliance.daysUntilExpiry !== null && compliance.daysUntilExpiry <= 30) {
      result.push({
        id: "credentials-expiring",
        severity: compliance.daysUntilExpiry <= 7 ? "critical" : "warning",
        title: t("alerts.credentialsExpiringSoon"),
        message: compliance.statusMessage,
      });
    }
    if (compliance.status === "PENDING_VERIFICATION" || compliance.status === "REJECTED") {
      result.push({
        id: "verification-status",
        severity: compliance.status === "REJECTED" ? "critical" : "warning",
        title: compliance.status === "REJECTED" ? t("alerts.verificationRejected") : t("alerts.verificationPending"),
        message: compliance.statusMessage,
      });
    }
    if (services.length === 1 && services[0].isDefault) {
      result.push({
        id: "only-default-service",
        severity: "warning",
        title: t("alerts.expandServices"),
        message: t("alerts.expandServicesDesc"),
        href: "/expert/dashboard/services",
      });
    }
    return result;
  }, [compliance, services, t]);

  const availableSlotsToday = useMemo(() => {
    if (!isOnline) return 0;
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
    const todayName = dayNames[new Date().getDay()];
    const todaySlot = availability.find((s) => s.dayOfWeek === todayName && s.isAvailable);
    if (!todaySlot || !todaySlot.startTime || !todaySlot.endTime) return 0;

    const [startH, startM] = todaySlot.startTime.split(":").map(Number);
    const [endH, endM] = todaySlot.endTime.split(":").map(Number);
    const durationMin = services[0]?.durationMin || 60;
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (totalMinutes <= 0) return 0;

    const totalPotentialSlots = Math.floor(totalMinutes / durationMin);
    const now = new Date();
    const isToday = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    };

    const bookedCount = bookings.filter(
      (b) => isToday(b.scheduledStart) && ACTIVE_QUEUE_STATUSES.has(b.status)
    ).length;

    return Math.max(0, totalPotentialSlots - bookedCount);
  }, [isOnline, availability, services, bookings]);

  const recentActivities = useMemo(() => {
    return bookings
      .filter((b) => b.status === "COMPLETED" || b.status === "CONFIRMED")
      .sort((a, b) => {
        const timeA = new Date(a.completedAt || a.scheduledStart || a.createdAt).getTime();
        const timeB = new Date(b.completedAt || b.scheduledStart || b.createdAt).getTime();
        return timeB - timeA;
      })
      .slice(0, 5)
      .map((b) => ({
        id: b.id,
        client: b.citizen ? `${b.citizen.firstName} ${b.citizen.lastName}` : "Client",
        serviceName: b.service?.name ?? "Consultation",
        status: b.status,
        timestamp: b.completedAt || b.scheduledStart || b.createdAt,
      }));
  }, [bookings]);

  const isLoading = statsLoading || earningsLoading || complianceLoading || bookingsLoading || profileLoading;

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      {/* Welcome banner */}
      {/* Welcome banner — fixed navy gradient so text stays legible in both themes */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16324f] via-[#24558d] to-[#0d2238] p-4 sm:p-6 shadow-lg lg:p-8">
        <div className="absolute right-0 top-0 h-80 w-80 translate-x-20 -translate-y-20 rounded-full bg-white/[0.05] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-12 translate-y-12 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    isOnline ? "bg-white/15 text-white" : "bg-white/10 text-white/70"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isOnline ? "bg-white animate-pulse" : "bg-white/50"
                    }`}
                    aria-hidden="true"
                  />
                  {isOnline ? t("onlineAvailable") : t("offline")}
                </span>
                {(stats?.activeConsultations || 0) > 0 && (
                  <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                    {stats?.activeConsultations || 0} {t("activeSessions", { count: stats?.activeConsultations || 0, plural: (stats?.activeConsultations || 0) !== 1 ? "s" : "" })}
                  </div>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white lg:text-4xl break-words">
                {t(greetingKey, { name: firstName })}
              </h1>
              <p className="mt-2 text-white/70 lg:text-lg">
                {isOnline 
                  ? t("readyToServe") 
                  : t("setStatusOnline")}
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="hidden lg:flex flex-col gap-2">
              <Button
                onClick={() => handleToggleAvailable(!isOnline)}
                disabled={isTogglingAvailable}
                className={
                  isOnline
                    ? "bg-white/10 text-white shadow-none hover:bg-white/20"
                    : "bg-white text-brand-dark hover:bg-white/90"
                }
              >
                {isTogglingAvailable ? "..." : isOnline ? t("goOffline") : t("goOnline")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Banner */}
      {!profileLoading && isIncomplete && <ProfileCompletionBanner />}

      {/* Photo Upload Reminder */}
      {!profileLoading && !isIncomplete && !photoStatus.hasPhoto && (
        <CompactPhotoReminder
          photoStatus={photoStatus}
          onUploadClick={() => router.push('/expert/dashboard/profile#photo')}
        />
      )}

      {/* Verification Prompt - profile exists but not yet verified */}
      {!profileLoading && !isIncomplete && <VerificationPrompt />}

      {/* Reschedule Requests */}
      {!profileLoading && !isIncomplete && (
        <RescheduleRequestsCard
          bookings={bookings.filter((b) => b.pendingRescheduleStart && b.status !== "CANCELLED" && b.status !== "REFUNDED")}
        />
      )}

      {profileLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : isIncomplete ? (
        /* Profile incomplete — show setup card */
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProfileCompletionCard hasAvailability={availability.length > 0} />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/50 p-4">
              <h4 className="text-base font-semibold tracking-tight text-foreground">{t("whyCompleteProfile")}</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t("appearInSearch")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t("receiveBookings")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t("accessEarnings")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t("buildReputation")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <>
          <DashboardStats
            availableFundsRwf={earnings?.netRevenue ?? 0}
            pendingEscrowRwf={earnings?.pendingEscrowBalance ?? 0}
            activeBookings={stats?.activeConsultations ?? 0}
            pendingBookings={stats?.pendingBookings ?? 0}
            clientRating={stats?.averageRating ?? null}
            reviewCount={stats?.reviewCount ?? 0}
            available={isOnline}
            onToggleAvailable={handleToggleAvailable}
            isTogglingAvailable={isTogglingAvailable}
            nextBooking={nextBooking?.service ? { scheduledStart: nextBooking.scheduledStart, service: { name: nextBooking.service.name } } : null}
            availableSlotsToday={availableSlotsToday}
          />

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <RevenueChart data={revenueData} highestTransactionRwf={highestTransactionRwf} />
              
              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  label={t("performance.consultations")}
                  value={stats?.completedConsultations ?? 0}
                  icon={CalendarCheck}
                />
                <StatCard
                  label={t("performance.revenue")}
                  value={
                    earnings?.netRevenue
                      ? `${(earnings.netRevenue / 1000).toFixed(0)}K`
                      : "0"
                  }
                  icon={Banknote}
                />
                <StatCard
                  label={t("performance.rating")}
                  value={stats?.averageRating ? stats.averageRating.toFixed(1) : "—"}
                  icon={Star}
                />
                <StatCard
                  label={t("performance.reviews")}
                  value={stats?.reviewCount ?? 0}
                  icon={MessageSquare}
                />
              </div>
            </div>

            {/* Alerts Sidebar */}
            <div className="min-w-0">
              <RegulatoryAlerts alerts={alerts} />
            </div>
          </div>

          {/* Activity Feed */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BookingQueue sessions={queueSessions} />
            
            {/* Recent Activity */}
            <div className="rounded-xl border border-border bg-card shadow-sm min-w-0">
              <div className="flex items-center justify-between p-4 sm:p-5 pb-0">
                <h3 className="text-base font-semibold tracking-tight text-foreground">{t("activity.recentActivity")}</h3>
              </div>
              {recentActivities.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title={t("activity.recentActivity")}
                  description={tBookings("empty.completed")}
                  className="border-none bg-transparent shadow-none"
                />
              ) : (
                <div className="divide-y divide-border p-4 sm:p-5 pt-3">
                  {recentActivities.map((act) => (
                    <Link
                      key={act.id}
                      href={`/expert/dashboard/bookings/${act.id}`}
                      className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50 rounded-lg px-2 -mx-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {act.status === "COMPLETED" ? <CheckCircle2 size={15} /> : <CalendarCheck size={15} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{act.client}</p>
                          <p className="text-xs text-muted-foreground truncate">{act.serviceName}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <StatusBadge tone={act.status === "COMPLETED" ? "success" : "active"}>
                          {act.status === "COMPLETED" ? tBookings("status.completed") : tBookings("status.confirmed")}
                        </StatusBadge>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {formatRelativeTime(act.timestamp)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
