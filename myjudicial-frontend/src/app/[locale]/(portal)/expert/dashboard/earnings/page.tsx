"use client";

import { Wallet, Clock, ArrowUpRight, AlertCircle } from "lucide-react";
import { useGetExpertsEarnings } from "@/api/generated";
import { useTranslations } from "next-intl";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";
import {
  PageHeader,
  StatCard,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "@/shared/components/dashboard";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";

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
  const { data, isLoading, isError, refetch } = useGetExpertsEarnings();
  const { isBookingFirst } = usePaymentMode();
  const earnings = data?.status === 200 ? data.data.data : null;

  return (
    <div className="flex h-full flex-col p-6 lg:p-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        className="mb-6 shrink-0"
      />

      {isBookingFirst && (
        <Alert variant="warning" className="mb-6">
          <AlertCircle />
          <AlertDescription>
            Payments are currently disabled on the platform. Earnings and payouts will appear here once payments are re-enabled.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <LoadingSpinner className="flex-1" />
      ) : isError || !earnings ? (
        <ErrorState
          message="Failed to load earnings data. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label={t("netRevenue")}
              value={formatCurrency(earnings.netRevenue, earnings.currency)}
              hint={
                earnings.platformFees > 0
                  ? t("afterFees", { amount: formatCurrency(earnings.platformFees, earnings.currency) })
                  : t("afterNoFees")
              }
              icon={Wallet}
            />
            <StatCard
              label={t("pendingEscrow")}
              value={formatCurrency(earnings.pendingEscrowBalance, earnings.currency)}
              hint={t("heldFromBookings")}
              icon={Clock}
            />
            <StatCard
              label={t("grossRevenue")}
              value={formatCurrency(earnings.grossRevenue, earnings.currency)}
              hint={t("completedBookings", { count: earnings.completedPayouts })}
              icon={ArrowUpRight}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">{t("recentTransactions")}</h2>
            </div>
            {earnings.recentTransactions.length === 0 ? (
              <EmptyState
                icon={Clock}
                title={t("noTransactions")}
                className="border-0 bg-transparent"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3">{t("booking")}</th>
                      <th className="px-5 py-3">{t("service")}</th>
                      <th className="px-5 py-3">{t("amount")}</th>
                      <th className="px-5 py-3">{t("completed")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {earnings.recentTransactions.map((tx) => (
                      <tr key={tx.bookingId} className="text-sm transition-colors hover:bg-muted/50">
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                          {tx.bookingId.slice(0, 8)}...
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{tx.serviceName}</td>
                        <td className="px-5 py-3 font-medium tabular-nums text-primary">
                          +{formatCurrency(tx.amount, tx.currency)}
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
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
