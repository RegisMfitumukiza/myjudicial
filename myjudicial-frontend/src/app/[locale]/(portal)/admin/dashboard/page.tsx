"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Users, BadgeCheck, TrendingUp, DollarSign, Loader2, AlertCircle,
  UserCheck, Briefcase, Activity, ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useGetAdminAnalyticsSummary, useGetAdminAnalyticsRevenue, type GetAdminAnalyticsSummary200Data } from "@/api/generated";
import { useTranslations } from "next-intl";

interface CardConfig {
  labelKey: string;
  subtitleKey: string;
  icon: LucideIcon;
  path: string[];
  format?: (v: number) => string;
}

const cardConfigs: CardConfig[] = [
  { labelKey: "totalUsers",     subtitleKey: "totalUsersDesc",   icon: Users,      path: ["platform", "totalUsers"] },
  { labelKey: "clients",         subtitleKey: "clientsDesc", icon: UserCheck,  path: ["platform", "totalClients"] },
  { labelKey: "lawyers",         subtitleKey: "lawyersDesc",  icon: Briefcase,  path: ["platform", "totalExperts"] },
  { labelKey: "verifiedLawyers", subtitleKey: "verifiedLawyersDesc",   icon: BadgeCheck, path: ["platform", "verifiedExperts"] },
  { labelKey: "newToday",       subtitleKey: "newTodayDesc",       icon: Activity,   path: ["platform", "newUsersToday"] },
  { labelKey: "newThisMonth",  subtitleKey: "newThisMonthDesc",            icon: TrendingUp, path: ["platform", "newUsersThisMonth"] },
  { labelKey: "suspended",       subtitleKey: "suspendedDesc",          icon: ShieldAlert,path: ["platform", "suspendedExperts"] },
  { labelKey: "platformRevenue", subtitleKey: "platformRevenueDesc",     icon: DollarSign, path: ["revenue", "totalRevenue"],
    format: (v) => `RWF ${(v / 1000).toFixed(1)}k` },
];

function resolveValue(summary: GetAdminAnalyticsSummary200Data, path: string[]): number | null {
  let obj: any = summary;
  for (const key of path) {
    if (obj == null || typeof obj !== "object") return null;
    obj = obj[key];
  }
  return typeof obj === "number" ? obj : null;
}

export default function AdminDashboardPage() {
  const t = useTranslations("admin.dashboard");
  const { data: summaryRes, isLoading: summaryLoading, isError: summaryError } = useGetAdminAnalyticsSummary();
  const { data: revenueRes, isLoading: revenueLoading, isError: revenueError } = useGetAdminAnalyticsRevenue();

  const summary = summaryRes?.status === 200 ? summaryRes.data.data : null;
  const revenue = revenueRes?.status === 200 ? revenueRes.data.data : null;

  const stats = useMemo(() =>
    cardConfigs.map((cfg) => {
      const raw = summary ? resolveValue(summary, cfg.path) : null;
      const value = raw !== null ? (cfg.format ? cfg.format(raw) : raw.toLocaleString()) : "—";
      return { label: t(cfg.labelKey), subtitle: t(cfg.subtitleKey), value, icon: cfg.icon };
    }),
    [summary, t]
  );

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
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t("failedToLoad")}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("unableToFetch")}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-lg bg-brand-dark px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 p-6 lg:p-8">

      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-xl bg-brand-dark p-6 lg:p-8">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-16 -translate-y-16 rounded-full bg-white/[0.03] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-8 translate-y-8 rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="relative">
          <h1 className="text-2xl font-bold text-white lg:text-3xl">
            {t("welcome")}
          </h1>
          <p className="mt-1.5 text-sm text-white/60 lg:text-base">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {stats.map(({ label, subtitle, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue dark:bg-white/10 dark:text-white">
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
          <h3 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">
            {t("revenueLast7Days")}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-brand-border))" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid rgb(var(--color-brand-border))",
                    backgroundColor: "#fff",
                    fontSize: "13px",
                  }}
                  formatter={(value: number) => [`RWF ${value.toLocaleString()}`, t("revenue")]}
                />
                <Bar dataKey="amount" fill="rgb(var(--color-brand-blue))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!summary && chartData.length === 0 && (
        <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-10 text-center shadow-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("noData")}
          </p>
        </div>
      )}

    </div>
  );
}
