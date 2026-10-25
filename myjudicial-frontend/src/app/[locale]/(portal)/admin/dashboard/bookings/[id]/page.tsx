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
  Phone,
  Smartphone,
  AlertCircle,
  AlertTriangle,
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
import { Textarea } from "@/shared/components/ui/textarea";
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
  const [refundReason, setRefundReason] = useState("Client dispute arbitrated by admin — 100% full refund");

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
    return t("durationMin", { n: diff, min: diff });
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
      <div className="space-y-6 p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
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
    <div className="space-y-6 p-2 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
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

      {/* Dispute Resolution Card (Gap D) */}
      {booking.issueReportedAt && !isCancelledOrRefunded && booking.status !== "COMPLETED" && (
        <Card className="border-destructive/40 bg-destructive/5 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <CardTitle className="text-sm font-bold text-destructive">
                  Action Required: Active Client Dispute (Escrow Paused)
                </CardTitle>
              </div>
              <span className="rounded-full bg-destructive/20 px-2.5 py-0.5 text-[11px] font-bold text-destructive">
                Dispute Open
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-destructive/20 bg-background/80 p-3.5 text-xs">
              <p className="font-semibold text-foreground mb-1">
                Reported by: {booking.citizen?.firstName} {booking.citizen?.lastName}
                {(booking as any).citizen?.phone ? ` • ${(booking as any).citizen.phone}` : ""}
                {booking.citizen?.email ? ` • ${booking.citizen.email}` : ""}
              </p>
              <p className="text-muted-foreground mb-2">
                Reported on: {new Date(booking.issueReportedAt).toLocaleString(locale)}
              </p>
              <div className="rounded-lg bg-destructive/10 p-2.5 text-destructive font-medium whitespace-pre-wrap">
                "{booking.issueReason}"
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Investigate the matter. Choose to issue a 100% refund to the citizen via Mobile Money, or dismiss the dispute and release funds to the expert.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={refundMutation.isPending}
                  onClick={() => setShowRefund(true)}
                  className="gap-1.5"
                >
                  <Banknote size={14} />
                  Approve 100% Refund to Client
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  disabled={completeMutation.isPending}
                  onClick={() => setShowComplete(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  <CheckCircle size={14} />
                  Dismiss & Release to Expert
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      {!isCancelledOrRefunded && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("progress")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
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
                    {t("actualMin", {
                      n: Math.round((new Date((booking as any).actualEndTime).getTime() - new Date((booking as any).actualStartTime).getTime()) / 60000),
                      min: Math.round((new Date((booking as any).actualEndTime).getTime() - new Date((booking as any).actualStartTime).getTime()) / 60000),
                    })}
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
                {booking.citizen?.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Phone size={11} className="text-muted-foreground/70" />
                    <span>{booking.citizen.phone}</span>
                  </p>
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
                {booking.expert?.user?.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Phone size={11} className="text-muted-foreground/70" />
                    <span>{booking.expert.user.phone}</span>
                  </p>
                )}
                {(booking.expert as any)?.momoNumber && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 mt-0.5">
                    <Smartphone size={11} className="text-amber-600 dark:text-amber-400" />
                    <span>MoMo: {(booking.expert as any).momoNumber}</span>
                  </p>
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
              <span className="text-muted-foreground">{t("status")}</span>
              <span className="font-semibold text-foreground">{booking.paymentStatus}</span>
            </div>
            {booking.paymentReferenceId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("reference")}</span>
                <span className="font-medium text-foreground text-xs break-all">{booking.paymentReferenceId}</span>
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

        {/* Delivery & Escrow Handshake */}
        {(booking.deliveredAt || booking.issueReportedAt) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Delivery & Escrow Handshake
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {booking.deliveredAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Delivered At</span>
                  <span className="font-medium text-foreground">{formatDate(booking.deliveredAt)} {formatTime(booking.deliveredAt)}</span>
                </div>
              )}
              {booking.autoReleaseAt && booking.status !== "COMPLETED" && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Auto-Release Scheduled</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatDate(booking.autoReleaseAt)} {formatTime(booking.autoReleaseAt)}</span>
                </div>
              )}
              {booking.deliverySummary && (
                <div className="pt-2">
                  <span className="text-muted-foreground block text-xs mb-1">Expert Summary</span>
                  <p className="rounded-lg bg-muted p-2.5 text-xs text-foreground whitespace-pre-wrap">{booking.deliverySummary}</p>
                </div>
              )}
              {booking.issueReportedAt && (
                <div className="pt-2 border-t border-border">
                  <span className="text-destructive font-semibold block text-xs mb-1">Client Reported Issue</span>
                  <p className="rounded-lg bg-destructive/10 text-destructive p-2.5 text-xs whitespace-pre-wrap">{booking.issueReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
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

      {/* Refund Dialog (Gap C: Binary 100% Model) */}
      <Dialog open={showRefund} onOpenChange={setShowRefund}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("processRefund")}</DialogTitle>
            <DialogDescription>
              This will issue an immediate 100% refund of{" "}
              <strong>{formatCurrency(Number(booking.payment?.amount ?? booking.service?.flatFee ?? 0), booking.service?.currency ?? "RWF")}</strong>{" "}
              directly back to the client's Mobile Money wallet via AzamPay, and mark this booking as REFUNDED.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-foreground">
              Reason for Refund (sent to citizen & expert):
            </label>
            <Textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Client reported expert no-show, technical connection failure..."
              rows={3}
              className="text-xs"
            />
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
              disabled={refundMutation.isPending || refundReason.trim().length < 5}
              onClick={() =>
                refundMutation.mutate({
                  id: booking.id,
                  data: {
                    reason: refundReason.trim(),
                    percentage: 100,
                  },
                })
              }
            >
              {refundMutation.isPending ? t("processing") : "Confirm 100% Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
