"use client";

import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import type { ExpertEarnings } from "../hooks/useEarnings";
import { useTranslations } from "next-intl";

interface EarningsSummaryProps {
  earnings: ExpertEarnings;
}

export function EarningsSummary({ earnings }: EarningsSummaryProps) {
  const t = useTranslations("expertDashboard_earnings");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: earnings.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      labelKey: "grossRevenue",
      value: formatCurrency(earnings.grossRevenue),
      icon: DollarSign,
      color: "text-brand-blue",
      bgColor: "bg-brand-blue/10",
    },
    {
      labelKey: "platformFees",
      value: formatCurrency(earnings.platformFees),
      icon: TrendingUp,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      labelKey: "netRevenue",
      value: formatCurrency(earnings.netRevenue),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      labelKey: "pendingEscrow",
      value: formatCurrency(earnings.pendingEscrowBalance),
      icon: Clock,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.labelKey}
            className="rounded-lg border border-brand-border bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-slate-600">{t(stat.labelKey as any)}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
