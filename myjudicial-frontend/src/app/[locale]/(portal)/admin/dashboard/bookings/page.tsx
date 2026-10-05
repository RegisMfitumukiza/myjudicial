"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCheck,
  Search,
  Filter,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminBookings,
  useGetAdminBookingsStats,
  usePatchAdminBookingsIdComplete,
  usePatchAdminBookingsIdRefund,
  getGetAdminBookingsQueryKey,
  getGetAdminBookingsStatsQueryKey,
  type Booking,
  type GetAdminBookingsStatus,
} from "@/api/generated";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";
import { useTranslations, useLocale } from "next-intl";

import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatCard } from "@/shared/components/dashboard/stat-card";
import { StatusBadge, type StatusTone } from "@/shared/components/dashboard/status-badge";
import { TableSkeleton } from "@/shared/components/dashboard/loading";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { EmptyState } from "@/shared/components/dashboard/empty-state";
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

type StatusFilter = GetAdminBookingsStatus | "ALL";

// Helper functions
const getStatusTone = (status: Booking["status"]): StatusTone => {
  const map: Record<Booking["status"], StatusTone> = {
    PENDING: "pending",
    CONFIRMED: "info",
    ACTIVE: "active",
    COMPLETED: "success",
    CANCELLED: "neutral",
    REFUNDED: "destructive",
  };
  return map[status] ?? "neutral";
};

function clientName(booking: Booking): string {
  if (!booking.citizen) return "Client";
  return `${booking.citizen.firstName} ${booking.citizen.lastName}`.trim() || "Client";
}

function bookingAmount(booking: Booking): { amount: number; currency: string } {
  if (booking.payment) return { amount: booking.payment.amount, currency: booking.payment.currency ?? "RWF" };
  if (booking.service) return { amount: booking.service.flatFee, currency: booking.service.currency ?? "RWF" };
  return { amount: 0, currency: "RWF" };
}

export default function BookingsPage() {
  const t = useTranslations("admin.bookings");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { isBookingFirst } = usePaymentMode();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundPercentage, setRefundPercentage] = useState<50 | 100>(100);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkRefundModal, setShowBulkRefundModal] = useState(false);
  const [bulkRefundReason, setBulkRefundReason] = useState("");
  const [bulkRefundPercentage, setBulkRefundPercentage] = useState<50 | 100>(100);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showBulkCompleteModal, setShowBulkCompleteModal] = useState(false);

  const getStatusLabel = (status: Booking["status"]): string => {
    const map: Record<Booking["status"], string> = {
      PENDING: t("pending"),
      CONFIRMED: t("confirmed"),
      ACTIVE: t("active"),
      COMPLETED: t("completed"),
      CANCELLED: t("cancelled"),
      REFUNDED: t("refunded"),
    };
    return map[status] ?? status;
  };

  const formatCurrency = (amount: number, currency = "RWF") => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
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

  const listParams = {
    page: String(page),
    limit: "20",
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  // Fetch bookings
  const { data: bookingsResponse, isLoading: loadingBookings, error: bookingsError } = useGetAdminBookings(listParams);

  // Fetch stats
  const { data: statsResponse, isLoading: loadingStats } = useGetAdminBookingsStats();

  // Mutations
  const completeMutation = usePatchAdminBookingsIdComplete({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminBookingsQueryKey(listParams) });
        queryClient.invalidateQueries({ queryKey: getGetAdminBookingsStatsQueryKey() });
      },
    },
  });

  const refundMutation = usePatchAdminBookingsIdRefund({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminBookingsQueryKey(listParams) });
        queryClient.invalidateQueries({ queryKey: getGetAdminBookingsStatsQueryKey() });
        setShowRefundModal(false);
        setRefundReason("");
        setRefundPercentage(100);
        setSelectedBooking(null);
      },
    },
  });

  const bookings: Booking[] = bookingsResponse?.status === 200 ? bookingsResponse.data.data : [];
  const pagination = bookingsResponse?.status === 200 ? bookingsResponse.data.pagination : undefined;
  const stats = statsResponse?.status === 200 ? statsResponse.data.data : undefined;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableBookings.map((b) => b.id)));
    }
  }

  async function handleBulkComplete() {
    if (bulkCompletable.length === 0) return;
    setShowBulkCompleteModal(true);
  }

  async function confirmBulkComplete() {
    for (const b of bulkCompletable) {
      await completeMutation.mutateAsync({ id: b.id });
    }
    setShowBulkCompleteModal(false);
    setSelectedIds(new Set());
  }

  async function handleBulkRefund() {
    if (bulkRefundable.length === 0) return;
    setShowBulkRefundModal(true);
  }

  async function confirmBulkRefund() {
    if (bulkRefundReason.trim().length < 5) return;
    for (const b of bulkRefundable) {
      await refundMutation.mutateAsync({ id: b.id, data: { reason: bulkRefundReason.trim(), percentage: bulkRefundPercentage } });
    }
    setShowBulkRefundModal(false);
    setBulkRefundReason("");
    setBulkRefundPercentage(100);
    setSelectedIds(new Set());
  }

  // Client-side search filter
  const filteredBookings = search.trim()
    ? bookings.filter((b) => {
        const q = search.toLowerCase();
        const name = `${b.citizen?.firstName ?? ""} ${b.citizen?.lastName ?? ""} ${b.expert?.displayName ?? ""}`.toLowerCase();
        return name.includes(q);
      })
    : bookings;

  // Selection helpers (must be after filteredBookings)
  const selectableBookings = filteredBookings.filter((b) => ["ACTIVE", "CONFIRMED"].includes(b.status));
  const allSelected = selectableBookings.length > 0 && selectableBookings.every((b) => selectedIds.has(b.id));
  const selectedBookings = filteredBookings.filter((b) => selectedIds.has(b.id));
  const bulkCompletable = selectedBookings.filter((b) => b.status === "ACTIVE");
  const bulkRefundable = selectedBookings.filter((b) => ["CONFIRMED", "COMPLETED"].includes(b.status));

  const handleComplete = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCompleteModal(true);
  };

  const confirmComplete = () => {
    if (!selectedBooking) return;
    completeMutation.mutate({ id: selectedBooking.id });
    setShowCompleteModal(false);
    setSelectedBooking(null);
  };

  const handleRefund = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowRefundModal(true);
  };

  const confirmRefund = () => {
    if (!selectedBooking || refundReason.trim().length < 5) return;
    refundMutation.mutate({
      id: selectedBooking.id,
      data: { reason: refundReason.trim(), percentage: refundPercentage },
    });
  };

  if (loadingBookings || loadingStats) {
    return <TableSkeleton statsCount={6} columns={6} />;
  }

  if (bookingsError) {
    return (
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <ErrorState
          title={t("failedToLoad")}
          message={bookingsError instanceof Error ? bookingsError.message : t("unknownError")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            label={t("total")}
            value={stats.totalBookings.toLocaleString()}
            icon={Calendar}
          />
          <StatCard
            label={t("pending")}
            value={stats.counts.PENDING.toLocaleString()}
            icon={Clock}
          />
          <StatCard
            label={t("confirmed")}
            value={stats.counts.CONFIRMED.toLocaleString()}
            icon={CheckCheck}
          />
          <StatCard
            label={t("completed")}
            value={stats.counts.COMPLETED.toLocaleString()}
            icon={CheckCheck}
          />
          <StatCard
            label={t("revenue")}
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
          />
          <StatCard
            label={t("refunded")}
            value={stats.counts.REFUNDED.toLocaleString()}
            icon={DollarSign}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Filter size={16} className="shrink-0 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as StatusFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full min-[360px]:w-[140px] flex-1 min-w-[120px]">
                  <SelectValue placeholder={t("allStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("allStatus")}</SelectItem>
                  <SelectItem value="PENDING">{t("pending")}</SelectItem>
                  <SelectItem value="CONFIRMED">{t("confirmed")}</SelectItem>
                  <SelectItem value="ACTIVE">{t("active")}</SelectItem>
                  <SelectItem value="COMPLETED">{t("completed")}</SelectItem>
                  <SelectItem value="CANCELLED">{t("cancelled")}</SelectItem>
                  <SelectItem value="REFUNDED">{t("refunded")}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                placeholder={t("from")}
                className="w-full min-[360px]:w-auto flex-1 min-w-[120px]"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                placeholder={t("to")}
                className="w-full min-[360px]:w-auto flex-1 min-w-[120px]"
              />
            </div>
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="lg:w-64"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 border-b border-border bg-primary/5 px-6 py-3">
            <span className="text-sm font-medium text-foreground">{t("selected", { count: selectedIds.size })}</span>
            {bulkCompletable.length > 0 && (
              <Button
                size="xs"
                variant="default"
                onClick={handleBulkComplete}
                disabled={completeMutation.isPending}
              >
                <CheckCheck size={14} />
                {t("completeN", { count: bulkCompletable.length })}
              </Button>
            )}
            {!isBookingFirst && bulkRefundable.length > 0 && (
              <Button
                size="xs"
                variant="destructive"
                onClick={handleBulkRefund}
                disabled={refundMutation.isPending}
              >
                <DollarSign size={14} />
                {t("refundN", { count: bulkRefundable.length })}
              </Button>
            )}
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto"
            >
              {t("clearSelection")}
            </Button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="w-10 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-input"
                  />
                </th>
                <th className="px-6 py-4">{t("client")}</th>
                <th className="px-6 py-4">{t("expert")}</th>
                <th className="px-6 py-4">{t("service")}</th>
                <th className="px-6 py-4">{t("scheduled")}</th>
                <th className="px-6 py-4">{t("status")}</th>
                <th className="px-6 py-4">{t("amount")}</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <EmptyState
                      icon={Calendar}
                      title={search.trim() ? t("noBookingsSearch") : t("noBookings")}
                      description=""
                    />
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const name = clientName(booking);
                  const { amount, currency } = bookingAmount(booking);

                  return (
                    <tr key={booking.id} className="transition-colors hover:bg-muted/50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(booking.id)}
                          onChange={() => toggleSelect(booking.id)}
                          disabled={!["ACTIVE", "CONFIRMED"].includes(booking.status)}
                          className="h-4 w-4 rounded border-input disabled:opacity-30"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/dashboard/bookings/${booking.id}`} className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground hover:underline">{name}</p>
                            <p className="text-xs text-muted-foreground">{booking.citizen?.email ?? "—"}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-xs text-success">
                            {(booking.expert?.displayName ?? "E").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {booking.expert?.displayName ?? "Expert"}
                            </p>
                            <p className="text-xs text-muted-foreground">{booking.expert?.user?.email ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">
                          {booking.service?.name ?? t("consultation")}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-foreground">{formatDateTime(booking.scheduledStart)}</p>
                          <p className="text-xs text-muted-foreground">{t("to")} {formatDateTime(booking.scheduledEnd)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge tone={getStatusTone(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">{formatCurrency(amount, currency)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {booking.status === "ACTIVE" && (
                            <Button
                              size="xs"
                              variant="default"
                              onClick={() => handleComplete(booking)}
                              disabled={completeMutation.isPending}
                            >
                              <CheckCheck size={14} />
                              {t("complete")}
                            </Button>
                          )}
                          {!isBookingFirst && (booking.status === "CONFIRMED" || booking.status === "COMPLETED") && (
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() => handleRefund(booking)}
                              disabled={refundMutation.isPending}
                            >
                              <DollarSign size={14} />
                              {t("refund")}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {pagination.page} / {pagination.pages} ({pagination.total})
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
                disabled={page === pagination.pages}
              >
                →
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Refund Modal */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("processRefund")}</DialogTitle>
            <DialogDescription>
              {t("refundBookingFor", { name: selectedBooking ? clientName(selectedBooking) : "" })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                {t("refundAmount")} *
              </label>
              <div className="mt-2 flex gap-3">
                {(() => {
                  if (!selectedBooking) return null;
                  const { amount, currency } = bookingAmount(selectedBooking);
                  return (
                    <>
                      <Button
                        variant={refundPercentage === 50 ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setRefundPercentage(50)}
                      >
                        50% ({formatCurrency(amount * 0.5, currency)})
                      </Button>
                      <Button
                        variant={refundPercentage === 100 ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setRefundPercentage(100)}
                      >
                        100% ({formatCurrency(amount, currency)})
                      </Button>
                    </>
                  );
                })()}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">
                {t("reasonForRefund")} *
              </label>
              <textarea
                className="mt-2 flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                rows={4}
                placeholder={t("refundReasonPlaceholder")}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("minChars")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRefundModal(false);
                setRefundReason("");
                setRefundPercentage(100);
                setSelectedBooking(null);
              }}
            >
              {t("processing")}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRefund}
              disabled={refundReason.trim().length < 5 || refundMutation.isPending}
            >
              {refundMutation.isPending ? t("processing") : t("confirmRefund")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Refund Modal */}
      <Dialog open={showBulkRefundModal} onOpenChange={setShowBulkRefundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("bulkRefund")}</DialogTitle>
            <DialogDescription>
              {t("refundNBookings", { count: bulkRefundable.length })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">{t("refundAmount")} *</label>
              <div className="mt-2 flex gap-3">
                <Button
                  variant={bulkRefundPercentage === 50 ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setBulkRefundPercentage(50)}
                >
                  50%
                </Button>
                <Button
                  variant={bulkRefundPercentage === 100 ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setBulkRefundPercentage(100)}
                >
                  100%
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("reasonForRefund")} *</label>
              <textarea
                className="mt-2 flex min-h-[80px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                rows={4}
                placeholder={t("refundReasonPlaceholder")}
                value={bulkRefundReason}
                onChange={(e) => setBulkRefundReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowBulkRefundModal(false); setBulkRefundReason(""); setBulkRefundPercentage(100); }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkRefund}
              disabled={bulkRefundReason.trim().length < 5 || refundMutation.isPending}
            >
              {refundMutation.isPending ? t("processing") : t("refundNBookingAction", { count: bulkRefundable.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Complete Confirmation Modal */}
      <Dialog open={showCompleteModal} onOpenChange={(open) => {
        if (!open) { setShowCompleteModal(false); setSelectedBooking(null); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("markAsComplete")}</DialogTitle>
            <DialogDescription>
              {t("markCompleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowCompleteModal(false); setSelectedBooking(null); }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmComplete}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? t("processing") : t("confirmComplete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Complete Confirmation Modal */}
      <Dialog open={showBulkCompleteModal} onOpenChange={(open) => {
        if (!open) setShowBulkCompleteModal(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("markAsComplete")}</DialogTitle>
            <DialogDescription>
              {t("markBulkCompleteConfirm", { count: bulkCompletable.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkCompleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBulkComplete}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? t("processing") : t("confirmComplete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
