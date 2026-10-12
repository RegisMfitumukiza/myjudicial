"use client";

import { useState } from "react";
import {
  Users,
  UserCheck,
  ShoppingBag,
  Calendar,
  DollarSign,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  Clock,
  Star,
  CheckCircle2,
  Ban,
  CreditCard,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";

import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge, type StatusTone } from "@/shared/components/dashboard/status-badge";
import { TableSkeleton } from "@/shared/components/dashboard/loading";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { EmptyState } from "@/shared/components/dashboard/empty-state";
import { UserAvatar } from "@/shared/components/expert-avatar";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";

// ── Types ──

type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING" | "DELETED";
type ActivityFilter = "ALL" | "HAS_BOOKINGS" | "NO_BOOKINGS" | "REPEAT_CLIENTS";

interface ClientStats {
  totalClients: number;
  activeClients: number;
  suspendedClients: number;
  pendingClients: number;
  buyersCount: number;
  newThisMonth: number;
  totalBookings: number;
  totalSpent: number;
  currency: string;
}

interface ClientListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  accountStatus: AccountStatus;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  preferredLanguage: string;
  totalBookings: number;
  completedBookings: number;
  totalReviews: number;
  totalSpent: number;
  currency: string;
  lastBookingAt: string | null;
}

interface ClientsResponse {
  data: ClientListItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ClientDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  accountStatus: AccountStatus;
  avatarUrl: string | null;
  preferredLanguage: string;
  createdAt: string;
  lastLoginAt: string | null;
  metrics: {
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalSpent: number;
    currency: string;
    averageOrderValue: number;
    reviewsSubmitted: number;
  };
  recentBookings: Array<{
    id: string;
    status: string;
    paymentStatus: string;
    scheduledStart: string;
    scheduledEnd: string;
    createdAt: string;
    cancellationReason: string | null;
    expert: {
      id: string;
      fullName: string;
      avatarUrl: string | null;
      specialties: string[];
    };
    service: {
      id: string;
      title: string;
      durationMinutes: number;
      price: number;
      currency: string;
    } | null;
    payment: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      paidAt: string | null;
      txRef: string;
    } | null;
  }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    createdAt: string;
    expertName: string;
  }>;
}

// ── API Functions ──

const fetchStats = async (): Promise<{ data: ClientStats }> => {
  return apiFetch("/admin/clients/stats");
};

const fetchClients = async (params: {
  page?: number;
  limit?: number;
  status?: AccountStatus | "ALL";
  activity?: ActivityFilter;
  search?: string;
}): Promise<ClientsResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.status && params.status !== "ALL") query.append("status", params.status);
  if (params.activity && params.activity !== "ALL") query.append("activity", params.activity);
  if (params.search) query.append("search", params.search);

  return apiFetch(`/admin/clients?${query.toString()}`);
};

const fetchClientDetail = async (id: string): Promise<{ data: ClientDetail }> => {
  return apiFetch(`/admin/clients/${id}`);
};

const updateClientStatus = async (
  clientId: string,
  status: AccountStatus,
  reason?: string
) => {
  return apiFetch(`/admin/clients/${clientId}/status`, {
    method: "PATCH",
    body: { status, reason },
  });
};

// ── Helpers ──

const getStatusTone = (status: AccountStatus): StatusTone => {
  const map: Record<AccountStatus, StatusTone> = {
    ACTIVE: "active",
    INACTIVE: "neutral",
    SUSPENDED: "destructive",
    PENDING: "pending",
    DELETED: "neutral",
  };
  return map[status] ?? "neutral";
};

const getBookingTone = (status: string): StatusTone => {
  switch (status) {
    case "COMPLETED":
      return "active";
    case "CONFIRMED":
      return "info";
    case "IN_PROGRESS":
      return "pending";
    case "CANCELLED":
    case "REFUNDED":
      return "destructive";
    default:
      return "neutral";
  }
};

export default function AdminClientsPage() {
  const t = useTranslations("admin.clients");
  const locale = useLocale();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "ALL">("ALL");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("ALL");

  // Selection & Modals
  const [detailClientId, setDetailClientId] = useState<string | null>(null);
  const [selectedClientForStatus, setSelectedClientForStatus] = useState<ClientListItem | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<AccountStatus>("ACTIVE");
  const [actionReason, setActionReason] = useState("");

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString(locale, {
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

  const formatCurrency = (amount: number, currency = "RWF") => {
    return `${Number(amount || 0).toLocaleString(locale)} ${currency}`;
  };

  // Queries
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-clients-stats"],
    queryFn: fetchStats,
  });

  const {
    data: clientsData,
    isLoading: loadingClients,
    error,
  } = useQuery({
    queryKey: ["admin-clients", page, searchQuery, statusFilter, activityFilter],
    queryFn: () =>
      fetchClients({
        page,
        limit: 20,
        search: searchQuery || undefined,
        status: statusFilter,
        activity: activityFilter,
      }),
  });

  const { data: detailData, isLoading: loadingDetail } = useQuery({
    queryKey: ["admin-client-detail", detailClientId],
    queryFn: () => fetchClientDetail(detailClientId!),
    enabled: Boolean(detailClientId),
  });

  // Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      clientId,
      status,
      reason,
    }: {
      clientId: string;
      status: AccountStatus;
      reason?: string;
    }) => updateClientStatus(clientId, status, reason),
    onSuccess: () => {
      toast.success(t("clientStatusUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-clients-stats"] });
      if (detailClientId) {
        queryClient.invalidateQueries({ queryKey: ["admin-client-detail", detailClientId] });
      }
      setShowStatusModal(false);
      setActionReason("");
      setSelectedClientForStatus(null);
    },
    onError: (err: any) => {
      toast.error(err?.message || t("unknownError"));
    },
  });

  const clients = clientsData?.data ?? [];
  const pagination = clientsData?.meta ?? clientsData?.pagination;
  const stats = statsData?.data;
  const activeClientDetail = detailData?.data;

  const handleOpenStatusModal = (client: ClientListItem) => {
    setSelectedClientForStatus(client);
    setNewStatus(client.accountStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = () => {
    if (!selectedClientForStatus) return;
    updateStatusMutation.mutate({
      clientId: selectedClientForStatus.id,
      status: newStatus,
      reason: actionReason.trim() || undefined,
    });
  };

  if (error && !loadingClients) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <ErrorState
          title={t("failedToLoad")}
          message={error instanceof Error ? error.message : t("unknownError")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {/* KPI Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            label={t("totalClients")}
            value={stats.totalClients}
            icon={Users}
          />
          <StatCard
            label={t("activeClients")}
            value={stats.activeClients}
            icon={UserCheck}
          />
          <StatCard
            label={t("buyers")}
            value={stats.buyersCount}
            icon={ShoppingBag}
          />
          <StatCard
            label={t("totalBookings")}
            value={stats.totalBookings}
            icon={Calendar}
          />
          <StatCard
            label={t("totalSpent")}
            value={formatCurrency(stats.totalSpent, stats.currency)}
            icon={DollarSign}
          />
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3 py-1 shadow-sm">
              <Search size={18} className="shrink-0 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Filter size={16} className="shrink-0 text-muted-foreground" />

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as typeof statusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder={t("allStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("allStatus")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                  <SelectItem value="SUSPENDED">{t("suspended")}</SelectItem>
                  <SelectItem value="PENDING">{t("pending")}</SelectItem>
                </SelectContent>
              </Select>

              {/* Activity Filter */}
              <Select
                value={activityFilter}
                onValueChange={(value) => {
                  setActivityFilter(value as ActivityFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t("allActivity")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("allActivity")}</SelectItem>
                  <SelectItem value="HAS_BOOKINGS">{t("hasBookings")}</SelectItem>
                  <SelectItem value="NO_BOOKINGS">{t("noBookings")}</SelectItem>
                  <SelectItem value="REPEAT_CLIENTS">{t("repeatClients")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Data Table */}
      <Card>
        {loadingClients ? (
          <div className="p-6">
            <TableSkeleton rows={8} columns={7} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20">
                  <th className="px-6 py-4">{t("client")}</th>
                  <th className="px-6 py-4">{t("status")}</th>
                  <th className="px-6 py-4">{t("bookings")}</th>
                  <th className="px-6 py-4">{t("spent")}</th>
                  <th className="px-6 py-4">{t("joined")}</th>
                  <th className="px-6 py-4">{t("lastBooking")}</th>
                  <th className="px-6 py-4 text-right">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <EmptyState
                        icon={Users}
                        title={t("noClients")}
                        description={t("noClientsDesc")}
                      />
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr
                      key={client.id}
                      className="transition-colors hover:bg-muted/40 cursor-pointer"
                      onClick={() => setDetailClientId(client.id)}
                    >
                      {/* Client Identity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={client.avatarUrl}
                            name={client.fullName}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-foreground">{client.fullName}</p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail size={12} />
                              <span>{client.email}</span>
                            </div>
                            {client.phone && (
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone size={12} />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge tone={getStatusTone(client.accountStatus)}>
                          {t(client.accountStatus.toLowerCase() as any)}
                        </StatusBadge>
                      </td>

                      {/* Bookings Count */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {client.totalBookings}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {client.completedBookings} {t("completedBookings").toLowerCase()}
                          </span>
                        </div>
                      </td>

                      {/* Lifetime Spend */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">
                          {formatCurrency(client.totalSpent, client.currency)}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(client.createdAt)}
                      </td>

                      {/* Last Booking Date */}
                      <td className="px-6 py-4 text-muted-foreground">
                        {client.lastBookingAt ? formatDate(client.lastBookingAt) : "—"}
                      </td>

                      {/* Row Actions */}
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs"
                            onClick={() => setDetailClientId(client.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {t("viewDetails")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${
                              client.accountStatus === "ACTIVE"
                                ? "text-destructive hover:bg-destructive/10"
                                : "text-emerald-600 hover:bg-emerald-500/10"
                            }`}
                            title={
                              client.accountStatus === "ACTIVE"
                                ? t("suspend")
                                : t("activate")
                            }
                            onClick={() => handleOpenStatusModal(client)}
                          >
                            {client.accountStatus === "ACTIVE" ? (
                              <Ban className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4 text-sm">
            <span className="text-muted-foreground">
              {pagination.total} {t("totalClients").toLowerCase()} · Page {page} of{" "}
              {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="h-8 gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="h-8 gap-1"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Client Detail Modal / Slideover ── */}
      <Dialog
        open={Boolean(detailClientId)}
        onOpenChange={(open) => !open && setDetailClientId(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {loadingDetail || !activeClientDetail ? (
            <div className="py-12 flex justify-center">
              <span className="text-sm text-muted-foreground">{t("loading")}</span>
            </div>
          ) : (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={activeClientDetail.avatarUrl}
                      name={activeClientDetail.fullName}
                      size="lg"
                    />
                    <div>
                      <DialogTitle className="text-xl font-bold">
                        {activeClientDetail.fullName}
                      </DialogTitle>
                      <DialogDescription className="flex items-center gap-2 text-xs">
                        <span>{activeClientDetail.email}</span>
                        {activeClientDetail.phone && (
                          <>
                            <span>•</span>
                            <span>{activeClientDetail.phone}</span>
                          </>
                        )}
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={getStatusTone(activeClientDetail.accountStatus)}>
                      {t(activeClientDetail.accountStatus.toLowerCase() as any)}
                    </StatusBadge>
                  </div>
                </div>
              </DialogHeader>

              {/* Client Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-4 rounded-xl border border-border">
                <div>
                  <span className="text-xs text-muted-foreground block">{t("totalBookings")}</span>
                  <span className="text-lg font-bold text-foreground">
                    {activeClientDetail.metrics.totalBookings}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">{t("completedBookings")}</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {activeClientDetail.metrics.completedBookings}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">{t("totalSpent")}</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(
                      activeClientDetail.metrics.totalSpent,
                      activeClientDetail.metrics.currency
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">{t("avgOrderValue")}</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(
                      activeClientDetail.metrics.averageOrderValue,
                      activeClientDetail.metrics.currency
                    )}
                  </span>
                </div>
              </div>

              {/* Detail Tabs */}
              <Tabs defaultValue="bookings" className="w-full">
                <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 rounded-none">
                  <TabsTrigger
                    value="bookings"
                    className="gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
                  >
                    <Calendar className="h-4 w-4" />
                    {t("bookingHistory")} ({activeClientDetail.recentBookings.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
                  >
                    <Star className="h-4 w-4" />
                    {t("reviews")} ({activeClientDetail.recentReviews.length})
                  </TabsTrigger>
                </TabsList>

                {/* Bookings List */}
                <TabsContent value="bookings" className="mt-4 space-y-3">
                  {activeClientDetail.recentBookings.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      {t("noBookingsDesc")}
                    </div>
                  ) : (
                    activeClientDetail.recentBookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-border bg-card gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {b.service?.title || "Legal Consultation"}
                            </span>
                            <StatusBadge tone={getBookingTone(b.status)}>
                              {b.status}
                            </StatusBadge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              {t("expert")}: {b.expert.fullName}
                            </span>
                            <span>•</span>
                            <span>{formatDateTime(b.scheduledStart)}</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="font-semibold text-foreground block">
                            {b.payment
                              ? formatCurrency(b.payment.amount, b.payment.currency)
                              : b.service
                              ? formatCurrency(b.service.price, b.service.currency)
                              : "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {b.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Reviews List */}
                <TabsContent value="reviews" className="mt-4 space-y-3">
                  {activeClientDetail.recentReviews.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      {t("noReviewsDesc")}
                    </div>
                  ) : (
                    activeClientDetail.recentReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3.5 rounded-lg border border-border bg-card space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Star
                                key={idx}
                                className={`h-4 w-4 ${
                                  idx < rev.rating
                                    ? "fill-amber-500 text-amber-500"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-xs font-semibold text-foreground">
                              {rev.rating} / 5
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(rev.createdAt)}
                          </span>
                        </div>
                        {rev.title && (
                          <p className="font-medium text-sm text-foreground">{rev.title}</p>
                        )}
                        {rev.comment && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {rev.comment}
                          </p>
                        )}
                        <span className="text-[11px] text-muted-foreground block">
                          Reviewed: {rev.expertName}
                        </span>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDetailClientId(null)}
                >
                  {t("close")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Status Change Confirmation Modal ── */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("changeStatusConfirm")}</DialogTitle>
            <DialogDescription>
              {t("changeStatusPrompt", {
                name: selectedClientForStatus?.fullName ?? "",
                status: t(newStatus.toLowerCase() as any),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("reasonOptional")}
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              rows={3}
              placeholder={t("reasonPlaceholder")}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusModal(false);
                setActionReason("");
                setSelectedClientForStatus(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? t("updating") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
