"use client";

import { useMemo } from "react";
import {
  Users, BadgeCheck, DollarSign, AlertCircle,
  UserCheck, Briefcase, ShieldAlert, FileCheck,
  Star, Clock, ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Link } from "@/i18n/routing";
import { useGetAdminAnalyticsSummary, useGetAdminAnalyticsRevenue, useGetAdminVerificationQueue } from "@/api/generated";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard";
import { StatCard } from "@/shared/components/dashboard";
import { LoadingSpinner } from "@/shared/components/dashboard";
import { ErrorState } from "@/shared/components/dashboard";
import { EmptyState } from "@/shared/components/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

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
  const { data: summaryRes, isLoading: summaryLoading, isError: summaryError, refetch: refetchSummary } = useGetAdminAnalyticsSummary();
  const { data: revenueRes, isLoading: revenueLoading, isError: revenueError, refetch: refetchRevenue } = useGetAdminAnalyticsRevenue();
  const { data: verifRes, isLoading: verifLoading } = useGetAdminVerificationQueue();

  const summary = summaryRes?.status === 200 ? summaryRes.data.data : null;
  const revenue = revenueRes?.status === 200 ? revenueRes.data.data : null;
  const verifQueue = (verifRes as any)?.status === 200 ? (verifRes as any).data.data : [];
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
      day: new Date(item.date).toLocaleDateString("en-GB", { weekday: "short" }),
      amount: item.revenue,
    }));
  }, [revenue]);

  const isLoading = summaryLoading || revenueLoading;
  const hasError = summaryError || revenueError;

  if (isLoading) {
    return <LoadingSpinner label={t("unableToFetch")} />;
  }

  if (hasError) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <PageHeader title={t("welcome")} description={t("subtitle")} />
        <ErrorState
          title={t("failedToLoad")}
          message={t("unableToFetch")}
          onRetry={() => { refetchSummary(); refetchRevenue(); }}
        />
      </div>
    );
  }

  const hasData = platformStats && (platformStats.totalUsers > 0 || platformStats.totalExperts > 0);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader title={t("welcome")} description={t("subtitle")} />

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

      {/* Platform Overview */}
      {hasData && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label={t("totalUsers")}
            value={platformStats!.totalUsers.toLocaleString()}
            icon={Users}
            hint={`${platformStats!.newUsersToday} ${t("newTodayDesc")}`}
          />
          <StatCard
            label={t("verifiedLawyers")}
            value={platformStats!.verifiedExperts.toLocaleString()}
            icon={BadgeCheck}
            hint={`${platformStats!.totalExperts} ${t("lawyersDesc")}`}
          />
          <StatCard
            label={t("clients")}
            value={platformStats!.totalClients.toLocaleString()}
            icon={UserCheck}
          />
          <StatCard
            label={t("platformRevenue")}
            value={`RWF ${platformStats!.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
          />
        </div>
      )}

      {/* Secondary Stats */}
      {hasData && (platformStats!.newUsersThisMonth > 0 || pendingVerifications > 0) && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatCard
            label={t("newThisMonth")}
            value={platformStats!.newUsersThisMonth.toLocaleString()}
            icon={Briefcase}
          />
          <StatCard
            label={t("suspended")}
            value={platformStats!.suspendedExperts.toLocaleString()}
            icon={ShieldAlert}
          />
          <StatCard
            label={t("pendingVerifications")}
            value={pendingVerifications.toLocaleString()}
            icon={Clock}
            action={
              pendingVerifications > 0 ? (
                <Link href="/admin/dashboard/verifications" className="text-xs text-primary hover:underline">
                  {t("review")} <ArrowRight className="inline h-3 w-3" />
                </Link>
              ) : undefined
            }
          />
        </div>
      )}

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("revenueLast7Days")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" fontSize={12} axisLine={false} tickLine={false} className="text-muted-foreground" />
                  <YAxis fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                      fontSize: "13px",
                    }}
                    formatter={(value: number) => [`RWF ${value.toLocaleString()}`, t("revenue")]}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!hasData && chartData.length === 0 && (
        <EmptyState
          title={t("noData")}
          description={t("unableToFetch")}
        />
      )}
    </div>
  );
}
