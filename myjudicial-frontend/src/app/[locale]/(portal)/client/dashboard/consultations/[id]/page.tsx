"use client";

import { use, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import {
  CalendarDays, Clock, MapPin, Briefcase, Loader2, AlertCircle,
  ArrowLeft, Video, XCircle, CheckCircle, Star, MessageSquare, RefreshCw,
  Receipt, Download, CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { toast } from "sonner";
import { useCancelBooking } from "@/features/booking/hooks/useCancelBooking";
import { useRetryPayment } from "@/features/booking/hooks/useRetryPayment";
import { useRescheduleBooking } from "@/features/booking/hooks/useRescheduleBooking";
import { useApproveReschedule, useDeclineReschedule } from "@/features/booking/hooks/useApproveDeclineReschedule";
import { RescheduleModal } from "@/features/booking/components/reschedule-modal";
import { ReschedulePendingBanner } from "@/features/booking/components/reschedule-pending-banner";
import { downloadICS } from "@/features/booking/lib/ics";
import { apiFetch } from "@/lib/api/client";
import { getChatConversationsByBookingBookingId } from "@/api/generated";
import type { Booking } from "@/api/generated";
import type { ServiceNested } from "@/api/generated";
import { useTranslations } from "next-intl";

type BookingWithService = Booking & {
  service?: ServiceNested & { description?: string; durationMin?: number };
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDurationMin(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / 60000);
}

const STATUS_STEPS = [
  { key: "PENDING", order: 1 },
  { key: "CONFIRMED", order: 2 },
  { key: "ACTIVE", order: 3 },
  { key: "COMPLETED", order: 4 },
] as const;

const STATUS_ORDER: Record<string, number> = {
  PENDING: 1,
  CONFIRMED: 2,
  ACTIVE: 3,
  COMPLETED: 4,
  CANCELLED: -1,
  REFUNDED: -1,
};

export default function ConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("clientDashboard.consultationDetail");
  const { booking, isLoading, error } = useBooking(id);
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const { mutate: retryPayment, isPending: isRetrying } = useRetryPayment();
  const { mutate: rescheduleBooking, isPending: isRescheduling } = useRescheduleBooking();
  const { mutate: approveReschedule, isPending: isApproving } = useApproveReschedule();
  const { mutate: declineReschedule, isPending: isDeclining } = useDeclineReschedule();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [isResolvingChat, setIsResolvingChat] = useState(false);

  async function handleMessageExpert() {
    if (!booking) return;
    setIsResolvingChat(true);
    try {
      const result = await getChatConversationsByBookingBookingId(booking.id);
      if (result.status === 200) {
        router.push(`/client/dashboard/messages?conversationId=${result.data.data.id}`);
      } else {
        toast.error(t("toasts.conversationNotAvailable"));
      }
    } catch {
      toast.error(t("toasts.conversationNotAvailable"));
    } finally {
      setIsResolvingChat(false);
    }
  }

  async function handleDownloadReceipt() {
    if (!booking) return;
    const win = window.open("", "_blank");
    if (!win) { toast.error(t("toasts.popupBlocked")); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt</title>
<style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#24558d}</style></head><body><p>Loading receipt...</p></body></html>`);
    win.document.close();
    try {
      const json = await apiFetch<{ success: boolean; message?: string; data: any }>(
        `/payments/${booking.id}/receipt`,
      );
      if (!json.success) throw new Error(json.message ?? "Failed to fetch receipt");
      const r = json.data;
      win.document.write(`<!DOCTYPE html><html><head><title>Receipt ${r.receiptNo}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:40px auto;padding:20px;color:#1a1a2e}
  .header{text-align:center;border-bottom:2px solid #24558d;padding-bottom:16px;margin-bottom:24px}
  .header h1{font-size:18px;color:#24558d;margin:0 0 4px}
  .header p{font-size:12px;color:#666;margin:0}
  table{width:100%;border-collapse:collapse;margin:16px 0}
  td{padding:6px 0;font-size:13px;border-bottom:1px solid #eee}
  td:first-child{color:#666;width:40%}
  td:last-child{font-weight:500;text-align:right}
  .total td{border-top:2px solid #24558d;font-weight:700;font-size:15px;border-bottom:none;padding-top:12px}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase}
  .badge.paid{background:#d1fae5;color:#065f46}
  .badge.pending{background:#fef3c7;color:#92400e}
  .badge.failed{background:#fee2e2;color:#991b1b}
  .footer{margin-top:32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:16px}
  .actions{display:flex;gap:12px;justify-content:center;margin-top:24px}
  .btn{display:inline-block;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;transition:opacity .15s}
  .btn:hover{opacity:.85}
  .btn-primary{background:#24558d;color:#fff;border:none}
  .btn-outline{background:#fff;color:#24558d;border:1.5px solid #24558d}
  @media print{
    .actions{display:none !important}
    body{margin:0;padding:20px}
  }
</style></head><body>
<div class="header">
  <h1>MyJudicial Payment Receipt</h1>
  <p>${r.receiptNo} &bull; ${new Date(r.paidAt ?? r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
</div>
<table>
  <tr><td>Consultation</td><td>${r.service?.name ?? "N/A"}</td></tr>
  <tr><td>Expert</td><td>${r.expert.name}</td></tr>
  <tr><td>Date</td><td>${new Date(r.booking.scheduledStart).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} ${new Date(r.booking.scheduledStart).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</td></tr>
  <tr><td>Duration</td><td>${r.booking.actualDurationMin ?? r.service?.durationMin ?? "N/A"} min</td></tr>
  <tr><td>Payment Status</td><td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td></tr>
  <tr><td>Transaction Ref</td><td style="font-family:monospace;font-size:12px">${r.transactionRef}</td></tr>
  <tr class="total"><td>Total Paid</td><td>${r.currency} ${Number(r.amount).toLocaleString()}</td></tr>
  <tr><td>Platform Fee</td><td>${r.currency} ${Number(r.platformFee).toLocaleString()}</td></tr>
  <tr><td>Expert Payout</td><td>${r.currency} ${Number(r.expertPayout).toLocaleString()}</td></tr>
</table>
<div class="actions">
  <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
</div>
<div class="footer">MyJudicial &mdash; Professional Legal Marketplace<br>This receipt was generated automatically.</div>
</body></html>`);
      win.document.close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toasts.failedToDownloadReceipt"));
    }
  }

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
        <p className="text-brand-alert font-medium">{t("errors.failedToLoad")}</p>
        <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50 mb-6">{error?.message ?? t("errors.bookingNotFound")}</p>
        <Button asChild variant="outline" className="border-brand-border/20 text-xs">
          <Link href="/client/dashboard/consultations">{t("backToMyBookings")}</Link>
        </Button>
      </div>
    );
  }

  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);
  const canRetry = booking.status === "PENDING" && booking.paymentStatus === "FAILED";
  const JOINABLE_WINDOW_MS = 15 * 60 * 1000;
  const startsInMs = new Date(booking.scheduledStart).getTime() - Date.now();
  const canJoin = ["CONFIRMED", "ACTIVE"].includes(booking.status) && (booking.status === "ACTIVE" || startsInMs <= JOINABLE_WINDOW_MS);
  const canReview = booking.status === "COMPLETED";
  const canMessage = ["CONFIRMED", "ACTIVE", "COMPLETED"].includes(booking.status);
  const canDownloadReceipt = booking.paymentStatus === "PAID";
  const canReschedule = ["PENDING", "CONFIRMED"].includes(booking.status) && new Date(booking.scheduledStart) > new Date();
  const currentOrder = STATUS_ORDER[booking.status] ?? 0;
  const isCancelledOrRefunded = ["CANCELLED", "REFUNDED"].includes(booking.status);

  function handleCancel() {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) return;
    cancelBooking({ bookingId: booking!.id, reason: cancelReason.trim() }, {
      onSuccess: () => {
        setShowCancel(false);
        setCancelReason("");
      },
      onError: (err: Error) => toast.error(t("toasts.failedToCancel", { message: err.message })),
    });
  }

  function handleReschedule(data: { bookingId: string; scheduledStart: string; scheduledEnd: string; reason?: string }) {
    if (!booking) return;
    rescheduleBooking({
      bookingId: booking.id,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      reason: data.reason,
    }, {
      onSuccess: () => setShowReschedule(false),
    });
  }

  return (
    <main className="flex h-full flex-col bg-white dark:bg-black overflow-y-auto">
      <div className="mx-auto w-full max-w-[780px] flex-1 px-6 py-8">
        {/* Back link */}
        <Link
          href="/client/dashboard/consultations"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark/60 hover:text-brand-dark dark:text-white/60 dark:hover:text-white mb-6"
        >
          <ArrowLeft size={14} />
          {t("backToMyBookings")}
        </Link>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-brand-dark dark:text-white">
              {booking.service?.name ?? t("consultationFallback")}
            </h1>
            <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50">
              {t("withExpert", { expertName: booking.expert?.displayName ?? t("legalExpertFallback") })}
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

        {/* Pending Reschedule Banner */}
        {booking.pendingRescheduleStart && booking.pendingRescheduleEnd && (
          <div className="mb-6">
            <ReschedulePendingBanner
              currentStart={booking.scheduledStart}
              currentEnd={booking.scheduledEnd}
              pendingStart={booking.pendingRescheduleStart}
              pendingEnd={booking.pendingRescheduleEnd}
              reason={booking.pendingRescheduleReason}
              requestedBy={booking.pendingRescheduleRequestedBy ?? ""}
              currentUserId={booking.citizenId}
              isApproving={isApproving}
              isDeclining={isDeclining}
              onApprove={() => approveReschedule({ bookingId: booking.id })}
              onDecline={(reason) => declineReschedule({ bookingId: booking.id, reason })}
            />
          </div>
        )}

        {/* Status Timeline */}
        {!isCancelledOrRefunded && (
          <div className="mb-6 rounded-2xl border border-brand-border/20 bg-white p-6 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-4">{t("progress")}</h2>
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
                        {t(`steps.${step.key}`)}
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
                  {booking.status === "CANCELLED" ? t("bookingCancelled") : t("bookingRefunded")}
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
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-3">{t("sections.schedule")}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-brand-dark/50 dark:text-white/50 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-brand-dark dark:text-white">{formatDate(booking.scheduledStart)}</p>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50">{t("dateLabel")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-brand-dark/50 dark:text-white/50 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-brand-dark dark:text-white">
                    {formatTime(booking.scheduledStart)} — {formatTime(booking.scheduledEnd)}
                  </p>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50">
                    {t("durationLabel", { duration: t("minutesSuffix", { count: formatDurationMin(booking.scheduledStart, booking.scheduledEnd) }) })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expert */}
          <div className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-3">{t("sections.legalExpert")}</h2>
            <div>
              <p className="text-[15px] font-bold text-brand-dark dark:text-white">{booking.expert?.displayName ?? t("legalExpertFallback")}</p>
              {booking.expert?.user?.email && (
                <p className="text-[12px] text-brand-dark/50 dark:text-white/50">{booking.expert.user.email}</p>
              )}
            </div>
          </div>

          {/* Service */}
          <div className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-3">{t("sections.service")}</h2>
            <div>
              <p className="text-[15px] font-bold text-brand-dark dark:text-white">{(booking as BookingWithService).service?.name ?? t("consultationFallback")}</p>
              {(booking as BookingWithService).service?.description && (
                <p className="mt-1 text-[12px] text-brand-dark/50 dark:text-white/50">{(booking as BookingWithService).service?.description}</p>
              )}
              <p className="mt-2 text-[13px] font-semibold text-brand-dark dark:text-white">
                RWF {booking.service?.flatFee?.toLocaleString() ?? "—"}
              </p>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-3">{t("sections.payment")}</h2>
            {booking.paymentStatus === "NOT_REQUIRED" ? (
              <p className="text-[13px] text-brand-dark/60 dark:text-white/60">{t("paymentNotRequired")}</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-brand-dark/50 dark:text-white/50">{t("paymentStatus")}</span>
                  <span className="font-semibold text-brand-dark dark:text-white">{booking.paymentStatus}</span>
                </div>
                {booking.paymentReferenceId && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-brand-dark/50 dark:text-white/50">{t("paymentReference")}</span>
                    <span className="font-medium text-brand-dark dark:text-white text-[11px]">{booking.paymentReferenceId}</span>
                  </div>
                )}
                {booking.platformFee != null && (
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-brand-dark/50 dark:text-white/50">{t("platformFee")}</span>
                    <span className="font-medium text-brand-dark dark:text-white">RWF {Number(booking.platformFee).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Citizen notes */}
        {booking.citizenNotes && (
          <div className="mt-6 rounded-2xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-white/20 dark:bg-black">
            <h2 className="text-[13px] font-bold uppercase tracking-widest text-brand-dark/50 dark:text-white/50 mb-2">{t("sections.yourNotes")}</h2>
            <p className="text-[13px] text-brand-dark dark:text-white">{booking.citizenNotes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          {canRetry && (
            <Button
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-[13px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
              disabled={isRetrying}
              onClick={() => retryPayment({ bookingId: booking.id })}
            >
              {isRetrying ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              {isRetrying ? t("retrying") : t("retryPayment")}
            </Button>
          )}
          {["CONFIRMED", "ACTIVE"].includes(booking.status) && (
            <Button
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-semibold ${
                canJoin
                  ? "bg-brand-dark text-white hover:opacity-90 dark:bg-white dark:text-black"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
              }`}
              onClick={() => canJoin && router.push(`/client/dashboard/consultations/${booking.id}/join`)}
              disabled={!canJoin}
            >
              <Video size={15} />
              {canJoin ? t("joinConsultation") : t("notYetTime")}
            </Button>
          )}
          {canMessage && (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border-brand-border/20 px-6 py-3 text-[13px] font-semibold text-brand-dark dark:text-white"
              disabled={isResolvingChat}
              onClick={handleMessageExpert}
            >
              {isResolvingChat ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
              {t("messageExpert")}
            </Button>
          )}
          {canCancel && !showCancel && (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border-red-300 px-6 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-50"
              onClick={() => setShowCancel(true)}
            >
              <XCircle size={15} />
              {t("cancelBooking")}
            </Button>
          )}
          {canReschedule && !showReschedule && (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border-brand-border/20 px-6 py-3 text-[13px] font-semibold text-brand-dark dark:text-white"
              onClick={() => setShowReschedule(true)}
            >
              <CalendarClock size={15} />
              {t("reschedule")}
            </Button>
          )}
          {canReview && (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border-brand-border/20 px-6 py-3 text-[13px] font-semibold text-brand-dark dark:text-white"
              onClick={() => router.push(`/client/dashboard/consultations/${booking.id}/review`)}
            >
              <Star size={15} />
              {t("leaveReview")}
            </Button>
          )}
          {canDownloadReceipt && (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border-brand-border/20 px-6 py-3 text-[13px] font-semibold text-brand-dark dark:text-white"
              onClick={handleDownloadReceipt}
            >
              <Receipt size={15} />
              {t("downloadReceipt")}
            </Button>
          )}
          {["CONFIRMED", "COMPLETED"].includes(booking.status) && (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border-brand-border/20 px-6 py-3 text-[13px] font-semibold text-brand-dark dark:text-white"
              onClick={() => downloadICS({
                id: booking.id,
                expertName: booking.expert?.displayName ?? "Expert",
                serviceName: booking.service?.name ?? t("consultationFallback"),
                start: booking.scheduledStart,
                end: booking.scheduledEnd,
                description: booking.citizenNotes ?? undefined,
              })}
            >
              <CalendarDays size={15} />
              {t("addToCalendar")}
            </Button>
          )}
        </div>

        {/* Cancel Modal */}
        {showCancel && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/30 dark:bg-red-900/10">
            <h3 className="text-[14px] font-bold text-red-800 dark:text-red-300 mb-2">{t("cancelModal.title")}</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t("cancelModal.reasonPlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-[13px] text-brand-dark outline-none placeholder:text-brand-dark/30 focus:border-red-400 dark:bg-black dark:text-white"
            />
            <div className="mt-3 flex gap-2">
              <Button
                className="rounded-lg bg-red-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                disabled={isCancelling || cancelReason.trim().length < 5}
                onClick={handleCancel}
              >
                {isCancelling ? t("cancelModal.cancelling") : t("cancelModal.confirmCancellation")}
              </Button>
              <Button
                variant="outline"
                className="rounded-lg border-brand-border/20 px-4 py-2 text-[12px] font-semibold"
                onClick={() => { setShowCancel(false); setCancelReason(""); }}
              >
                {t("cancelModal.keepBooking")}
              </Button>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showReschedule && booking && (
          <RescheduleModal
            bookingId={booking.id}
            expertId={booking.expertId}
            serviceName={booking.service?.name}
            currentStart={booking.scheduledStart}
            currentEnd={booking.scheduledEnd}
            durationMin={booking.service?.durationMin ?? 60}
            isPending={isRescheduling}
            onReschedule={handleReschedule}
            onClose={() => setShowReschedule(false)}
          />
        )}
      </div>
    </main>
  );
}
