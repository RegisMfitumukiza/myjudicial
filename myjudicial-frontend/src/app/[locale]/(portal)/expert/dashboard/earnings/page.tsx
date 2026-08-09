"use client";

import { Wallet, Clock, ArrowUpRight, Loader2, AlertCircle } from "lucide-react";
import { useGetExpertsEarnings } from "@/api/generated";
import { useTranslations } from "next-intl";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function EarningsPage() {
  const t = useTranslations("expertDashboard_earnings");
  const { data, isLoading, isError } = useGetExpertsEarnings();
  const { isBookingFirst } = usePaymentMode();
  const earnings = data?.status === 200 ? data.data.data : null;

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <div className="mb-6 shrink-0">
        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      {isBookingFirst && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>Payments are currently disabled on the platform. Earnings and payouts will appear here once payments are re-enabled.</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : isError || !earnings ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          Failed to load earnings data. Please try again.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Wallet size={14} /> {t("netRevenue")}
              </div>
              <p className="mt-2 text-2xl font-bold text-brand-dark dark:text-gray-100">
                {formatCurrency(earnings.netRevenue, earnings.currency)}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {earnings.platformFees > 0 ? t("afterFees", { amount: formatCurrency(earnings.platformFees, earnings.currency) }) : t("afterNoFees")}
              </p>
            </div>
            <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Clock size={14} /> {t("pendingEscrow")}
              </div>
              <p className="mt-2 text-2xl font-bold text-brand-dark dark:text-gray-100">
                {formatCurrency(earnings.pendingEscrowBalance, earnings.currency)}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {t("heldFromBookings")}
              </p>
            </div>
            <div className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <ArrowUpRight size={14} /> {t("grossRevenue")}
              </div>
              <p className="mt-2 text-2xl font-bold text-brand-dark dark:text-gray-100">
                {formatCurrency(earnings.grossRevenue, earnings.currency)}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {t("completedBookings", { count: earnings.completedPayouts })}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-brand-border/20 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-brand-border/10 px-5 py-4 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-brand-dark dark:text-gray-100">{t("recentTransactions")}</h2>
            </div>
            {earnings.recentTransactions.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                {t("noTransactions")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-brand-border/10 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                      <th className="px-5 py-3">{t("booking")}</th>
                      <th className="px-5 py-3">{t("service")}</th>
                      <th className="px-5 py-3">{t("amount")}</th>
                      <th className="px-5 py-3">{t("completed")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.recentTransactions.map((tx) => (
                      <tr key={tx.bookingId} className="border-b border-brand-border/10 text-sm text-brand-dark last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800/50">
                        <td className="px-5 py-3 font-mono text-xs text-gray-400">
                          {tx.bookingId.slice(0, 8)}...
                        </td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{tx.serviceName}</td>
                        <td className="px-5 py-3 font-medium text-green-600">
                          +{formatCurrency(tx.amount, tx.currency)}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(tx.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
