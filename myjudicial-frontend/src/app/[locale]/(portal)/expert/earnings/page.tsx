"use client";

import { DollarSign, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EarningsSummary } from "@/features/experts/components/earnings-summary";
import { TransactionHistory } from "@/features/experts/components/transaction-history";
import { useEarnings } from "@/features/experts/hooks/useEarnings";

export default function EarningsPage() {
  const { data: earnings, isLoading, error } = useEarnings();

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Earnings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track your revenue, payouts, and transaction history
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load earnings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && earnings && (
        <div className="space-y-6">
          {/* Earnings Summary */}
          <EarningsSummary earnings={earnings} />

          {/* Payout Info */}
          <div className="rounded-lg border border-brand-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10">
                <DollarSign className="h-5 w-5 text-brand-blue" />
              </div>
              <div>
                <h2 className="font-semibold text-brand-dark">Completed Payouts</h2>
                <p className="text-sm text-slate-600">
                  Total payouts received: {earnings.completedPayouts}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-brand-dark">
              Recent Transactions
            </h2>
            <TransactionHistory earnings={earnings} />
          </div>
        </div>
      )}
    </div>
  );
}
