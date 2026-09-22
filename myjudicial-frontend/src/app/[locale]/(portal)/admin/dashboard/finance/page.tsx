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
import { Textarea } from "@/shared/components/ui/textarea";

type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";

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

const PAYMENT_STATUS_TONE: Record<PaymentStatus, StatusTone> = {
  PENDING: "pending",
  AUTHORIZED: "active",
  PAID: "success",
  FAILED: "destructive",
  REFUNDED: "neutral",
};

export default function FinancePage() {
  const t = useTranslations("admin.finance");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { isBookingFirst, isLoading: paymentModeLoading } = usePaymentMode();
  const [activeTab, setActiveTab] = useState<"payments" | "failed">("payments");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [selectedPayment, setSelectedPayment] = useState<FailedSettlement | null>(null);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [retryReason, setRetryReason] = useState("");

  const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    PENDING: t("pending"),
    AUTHORIZED: t("authorized"),
    PAID: t("paid"),
    FAILED: t("failed"),
    REFUNDED: t("allStatus"),
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

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-finance-stats"],
    queryFn: fetchStats,
  });

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

  const { data: failedData, isLoading: loadingFailed, error: failedError } = useQuery({
    queryKey: ["admin-finance-failed", page],
    queryFn: () => fetchFailedSettlements(page, 20),
    enabled: activeTab === "failed",
  });

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
      <div className="space-y-6 p-6 lg:p-8">
        <LoadingSpinner label={t("loading")} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
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

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
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
          />
          <StatCard
            label={t("failed")}
            value={stats.payments.failed}
            icon={AlertCircle}
          />
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as "payments" | "failed");
          setPage(1);
        }}
      >
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="payments">{t("allPayments")}</TabsTrigger>
          <TabsTrigger value="failed">
            {t("failedSettlements")}
            {stats && stats.payments.failed > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                {stats.payments.failed}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-6">
          {activeTab === "payments" && (
            <div className="space-y-6">
              <Card>
                <CardContent className="flex flex-col gap-4 pt-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 items-center gap-2">
                    <Search size={16} className="text-muted-foreground" />
                    <Input
                      placeholder={t("searchPlaceholder")}
                      className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Select
                      value={statusFilter}
                      onValueChange={(v) => {
                        setStatusFilter(v as PaymentStatus | "ALL");
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder={t("allStatus")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">{t("allStatus")}</SelectItem>
                        <SelectItem value="PENDING">{t("pending")}</SelectItem>
                        <SelectItem value="PAID">{t("paid")}</SelectItem>
                        <SelectItem value="FAILED">{t("failed")}</SelectItem>
                        <SelectItem value="REFUNDED">{t("allStatus")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

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
                            <th className="px-6 py-4">{t("allStatus")}</th>
                            <th className="px-6 py-4">{t("paidAt")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {payments.length === 0 ? (
                            <tr>
                              <td colSpan={8}>
                                <EmptyState
                                  icon={DollarSign}
                                  title={t("noPayments")}
                                />
                              </td>
                            </tr>
                          ) : (
                            payments.map((payment) => (
                              <tr key={payment.id} className="transition-colors hover:bg-muted/50">
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="font-medium text-foreground">{payment.txRef}</p>
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
                                  <p className="text-foreground">{payment.expert.displayName}</p>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-medium text-foreground">
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
                                  <span className="text-muted-foreground">{formatDate(payment.paidAt)}</span>
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
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                          >
                            ←
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={page === paymentsPagination.totalPages}
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

        <TabsContent value="failed" className="mt-6">
          {activeTab === "failed" && (
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
                                  <p className="text-xs text-muted-foreground">{payment.txRef}</p>
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
                                <p className="font-medium text-foreground">
                                  {formatCurrency(payment.expertPayout)}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-muted-foreground">
                                  {payment.expert.momoNumber || (
                                    <span className="text-destructive">{t("noMoMo")}</span>
                                  )}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-muted-foreground">{formatDate(payment.updatedAt)}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleRetryPayout(payment)}
                                  disabled={!payment.expert.momoNumber || retryMutation.isPending}
                                >
                                  <RefreshCw size={14} />
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
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                        >
                          ←
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(page + 1)}
                          disabled={page === failedPagination.totalPages}
                        >
                          →
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showRetryModal} onOpenChange={(open) => {
        if (!open) {
          setShowRetryModal(false);
          setRetryReason("");
          setSelectedPayment(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("retryPayoutModal")}</DialogTitle>
            <DialogDescription>
              {t("retryPayoutFor", {
                name: selectedPayment?.expert.displayName ?? "",
                amount: selectedPayment ? formatCurrency(selectedPayment.expertPayout) : "",
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

            {selectedPayment && !selectedPayment.expert.momoNumber && (
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
                setSelectedPayment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRetry}
              disabled={retryReason.trim().length < 10 || retryMutation.isPending || !selectedPayment?.expert.momoNumber}
            >
              {retryMutation.isPending ? t("retrying") : t("retryPayout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
