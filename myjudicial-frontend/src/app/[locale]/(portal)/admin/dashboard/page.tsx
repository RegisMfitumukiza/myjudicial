"use client";

import { useMemo } from "react";
import { useTimeOfDay, TIME_GREETING_KEY } from "@/shared/hooks/useTimeOfDay";
import {
  Users, BadgeCheck, DollarSign, AlertCircle,
  UserCheck, Briefcase, ShieldAlert, FileCheck,
  ArrowRight, Plus,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Link } from "@/i18n/routing";
import { useGetAdminAnalyticsSummary, useGetAdminAnalyticsRevenue, useGetAdminVerificationQueue } from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard";
import { StatCard } from "@/shared/components/dashboard";
import { DashboardSkeleton } from "@/shared/components/dashboard";
import { ErrorState } from "@/shared/components/dashboard";
import { EmptyState } from "@/shared/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { formatRWF } from "@/lib/utils";

function resolveValue(obj: any, path: string[]): number | null {
  let current = obj;
  for (const key of path) {
    if (current == null || typeof current !== "object") return null;
    current = current[key];
  }
  return typeof current === "number" ? current : null;
}

export default function AdminDashboardPage() {
  const t = useTranslations("admin.dashboard");
  const locale = useLocale();
  const timeOfDay = useTimeOfDay();
  const greetingKey = TIME_GREETING_KEY[timeOfDay];
  const { data: summaryRes, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useGetAdminAnalyticsSummary();
  const { data: revenueRes, isLoading: revenueLoading, isError: revenueError, refetch: refetchRevenue } = useGetAdminAnalyticsRevenue();
  const { data: verifRes } = useGetAdminVerificationQueue();

  const summary = summaryRes?.status === 200 ? summaryRes.data.data : null;
  const revenue = revenueRes?.status === 200 ? revenueRes.data.data : null;
  const verifQueue = useMemo(
    () => ((verifRes as any)?.status === 200 ? (verifRes as any).data.data : []),
    [verifRes]
  );
  const pendingVerifications = Array.isArray(verifQueue) ? verifQueue.filter((v: any) => v.status === "PENDING").length : 0;

  const platformStats = useMemo(() => {
    if (!summary) return null;
    return {
      totalUsers: resolveValue(summary, ["platform", "totalUsers"]) ?? 0,
      totalExperts: resolveValue(summary, ["platform", "totalExperts"]) ?? 0,
      verifiedExperts: resolveValue(summary, ["platform", "verifiedExperts"]) ?? 0,
      totalClients: resolveValue(summary, ["platform", "totalClients"]) ?? 0,
      suspendedExperts: resolveValue(summary, ["platform", "suspendedExperts"]) ?? 0,
      newUsersToday: resolveValue(summary, ["platform", "newUsersToday"]) ?? 0,
      newUsersThisMonth: resolveValue(summary, ["platform", "newUsersThisMonth"]) ?? 0,
      totalRevenue: resolveValue(summary, ["revenue", "totalRevenue"]) ?? 0,
    };
  }, [summary]);

  const chartData = useMemo(() => {
    if (!revenue?.timeSeries) return [];
    return revenue.timeSeries.map((item) => ({
      day: new Date(item.date).toLocaleDateString(locale, { weekday: "short" }),
      amount: item.revenue,
    }));
  }, [revenue, locale]);

  // Most recent verification activity (newest first) for the activity feed
  const recentVerifications = useMemo(() => {
    return Array.isArray(verifQueue)
      ? [...verifQueue]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
      : [];
  }, [verifQueue]);

  const isLoading = summaryLoading || revenueLoading;
  const hasError = summaryError || revenueError;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (hasError) {
    return (
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
        <PageHeader title={t(greetingKey)} description={t("subtitle")} />
        <ErrorState
          title={t("failedToLoad")}
          message={t("unableToFetch")}
          onRetry={() => { refetchSummary(); refetchRevenue(); }}
        />
      </div>
    );
  }

  const hasData = platformStats && (platformStats.totalUsers > 0 || platformStats.totalExperts > 0);

  const quickActions = [
    {
      href: "/admin/dashboard/experts",
      icon: Plus,
      label: t("addExpert"),
    },
    {
      href: "/admin/dashboard/users",
      icon: UserCheck,
      label: t("manageUsers"),
    },
    {
      href: "/admin/dashboard/finance",
      icon: DollarSign,
      label: t("viewFinance"),
    },
    {
      href: "/admin/dashboard/specialties",
      icon: FileCheck,
      label: t("manageSpecialties"),
    },
  ];

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader title={t(greetingKey)} description={t("subtitle")} />

      {/* Action Required - only show if there are items needing attention */}
      {(pendingVerifications > 0 || (platformStats?.suspendedExperts ?? 0) > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-warning" />
              {t("actionRequired")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {pendingVerifications > 0 && (
                <Link href="/admin/dashboard/verifications">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileCheck className="h-4 w-4" />
                    {pendingVerifications} {t("pendingVerifications")}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
              {(platformStats?.suspendedExperts ?? 0) > 0 && (
                <Link href="/admin/dashboard/experts?tab=suspended">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    {platformStats!.suspendedExperts} {t("suspendedExperts")}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Overview - Unified 6-metric responsive KPI grid */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          label={t("totalUsers")}
          value={(platformStats?.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          hint={`${platformStats?.newUsersToday ?? 0} ${t("newTodayDesc")}`}
        />
        <StatCard
          label={t("verifiedLawyers")}
          value={(platformStats?.verifiedExperts ?? 0).toLocaleString()}
          icon={BadgeCheck}
          hint={`${platformStats?.totalExperts ?? 0} ${t("lawyersDesc")}`}
        />
        <StatCard
          label={t("clients")}
          value={(platformStats?.totalClients ?? 0).toLocaleString()}
          icon={UserCheck}
        />
        <StatCard
          label={t("platformRevenue")}
          value={formatRWF(platformStats?.totalRevenue)}
          icon={DollarSign}
        />
        <StatCard
          label={t("newThisMonth")}
          value={(platformStats?.newUsersThisMonth ?? 0).toLocaleString()}
          icon={Briefcase}
          hint={t("newThisMonthDesc")}
        />
        <StatCard
          label={t("suspended")}
          value={(platformStats?.suspendedExperts ?? 0).toLocaleString()}
          icon={ShieldAlert}
          hint={t("suspendedDesc")}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{t("quickActions")}</h2>
            <p className="text-xs text-muted-foreground">{t("quickActionsDesc")}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((qa) => (
            <Link
              key={qa.href}
              href={qa.href}
              className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md min-w-0 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <qa.icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{qa.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Two-column: Recent verifications + Revenue chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 min-w-0">
        {/* Recent Verifications - single verification hub */}
        <Card className="lg:col-span-2 min-w-0">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{t("recentVerifications")}</CardTitle>
                {pendingVerifications > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning/15 px-1.5 text-xs font-semibold text-warning">
                    {pendingVerifications}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {pendingVerifications > 0 && (
                  <Link href="/admin/dashboard/verifications" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    {t("review")} <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
                <Link href="/admin/dashboard/verifications" className="text-xs text-primary hover:underline">
                  {t("viewAll")}
                </Link>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("recentVerificationsDesc")}</p>
          </CardHeader>
          <CardContent>
            {recentVerifications.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentVerifications.map((record) => (
                  <li key={record.id} className="flex items-center gap-3 py-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {record.expert?.displayName ?? "Expert"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {record.expert?.primarySpecialty?.replace(/_/g, " ") ?? record.status}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        record.status === "APPROVED"
                          ? "bg-primary/10 text-primary"
                          : record.status === "REJECTED"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/15 text-warning"
                      }`}
                    >
                      {record.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("noVerificationsYet")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="lg:col-span-3 min-w-0 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("revenueLast7Days")}</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" fontSize={12} axisLine={false} tickLine={false} className="text-muted-foreground" />
                    <YAxis fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${v}`)} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--card))",
                        color: "hsl(var(--card-foreground))",
                        fontSize: "13px",
                      }}
                      formatter={(value: number) => [formatRWF(value), t("revenue")]}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("noData")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Empty state when there is no data at all */}
      {!hasData && recentVerifications.length === 0 && chartData.length === 0 && (
        <EmptyState
          title={t("noData")}
          description={t("unableToFetch")}
        />
      )}
    </div>
  );
}
