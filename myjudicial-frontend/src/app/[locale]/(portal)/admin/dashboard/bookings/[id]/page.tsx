"use client";

import { use, useState, useMemo } from "react";
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
import { useTranslations, useLocale } from "next-intl";

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
  const t = useTranslations("admin.bookings");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { booking, isLoading, error } = useBooking(id);
  const [showComplete, setShowComplete] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundPercentage, setRefundPercentage] = useState(100);

  const statusSteps = useMemo(() => [
    { key: "PENDING", label: t("bookingCreated"), order: 1 },
    { key: "CONFIRMED", label: t("paymentConfirmed"), order: 2 },
    { key: "ACTIVE", label: t("consultationActive"), order: 3 },
    { key: "COMPLETED", label: t("completed"), order: 4 },
  ], [t]);

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (start: string, end: string) => {
    const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    return t("durationMin", { min: diff });
  };

  const formatCurrency = (amount: number, currency = "RWF") => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const completeMutation = usePatchAdminBookingsIdComplete({
    mutation: {
      onSuccess: () => {
        toast.success(t("bookingCompleteToast"));
        queryClient.invalidateQueries({ queryKey: getGetAdminBookingsQueryKey() });
        setShowComplete(false);
      },
      onError: () => toast.error(t("actionFailed")),
    },
  });

  const refundMutation = usePatchAdminBookingsIdRefund({
    mutation: {
      onSuccess: () => {
        toast.success(t("refundProcessed"));
        queryClient.invalidateQueries({ queryKey: getGetAdminBookingsQueryKey() });
        setShowRefund(false);
      },
      onError: () => toast.error(t("refundFailed")),
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6 p-6 lg:p-8">
        <PageHeader
          title={t("title")}
          backHref="/admin/dashboard/bookings"
          backLabel={t("backToBookings")}
        />
        <ErrorState
          title={t("failedToLoad")}
          message={error?.message ?? t("bookingNotFound")}
          action={
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/dashboard/bookings">{t("backToBookings")}</Link>
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
        title={booking.service?.name ?? t("consultation")}
        description={`Booking ${booking.id}`}
        backHref="/admin/dashboard/bookings"
        backLabel={t("backToBookings")}
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
              {t("progress")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {statusSteps.map((step, i) => {
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
                    {i < statusSteps.length - 1 && (
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
                {booking.status === "CANCELLED" ? t("bookingCancelled") : t("bookingRefunded")}
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
              {t("schedule")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{formatDate(booking.scheduledStart)}</p>
                <p className="text-xs text-muted-foreground">{t("scheduled")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {formatTime(booking.scheduledStart)} &mdash; {formatTime(booking.scheduledEnd)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("duration")}: {formatDuration(booking.scheduledStart, booking.scheduledEnd)}
                </p>
              </div>
            </div>
            {(booking as any).actualStartTime && (booking as any).actualEndTime && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-success" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("actualMin", { min: Math.round((new Date((booking as any).actualEndTime).getTime() - new Date((booking as any).actualStartTime).getTime()) / 60000) })}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("consultationDuration")}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("client")}
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
              {t("expert")}
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
              {t("payment")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("allStatus")}</span>
              <span className="font-semibold text-foreground">{booking.paymentStatus}</span>
            </div>
            {booking.paymentReferenceId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("reference")}</span>
                <span className="font-medium text-foreground text-xs">{booking.paymentReferenceId}</span>
              </div>
            )}
            {booking.platformFee != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("platformFee")}</span>
                <span className="font-medium text-foreground">{formatCurrency(Number(booking.platformFee))}</span>
              </div>
            )}
            {booking.expertPayout != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("expertPayout")}</span>
                <span className="font-medium text-foreground">{formatCurrency(Number(booking.expertPayout))}</span>
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
              {t("clientNotes")}
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
            {t("markCompleteRelease")}
          </Button>
        )}
        {canRefund && (
          <Button
            variant="destructive"
            disabled={refundMutation.isPending}
            onClick={() => setShowRefund(true)}
          >
            <Banknote size={15} />
            {t("processRefund")}
          </Button>
        )}
      </div>

      {/* Complete Dialog */}
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("markAsComplete")}</DialogTitle>
            <DialogDescription>
              {t("markAsCompleteDesc")}
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
              {completeMutation.isPending ? t("processing") : t("confirmComplete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefund} onOpenChange={setShowRefund}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("processRefund")}</DialogTitle>
            <DialogDescription>
              {t("processRefundDesc")}
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
                {t("pctRefund", { pct })}
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
              {refundMutation.isPending ? t("processing") : t("confirmPctRefund", { pct: refundPercentage })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
