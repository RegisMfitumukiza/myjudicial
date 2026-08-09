"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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

function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return "—";
  const target = new Date(iso).getTime();
  const diffMs = target - Date.now();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 0) return "In progress";
  if (diffMin < 60) return `In ${diffMin} min${diffMin === 1 ? "" : "s"}`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `In ${diffHr} hour${diffHr === 1 ? "" : "s"}`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "Tomorrow";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function ExpertDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("expertDashboard");
  const firstName = session?.user?.name?.split(" ")[0] || "Practitioner";
  const queryClient = useQueryClient();

  const { isIncomplete, isLoading: profileLoading } = useProfileCompletionStatus();

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
          toast.error(error instanceof Error ? error.message : t("profileUpdateFailed"));
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
        day: new Date(t.completedAt as string).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
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

  const isLoading = statsLoading || earningsLoading || complianceLoading || bookingsLoading || profileLoading;

  const SkeletonCard = () => (
    <div className="h-32 animate-pulse rounded-xl border border-brand-border bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
  );

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-dark via-brand-blue to-brand-dark p-8 shadow-lg">
        <div className="absolute right-0 top-0 h-80 w-80 translate-x-20 -translate-y-20 rounded-full bg-white/[0.05] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-12 translate-y-12 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isOnline 
                    ? "bg-green-500/20 text-green-300 animate-pulse" 
                    : "bg-gray-500/20 text-gray-300"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-400" : "bg-gray-400"}`} />
                  {isOnline ? t("onlineAvailable") : t("offline")}
                </div>
                {(stats?.activeConsultations || 0) > 0 && (
                  <div className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300">
                    {stats?.activeConsultations || 0} {t("activeSessions", { count: stats?.activeConsultations || 0, plural: (stats?.activeConsultations || 0) !== 1 ? "s" : "" })}
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white lg:text-4xl">
                {t("welcome", { name: firstName })}
              </h1>
              <p className="mt-2 text-white/70 lg:text-lg">
                {isOnline 
                  ? t("readyToServe") 
                  : t("setStatusOnline")}
              </p>
            </div>
            
            {/* Quick Actions */}
            <div className="hidden lg:flex flex-col gap-2">
              <button
                onClick={() => handleToggleAvailable(!isOnline)}
                disabled={isTogglingAvailable}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isOnline
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {isTogglingAvailable ? "..." : isOnline ? t("goOffline") : t("goOnline")}
              </button>
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
          onUploadClick={() => router.push('/expert/profile/edit#photo')}
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-semibold text-slate-900 dark:text-white">{t("whyCompleteProfile")}</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue">•</span>
                  <span>{t("appearInSearch")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue">•</span>
                  <span>{t("receiveBookings")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue">•</span>
                  <span>{t("accessEarnings")}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue">•</span>
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
            availableSlotsToday={0} // TODO: Calculate from today's schedule in Phase 2
          />

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <RevenueChart data={revenueData} highestTransactionRwf={highestTransactionRwf} />
              
              {/* Quick Stats Row */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-brand-dark dark:text-gray-100">
                      {stats?.completedConsultations ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("performance.consultations")}</p>
                  </div>
                </div>
                
                <div className="rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {earnings?.netRevenue ? `${(earnings.netRevenue / 1000).toFixed(0)}K` : "0"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("performance.revenue")}</p>
                  </div>
                </div>
                
                <div className="rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {stats?.averageRating ? stats.averageRating.toFixed(1) : "—"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("performance.rating")}</p>
                  </div>
                </div>
                
                <div className="rounded-xl border border-brand-border/20 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {stats?.reviewCount ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("performance.reviews")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts Sidebar */}
            <div>
              <RegulatoryAlerts alerts={alerts} />
            </div>
          </div>

          {/* Activity Feed */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BookingQueue sessions={queueSessions} />
            
            {/* Recent Activity - placeholder until real activity feed endpoint */}
            <div className="rounded-xl border border-brand-border/20 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-dark dark:text-gray-100">{t("activity.recentActivity")}</h3>
              </div>
              <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">
                {t("activity.comingSoon")}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
