"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Search,
  RefreshCw,
  Clock,
  Lock,
  Download,
  RotateCcw,
  ExternalLink,
  Eye,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  User,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge, type StatusTone } from "@/shared/components/dashboard/status-badge";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { EmptyState } from "@/shared/components/dashboard/empty-state";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/components/ui/sheet";
import { Textarea } from "@/shared/components/ui/textarea";
import { Link } from "@/i18n/routing";

type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";
type EscrowStatus = "HELD_IN_ESCROW" | "DISBURSED_TO_EXPERT" | "REFUNDED";

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
    contactPhone?: string | null;
    payoutPhone?: string | null;
    isPayoutFallback?: boolean;
    payoutProvider?: string | null;
  };
}

interface EscrowLedgerItem {
  id: string;
  roomId: string;
  bookingId: string;
  lawyerWalletPhone: string;
  totalFee: number;
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
    contactPhone?: string | null;
    payoutPhone?: string | null;
    isPayoutFallback?: boolean;
    payoutProvider?: string | null;
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
    contactPhone?: string | null;
    payoutPhone?: string | null;
    isPayoutFallback?: boolean;
    payoutProvider?: string | null;
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
    ledgers: EscrowLedgerItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

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

const fetchStats = async (fromDate?: string, toDate?: string): Promise<{ data: FinanceStats }> => {
  const queryParams = new URLSearchParams();
  if (fromDate) queryParams.append("fromDate", fromDate);
  if (toDate) queryParams.append("toDate", toDate);
  const q = queryParams.toString();
  return apiFetch(`/admin/finance/stats${q ? `?${q}` : ""}`);
};

const fetchPayments = async (params: {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<PaymentsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.status) queryParams.append("status", params.status);
  if (params.search) queryParams.append("search", params.search);
  if (params.fromDate) queryParams.append("fromDate", params.fromDate);
  if (params.toDate) queryParams.append("toDate", params.toDate);
  return apiFetch(`/admin/finance/payments?${queryParams.toString()}`);
};

const fetchEscrow = async (params: {
  page?: number;
  limit?: number;
  status?: EscrowStatus;
  search?: string;
}): Promise<EscrowResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.status) queryParams.append("status", params.status);
  if (params.search) queryParams.append("search", params.search);
  return apiFetch(`/admin/finance/escrow?${queryParams.toString()}`);
};

const fetchFailedSettlements = async (page: number, limit: number): Promise<FailedSettlementsResponse> => {
  return apiFetch(`/admin/finance/failed-settlements?page=${page}&limit=${limit}`);
};

const retryPayout = async (bookingId: string, reason: string) => {
  return apiFetch("/admin/finance/retry-payout", { method: "POST", body: { bookingId, reason } });
};

const PAYMENT_STATUS_TONE: Record<PaymentStatus, StatusTone> = {
  PENDING: "pending",
  AUTHORIZED: "active",
  PAID: "success",
  FAILED: "destructive",
  REFUNDED: "neutral",
};

const ESCROW_STATUS_TONE: Record<EscrowStatus, StatusTone> = {
  HELD_IN_ESCROW: "pending",
  DISBURSED_TO_EXPERT: "success",
  REFUNDED: "neutral",
};

export default function FinancePage() {
  const t = useTranslations("admin.finance");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { isBookingFirst, isLoading: paymentModeLoading } = usePaymentMode();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"payments" | "escrow" | "failed">("payments");

  // Payments Tab State
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Escrow Tab State
  const [escrowPage, setEscrowPage] = useState(1);
  const [escrowSearch, setEscrowSearch] = useState("");
  const [escrowStatusFilter, setEscrowStatusFilter] = useState<EscrowStatus | "ALL">("ALL");
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowLedgerItem | null>(null);

  // Failed Settlements State
  const [failedPage, setFailedPage] = useState(1);
  const [selectedFailedSettlement, setSelectedFailedSettlement] = useState<FailedSettlement | null>(null);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [retryReason, setRetryReason] = useState("");

  const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    PENDING: t("pending"),
    AUTHORIZED: t("authorized"),
    PAID: t("paid"),
    FAILED: t("failed"),
    REFUNDED: t("refunded"),
  };

  const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
    HELD_IN_ESCROW: t("heldInEscrow"),
    DISBURSED_TO_EXPERT: t("disbursedToExpert"),
    REFUNDED: t("refunded"),
  };

  const formatCurrency = (amount: number, currency: string = "RWF") => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Queries
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-finance-stats", fromDate, toDate],
    queryFn: () =>
      fetchStats(
        fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
        toDate ? `${toDate}T23:59:59.999Z` : undefined
      ),
  });

  const {
    data: paymentsData,
    isLoading: loadingPayments,
    error: paymentsError,
  } = useQuery({
    queryKey: ["admin-finance-payments", paymentsPage, searchQuery, statusFilter, fromDate, toDate],
    queryFn: () =>
      fetchPayments({
        page: paymentsPage,
        limit: 20,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        fromDate: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
        toDate: toDate ? `${toDate}T23:59:59.999Z` : undefined,
      }),
    enabled: activeTab === "payments",
  });

  const {
    data: escrowData,
    isLoading: loadingEscrow,
    error: escrowError,
  } = useQuery({
    queryKey: ["admin-finance-escrow", escrowPage, escrowSearch, escrowStatusFilter],
    queryFn: () =>
      fetchEscrow({
        page: escrowPage,
        limit: 20,
        search: escrowSearch.trim() || undefined,
        status: escrowStatusFilter !== "ALL" ? escrowStatusFilter : undefined,
      }),
    enabled: activeTab === "escrow",
  });

  const {
    data: failedData,
    isLoading: loadingFailed,
    error: failedError,
  } = useQuery({
    queryKey: ["admin-finance-failed", failedPage],
    queryFn: () => fetchFailedSettlements(failedPage, 20),
    enabled: activeTab === "failed",
  });

  const retryMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      retryPayout(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-finance-failed"] });
      queryClient.invalidateQueries({ queryKey: ["admin-finance-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-finance-payments"] });
      setShowRetryModal(false);
      setRetryReason("");
      setSelectedFailedSettlement(null);
    },
  });

  const stats = statsData?.data;
  const payments = paymentsData?.data?.payments ?? [];
  const paymentsPagination = paymentsData?.data?.pagination;
  const ledgers = escrowData?.data?.ledgers ?? [];
  const escrowPagination = escrowData?.data?.pagination;
  const failedPayments = failedData?.data?.payments ?? [];
  const failedPagination = failedData?.data?.pagination;

  const handleRetryPayout = (payment: FailedSettlement) => {
    setSelectedFailedSettlement(payment);
    setShowRetryModal(true);
  };

  const confirmRetry = () => {
    if (!selectedFailedSettlement || !retryReason.trim()) return;
    retryMutation.mutate({
      bookingId: selectedFailedSettlement.bookingId,
      reason: retryReason,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
    setPaymentsPage(1);
  };

  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const res = await fetchPayments({
        limit: 1000,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        fromDate: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
        toDate: toDate ? `${toDate}T23:59:59.999Z` : undefined,
      });

      const items = res.data.payments;
      if (!items || items.length === 0) return;

      const headers = [
        "Transaction Ref",
        "Provider Tx ID",
        "Booking ID",
        "Citizen Name",
        "Citizen Email",
        "Expert Name",
        "MoMo Number",
        "Amount (RWF)",
        "Platform Fee (RWF)",
        "Expert Payout (RWF)",
        "Status",
        "Paid At",
        "Created At",
      ];

      const csvRows = [
        headers.join(","),
        ...items.map((p) =>
          [
            `"${p.txRef}"`,
            `"${p.providerTransactionId ?? ""}"`,
            `"${p.bookingId}"`,
            `"${p.citizen.firstName} ${p.citizen.lastName}"`,
            `"${p.citizen.email}"`,
            `"${p.expert.displayName}"`,
            `"${p.expert.momoNumber ?? ""}"`,
            p.amount,
            p.platformFee,
            p.expertPayout,
            p.status,
            `"${p.paidAt ?? ""}"`,
            `"${p.createdAt}"`,
          ].join(",")
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `myjudicial_finance_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export finance CSV", err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  if (loadingStats) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <LoadingSpinner label={t("loading")} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      {(isBookingFirst || paymentModeLoading) && (
        <Card>
          <CardContent className="flex items-start gap-3 pt-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Payments are currently disabled
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mobile Money is disabled in booking-first mode. No payments or escrow records exist yet. This page will become active once the payment mode is re-enabled.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responsive Stat Cards: Single column on small devices, 3 columns on mid-range tablets (1026px), 6 columns on large desktops */}
      {stats && (
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            label={t("totalRevenue")}
            value={formatCurrency(stats.revenue.total)}
            icon={DollarSign}
          />
          <StatCard
            label={t("expertPayouts")}
            value={formatCurrency(stats.revenue.payouts)}
            icon={TrendingUp}
          />
          <StatCard
            label={t("platformFees")}
            value={formatCurrency(stats.revenue.platformFees)}
            icon={TrendingDown}
          />
          <StatCard
            label={t("pending")}
            value={stats.payments.pending}
            icon={Clock}
          />
          <StatCard
            label={t("escrowHolds")}
            value={stats.escrow.holds}
            icon={Lock}
          />
          <StatCard
            label={t("failed")}
            value={stats.payments.failed}
            icon={AlertCircle}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as "payments" | "escrow" | "failed");
        }}
      >
        <TabsList variant="line" className="w-full justify-start overflow-x-auto scrollbar-none border-b border-border">
          <TabsTrigger value="payments">{t("allPayments")}</TabsTrigger>
          <TabsTrigger value="escrow">{t("escrowLedger")}</TabsTrigger>
          <TabsTrigger value="failed">
            {t("failedSettlements")}
            {stats && stats.payments.failed > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                {stats.payments.failed}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: ALL PAYMENTS ─── */}
        <TabsContent value="payments" className="mt-6">
          {activeTab === "payments" && (
            <div className="space-y-6">
              {/* Comprehensive Filter Bar */}
              <Card>
                <CardContent className="flex flex-col gap-3.5 p-3.5 sm:p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Search */}
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background/50 px-3 py-1.5 focus-within:ring-1 focus-within:ring-ring">
                      <Search size={16} className="text-muted-foreground shrink-0" />
                      <Input
                        placeholder={t("searchPlaceholder")}
                        className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPaymentsPage(1);
                        }}
                      />
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Status Filter */}
                      <Select
                        value={statusFilter}
                        onValueChange={(v) => {
                          setStatusFilter(v as PaymentStatus | "ALL");
                          setPaymentsPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[140px] sm:w-[160px] h-9">
                          <SelectValue placeholder={t("allStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">{t("allStatus")}</SelectItem>
                          <SelectItem value="PENDING">{t("pending")}</SelectItem>
                          <SelectItem value="AUTHORIZED">{t("authorized")}</SelectItem>
                          <SelectItem value="PAID">{t("paid")}</SelectItem>
                          <SelectItem value="FAILED">{t("failed")}</SelectItem>
                          <SelectItem value="REFUNDED">{t("refunded")}</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Date Range From */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground whitespace-nowrap">{t("dateFrom")}:</span>
                        <Input
                          type="date"
                          value={fromDate}
                          onChange={(e) => {
                            setFromDate(e.target.value);
                            setPaymentsPage(1);
                          }}
                          className="h-9 w-[130px] sm:w-[140px] text-xs"
                        />
                      </div>

                      {/* Date Range To */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground whitespace-nowrap">{t("dateTo")}:</span>
                        <Input
                          type="date"
                          value={toDate}
                          onChange={(e) => {
                            setToDate(e.target.value);
                            setPaymentsPage(1);
                          }}
                          className="h-9 w-[130px] sm:w-[140px] text-xs"
                        />
                      </div>

                      {/* Clear Filters */}
                      {(searchQuery || statusFilter !== "ALL" || fromDate || toDate) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearFilters}
                          className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                          title={t("clearFilters")}
                        >
                          <RotateCcw className="mr-1 h-3.5 w-3.5" />
                          {t("clearFilters")}
                        </Button>
                      )}

                      {/* Export CSV */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCsv}
                        disabled={isExportingCsv || payments.length === 0}
                        className="h-9 gap-1.5 text-xs"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {isExportingCsv ? t("loading") : t("exportCsv")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payments Table */}
              <Card>
                {loadingPayments ? (
                  <LoadingSpinner label={t("loading")} />
                ) : paymentsError ? (
                  <ErrorState
                    title={t("failedToLoad")}
                    onRetry={() => queryClient.invalidateQueries({ queryKey: ["admin-finance-payments"] })}
                  />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-4">{t("transaction")}</th>
                            <th className="px-6 py-4">{t("citizen")}</th>
                            <th className="px-6 py-4">{t("expert")}</th>
                            <th className="px-6 py-4">{t("amount")}</th>
                            <th className="px-6 py-4">{t("platformFee")}</th>
                            <th className="px-6 py-4">{t("expertPayout")}</th>
                            <th className="px-6 py-4">{t("status")}</th>
                            <th className="px-6 py-4">{t("paidAt")}</th>
                            <th className="px-6 py-4 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={9}>
                                <EmptyState
                                  icon={DollarSign}
                                  title={t("noPayments")}
                                />
                              </td>
                            </tr>
                          ) : (
                            payments.map((payment) => (
                              <tr
                                key={payment.id}
                                className="group transition-colors hover:bg-muted/50 cursor-pointer"
                                onClick={() => setSelectedPayment(payment)}
                              >
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-mono text-xs font-medium text-foreground">{payment.txRef}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {payment.providerTransactionId || "—"}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {payment.citizen.firstName} {payment.citizen.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{payment.citizen.email}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-medium text-foreground">{payment.expert.displayName}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-foreground">
                                    {formatCurrency(payment.amount, payment.currency)}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-muted-foreground">
                                    {formatCurrency(payment.platformFee, payment.currency)}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-muted-foreground">
                                    {formatCurrency(payment.expertPayout, payment.currency)}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  <StatusBadge tone={PAYMENT_STATUS_TONE[payment.status]}>
                                    {PAYMENT_STATUS_LABELS[payment.status]}
                                  </StatusBadge>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs text-muted-foreground">{formatDate(payment.paidAt)}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPayment(payment);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span className="sr-only">{t("paymentDetails")}</span>
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {paymentsPagination && paymentsPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-border px-6 py-4">
                        <p className="text-sm text-muted-foreground">
                          Page {paymentsPagination.page} / {paymentsPagination.totalPages} (
                          {paymentsPagination.total})
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentsPage(paymentsPage - 1)}
                            disabled={paymentsPage === 1}
                          >
                            ←
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentsPage(paymentsPage + 1)}
                            disabled={paymentsPage === paymentsPagination.totalPages}
                          >
                            →
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 2: ESCROW LEDGER ─── */}
        <TabsContent value="escrow" className="mt-6">
          {activeTab === "escrow" && (
            <div className="space-y-6">
              {/* Escrow Filter Bar */}
              <Card>
                <CardContent className="flex flex-col gap-3.5 p-3.5 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background/50 px-3 py-1.5 focus-within:ring-1 focus-within:ring-ring">
                    <Search size={16} className="text-muted-foreground shrink-0" />
                    <Input
                      placeholder={t("searchPlaceholder")}
                      className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                      value={escrowSearch}
                      onChange={(e) => {
                        setEscrowSearch(e.target.value);
                        setEscrowPage(1);
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Select
                      value={escrowStatusFilter}
                      onValueChange={(v) => {
                        setEscrowStatusFilter(v as EscrowStatus | "ALL");
                        setEscrowPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder={t("allStatus")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">{t("allStatus")}</SelectItem>
                        <SelectItem value="HELD_IN_ESCROW">{t("heldInEscrow")}</SelectItem>
                        <SelectItem value="DISBURSED_TO_EXPERT">{t("disbursedToExpert")}</SelectItem>
                        <SelectItem value="REFUNDED">{t("refunded")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Escrow Table */}
              <Card>
                {loadingEscrow ? (
                  <LoadingSpinner label={t("loading")} />
                ) : escrowError ? (
                  <ErrorState
                    title={t("failedToLoad")}
                    onRetry={() => queryClient.invalidateQueries({ queryKey: ["admin-finance-escrow"] })}
                  />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-4">{t("roomId")}</th>
                            <th className="px-6 py-4">{t("booking")}</th>
                            <th className="px-6 py-4">{t("citizen")}</th>
                            <th className="px-6 py-4">{t("expert")}</th>
                            <th className="px-6 py-4">{t("lawyerWallet")}</th>
                            <th className="px-6 py-4">{t("amount")}</th>
                            <th className="px-6 py-4">{t("status")}</th>
                            <th className="px-6 py-4">{t("settledAt")}</th>
                            <th className="px-6 py-4 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {ledgers.length === 0 ? (
                            <tr>
                              <td colSpan={9}>
                                <EmptyState
                                  icon={Lock}
                                  title={t("noEscrow")}
                                />
                              </td>
                            </tr>
                          ) : (
                            ledgers.map((ledger) => (
                              <tr
                                key={ledger.id}
                                className="group transition-colors hover:bg-muted/50 cursor-pointer"
                                onClick={() => setSelectedEscrow(ledger)}
                              >
                                <td className="px-6 py-4">
                                  <p className="font-mono text-xs font-medium text-foreground">
                                    {ledger.roomId.length > 12 ? `${ledger.roomId.slice(0, 10)}...` : ledger.roomId}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  <Link
                                    href={`/admin/dashboard/bookings?search=${ledger.bookingId}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
                                  >
                                    {ledger.bookingId.slice(0, 8)}...
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {ledger.citizen.firstName} {ledger.citizen.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{ledger.citizen.email}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-medium text-foreground">{ledger.expert.displayName}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {ledger.lawyerWalletPhone || "—"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-foreground">{formatCurrency(ledger.totalFee)}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <StatusBadge tone={ESCROW_STATUS_TONE[ledger.status]}>
                                    {ESCROW_STATUS_LABELS[ledger.status]}
                                  </StatusBadge>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs text-muted-foreground">{formatDate(ledger.settledAt)}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEscrow(ledger);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span className="sr-only">{t("paymentDetails")}</span>
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {escrowPagination && escrowPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-border px-6 py-4">
                        <p className="text-sm text-muted-foreground">
                          Page {escrowPagination.page} / {escrowPagination.totalPages} ({escrowPagination.total})
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEscrowPage(escrowPage - 1)}
                            disabled={escrowPage === 1}
                          >
                            ←
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEscrowPage(escrowPage + 1)}
                            disabled={escrowPage === escrowPagination.totalPages}
                          >
                            →
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ─── TAB 3: FAILED SETTLEMENTS (TIER 2 MANUAL FALLBACK) ─── */}
        <TabsContent value="failed" className="mt-6">
          {activeTab === "failed" && (
            <div className="space-y-6">
              {/* Automated Retry Explanation Banner */}
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
                <CardContent className="flex items-start gap-3 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="text-xs sm:text-sm">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      Two-Tier Settlement Protection Active
                    </p>
                    <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                      Transient network or gateway errors are automatically retried every 15 minutes up to 3 times by background workers. Bookings listed below require administrative intervention (e.g., missing expert MoMo number or float limits). Once resolved, trigger manual settlement with an audit note.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                {loadingFailed ? (
                  <LoadingSpinner label={t("loading")} />
                ) : failedError ? (
                  <ErrorState
                    title={t("failedToLoadSettlements")}
                    onRetry={() => queryClient.invalidateQueries({ queryKey: ["admin-finance-failed"] })}
                  />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="px-6 py-4">{t("booking")}</th>
                            <th className="px-6 py-4">{t("expert")}</th>
                            <th className="px-6 py-4">{t("citizen")}</th>
                            <th className="px-6 py-4">{t("expertPayout")}</th>
                            <th className="px-6 py-4">{t("momoNumber")}</th>
                            <th className="px-6 py-4">{t("lastAttempt")}</th>
                            <th className="px-6 py-4 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {failedPayments.length === 0 ? (
                            <tr>
                              <td colSpan={7}>
                                <EmptyState
                                  icon={RefreshCw}
                                  title={t("noFailed")}
                                  description={t("allProcessed")}
                                />
                              </td>
                            </tr>
                          ) : (
                            failedPayments.map((payment) => (
                              <tr key={payment.id} className="transition-colors hover:bg-muted/50">
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {payment.bookingId.substring(0, 8)}...
                                    </p>
                                    <p className="font-mono text-xs text-muted-foreground">{payment.txRef}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-medium text-foreground">
                                    {payment.expert.displayName}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="text-foreground">
                                      {payment.citizen.firstName} {payment.citizen.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{payment.citizen.email}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-foreground">
                                    {formatCurrency(payment.expertPayout)}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  {payment.expert.payoutPhone || payment.expert.momoNumber ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono text-xs text-foreground font-medium">
                                        {payment.expert.payoutPhone || payment.expert.momoNumber}
                                      </span>
                                      {payment.expert.isPayoutFallback ? (
                                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                          Fallback
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                          {payment.expert.payoutProvider || "MTN"}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                                      <AlertCircle className="h-3.5 w-3.5" />
                                      {t("noMoMo")}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-xs text-muted-foreground">{formatDate(payment.updatedAt)}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleRetryPayout(payment)}
                                    disabled={(!payment.expert.payoutPhone && !payment.expert.momoNumber) || retryMutation.isPending}
                                  >
                                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${retryMutation.isPending ? "animate-spin" : ""}`} />
                                    {t("retryPayout")}
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {failedPagination && failedPagination.totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-border px-6 py-4">
                        <p className="text-sm text-muted-foreground">
                          Page {failedPagination.page} / {failedPagination.totalPages} ({failedPagination.total})
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFailedPage(failedPage - 1)}
                            disabled={failedPage === 1}
                          >
                            ←
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFailedPage(failedPage + 1)}
                            disabled={failedPage === failedPagination.totalPages}
                          >
                            →
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── PAYMENT DETAILS DRAWER (SHEET) ─── */}
      <Sheet open={Boolean(selectedPayment)} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto p-0">
          {selectedPayment && (
            <div className="space-y-6 p-6">
              <SheetHeader className="p-0 border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <StatusBadge tone={PAYMENT_STATUS_TONE[selectedPayment.status]}>
                    {PAYMENT_STATUS_LABELS[selectedPayment.status]}
                  </StatusBadge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDate(selectedPayment.createdAt)}
                  </span>
                </div>
                <SheetTitle className="text-lg font-bold mt-2">
                  {selectedPayment.txRef}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {t("paymentDetails")}
                </SheetDescription>
              </SheetHeader>

              {/* Financial Breakdown */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("breakdown")}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("amount")} (100%)</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{t("platformFee")} (15%)</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(selectedPayment.platformFee, selectedPayment.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{t("expertPayout")} (85%)</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(selectedPayment.expertPayout, selectedPayment.currency)}
                  </span>
                </div>
              </div>

              {/* Client & Expert Information */}
              <div className="space-y-4">
                <div className="rounded-xl border border-border p-3.5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {t("clientContact")}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedPayment.citizen.firstName} {selectedPayment.citizen.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3 w-3" />
                    {selectedPayment.citizen.email}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-3.5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    {t("expertContact")}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedPayment.expert.displayName}
                  </p>
                  {selectedPayment.expert.contactPhone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      <span>{selectedPayment.expert.contactPhone}</span>
                      <span className="text-[10px] text-muted-foreground/70 font-mono">(Contact Phone)</span>
                    </p>
                  )}
                  <div className="text-xs flex items-center gap-1.5 pt-0.5">
                    <CreditCard className="h-3 w-3 text-primary shrink-0" />
                    {selectedPayment.expert.payoutPhone || selectedPayment.expert.momoNumber ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-foreground font-medium">
                          {selectedPayment.expert.payoutPhone || selectedPayment.expert.momoNumber}
                        </span>
                        {selectedPayment.expert.isPayoutFallback ? (
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Account Phone Fallback
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {selectedPayment.expert.payoutProvider || "MTN"} MoMo
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-destructive font-medium">{t("noMoMo")}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Gateway & Settlement Audit Trail */}
              <div className="rounded-xl border border-border p-3.5 space-y-2.5 text-xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Audit Traceability
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("gatewayRef")}:</span>
                  <span className="font-mono text-foreground font-medium">
                    {selectedPayment.providerTransactionId || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payout Ref:</span>
                  <span className="font-mono text-foreground font-medium">
                    {selectedPayment.providerPayoutRef || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("paidAt")}:</span>
                  <span className="text-foreground">{formatDate(selectedPayment.paidAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payout Sent:</span>
                  <span className="text-foreground">{formatDate(selectedPayment.payoutSentAt)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between items-center">
                  <span className="text-muted-foreground">{t("booking")}:</span>
                  <Link
                    href={`/admin/dashboard/bookings?search=${selectedPayment.bookingId}`}
                    className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {selectedPayment.bookingId.slice(0, 8)}...
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── ESCROW DETAILS DRAWER (SHEET) ─── */}
      <Sheet open={Boolean(selectedEscrow)} onOpenChange={(open) => !open && setSelectedEscrow(null)}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto p-0">
          {selectedEscrow && (
            <div className="space-y-6 p-6">
              <SheetHeader className="p-0 border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <StatusBadge tone={ESCROW_STATUS_TONE[selectedEscrow.status]}>
                    {ESCROW_STATUS_LABELS[selectedEscrow.status]}
                  </StatusBadge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDate(selectedEscrow.createdAt)}
                  </span>
                </div>
                <SheetTitle className="text-lg font-bold mt-2 font-mono">
                  Room: {selectedEscrow.roomId}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {t("escrowLedger")}
                </SheetDescription>
              </SheetHeader>

              {/* Escrow Custody Details */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Escrow Custody
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("amount")}</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(selectedEscrow.totalFee)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t("lawyerWallet")}:</span>
                  <span className="font-mono font-medium text-foreground">
                    {selectedEscrow.lawyerWalletPhone || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t("settledAt")}:</span>
                  <span className="text-foreground">{formatDate(selectedEscrow.settledAt)}</span>
                </div>
              </div>

              {/* Parties */}
              <div className="space-y-4">
                <div className="rounded-xl border border-border p-3.5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {t("citizen")}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedEscrow.citizen.firstName} {selectedEscrow.citizen.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedEscrow.citizen.email}</p>
                </div>

                <div className="rounded-xl border border-border p-3.5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    {t("expert")}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedEscrow.expert.displayName}
                  </p>
                  {selectedEscrow.expert.contactPhone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      <span>{selectedEscrow.expert.contactPhone}</span>
                      <span className="text-[10px] text-muted-foreground/70 font-mono">(Contact Phone)</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3 text-primary shrink-0" />
                    {selectedEscrow.expert.payoutPhone || selectedEscrow.expert.momoNumber || t("noMoMo")}
                  </p>
                </div>
              </div>

              {/* Booking Shortcut */}
              <div className="rounded-xl border border-border p-3.5 flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{t("booking")}:</span>
                <Link
                  href={`/admin/dashboard/bookings?search=${selectedEscrow.bookingId}`}
                  className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                >
                  {selectedEscrow.bookingId}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── RETRY PAYOUT MODAL ─── */}
      <Dialog
        open={showRetryModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowRetryModal(false);
            setRetryReason("");
            setSelectedFailedSettlement(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("retryPayoutModal")}</DialogTitle>
            <DialogDescription>
              {t("retryPayoutFor", {
                name: selectedFailedSettlement?.expert.displayName ?? "",
                amount: selectedFailedSettlement ? formatCurrency(selectedFailedSettlement.expertPayout) : "",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                {t("reasonForRetry")}
              </label>
              <Textarea
                rows={4}
                placeholder={t("retryReasonPlaceholder")}
                value={retryReason}
                onChange={(e) => setRetryReason(e.target.value)}
              />
            </div>

            {selectedFailedSettlement && !selectedFailedSettlement.expert.payoutPhone && !selectedFailedSettlement.expert.momoNumber && (
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-sm text-destructive">
                  {t("noMoMo")}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRetryModal(false);
                setRetryReason("");
                setSelectedFailedSettlement(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRetry}
              disabled={
                retryReason.trim().length < 10 ||
                retryMutation.isPending ||
                (!selectedFailedSettlement?.expert.payoutPhone && !selectedFailedSettlement?.expert.momoNumber)
              }
            >
              {retryMutation.isPending ? t("retrying") : t("retryPayout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
