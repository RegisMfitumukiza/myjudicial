"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import {
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Filter,
  RefreshCw,
  Ban,
  CheckCheck,
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
import { format } from "date-fns";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";

type StatusFilter = GetAdminBookingsStatus | "ALL";

// Helper functions
const getStatusBadge = (status: Booking["status"]) => {
  const configs = {
    PENDING: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock, label: "Pending" },
    CONFIRMED: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle, label: "Confirmed" },
    ACTIVE: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: RefreshCw, label: "Active" },
    COMPLETED: { color: "bg-brand-green/10 text-brand-green", icon: CheckCheck, label: "Completed" },
    CANCELLED: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", icon: Ban, label: "Cancelled" },
    REFUNDED: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle, label: "Refunded" },
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

const formatCurrency = (amount: number, currency = "RWF") => {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM dd, yyyy HH:mm");
  } catch {
    return dateString;
  }
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
    if (!confirm(`Mark ${bulkCompletable.length} booking(s) as completed?`)) return;
    for (const b of bulkCompletable) {
      await completeMutation.mutateAsync({ id: b.id });
    }
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
    if (confirm(`Mark booking for ${clientName(booking)} as completed?`)) {
      completeMutation.mutate({ id: booking.id });
    }
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
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="flex items-center justify-center p-6 lg:p-8" style={{ minHeight: "60vh" }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load bookings</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {bookingsError instanceof Error ? bookingsError.message : "Unknown error occurred"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Bookings Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage all platform consultations and bookings</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <Calendar size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalBookings.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Total</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/10 text-amber-600">
              <Clock size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.counts.PENDING.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Pending</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
              <CheckCircle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.counts.CONFIRMED.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Confirmed</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/10 text-green-600">
              <CheckCheck size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.counts.COMPLETED.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Completed</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
              <DollarSign size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(stats.totalRevenue)}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Revenue</p>
          </div>

          <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-5 shadow-md">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 text-red-600">
              <XCircle size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.counts.REFUNDED.toLocaleString()}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Refunded</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 p-4 shadow-md lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-gray-400" />
          <select
            className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none dark:bg-gray-800 dark:text-gray-100"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none dark:bg-gray-800 dark:text-gray-100"
            placeholder="To"
          />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by client or expert name..."
          className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-blue focus:outline-none dark:bg-gray-800 dark:text-gray-100 lg:w-64"
        />
      </div>

      {/* Bookings Table */}
      <div className="rounded-xl border border-brand-border/20 bg-white dark:bg-gray-900 shadow-md">
        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 border-b border-brand-border/10 bg-brand-blue/5 px-6 py-3">
            <span className="text-sm font-medium text-brand-dark dark:text-gray-100">{selectedIds.size} selected</span>
            {bulkCompletable.length > 0 && (
              <button
                onClick={handleBulkComplete}
                disabled={completeMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCheck size={14} />
                Complete ({bulkCompletable.length})
              </button>
            )}
            {!isBookingFirst && bulkRefundable.length > 0 && (
              <button
                onClick={handleBulkRefund}
                disabled={refundMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle size={14} />
                Refund ({bulkRefundable.length})
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Clear selection
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-brand-border/10 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="w-10 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Expert</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Scheduled</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/10">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {search.trim() ? "No bookings match your search." : "No bookings found."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const name = clientName(booking);
                  const { amount, currency } = bookingAmount(booking);

                  return (
                    <tr key={booking.id} className="transition-colors hover:bg-brand-canvas dark:hover:bg-gray-800">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(booking.id)}
                          onChange={() => toggleSelect(booking.id)}
                          disabled={!["ACTIVE", "CONFIRMED"].includes(booking.status)}
                          className="h-4 w-4 rounded border-gray-300 disabled:opacity-30"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/dashboard/bookings/${booking.id}`} className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10 text-xs text-brand-blue">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 hover:underline">{name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{booking.citizen?.email ?? "—"}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600/10 text-xs text-green-600">
                            {(booking.expert?.displayName ?? "E").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {booking.expert?.displayName ?? "Expert"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{booking.expert?.user?.email ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {booking.service?.name ?? "Consultation"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900 dark:text-gray-100">{formatDateTime(booking.scheduledStart)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">to {formatDateTime(booking.scheduledEnd)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(amount, currency)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {booking.status === "ACTIVE" && (
                            <button
                              onClick={() => handleComplete(booking)}
                              disabled={completeMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                            >
                              <CheckCheck size={14} />
                              Complete
                            </button>
                          )}
                          {!isBookingFirst && (booking.status === "CONFIRMED" || booking.status === "COMPLETED") && (
                            <button
                              onClick={() => handleRefund(booking)}
                              disabled={refundMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                            >
                              <XCircle size={14} />
                              Refund
                            </button>
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
          <div className="flex items-center justify-between border-t border-brand-border/10 px-6 py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
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
                disabled={page === pagination.pages}
                className="rounded-lg border border-brand-border px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Process Refund</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Refund booking for <span className="font-medium">{clientName(selectedBooking)}</span>
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Refund Amount *
                </label>
                <div className="mt-1 flex gap-3">
                  {(() => {
                    const { amount, currency } = bookingAmount(selectedBooking);
                    return (
                      <>
                        <button
                          onClick={() => setRefundPercentage(50)}
                          className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                            refundPercentage === 50
                              ? "border-brand-blue bg-brand-blue text-white"
                              : "border-brand-border bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          }`}
                        >
                          50% ({formatCurrency(amount * 0.5, currency)})
                        </button>
                        <button
                          onClick={() => setRefundPercentage(100)}
                          className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                            refundPercentage === 100
                              ? "border-brand-blue bg-brand-blue text-white"
                              : "border-brand-border bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          }`}
                        >
                          100% ({formatCurrency(amount, currency)})
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reason for refund *
                </label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:bg-gray-800 dark:text-gray-100"
                  rows={4}
                  placeholder="Provide a detailed reason for the refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">Minimum 5 characters required</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundReason("");
                  setRefundPercentage(100);
                  setSelectedBooking(null);
                }}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmRefund}
                disabled={refundReason.trim().length < 5 || refundMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {refundMutation.isPending ? "Processing..." : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Refund Modal */}
      {showBulkRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Bulk Refund</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Refund <span className="font-medium">{bulkRefundable.length}</span> booking(s)
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Refund Amount *</label>
                <div className="mt-1 flex gap-3">
                  <button
                    onClick={() => setBulkRefundPercentage(50)}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      bulkRefundPercentage === 50
                        ? "border-brand-blue bg-brand-blue text-white"
                        : "border-brand-border bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    50%
                  </button>
                  <button
                    onClick={() => setBulkRefundPercentage(100)}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      bulkRefundPercentage === 100
                        ? "border-brand-blue bg-brand-blue text-white"
                        : "border-brand-border bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    100%
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason for refund *</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 text-sm text-gray-900 focus:border-brand-blue focus:outline-none dark:bg-gray-800 dark:text-gray-100"
                  rows={4}
                  placeholder="Provide a detailed reason for the refund..."
                  value={bulkRefundReason}
                  onChange={(e) => setBulkRefundReason(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowBulkRefundModal(false); setBulkRefundReason(""); setBulkRefundPercentage(100); }}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkRefund}
                disabled={bulkRefundReason.trim().length < 5 || refundMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {refundMutation.isPending ? "Processing..." : `Refund ${bulkRefundable.length} Booking(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
