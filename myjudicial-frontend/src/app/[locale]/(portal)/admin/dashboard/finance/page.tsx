"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { format } from "date-fns";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";

// Types
type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";
type EscrowStatus = "PENDING" | "LOCKED" | "HELD_IN_ESCROW" | "DISBURSED_TO_EXPERT" | "REFUNDED";

interface FinanceStats {
  revenue: {
    total: number;
    payouts: number;
    platformFees: number;
  };
  payments: {
    pending: number;
    paid: number;
    failed: number;
    refunded: number;
  };
  escrow: {
    holds: number;
    disbursed: number;
    refunded: number;
  };
}

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  platformFee: number;
  expertPayout: number;
  txRef: string;
  providerTransactionId: string | null;
  providerPayoutRef: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  payoutSentAt: string | null;
  createdAt: string;
  citizen: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  expert: {
    id: string;
    displayName: string;
    momoNumber: string | null;
  };
}

interface EscrowLedger {
  id: string;
  roomId: string;
  bookingId: string;
  lawyerWalletPhone: string | null;
  totalFeeRwf: number;
  status: EscrowStatus;
  createdAt: string;
  settledAt: string | null;
  citizen: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  expert: {
    id: string;
    displayName: string;
    momoNumber: string | null;
  };
}

interface FailedSettlement {
  id: string;
  bookingId: string;
  amount: number;
  expertPayout: number;
  txRef: string;
  providerTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
  citizen: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  expert: {
    id: string;
    displayName: string;
    momoNumber: string | null;
  };
}

interface PaymentsResponse {
  data: {
    payments: Payment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface EscrowResponse {
  data: {
    ledgers: EscrowLedger[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// API functions
const fetchStats = async (): Promise<{ data: FinanceStats }> => {
  return apiFetch("/admin/finance/stats");
};

const fetchPayments = async (params: {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  search?: string;
}): Promise<PaymentsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.status) queryParams.append("status", params.status);
  if (params.search) queryParams.append("search", params.search);

  return apiFetch(`/admin/finance/payments?${queryParams.toString()}`);
};

interface FailedSettlementsResponse {
  data: {
    payments: FailedSettlement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

const fetchFailedSettlements = async (page: number, limit: number): Promise<FailedSettlementsResponse> => {
  return apiFetch(`/admin/finance/failed-settlements?page=${page}&limit=${limit}`);
};

const retryPayout = async (bookingId: string, reason: string) => {
  return apiFetch("/admin/finance/retry-payout", { method: "POST", body: { bookingId, reason } });
};

// Helper functions
const getPaymentStatusBadge = (status: PaymentStatus) => {
  const configs: Record<PaymentStatus, { color: string; icon: any; label: string }> = {
    PENDING: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock, label: "Pending" },
    AUTHORIZED: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle, label: "Authorized" },
    PAID: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle, label: "Paid" },
    FAILED: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle, label: "Failed" },
    REFUNDED: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: RefreshCw, label: "Refunded" },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const getEscrowStatusBadge = (status: EscrowStatus) => {
  const configs: Record<EscrowStatus, { color: string; label: string }> = {
    PENDING: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", label: "Pending" },
    LOCKED: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Locked" },
    HELD_IN_ESCROW: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Held" },
    DISBURSED_TO_EXPERT: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Disbursed" },
    REFUNDED: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Refunded" },
  };

  const config = configs[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const formatCurrency = (amount: number, currency: string = "RWF") => {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "MMM dd, yyyy HH:mm");
  } catch {
    return dateString;
  }
};

export default function FinancePage() {
  const queryClient = useQueryClient();
  const { isBookingFirst, isLoading: paymentModeLoading } = usePaymentMode();
  const [activeTab, setActiveTab] = useState<"payments" | "escrow" | "failed">("payments");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [selectedPayment, setSelectedPayment] = useState<FailedSettlement | null>(null);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [retryReason, setRetryReason] = useState("");

  // Fetch stats
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-finance-stats"],
    queryFn: fetchStats,
  });

  // Fetch payments
  const { data: paymentsData, isLoading: loadingPayments, error: paymentsError } = useQuery({
    queryKey: ["admin-finance-payments", page, searchQuery, statusFilter],
    queryFn: () =>
      fetchPayments({
        page,
        limit: 20,
        search: searchQuery || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      }),
    enabled: activeTab === "payments",
  });

  // Fetch failed settlements
  const { data: failedData, isLoading: loadingFailed, error: failedError } = useQuery({
    queryKey: ["admin-finance-failed", page],
    queryFn: () => fetchFailedSettlements(page, 20),
    enabled: activeTab === "failed",
  });

  // Retry payout mutation
  const retryMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      retryPayout(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-finance-failed"] });
      queryClient.invalidateQueries({ queryKey: ["admin-finance-stats"] });
      setShowRetryModal(false);
      setRetryReason("");
      setSelectedPayment(null);
    },
  });

  const stats = statsData?.data;
  const payments = paymentsData?.data?.payments ?? [];
  const paymentsPagination = paymentsData?.data?.pagination;
  const failedPayments = failedData?.data?.payments ?? [];
  const failedPagination = failedData?.data?.pagination;

  const handleRetryPayout = (payment: FailedSettlement) => {
    setSelectedPayment(payment);
    setShowRetryModal(true);
  };

  const confirmRetry = () => {
    if (!selectedPayment || !retryReason.trim()) return;
    retryMutation.mutate({
      bookingId: selectedPayment.bookingId,
      reason: retryReason,
    });
  };

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading finance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Finance & Payments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Payment tracking, escrow management, and settlements</p>
      </div>

      {/* Payment mode notice */}
      {(isBookingFirst || paymentModeLoading) && (
        <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-6 shadow-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-brand-blue mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Payments are currently disabled
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Mobile Money is disabled in booking-first mode. No payments or escrow records exist yet. This page will become active once the payment mode is re-enabled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <DollarSign size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(stats.revenue.total)}
            </p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <TrendingUp size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(stats.revenue.payouts)}
            </p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Expert Payouts</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/10 text-purple-600">
              <TrendingDown size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(stats.revenue.platformFees)}
            </p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Platform Fees</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-600/10 text-yellow-600">
              <Clock size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.payments.pending}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Pending</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
              <CheckCircle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.escrow.holds}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Escrow Holds</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 text-red-600">
              <AlertCircle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.payments.failed}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Failed</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border">
        <button
          onClick={() => {
            setActiveTab("payments");
            setPage(1);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "payments"
              ? "border-b-2 border-brand-blue text-brand-blue"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          All Payments
        </button>
        <button
          onClick={() => {
            setActiveTab("failed");
            setPage(1);
          }}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "failed"
              ? "border-b-2 border-brand-blue text-brand-blue"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          Failed Settlements
          {stats && stats.payments.failed > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {stats.payments.failed}
            </span>
          )}
        </button>
      </div>

      {/* Filters (for payments tab) */}
      {activeTab === "payments" && (
        <div className="flex flex-col gap-4 rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-4 shadow-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by transaction ref, name..."
              className="flex-1 border-0 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter size={16} className="text-gray-400" />
            <select
              className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(1);
              }}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>
      )}

      {/* Payments Table */}
      {activeTab === "payments" && (
        <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 shadow-md">
          {loadingPayments ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
          ) : paymentsError ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <p className="mt-2 text-sm text-gray-900 dark:text-gray-100">Failed to load payments</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-border/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="px-6 py-4">Transaction</th>
                      <th className="px-6 py-4">Citizen</th>
                      <th className="px-6 py-4">Expert</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Platform Fee</th>
                      <th className="px-6 py-4">Expert Payout</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Paid At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/10">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <p className="text-sm text-gray-500 dark:text-gray-400">No payments found</p>
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment.id} className="transition-colors hover:bg-brand-canvas dark:hover:bg-gray-800">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{payment.txRef}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {payment.providerTransactionId || "—"}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {payment.citizen.firstName} {payment.citizen.lastName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{payment.citizen.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-900 dark:text-gray-100">{payment.expert.displayName}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(payment.amount, payment.currency)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-700 dark:text-gray-300">
                              {formatCurrency(payment.platformFee, payment.currency)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-700 dark:text-gray-300">
                              {formatCurrency(payment.expertPayout, payment.currency)}
                            </p>
                          </td>
                          <td className="px-6 py-4">{getPaymentStatusBadge(payment.status)}</td>
                          <td className="px-6 py-4">
                            <span className="text-gray-700 dark:text-gray-300">{formatDate(payment.paidAt)}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {paymentsPagination && paymentsPagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-brand-border/10 px-6 py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page {paymentsPagination.page} of {paymentsPagination.totalPages} (
                    {paymentsPagination.total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === paymentsPagination.totalPages}
                      className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Failed Settlements Table */}
      {activeTab === "failed" && (
        <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 shadow-md">
          {loadingFailed ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
            </div>
          ) : failedError ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <p className="mt-2 text-sm text-gray-900 dark:text-gray-100">Failed to load settlements</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-brand-border/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="px-6 py-4">Booking</th>
                      <th className="px-6 py-4">Expert</th>
                      <th className="px-6 py-4">Citizen</th>
                      <th className="px-6 py-4">Payout Amount</th>
                      <th className="px-6 py-4">MoMo Number</th>
                      <th className="px-6 py-4">Last Attempt</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/10">
                    {failedPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircle size={48} className="text-green-500" />
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              No failed settlements
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              All payouts have been processed successfully
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      failedPayments.map((payment) => (
                        <tr key={payment.id} className="transition-colors hover:bg-brand-canvas dark:hover:bg-gray-800">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {payment.bookingId.substring(0, 8)}...
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{payment.txRef}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {payment.expert.displayName}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-gray-900 dark:text-gray-100">
                                {payment.citizen.firstName} {payment.citizen.lastName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{payment.citizen.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(payment.expertPayout)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-700 dark:text-gray-300">
                              {payment.expert.momoNumber || (
                                <span className="text-red-600 dark:text-red-400">Not set</span>
                              )}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-700 dark:text-gray-300">{formatDate(payment.updatedAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleRetryPayout(payment)}
                              disabled={!payment.expert.momoNumber || retryMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
                            >
                              <RefreshCw size={14} />
                              Retry Payout
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {failedPagination && failedPagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-brand-border/10 px-6 py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page {failedPagination.page} of {failedPagination.totalPages} ({failedPagination.total}{" "}
                    total)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === failedPagination.totalPages}
                      className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Retry Payout Modal */}
      {showRetryModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Retry Payout</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Retry payout for <span className="font-medium">{selectedPayment.expert.displayName}</span> (
              {formatCurrency(selectedPayment.expertPayout)})
            </p>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason for retry *
              </label>
              <textarea
                className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
                rows={4}
                placeholder="Explain why the payout is being retried..."
                value={retryReason}
                onChange={(e) => setRetryReason(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 10 characters required</p>
            </div>

            {!selectedPayment.expert.momoNumber && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-400">
                  Expert has no MoMo number set. Payout will fail unless number is added.
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRetryModal(false);
                  setRetryReason("");
                  setSelectedPayment(null);
                }}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmRetry}
                disabled={retryReason.trim().length < 10 || retryMutation.isPending || !selectedPayment.expert.momoNumber}
                className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
              >
                {retryMutation.isPending ? "Retrying..." : "Retry Payout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
