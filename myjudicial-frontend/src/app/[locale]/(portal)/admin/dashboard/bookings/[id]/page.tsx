"use client";

import { use, useState } from "react";
import { Link } from "@/i18n/routing";
import {
  CalendarDays, Clock, Briefcase, Loader2, AlertCircle,
  ArrowLeft, CheckCircle, XCircle, User, Shield, Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { toast } from "sonner";
import {
  usePatchAdminBookingsIdComplete,
  usePatchAdminBookingsIdRefund,
  getGetAdminBookingsQueryKey,
} from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(start: string, end: string) {
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${diff} min`;
}

const STATUS_STEPS = [
  { key: "PENDING", label: "Booking Created", order: 1 },
  { key: "CONFIRMED", label: "Payment Confirmed", order: 2 },
  { key: "ACTIVE", label: "Consultation Active", order: 3 },
  { key: "COMPLETED", label: "Completed", order: 4 },
] as const;

const STATUS_ORDER: Record<string, number> = {
  PENDING: 1, CONFIRMED: 2, ACTIVE: 3, COMPLETED: 4, CANCELLED: -1, REFUNDED: -1,
};

export default function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { booking, isLoading, error } = useBooking(id);
  const [showComplete, setShowComplete] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundPercentage, setRefundPercentage] = useState(100);

  const completeMutation = usePatchAdminBookingsIdComplete({
    mutation: {
      onSuccess: () => {
        toast.success("Booking marked as complete. Escrow released.");
        queryClient.invalidateQueries({ queryKey: getGetAdminBookingsQueryKey() });
        setShowComplete(false);
      },
      onError: (err: Error) => toast.error(`Failed: ${err.message}`),
    },
  });

  const refundMutation = usePatchAdminBookingsIdRefund({
    mutation: {
      onSuccess: () => {
        toast.success("Refund processed successfully.");
        queryClient.invalidateQueries({ queryKey: getGetAdminBookingsQueryKey() });
        setShowRefund(false);
      },
      onError: (err: Error) => toast.error(`Refund failed: ${err.message}`),
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-brand-dark/50 dark:text-white/50" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white dark:bg-black px-6">
        <AlertCircle className="h-10 w-10 text-brand-alert mb-4" />
        <p className="text-brand-alert font-medium">Failed to load booking</p>
        <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50 mb-6">{error?.message ?? "Booking not found"}</p>
        <Button asChild variant="outline" className="border-brand-border/20 text-xs">
          <Link href="/admin/dashboard/bookings">Back to Bookings</Link>
        </Button>
      </div>
    );
  }

  const canComplete = ["CONFIRMED", "ACTIVE"].includes(booking.status);
  const canRefund = ["CONFIRMED", "ACTIVE", "COMPLETED"].includes(booking.status);
  const currentOrder = STATUS_ORDER[booking.status] ?? 0;
  const isCancelledOrRefunded = ["CANCELLED", "REFUNDED"].includes(booking.status);

  return (
    <main className="flex h-full flex-col bg-white dark:bg-black overflow-y-auto">
      <div className="mx-auto w-full max-w-[780px] flex-1 px-6 py-8">
        <Link
          href="/admin/dashboard/bookings"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white mb-6"
        >
          <ArrowLeft size={14} />
          Back to Bookings
        </Link>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-brand-dark dark:text-white">
              {booking.service?.name ?? "Consultation"}
            </h1>
            <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50">
              Booking <span className="font-mono text-[11px]">{booking.id}</span>
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
            booking.status === "PENDING" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
            booking.status === "CONFIRMED" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
            booking.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
            booking.status === "COMPLETED" ? "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white" :
            booking.status === "CANCELLED" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" :
            "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
          }`}>
            {booking.status}
          </span>
        </div>

        {/* Status Timeline */}
        {!isCancelledOrRefunded && (
          <div className="mb-6 rounded-2xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-4">Progress</h2>
            <div className="flex items-center gap-2">
              {STATUS_STEPS.map((step, i) => {
                const isReached = currentOrder >= step.order;
                return (
                  <div key={step.key} className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                        isReached
                          ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                          : "bg-brand-dark/10 text-brand-dark/40 dark:bg-white/10 dark:text-white/40"
                      }`}>
                        {isReached ? <CheckCircle size={14} /> : step.order}
                      </div>
                      <span className={`text-[11px] font-semibold hidden sm:inline ${
                        isReached ? "text-brand-dark dark:text-white" : "text-brand-dark/40 dark:text-white/40"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-px ${
                        currentOrder > step.order ? "bg-brand-dark dark:bg-white" : "bg-brand-dark/20 dark:bg-white/20"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelled/Refunded info */}
        {isCancelledOrRefunded && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/30 dark:bg-red-900/10">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-[14px] font-bold text-red-800 dark:text-red-300">
                  {booking.status === "CANCELLED" ? "Booking Cancelled" : "Booking Refunded"}
                </h3>
                {booking.cancellationReason && (
                  <p className="mt-1 text-[13px] text-red-700 dark:text-red-400">{booking.cancellationReason}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Schedule */}
          <div className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-3">Schedule</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-brand-dark/50 dark:text-white/50 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-brand-dark dark:text-white">{formatDate(booking.scheduledStart)}</p>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50">Date</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-brand-dark/50 dark:text-white/50 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-brand-dark dark:text-white">
                    {formatTime(booking.scheduledStart)} — {formatTime(booking.scheduledEnd)}
                  </p>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50">
                    Duration: {formatDuration(booking.scheduledStart, booking.scheduledEnd)}
                  </p>
                </div>
              </div>
              {(booking as any).actualStartTime && (booking as any).actualEndTime && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-brand-dark dark:text-white">
                      Actual: {Math.round((new Date((booking as any).actualEndTime).getTime() - new Date((booking as any).actualStartTime).getTime()) / 60000)} min
                    </p>
                    <p className="text-[11px] text-brand-dark/50 dark:text-white/50">Consultation Duration</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Client */}
          <div className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-3">Client</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark/10 dark:bg-white/10">
                <User size={18} className="text-brand-dark dark:text-white" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-brand-dark dark:text-white">
                  {booking.citizen?.firstName} {booking.citizen?.lastName}
                </p>
                {booking.citizen?.email && (
                  <p className="text-[12px] text-brand-dark/50 dark:text-white/50">{booking.citizen.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Expert */}
          <div className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-3">Expert</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark/10 dark:bg-white/10">
                <Shield size={18} className="text-brand-dark dark:text-white" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-brand-dark dark:text-white">
                  {booking.expert?.displayName ?? "Expert"}
                </p>
                {booking.expert?.user?.email && (
                  <p className="text-[12px] text-brand-dark/50 dark:text-white/50">{booking.expert.user.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-3">Payment</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-brand-dark/50 dark:text-white/50">Status</span>
                <span className="font-semibold text-brand-dark dark:text-white">{booking.paymentStatus}</span>
              </div>
              {booking.paymentReferenceId && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-brand-dark/50 dark:text-white/50">Reference</span>
                  <span className="font-medium text-brand-dark dark:text-white text-[11px]">{booking.paymentReferenceId}</span>
                </div>
              )}
              {booking.platformFee != null && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-brand-dark/50 dark:text-white/50">Platform Fee</span>
                  <span className="font-medium text-brand-dark dark:text-white">RWF {Number(booking.platformFee).toLocaleString()}</span>
                </div>
              )}
              {booking.expertPayout != null && (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-brand-dark/50 dark:text-white/50">Expert Payout</span>
                  <span className="font-medium text-brand-dark dark:text-white">RWF {Number(booking.expertPayout).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Citizen notes */}
        {booking.citizenNotes && (
          <div className="mt-6 rounded-2xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-2">Client Notes</h2>
            <p className="text-[13px] text-brand-dark dark:text-white">{booking.citizenNotes}</p>
          </div>
        )}

        {/* Admin Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          {canComplete && (
            <Button
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-[13px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
              disabled={completeMutation.isPending}
              onClick={() => setShowComplete(true)}
            >
              {completeMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Mark Complete & Release Escrow
            </Button>
          )}
          {canRefund && (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border-red-300 px-6 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-50"
              disabled={refundMutation.isPending}
              onClick={() => setShowRefund(true)}
            >
              <Banknote size={15} />
              Process Refund
            </Button>
          )}
        </div>

        {/* Complete Modal */}
        {showComplete && (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900/30 dark:bg-green-900/10">
            <h3 className="text-[14px] font-bold text-green-800 dark:text-green-300 mb-2">Mark as complete?</h3>
            <p className="text-[13px] text-green-700 dark:text-green-400 mb-3">
              This will release the escrowed funds to the expert and mark the booking as COMPLETED.
            </p>
            <div className="flex gap-2">
              <Button
                className="rounded-lg bg-green-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-green-700 disabled:opacity-40"
                disabled={completeMutation.isPending}
                onClick={() => completeMutation.mutate({ id: booking.id })}
              >
                {completeMutation.isPending ? "Processing..." : "Confirm Complete"}
              </Button>
              <Button
                variant="outline"
                className="rounded-lg border-brand-border/20 px-4 py-2 text-[12px] font-semibold"
                onClick={() => setShowComplete(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Refund Modal */}
        {showRefund && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/30 dark:bg-red-900/10">
            <h3 className="text-[14px] font-bold text-red-800 dark:text-red-300 mb-2">Process refund?</h3>
            <p className="text-[13px] text-red-700 dark:text-red-400 mb-3">
              Select refund percentage. The remaining amount will be released to the expert.
            </p>
            <div className="flex gap-2 mb-3">
              {[50, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setRefundPercentage(pct)}
                  className={`rounded-lg px-4 py-2 text-[12px] font-semibold ${
                    refundPercentage === pct
                      ? "bg-red-600 text-white"
                      : "bg-white border border-red-200 text-red-600 hover:bg-red-50"
                  }`}
                >
                  {pct}% Refund
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                className="rounded-lg bg-red-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                disabled={refundMutation.isPending}
                onClick={() => refundMutation.mutate({ id: booking.id, data: { reason: `${refundPercentage}% refund administered by admin`, percentage: refundPercentage as 50 | 100 } })}
              >
                {refundMutation.isPending ? "Processing..." : `Confirm ${refundPercentage}% Refund`}
              </Button>
              <Button
                variant="outline"
                className="rounded-lg border-brand-border/20 px-4 py-2 text-[12px] font-semibold"
                onClick={() => setShowRefund(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
