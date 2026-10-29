"use client";

import { Suspense, useState, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
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
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge, type StatusTone } from "@/shared/components/dashboard/status-badge";
import { TableSkeleton, TableSectionSkeleton } from "@/shared/components/dashboard/loading";
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
import { Link, useRouter, usePathname } from "@/i18n/routing";

type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";
type EscrowStatus = "PENDING" | "LOCKED" | "HELD_IN_ESCROW" | "DISBURSED_TO_EXPERT" | "REFUNDED";
type FinanceTab = "payments" | "escrow" | "failed";
const VALID_TABS: FinanceTab[] = ["payments", "escrow", "failed"];

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
  if (fromDate && fromDate.trim()) queryParams.append("fromDate", fromDate.trim());
  if (toDate && toDate.trim()) queryParams.append("toDate", toDate.trim());
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
  if (params.status && (params.status as string) !== "ALL") queryParams.append("status", params.status);
  if (params.search && params.search.trim()) queryParams.append("search", params.search.trim());
  if (params.fromDate && params.fromDate.trim()) queryParams.append("fromDate", params.fromDate.trim());
  if (params.toDate && params.toDate.trim()) queryParams.append("toDate", params.toDate.trim());
  const q = queryParams.toString();
  return apiFetch(`/admin/finance/payments${q ? `?${q}` : ""}`);
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
  if (params.status && (params.status as string) !== "ALL") queryParams.append("status", params.status);
  if (params.search && params.search.trim()) queryParams.append("search", params.search.trim());
  const q = queryParams.toString();
  return apiFetch(`/admin/finance/escrow${q ? `?${q}` : ""}`);
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
  PENDING: "pending",
  LOCKED: "pending",
  HELD_IN_ESCROW: "pending",
  DISBURSED_TO_EXPERT: "success",
  REFUNDED: "neutral",
};


function detectCarrier(raw?: string | null): "MTN" | "AIRTEL" | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (/^(250)?7[89]/.test(digits) || /^07[89]/.test(digits)) return "MTN";
  if (/^(250)?7[23]/.test(digits) || /^07[23]/.test(digits)) return "AIRTEL";
  return null;
}

function CarrierBadge({ phone }: { phone?: string | null }) {
  const carrier = detectCarrier(phone);
  if (!carrier) return null;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
        carrier === "MTN"
          ? "bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/30"
          : "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30"
      }`}
    >
      {carrier}
    </span>
  );
}

function CopyChip({
  value,
  displayValue,
  label,
  className = "",
}: {
  value: string;
  displayValue?: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(label ? `${label} copied` : "Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className={`group inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/80 max-w-full ${className}`}
      title={`Copy ${label || "value"}: ${value}`}
    >
      <span className="truncate">{displayValue || value}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  );
}

function EscrowLifecycleStepper({
  status,
  paidAt,
  settledAt,
  payoutSentAt,
  currency = "RWF",
  amount,
  expertPayout,
  t,
  formatDate,
}: {
  status: EscrowStatus | PaymentStatus;
  paidAt?: string | null;
  settledAt?: string | null;
  payoutSentAt?: string | null;
  currency?: string;
  amount: number;
  expertPayout: number;
  t: any;
  formatDate: (d?: string | null) => string;
}) {
  const isPaid = Boolean(paidAt || status === "PAID" || status === "LOCKED" || status === "HELD_IN_ESCROW" || status === "DISBURSED_TO_EXPERT");
  const isEscrowLocked = Boolean(status === "LOCKED" || status === "HELD_IN_ESCROW" || status === "DISBURSED_TO_EXPERT");
  const isConsultationDone = Boolean(settledAt || status === "DISBURSED_TO_EXPERT");
  const isDisbursed = Boolean(status === "DISBURSED_TO_EXPERT" || payoutSentAt);
  const isRefunded = status === "REFUNDED";

  const steps = [
    {
      id: 1,
      title: t("step1Title"),
      subtitle: paidAt ? formatDate(paidAt) : t("step1Pending"),
      state: isPaid ? "completed" : "current",
      desc: t("step1Desc", { amount: `${currency} ${amount.toLocaleString()}` }),
    },
    {
      id: 2,
      title: t("step2Title"),
      subtitle: isEscrowLocked ? t("step2Locked") : t("step2Pending"),
      state: isRefunded ? "refunded" : isEscrowLocked ? (isConsultationDone ? "completed" : "current") : "upcoming",
      desc: t("step2Desc"),
    },
    {
      id: 3,
      title: t("step3Title"),
      subtitle: isConsultationDone ? (settledAt ? formatDate(settledAt) : t("step3Done")) : t("step3Awaiting"),
      state: isRefunded ? "refunded" : isConsultationDone ? "completed" : isEscrowLocked ? "current" : "upcoming",
      desc: t("step3Desc"),
    },
    {
      id: 4,
      title: isRefunded ? t("step4RefundedTitle") : t("step4Title"),
      subtitle: isRefunded ? t("step4RefundedSub") : isDisbursed ? formatDate(payoutSentAt || settledAt) : t("step4Pending"),
      state: isRefunded ? "neutral" : isDisbursed ? "completed" : "upcoming",
      desc: isRefunded ? t("step4RefundedDesc") : t("step4Desc", { payout: `${currency} ${expertPayout.toLocaleString()}` }),
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          {t("lifecycleTitle")}
        </p>
        <span className="text-[11px] font-medium text-muted-foreground">
          {isRefunded ? t("refunded") : isDisbursed ? t("disbursedToExpert") : t("fundsInEscrow")}
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {steps.map((s) => {
          const isDone = s.state === "completed";
          const isCurrent = s.state === "current";
          const isRef = s.state === "refunded";
          return (
            <div key={s.id} className="relative">
              <div
                className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold border transition-colors ${
                  isDone
                    ? "bg-emerald-500 border-emerald-600 text-white"
                    : isCurrent
                    ? "bg-primary border-primary text-primary-foreground ring-2 ring-primary/20 animate-pulse"
                    : isRef
                    ? "bg-amber-500 border-amber-600 text-white"
                    : "bg-muted border-border text-muted-foreground"
                }`}
              >
                {isDone ? "✓" : s.id}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-semibold ${isCurrent ? "text-foreground" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {s.subtitle}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinancePageContent() {
  const t = useTranslations("admin.finance");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { isBookingFirst } = usePaymentMode();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlTab = searchParams.get("tab") as FinanceTab | null;
  const initialTab: FinanceTab =
    urlTab && VALID_TABS.includes(urlTab)
      ? urlTab
      : "payments";

  // Active Tab
  const [activeTab, setActiveTab] = useState<FinanceTab>(initialTab);

  // Sync state when URL tab changes or restore from localStorage on direct visit
  useEffect(() => {
    if (urlTab && VALID_TABS.includes(urlTab)) {
      setActiveTab(urlTab);
    } else {
      try {
        const savedTab = localStorage.getItem("admin_finance_tab") as FinanceTab | null;
        if (savedTab && VALID_TABS.includes(savedTab) && savedTab !== "payments") {
          setActiveTab(savedTab);
          const params = new URLSearchParams(searchParams.toString());
          params.set("tab", savedTab);
          const qs = params.toString();
          router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }
      } catch {}
    }
  }, [urlTab, pathname, router, searchParams]);

  const handleTabChange = (newTab: string) => {
    const validTab = (VALID_TABS.includes(newTab as FinanceTab) ? newTab : "payments") as FinanceTab;
    setActiveTab(validTab);
    try {
      localStorage.setItem("admin_finance_tab", validTab);
    } catch {}

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (validTab === "payments") {
        params.delete("tab");
      } else {
        params.set("tab", validTab);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

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
  const [isExportingEscrowCsv, setIsExportingEscrowCsv] = useState(false);

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
    PENDING: t("statusPending"),
    LOCKED: t("statusLocked"),
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

  const formatDate = (dateString?: string | null) => {
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

  const handleExportEscrowCsv = async () => {
    setIsExportingEscrowCsv(true);
    try {
      const res = await fetchEscrow({
        limit: 1000,
        search: escrowSearch.trim() || undefined,
        status: escrowStatusFilter !== "ALL" ? escrowStatusFilter : undefined,
      });

      const items = res.data.ledgers;
      if (!items || items.length === 0) return;

      const headers = [
        "Room ID",
        "Booking ID",
        "Citizen Name",
        "Citizen Email",
        "Expert Name",
        "Lawyer Wallet",
        "Total Fee (RWF)",
        "Status",
        "Created At",
        "Settled At",
      ];

      const csvRows = [
        headers.join(","),
        ...items.map((e) =>
          [
            `"${e.roomId}"`,
            `"${e.bookingId}"`,
            `"${e.citizen.firstName} ${e.citizen.lastName}"`,
            `"${e.citizen.email}"`,
            `"${e.expert.displayName}"`,
            `"${e.lawyerWalletPhone || ""}"`,
            e.totalFee,
            e.status,
            `"${e.createdAt}"`,
            `"${e.settledAt ?? ""}"`,
          ].join(",")
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `myjudicial_escrow_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } catch (err) {
      console.error("Failed to export escrow CSV", err);
      toast.error(t("exportError"));
    } finally {
      setIsExportingEscrowCsv(false);
    }
  };


  if (loadingStats) {
    return <TableSkeleton statsCount={4} columns={6} rows={6} />;
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      {isBookingFirst && (
        <Card>
          <CardContent className="flex items-start gap-3 pt-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("paymentsDisabled")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("paymentsDisabledDesc")}
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
        onValueChange={handleTabChange}
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
                  <TableSectionSkeleton rows={5} columns={6} className="border-0 rounded-none shadow-none" />
                ) : paymentsError ? (
                  <ErrorState
                    title={t("failedToLoad")}
                    onRetry={() => queryClient.invalidateQueries({ queryKey: ["admin-finance-payments"] })}
                  />
                ) : (
                  <>
                    {/* Mobile / Small Devices Card Stack (< 1024px) */}
                    <div className="divide-y divide-border lg:hidden">
                      {payments.length === 0 ? (
                        <div className="p-6">
                          <EmptyState icon={DollarSign} title={t("noPayments")} />
                        </div>
                      ) : (
                        payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="p-4 space-y-3 cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm text-foreground capitalize">
                                  {payment.citizen.firstName} {payment.citizen.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  to <strong className="text-foreground font-medium capitalize">{payment.expert.displayName}</strong>
                                </p>
                              </div>
                              <StatusBadge tone={PAYMENT_STATUS_TONE[payment.status]}>
                                {PAYMENT_STATUS_LABELS[payment.status]}
                              </StatusBadge>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                              <div>
                                <span className="text-muted-foreground">{t("amount")}: </span>
                                <span className="font-bold text-foreground">
                                  {formatCurrency(payment.amount, payment.currency)}
                                </span>
                              </div>
                              <div className="font-mono text-muted-foreground text-[11px]">
                                {formatDate(payment.paidAt || payment.createdAt)}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                              <CopyChip value={payment.txRef} displayValue={`${payment.txRef.slice(0, 16)}...`} label="TxRef" />
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                {t("paymentDetails")}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Desktop Full Table (>= 1024px) */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="px-3 xl:px-5 py-3.5">{t("transaction")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("citizen")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("expert")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("amount")}</th>
                            <th className="px-3 xl:px-5 py-3.5 hidden xl:table-cell">{t("platformFee")}</th>
                            <th className="px-3 xl:px-5 py-3.5 hidden xl:table-cell">{t("expertPayout")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("status")}</th>
                            <th className="px-3 xl:px-5 py-3.5 hidden 2xl:table-cell">{t("paidAt")}</th>
                            <th className="px-3 xl:px-5 py-3.5 text-right"></th>
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
                                <td className="px-3 xl:px-5 py-3.5">
                                  <div className="space-y-0.5 min-w-0">
                                    <CopyChip value={payment.txRef} label="Transaction Ref" />
                                    <div>
                                      {payment.providerTransactionId ? (
                                        <CopyChip
                                          value={payment.providerTransactionId}
                                          label="Gateway ID"
                                          className="text-[11px]"
                                        />
                                      ) : (
                                        <span className="text-[11px] text-muted-foreground italic">
                                          {t("pendingGateway")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5">
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate max-w-[140px] xl:max-w-none capitalize">
                                      {payment.citizen.firstName} {payment.citizen.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[140px] xl:max-w-none">{payment.citizen.email}</p>
                                  </div>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5">
                                  <p className="font-medium text-foreground truncate max-w-[120px] xl:max-w-none capitalize">{payment.expert.displayName}</p>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 whitespace-nowrap">
                                  <p className="font-semibold text-foreground">
                                    {formatCurrency(payment.amount, payment.currency)}
                                  </p>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 whitespace-nowrap hidden xl:table-cell">
                                  <p className="text-muted-foreground">
                                    {formatCurrency(payment.platformFee, payment.currency)}
                                  </p>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 whitespace-nowrap hidden xl:table-cell">
                                  <p className="text-muted-foreground">
                                    {formatCurrency(payment.expertPayout, payment.currency)}
                                  </p>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5">
                                  <StatusBadge tone={PAYMENT_STATUS_TONE[payment.status]}>
                                    {PAYMENT_STATUS_LABELS[payment.status]}
                                  </StatusBadge>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 whitespace-nowrap hidden 2xl:table-cell">
                                  <span className="text-xs text-muted-foreground">{formatDate(payment.paidAt)}</span>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 text-right">
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
                          {t("pageOf", { page: paymentsPagination.page, total: paymentsPagination.totalPages })} ({paymentsPagination.total})
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
                        <SelectItem value="LOCKED">{t("statusLocked")}</SelectItem>
                        <SelectItem value="HELD_IN_ESCROW">{t("heldInEscrow")}</SelectItem>
                        <SelectItem value="PENDING">{t("statusPending")}</SelectItem>
                        <SelectItem value="DISBURSED_TO_EXPERT">{t("disbursedToExpert")}</SelectItem>
                        <SelectItem value="REFUNDED">{t("refunded")}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportEscrowCsv}
                      disabled={isExportingEscrowCsv || ledgers.length === 0}
                      className="h-9 gap-1.5 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {isExportingEscrowCsv ? t("loading") : t("exportEscrowCsv")}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Escrow Table */}
              <Card>
                {loadingEscrow ? (
                  <TableSectionSkeleton rows={5} columns={6} className="border-0 rounded-none shadow-none" />
                ) : escrowError ? (
                  <ErrorState
                    title={t("failedToLoad")}
                    onRetry={() => queryClient.invalidateQueries({ queryKey: ["admin-finance-escrow"] })}
                  />
                ) : (
                  <>
                    {/* Mobile / Small Devices Card Stack (< 1024px) */}
                    <div className="divide-y divide-border lg:hidden">
                      {ledgers.length === 0 ? (
                        <div className="p-6">
                          <EmptyState icon={Lock} title={t("noEscrow")} />
                        </div>
                      ) : (
                        ledgers.map((ledger) => (
                          <div
                            key={ledger.id}
                            className="p-4 space-y-3 cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => setSelectedEscrow(ledger)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-sm text-foreground capitalize">
                                  {ledger.citizen.firstName} {ledger.citizen.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  with <strong className="text-foreground font-medium capitalize">{ledger.expert.displayName}</strong>
                                </p>
                              </div>
                              <StatusBadge tone={ESCROW_STATUS_TONE[ledger.status]}>
                                {ESCROW_STATUS_LABELS[ledger.status]}
                              </StatusBadge>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                              <div>
                                <span className="text-muted-foreground">{t("amount")}: </span>
                                <span className="font-bold text-foreground">
                                  {formatCurrency(ledger.totalFee)}
                                </span>
                              </div>
                              <div className="text-[11px]">
                                {ledger.settledAt ? (
                                  <span className="font-mono text-muted-foreground">{formatDate(ledger.settledAt)}</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
                                    <Clock className="h-2.5 w-2.5" />
                                    {t("awaitingConsultation")}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                              <CopyChip value={ledger.roomId} displayValue={`${ledger.roomId.slice(0, 14)}...`} label="Room ID" />
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                {t("paymentDetails")}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Desktop Full Table (>= 1024px) */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="px-3 xl:px-5 py-3.5 hidden 2xl:table-cell">{t("roomId")}</th>
                            <th className="px-3 xl:px-5 py-3.5 hidden xl:table-cell">{t("booking")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("citizen")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("expert")}</th>
                            <th className="px-3 xl:px-5 py-3.5 hidden xl:table-cell">{t("lawyerWallet")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("amount")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("status")}</th>
                            <th className="px-3 xl:px-5 py-3.5 hidden 2xl:table-cell">{t("settledAt")}</th>
                            <th className="px-3 xl:px-5 py-3.5 text-right"></th>
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
                                <td className="px-3 xl:px-5 py-3.5 hidden 2xl:table-cell">
                                  <CopyChip
                                    value={ledger.roomId}
                                    displayValue={ledger.roomId.length > 12 ? `${ledger.roomId.slice(0, 10)}...` : ledger.roomId}
                                    label="Room ID"
                                  />
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 hidden xl:table-cell">
                                  <div className="flex items-center gap-1.5">
                                    <CopyChip
                                      value={ledger.bookingId}
                                      displayValue={`${ledger.bookingId.slice(0, 8)}...`}
                                      label="Booking ID"
                                    />
                                    <Link
                                      href={`/admin/dashboard/bookings?search=${ledger.bookingId}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-primary hover:text-primary/80 transition-colors"
                                      title={t("viewBooking")}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                  </div>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5">
                                  <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate max-w-[140px] xl:max-w-none capitalize">
                                      {ledger.citizen.firstName} {ledger.citizen.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[140px] xl:max-w-none">{ledger.citizen.email}</p>
                                  </div>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5">
                                  <p className="font-medium text-foreground truncate max-w-[120px] xl:max-w-none capitalize">{ledger.expert.displayName}</p>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 hidden xl:table-cell">
                                  {ledger.lawyerWalletPhone ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <CopyChip value={ledger.lawyerWalletPhone} label="Lawyer Wallet" />
                                      <CarrierBadge phone={ledger.lawyerWalletPhone} />
                                    </div>
                                  ) : (
                                    <span className="font-mono text-xs text-muted-foreground italic">—</span>
                                  )}
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 whitespace-nowrap">
                                  <p className="font-semibold text-foreground">{formatCurrency(ledger.totalFee)}</p>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5">
                                  <StatusBadge tone={ESCROW_STATUS_TONE[ledger.status]}>
                                    {ESCROW_STATUS_LABELS[ledger.status]}
                                  </StatusBadge>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 whitespace-nowrap hidden 2xl:table-cell">
                                  {ledger.settledAt ? (
                                    <span className="text-xs text-muted-foreground font-mono">{formatDate(ledger.settledAt)}</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                                      <Clock className="h-2.5 w-2.5" />
                                      {t("awaitingConsultation")}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 text-right">
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
                          {t("pageOf", { page: escrowPagination.page, total: escrowPagination.totalPages })} ({escrowPagination.total})
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
                      {t("twoTierTitle")}
                    </p>
                    <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                      {t("twoTierDesc")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                {loadingFailed ? (
                  <TableSectionSkeleton rows={5} columns={6} className="border-0 rounded-none shadow-none" />
                ) : failedError ? (
                  <ErrorState
                    title={t("failedToLoadSettlements")}
                    onRetry={() => queryClient.invalidateQueries({ queryKey: ["admin-finance-failed"] })}
                  />
                ) : (
                  <>
                    {/* Mobile / Small Devices Card Stack (< 1024px) */}
                    <div className="divide-y divide-border lg:hidden">
                      {failedPayments.length === 0 ? (
                        <div className="p-6">
                          <EmptyState
                            icon={RefreshCw}
                            title={t("noFailed")}
                            description={t("allProcessed")}
                          />
                        </div>
                      ) : (
                        failedPayments.map((payment) => (
                          <div key={payment.id} className="p-4 space-y-3">
                            {/* Header: Names + Payout */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground capitalize">
                                  {payment.citizen.firstName} {payment.citizen.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  to <strong className="text-foreground font-medium capitalize">{payment.expert.displayName}</strong>
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="font-bold text-sm text-foreground">
                                  {formatCurrency(payment.expertPayout)}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{t("expertPayout")}</p>
                              </div>
                            </div>

                            {/* MoMo / Wallet info */}
                            <div className="text-xs pt-1 border-t border-border/60">
                              {payment.expert.payoutPhone || payment.expert.momoNumber ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-foreground font-medium">
                                    {payment.expert.payoutPhone || payment.expert.momoNumber}
                                  </span>
                                  {payment.expert.isPayoutFallback ? (
                                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                      {t("fallback")}
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
                            </div>

                            {/* Booking + Last Attempt + Retry */}
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <div className="min-w-0 space-y-0.5">
                                <CopyChip value={payment.txRef} displayValue={`${payment.txRef.slice(0, 16)}...`} label="TxRef" />
                                <p className="text-[10px] text-muted-foreground font-mono pl-1">{formatDate(payment.updatedAt)}</p>
                              </div>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleRetryPayout(payment)}
                                disabled={(!payment.expert.payoutPhone && !payment.expert.momoNumber) || retryMutation.isPending}
                                className="h-8 text-xs shrink-0"
                              >
                                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${retryMutation.isPending ? "animate-spin" : ""}`} />
                                {t("retryPayout")}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Desktop Full Table (>= 1024px) */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="px-3 xl:px-5 py-3.5">{t("booking")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("expert")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("citizen")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("expertPayout")}</th>
                            <th className="px-3 xl:px-5 py-3.5">{t("momoNumber")}</th>
                            <th className="px-3 xl:px-5 py-3.5 hidden xl:table-cell">{t("lastAttempt")}</th>
                            <th className="px-3 xl:px-5 py-3.5 text-right"></th>
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
                                <td className="px-3 xl:px-5 py-3.5">
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <CopyChip
                                        value={payment.bookingId}
                                        displayValue={`${payment.bookingId.slice(0, 8)}...`}
                                        label="Booking ID"
                                      />
                                      <Link
                                        href={`/admin/dashboard/bookings?search=${payment.bookingId}`}
                                        className="text-primary hover:text-primary/80 transition-colors"
                                        title={t("viewBooking")}
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </Link>
                                    </div>
                                    <CopyChip value={payment.txRef} label="TxRef" className="text-[11px]" />
                                  </div>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5">
                                  <p className="font-medium text-foreground truncate max-w-[120px] xl:max-w-none">
                                    {payment.expert.displayName}
                                  </p>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5">
                                  <div className="min-w-0">
                                    <p className="text-foreground truncate max-w-[130px] xl:max-w-none capitalize">
                                      {payment.citizen.firstName} {payment.citizen.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[130px] xl:max-w-none">{payment.citizen.email}</p>
                                  </div>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 whitespace-nowrap">
                                  <p className="font-semibold text-foreground">
                                    {formatCurrency(payment.expertPayout)}
                                  </p>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5">
                                  {payment.expert.payoutPhone || payment.expert.momoNumber ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono text-xs text-foreground font-medium">
                                        {payment.expert.payoutPhone || payment.expert.momoNumber}
                                      </span>
                                      {payment.expert.isPayoutFallback ? (
                                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                          {t("fallback")}
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
                                <td className="px-3 xl:px-5 py-3.5 whitespace-nowrap hidden xl:table-cell">
                                  <span className="text-xs text-muted-foreground">{formatDate(payment.updatedAt)}</span>
                                </td>
                                <td className="px-3 xl:px-5 py-3.5 text-right">
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
                          {t("pageOf", { page: failedPagination.page, total: failedPagination.totalPages })} ({failedPagination.total})
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
              <SheetHeader className="p-0 border-b border-border pb-4 pr-10">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge tone={PAYMENT_STATUS_TONE[selectedPayment.status]}>
                    {PAYMENT_STATUS_LABELS[selectedPayment.status]}
                  </StatusBadge>
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(selectedPayment.createdAt)}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <SheetTitle className="text-base font-bold font-mono tracking-tight break-all">
                    {selectedPayment.txRef}
                  </SheetTitle>
                  <CopyChip value={selectedPayment.txRef} label="Transaction Ref" />
                </div>
                <SheetDescription className="text-xs">
                  {t("paymentDetails")}
                </SheetDescription>
              </SheetHeader>

              {/* Escrow Settlement Lifecycle Stepper */}
              <EscrowLifecycleStepper
                status={selectedPayment.status}
                paidAt={selectedPayment.paidAt}
                payoutSentAt={selectedPayment.payoutSentAt}
                amount={selectedPayment.amount}
                expertPayout={selectedPayment.expertPayout}
                currency={selectedPayment.currency}
                t={t}
                formatDate={formatDate}
              />

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
                  <p className="text-sm font-medium text-foreground capitalize">
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
                  <p className="text-sm font-medium text-foreground capitalize">
                    {selectedPayment.expert.displayName}
                  </p>
                  {selectedPayment.expert.contactPhone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      <span>{selectedPayment.expert.contactPhone}</span>
                      <span className="text-[10px] text-muted-foreground/70 font-mono">({t("contactPhoneLabel")})</span>
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
                            {t("accountPhoneFallback")}
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
                  {t("auditTraceability")}
                </p>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground shrink-0">{t("gatewayRef")}:</span>
                  {selectedPayment.providerTransactionId ? (
                    <CopyChip value={selectedPayment.providerTransactionId} label="Gateway Ref" />
                  ) : (
                    <span className="text-muted-foreground italic text-[11px]">{t("pendingGateway")}</span>
                  )}
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground shrink-0">{t("payoutRef")}:</span>
                  {selectedPayment.providerPayoutRef ? (
                    <CopyChip value={selectedPayment.providerPayoutRef} label="Payout Ref" />
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Lock className="h-2.5 w-2.5" />
                      {t("heldInEscrowPill")}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("paidAt")}:</span>
                  <span className="text-foreground">{formatDate(selectedPayment.paidAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("payoutSent")}:</span>
                  {selectedPayment.payoutSentAt ? (
                    <span className="text-foreground">{formatDate(selectedPayment.payoutSentAt)}</span>
                  ) : (
                    <span className="text-muted-foreground italic text-[11px]">{t("awaitingSessionRelease")}</span>
                  )}
                </div>
                <div className="pt-2 border-t border-border flex justify-between items-center">
                  <span className="text-muted-foreground">{t("booking")}:</span>
                  <div className="flex items-center gap-1.5">
                    <CopyChip value={selectedPayment.bookingId} displayValue={`${selectedPayment.bookingId.slice(0, 8)}...`} label="Booking ID" />
                    <Link
                      href={`/admin/dashboard/bookings?search=${selectedPayment.bookingId}`}
                      className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                      title={t("viewBooking")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
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
              <SheetHeader className="p-0 border-b border-border pb-4 pr-10">
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge tone={ESCROW_STATUS_TONE[selectedEscrow.status]}>
                    {ESCROW_STATUS_LABELS[selectedEscrow.status]}
                  </StatusBadge>
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(selectedEscrow.createdAt)}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <SheetTitle className="text-base font-bold font-mono tracking-tight break-all">
                    {t("roomLabel")}: {selectedEscrow.roomId}
                  </SheetTitle>
                  <CopyChip value={selectedEscrow.roomId} label="Room ID" />
                </div>
                <SheetDescription className="text-xs">
                  {t("escrowLedger")}
                </SheetDescription>
              </SheetHeader>

              {/* Escrow Settlement Lifecycle Stepper */}
              <EscrowLifecycleStepper
                status={selectedEscrow.status}
                paidAt={selectedEscrow.createdAt}
                settledAt={selectedEscrow.settledAt}
                amount={selectedEscrow.totalFee}
                expertPayout={Number((selectedEscrow.totalFee * 0.85).toFixed(0))}
                currency="RWF"
                t={t}
                formatDate={formatDate}
              />

              {/* Escrow Custody Details */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("escrowCustody")}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{t("amount")}</span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(selectedEscrow.totalFee)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t("lawyerWallet")}:</span>
                  {selectedEscrow.lawyerWalletPhone ? (
                    <div className="flex items-center gap-1.5">
                      <CopyChip value={selectedEscrow.lawyerWalletPhone} label="Lawyer Wallet" />
                      <CarrierBadge phone={selectedEscrow.lawyerWalletPhone} />
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-[11px]">—</span>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">{t("settledAt")}:</span>
                  {selectedEscrow.settledAt ? (
                    <span className="text-foreground font-medium">{formatDate(selectedEscrow.settledAt)}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <Clock className="h-2.5 w-2.5" />
                      {t("awaitingConsultationConclusion")}
                    </span>
                  )}
                </div>
              </div>

              {/* Parties */}
              <div className="space-y-4">
                <div className="rounded-xl border border-border p-3.5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {t("citizen")}
                  </p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {selectedEscrow.citizen.firstName} {selectedEscrow.citizen.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedEscrow.citizen.email}</p>
                </div>

                <div className="rounded-xl border border-border p-3.5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    {t("expert")}
                  </p>
                  <p className="text-sm font-medium text-foreground capitalize">
                    {selectedEscrow.expert.displayName}
                  </p>
                  {selectedEscrow.expert.contactPhone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      <span>{selectedEscrow.expert.contactPhone}</span>
                      <span className="text-[10px] text-muted-foreground/70 font-mono">({t("contactPhoneLabel")})</span>
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
                <div className="flex items-center gap-1.5">
                  <CopyChip value={selectedEscrow.bookingId} displayValue={`${selectedEscrow.bookingId.slice(0, 10)}...`} label="Booking ID" />
                  <Link
                    href={`/admin/dashboard/bookings?search=${selectedEscrow.bookingId}`}
                    className="font-mono text-primary hover:underline inline-flex items-center gap-1 text-xs"
                    title={t("viewBooking")}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
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
              {t("cancel")}
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

export default function FinancePage() {
  return (
    <Suspense fallback={<TableSkeleton statsCount={4} columns={6} rows={6} />}>
      <FinancePageContent />
    </Suspense>
  );
}
