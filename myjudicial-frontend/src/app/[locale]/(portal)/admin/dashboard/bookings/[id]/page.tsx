"use client";

import { use, useState } from "react";
import { Link } from "@/i18n/routing";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Shield,
  Banknote,
} from "lucide-react";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { toast } from "sonner";
import {
  usePatchAdminBookingsIdComplete,
  usePatchAdminBookingsIdRefund,
  getGetAdminBookingsQueryKey,
} from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/shared/components/dashboard/page-header";
import { StatusBadge, type StatusTone } from "@/shared/components/dashboard/status-badge";
import { LoadingSpinner } from "@/shared/components/dashboard/loading";
import { ErrorState } from "@/shared/components/dashboard/error-state";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";

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

const getStatusTone = (status: string): StatusTone => {
  const map: Record<string, StatusTone> = {
    PENDING: "pending",
    CONFIRMED: "info",
    ACTIVE: "active",
    COMPLETED: "success",
    CANCELLED: "destructive",
    REFUNDED: "destructive",
  };
  return map[status] ?? "neutral";
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
      <div className="space-y-6 p-6 lg:p-8">
        <LoadingSpinner label="Loading booking..." />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <PageHeader
          title="Booking Detail"
          backHref="/admin/dashboard/bookings"
          backLabel="Back to Bookings"
        />
        <ErrorState
          title="Failed to load booking"
          message={error?.message ?? "Booking not found"}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/dashboard/bookings">Back to Bookings</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const canComplete = ["CONFIRMED", "ACTIVE"].includes(booking.status);
  const canRefund = ["CONFIRMED", "ACTIVE", "COMPLETED"].includes(booking.status);
  const currentOrder = STATUS_ORDER[booking.status] ?? 0;
  const isCancelledOrRefunded = ["CANCELLED", "REFUNDED"].includes(booking.status);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        title={booking.service?.name ?? "Consultation"}
        description={`Booking ${booking.id}`}
        backHref="/admin/dashboard/bookings"
        backLabel="Back to Bookings"
        actions={
          <StatusBadge tone={getStatusTone(booking.status)}>
            {booking.status}
          </StatusBadge>
        }
      />

      {/* Status Timeline */}
      {!isCancelledOrRefunded && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {STATUS_STEPS.map((step, i) => {
                const isReached = currentOrder >= step.order;
                return (
                  <div key={step.key} className="flex flex-1 items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                          isReached
                            ? "bg-primary text-primary-foreground dark:bg-white dark:text-black"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isReached ? <CheckCircle size={14} /> : step.order}
                      </div>
                      <span
                        className={`text-[11px] font-semibold hidden sm:inline ${
                          isReached ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-px ${
                          currentOrder > step.order ? "bg-primary dark:bg-white" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled/Refunded info */}
      {isCancelledOrRefunded && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-destructive">
                {booking.status === "CANCELLED" ? "Booking Cancelled" : "Booking Refunded"}
              </h3>
              {booking.cancellationReason && (
                <p className="mt-1 text-sm text-destructive/80">{booking.cancellationReason}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{formatDate(booking.scheduledStart)}</p>
                <p className="text-xs text-muted-foreground">Date</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatTime(booking.scheduledStart)} &mdash; {formatTime(booking.scheduledEnd)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Duration: {formatDuration(booking.scheduledStart, booking.scheduledEnd)}
                </p>
              </div>
            </div>
            {(booking as any).actualStartTime && (booking as any).actualEndTime && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-success" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Actual: {Math.round((new Date((booking as any).actualEndTime).getTime() - new Date((booking as any).actualStartTime).getTime()) / 60000)} min
                  </p>
                  <p className="text-xs text-muted-foreground">Consultation Duration</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <User size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {booking.citizen?.firstName} {booking.citizen?.lastName}
                </p>
                {booking.citizen?.email && (
                  <p className="text-xs text-muted-foreground">{booking.citizen.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expert */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Expert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Shield size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {booking.expert?.displayName ?? "Expert"}
                </p>
                {booking.expert?.user?.email && (
                  <p className="text-xs text-muted-foreground">{booking.expert.user.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold text-foreground">{booking.paymentStatus}</span>
            </div>
            {booking.paymentReferenceId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium text-foreground text-xs">{booking.paymentReferenceId}</span>
              </div>
            )}
            {booking.platformFee != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-medium text-foreground">RWF {Number(booking.platformFee).toLocaleString()}</span>
              </div>
            )}
            {booking.expertPayout != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Expert Payout</span>
                <span className="font-medium text-foreground">RWF {Number(booking.expertPayout).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Citizen notes */}
      {booking.citizenNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Client Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{booking.citizenNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Admin Actions */}
      <div className="flex flex-wrap gap-3">
        {canComplete && (
          <Button
            disabled={completeMutation.isPending}
            onClick={() => setShowComplete(true)}
          >
            <CheckCircle size={15} />
            Mark Complete & Release Escrow
          </Button>
        )}
        {canRefund && (
          <Button
            variant="destructive"
            disabled={refundMutation.isPending}
            onClick={() => setShowRefund(true)}
          >
            <Banknote size={15} />
            Process Refund
          </Button>
        )}
      </div>

      {/* Complete Dialog */}
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as complete?</DialogTitle>
            <DialogDescription>
              This will release the escrowed funds to the expert and mark the booking as COMPLETED.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowComplete(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={completeMutation.isPending}
              onClick={() => completeMutation.mutate({ id: booking.id })}
            >
              {completeMutation.isPending ? "Processing..." : "Confirm Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefund} onOpenChange={setShowRefund}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process refund?</DialogTitle>
            <DialogDescription>
              Select refund percentage. The remaining amount will be released to the expert.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            {[50, 100].map((pct) => (
              <Button
                key={pct}
                variant={refundPercentage === pct ? "default" : "outline"}
                className="flex-1"
                onClick={() => setRefundPercentage(pct)}
              >
                {pct}% Refund
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefund(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={refundMutation.isPending}
              onClick={() => refundMutation.mutate({ id: booking.id, data: { reason: `${refundPercentage}% refund administered by admin`, percentage: refundPercentage as 50 | 100 } })}
            >
              {refundMutation.isPending ? "Processing..." : `Confirm ${refundPercentage}% Refund`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
