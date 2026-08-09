"use client";

import { format } from "date-fns";
import { CheckCircle, Clock } from "lucide-react";
import type { ExpertEarnings } from "../hooks/useEarnings";
import { useTranslations } from "next-intl";

interface TransactionHistoryProps {
  earnings: ExpertEarnings;
}

export function TransactionHistory({ earnings }: TransactionHistoryProps) {
  const t = useTranslations("experts");
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: earnings.currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (earnings.recentTransactions.length === 0) {
    return (
      <div className="rounded-lg border border-brand-border bg-white p-8 text-center">
        <p className="text-sm text-slate-600">{t("transactions.noTransactions")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-brand-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                {t("transactions.service")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                {t("transactions.amount")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                {t("transactions.date")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                {t("transactions.status")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {earnings.recentTransactions.map((transaction) => (
              <tr key={transaction.bookingId} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm text-brand-dark">
                  {transaction.serviceName}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-brand-dark">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                  {transaction.completedAt
                    ? format(new Date(transaction.completedAt), "MMM d, yyyy")
                    : t("transactions.pending")}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {transaction.completedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <CheckCircle className="h-3 w-3" />
                      {t("transactions.completed")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      <Clock className="h-3 w-3" />
                      {t("transactions.pending")}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
