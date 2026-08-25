"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { RevenueDay } from "@/features/experts/dashboard-types";
import { TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { useTheme } from "@/shared/components/theme-provider";
import { EmptyState } from "@/shared/components/dashboard";

interface RevenueChartProps {
  data: RevenueDay[];
  highestTransactionRwf: number;
}

export function RevenueChart({ data, highestTransactionRwf }: RevenueChartProps) {
  const t = useTranslations("expertDashboard");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const gridColor = isDark ? "#272c35" : "#eef1f5";
  const tickColor = isDark ? "#828c99" : "#94a3b8";
  const seriesColor = isDark ? "#7fa8d4" : "#24558d";
  const tooltipContentStyle = {
    backgroundColor: isDark ? "#171a20" : "#ffffff",
    border: isDark ? "1px solid #2c313a" : "1px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 12,
  };

  const total = data.reduce((sum, d) => sum + d.amountRwf, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold tracking-tight text-foreground">{t("recentEarnings")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <TrendingUp size={11} className="mr-0.5 inline text-primary" aria-hidden="true" />
            {t("totalAmount", { amount: total.toLocaleString() })}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20 dark:bg-white/10 dark:text-white">
          {t("highestAmount", { amount: highestTransactionRwf.toLocaleString() })}
        </span>
      </div>
      {data.length === 0 ? (
        <EmptyState
          title={t("noEarnings")}
          className="mt-4 py-6"
        />
      ) : (
      <>
      <div className="mt-4 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={seriesColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={seriesColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: tickColor }}
            />
            <YAxis
              tickFormatter={(v: number) => `${v / 1000}k`}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: tickColor }}
              width={36}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()} RWF`, t("revenue")]}
              contentStyle={tooltipContentStyle}
            />
            <Area
              type="monotone"
              dataKey="amountRwf"
              stroke={seriesColor}
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-sm bg-primary" aria-hidden="true" />
        {t("revenuePerConsultation")}
      </div>
      </>
      )}
    </div>
  );
}
