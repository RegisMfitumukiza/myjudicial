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

interface RevenueChartProps {
  data: RevenueDay[];
  highestTransactionRwf: number;
}

export function RevenueChart({ data, highestTransactionRwf }: RevenueChartProps) {
  const t = useTranslations("expertDashboard");
  const total = data.reduce((sum, d) => sum + d.amountRwf, 0);

  return (
    <div className="rounded-xl border border-brand-border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t("recentEarnings")}</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            <TrendingUp size={11} className="inline mr-0.5 text-green-500" />
            {t("totalAmount", { amount: total.toLocaleString() })}
          </p>
        </div>
        <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue ring-1 ring-brand-blue/20 dark:bg-brand-blue/20">
          {t("highestAmount", { amount: highestTransactionRwf.toLocaleString() })}
        </span>
      </div>
      {data.length === 0 ? (
        <p className="mt-8 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("noEarnings")}
        </p>
      ) : (
      <>
      <div className="mt-4 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-blue)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--color-brand-blue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#eef1f5" strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <YAxis
              tickFormatter={(v: number) => `${v / 1000}k`}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              width={36}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()} RWF`, t("revenue")]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--color-brand-border)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Area
              type="monotone"
              dataKey="amountRwf"
              stroke="var(--color-brand-blue)"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <span className="h-2 w-2 rounded-sm bg-brand-blue" />
        {t("revenuePerConsultation")}
      </div>
      </>
      )}
    </div>
  );
}
