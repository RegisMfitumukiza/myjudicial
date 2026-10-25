"use client";

import { use, useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import {
  CalendarDays, Clock, MapPin, Briefcase, Loader2, AlertCircle,
  ArrowLeft, Video, XCircle, CheckCircle, Star, MessageSquare, RefreshCw,
  Receipt, Download, CalendarClock, Phone, Mail, FileText, Navigation, ExternalLink, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { toast } from "sonner";
import { useCancelBooking } from "@/features/booking/hooks/useCancelBooking";
import { useRetryPayment } from "@/features/booking/hooks/useRetryPayment";
import { useRescheduleBooking } from "@/features/booking/hooks/useRescheduleBooking";
import { useApproveReschedule, useDeclineReschedule } from "@/features/booking/hooks/useApproveDeclineReschedule";
import { useConfirmConsultationCompletion, useReportConsultationIssue } from "@/features/booking/hooks/useDeliveryLifecycle";
import { RescheduleModal } from "@/features/booking/components/reschedule-modal";
import { ReschedulePendingBanner } from "@/features/booking/components/reschedule-pending-banner";
import { downloadICS } from "@/features/booking/lib/ics";
import { apiFetch } from "@/lib/api/client";
import { getChatConversationsByBookingBookingId } from "@/api/generated";
import type { Booking } from "@/api/generated";
import type { ServiceNested } from "@/api/generated";
import { useTranslations, useLocale } from "next-intl";
import { CaseDocumentsCard } from "@/features/documents/components/case-documents-card";

type BookingWithService = Booking & {
  expert?: {
    id: string;
    displayName: string;
    officeAddress?: string | null;
    city?: string | null;
    user?: { id?: string; email: string; phone?: string | null };
  };
  service?: ServiceNested & {
    description?: string;
    category?: string;
    deliveryMode?: "VIDEO" | "IN_PERSON" | "PHONE" | "EMAIL" | string;
    durationMin?: number;
  };
};

function formatDate(iso: string, locale: string = "en") {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(iso: string, locale: string = "en") {
  const d = new Date(iso);
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
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

function useCountdown(targetIso?: string | null) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean } | null>(null);

  useEffect(() => {
    if (!targetIso) return;
    function calculate() {
      const diff = new Date(targetIso!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    }
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  return timeLeft;
}

export default function ConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("clientDashboard.consultationDetail");
  const locale = useLocale();
  const { booking, isLoading, error } = useBooking(id);
  const countdown = useCountdown(booking?.autoReleaseAt);
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const { mutate: retryPayment, isPending: isRetrying } = useRetryPayment();
  const { mutate: rescheduleBooking, isPending: isRescheduling } = useRescheduleBooking();
  const { mutate: approveReschedule, isPending: isApproving } = useApproveReschedule();
  const { mutate: declineReschedule, isPending: isDeclining } = useDeclineReschedule();
  const { mutate: confirmCompletion, isPending: isConfirming } = useConfirmConsultationCompletion();
  const { mutate: reportIssue, isPending: isReporting } = useReportConsultationIssue();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [issueReason, setIssueReason] = useState("");
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
    win.document.write(`<!DOCTYPE html><html><head><title>${t("receipt.windowTitle")}</title>
<style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;color:#24558d}</style></head><body><p>${t("receipt.loading")}</p></body></html>`);
    win.document.close();
    try {
      const json = await apiFetch<{ success: boolean; message?: string; data: any }>(
        `/payments/${booking.id}/receipt`,
      );
      if (!json.success) throw new Error(json.message ?? t("toasts.failedToDownloadReceipt"));
      const r = json.data;
      const dateLocale = locale;
      win.document.write(`<!DOCTYPE html><html><head><title>${t("receipt.windowTitle")} ${r.receiptNo}</title>
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
  @media print{
    .actions{display:none !important}
    body{margin:0;padding:20px}
  }
</style></head><body>
<div class="header">
  <h1>${t("receipt.pageTitle")}</h1>
  <p>${r.receiptNo} &bull; ${new Date(r.paidAt ?? r.createdAt).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })}</p>
</div>
<table>
  <tr><td>${t("receipt.colConsultation")}</td><td>${r.service?.name ?? "N/A"}</td></tr>
  <tr><td>${t("receipt.colExpert")}</td><td>${r.expert.name}</td></tr>
  <tr><td>${t("receipt.colDate")}</td><td>${new Date(r.booking.scheduledStart).toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })} ${new Date(r.booking.scheduledStart).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}</td></tr>
  <tr><td>${t("receipt.colDuration")}</td><td>${r.booking.actualDurationMin ?? r.service?.durationMin ?? "N/A"} min</td></tr>
  <tr><td>${t("receipt.colPaymentStatus")}</td><td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td></tr>
  <tr><td>${t("receipt.colTransactionRef")}</td><td style="font-family:monospace;font-size:12px">${r.transactionRef}</td></tr>
  <tr class="total"><td>${t("receipt.colTotalPaid")}</td><td>${r.currency} ${Number(r.amount).toLocaleString()}</td></tr>
  <tr><td>${t("receipt.colPlatformFee")}</td><td>${r.currency} ${Number(r.platformFee).toLocaleString()}</td></tr>
  <tr><td>${t("receipt.colExpertPayout")}</td><td>${r.currency} ${Number(r.expertPayout).toLocaleString()}</td></tr>
</table>
<div class="actions">
  <button class="btn btn-primary" onclick="window.print()">${t("receipt.printButton")}</button>
</div>
<div class="footer">${t("receipt.footer")}<br>${t("receipt.footerGenerated")}</div>
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
  const isPaymentPending = booking.status === "PENDING" && booking.paymentStatus === "PENDING";
  const isPaymentFailed = booking.status === "PENDING" && booking.paymentStatus === "FAILED";
  const canRetry = isPaymentPending || isPaymentFailed;
  const JOINABLE_WINDOW_MS = 15 * 60 * 1000;
  const startsInMs = new Date(booking.scheduledStart).getTime() - Date.now();
  const canJoin = ["CONFIRMED", "ACTIVE"].includes(booking.status) && (booking.status === "ACTIVE" || startsInMs <= JOINABLE_WINDOW_MS);
  const canReview = booking.status === "COMPLETED" && !booking.review;
  const canMessage = ["CONFIRMED", "ACTIVE", "COMPLETED"].includes(booking.status);
  const canDownloadReceipt = booking.paymentStatus === "PAID";
  const canReschedule = ["PENDING", "CONFIRMED", "ACTIVE"].includes(booking.status) && booking.status !== "COMPLETED";
  const currentOrder = STATUS_ORDER[booking.status] ?? 0;
  const isCancelledOrRefunded = ["CANCELLED", "REFUNDED"].includes(booking.status);

  const deliveryMode = (booking as BookingWithService).service?.deliveryMode ?? "VIDEO";
  const isVideo = deliveryMode === "VIDEO";
  const isInPerson = deliveryMode === "IN_PERSON";
  const isPhone = deliveryMode === "PHONE";
  const isDocument = deliveryMode === "EMAIL";
  const officeAddress = (booking as BookingWithService).expert?.officeAddress || (booking as BookingWithService).expert?.city || null;

  // ── Cancellation policy logic ──
  const msUntilStart = new Date(booking.scheduledStart).getTime() - Date.now();
  const hoursUntilStart = msUntilStart / (1000 * 60 * 60);
  const msSinceCreated = Date.now() - new Date(booking.createdAt).getTime();
  const GRACE_PERIOD_MS = 60 * 60 * 1000; // 60 minutes buyer's remorse
  const isWithinGrace = msSinceCreated < GRACE_PERIOD_MS;
  const isFreeCancellation = hoursUntilStart > 24;
  const isGracePeriod = !isFreeCancellation && isWithinGrace;
  const isLateCancellation = !isFreeCancellation && !isWithinGrace;
  const totalPaid = Number(booking.service?.flatFee ?? 0);
  const refundAmount = isLateCancellation ? Math.round(totalPaid * 0.5) : totalPaid;
  const expertCompensation = isLateCancellation ? Math.round(totalPaid * 0.5) : 0;
  const freeCancellationDeadline = new Date(new Date(booking.scheduledStart).getTime() - 24 * 60 * 60 * 1000);

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
    <div className="flex-1 min-w-0">
      <div className="mx-auto w-full max-w-[780px] p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
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
            {t(`status.${booking.status}` as any, { default: booking.status })}
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

        {/* Payment Pending Banner */}
        {isPaymentPending && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50/80 p-5 dark:border-amber-900/30 dark:bg-amber-950/20 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Smartphone size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-bold text-amber-950 dark:text-amber-200">
                    {t("paymentPendingBannerTitle")}
                  </h3>
                  <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                    {t("paymentPendingBadge")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                  {t("paymentPendingBannerDesc", { amount: Number(booking.service?.flatFee ?? 0).toLocaleString() })}
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <Button
                    size="sm"
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 flex items-center gap-1.5 shadow-sm"
                    disabled={isRetrying}
                    onClick={() => retryPayment({ bookingId: booking.id })}
                  >
                    {isRetrying ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    {isRetrying ? t("retrying") : t("sendMomoPromptNow")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Failed Banner */}
        {isPaymentFailed && (
          <div className="mb-6 rounded-2xl border border-red-300 bg-red-50/80 p-5 dark:border-red-900/30 dark:bg-red-950/20 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-[14px] font-bold text-red-950 dark:text-red-200">
                  {t("paymentFailedBannerTitle")}
                </h3>
                <p className="mt-1 text-xs text-red-900/80 dark:text-red-300/80 leading-relaxed">
                  {t("paymentFailedBannerDesc")}
                </p>
                <div className="mt-3">
                  <Button
                    size="sm"
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 flex items-center gap-1.5 shadow-sm"
                    disabled={isRetrying}
                    onClick={() => retryPayment({ bookingId: booking.id })}
                  >
                    {isRetrying ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    {isRetrying ? t("retrying") : t("retryPayment")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery / Escrow Confirmation Banner */}
        {booking.deliveredAt && booking.status !== "COMPLETED" && !booking.issueReportedAt && (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-50/60 p-6 dark:border-emerald-500/20 dark:bg-emerald-950/20">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <CheckCircle size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-emerald-950 dark:text-emerald-100">
                  {t("deliveryBannerTitle")}
                </h3>
                <p className="mt-1 text-[13px] text-emerald-900/80 dark:text-emerald-200/80">
                  {t("deliveryBannerDesc")}
                </p>
                {booking.autoReleaseAt && (
                  <p className="mt-2 text-[12px] font-medium text-emerald-800/70 dark:text-emerald-300/70">
                    {t("autoReleaseNotice", { date: new Date(booking.autoReleaseAt).toLocaleString(locale) })}
                  </p>
                )}
                {booking.autoReleaseAt && countdown && !countdown.isExpired && (
                  <div className="mt-2.5 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-100/80 px-3 py-1.5 text-xs font-bold text-emerald-950 dark:bg-emerald-900/40 dark:text-emerald-200 shadow-xs">
                    <Clock size={13} className="animate-pulse text-emerald-700 dark:text-emerald-400" />
                    <span>
                      {t("autoReleaseCountdown", {
                        hours: countdown.hours,
                        minutes: countdown.minutes,
                        seconds: countdown.seconds,
                      })}
                    </span>
                  </div>
                )}
                {booking.deliverySummary && (
                  <div className="mt-3 rounded-xl border border-emerald-500/20 bg-white/80 p-3.5 text-[13px] text-brand-dark dark:bg-black/40 dark:text-white">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-300 block mb-1">
                      {t("expertNotesTitle")}
                    </span>
                    <p className="whitespace-pre-wrap">{booking.deliverySummary}</p>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    onClick={() => confirmCompletion(booking.id)}
                    disabled={isConfirming}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
                  >
                    {isConfirming ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    {isConfirming ? t("confirmingCompletion") : t("confirmCompletion")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReportIssue(true)}
                    className="border-emerald-600/30 text-emerald-950 hover:bg-emerald-100/50 dark:text-emerald-200 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2"
                  >
                    <AlertCircle size={14} />
                    {t("reportIssue")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Issue Reported Banner */}
        {booking.issueReportedAt && booking.status !== "COMPLETED" && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-50/60 p-5 dark:border-amber-500/20 dark:bg-amber-950/20">
            <div className="flex items-start gap-3.5">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-amber-900 dark:text-amber-200">
                  {t("issueReportedBanner", { reason: booking.issueReason ?? "Issue reported" })}
                </p>
              </div>
            </div>
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

        {/* Delivery Mode Banner for Confirmed / Active Bookings */}
        {["CONFIRMED", "ACTIVE"].includes(booking.status) && (
          <>
            {isInPerson && (
              <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-50/70 p-5 dark:border-emerald-500/20 dark:bg-emerald-950/20 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-emerald-950 dark:text-emerald-200">
                          {t("inPersonTitle")}
                        </h3>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                          {t("modeInPerson")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
                        {t("inPersonDesc")}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                        <MapPin size={13} className="text-emerald-600 shrink-0" />
                        {officeAddress || "Registered Law Office, Kigali"}
                      </p>
                      <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                        {t("arrivalNotice")}
                      </p>
                    </div>
                  </div>
                  {officeAddress && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(officeAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button size="sm" className="gap-1.5 rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 shadow-sm whitespace-nowrap">
                        <Navigation size={13} /> {t("getDirections")}
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            {isPhone && (
              <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-50/70 p-5 dark:border-blue-500/20 dark:bg-blue-950/20 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <Phone size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-blue-950 dark:text-blue-200">
                        {t("phoneTitle")}
                      </h3>
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        {t("modePhone")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-blue-900/80 dark:text-blue-300/80 leading-relaxed">
                      {t("phoneDesc")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isDocument && (
              <div className="mb-6 rounded-2xl border border-purple-500/30 bg-purple-50/70 p-5 dark:border-purple-500/20 dark:bg-purple-950/20 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-purple-950 dark:text-purple-200">
                          {t("documentReviewTitle")}
                        </h3>
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                          {t("modeDocument")}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-purple-900/80 dark:text-purple-300/80 leading-relaxed">
                        {t("documentReviewDesc")}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const docSection = document.getElementById("case-documents-section");
                      if (docSection) docSection.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="shrink-0 gap-1.5 rounded-xl border-purple-300 text-xs font-semibold text-purple-800 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                  >
                    <FileText size={13} /> {t("viewCaseDocuments")}
                  </Button>
                </div>
              </div>
            )}
          </>
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
                  <p className="text-[13px] font-medium text-brand-dark dark:text-white">{formatDate(booking.scheduledStart, locale)}</p>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50">{t("dateLabel")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-brand-dark/50 dark:text-white/50 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-brand-dark dark:text-white">
                    {formatTime(booking.scheduledStart, locale)} — {formatTime(booking.scheduledEnd, locale)}
                  </p>
                  <p className="text-[11px] text-brand-dark/50 dark:text-white/50">
                    {t("durationLabel", { duration: t("minutesSuffix", { count: formatDurationMin(booking.scheduledStart, booking.scheduledEnd) }) })}
                  </p>
                </div>
              </div>
              {isInPerson && officeAddress && (
                <div className="flex items-center gap-3 pt-2 border-t border-border/60">
                  <MapPin className="h-4 w-4 text-brand-dark/50 dark:text-white/50 shrink-0" />
                  <div>
                    <p className="text-[12px] font-medium text-brand-dark dark:text-white">{officeAddress}</p>
                    <p className="text-[11px] text-brand-dark/50 dark:text-white/50">{t("officeAddressLabel")}</p>
                  </div>
                </div>
              )}
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
              
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-brand-dark/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark dark:bg-white/10 dark:text-white">
                  {isInPerson ? <MapPin size={11} /> : isPhone ? <Phone size={11} /> : isDocument ? <FileText size={11} /> : <Video size={11} />}
                  {isInPerson ? t("modeInPerson") : isPhone ? t("modePhone") : isDocument ? t("modeDocument") : t("modeVideo")}
                </span>
                {(booking as BookingWithService).service?.category && (
                  <span className="rounded-md bg-brand-dark/5 px-2 py-0.5 text-[11px] font-medium text-brand-dark/60 dark:bg-white/5 dark:text-white/60">
                    {(booking as BookingWithService).service!.category!.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              {(booking as BookingWithService).service?.description && (
                <p className="mt-2 text-[12px] text-brand-dark/50 dark:text-white/50">{(booking as BookingWithService).service?.description}</p>
              )}
              <p className="mt-2.5 text-[13px] font-semibold text-brand-dark dark:text-white">
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
                  <span className="text-brand-dark/50 dark:text-white/50">{t("paymentStatusLabel")}</span>
                  <span className="font-semibold text-brand-dark dark:text-white">{t(`paymentStatus.${booking.paymentStatus}` as any, { default: booking.paymentStatus })}</span>
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

        {/* Cancellation Policy Banner */}
        {canCancel && (
          <div className={`mt-6 rounded-2xl border p-4 shadow-sm ${
            isFreeCancellation
              ? "border-emerald-500/30 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-950/20"
              : isGracePeriod
              ? "border-blue-500/30 bg-blue-50/60 dark:border-blue-500/20 dark:bg-blue-950/20"
              : "border-amber-500/30 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-950/20"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${
                isFreeCancellation ? "bg-emerald-600" : isGracePeriod ? "bg-blue-600" : "bg-amber-600"
              }`}>
                {isFreeCancellation ? <CheckCircle size={16} /> : <Clock size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-[13px] font-bold ${
                  isFreeCancellation
                    ? "text-emerald-950 dark:text-emerald-200"
                    : isGracePeriod
                    ? "text-blue-950 dark:text-blue-200"
                    : "text-amber-950 dark:text-amber-200"
                }`}>
                  {isFreeCancellation
                    ? t("cancellationPolicy.freeTitle")
                    : isGracePeriod
                    ? t("cancellationPolicy.graceTitle")
                    : t("cancellationPolicy.lateTitle")}
                </h4>
                <p className={`mt-0.5 text-[12px] leading-relaxed ${
                  isFreeCancellation
                    ? "text-emerald-900/80 dark:text-emerald-300/80"
                    : isGracePeriod
                    ? "text-blue-900/80 dark:text-blue-300/80"
                    : "text-amber-900/80 dark:text-amber-300/80"
                }`}>
                  {isFreeCancellation
                    ? t("cancellationPolicy.freeDesc", { deadline: freeCancellationDeadline.toLocaleString(locale) })
                    : isGracePeriod
                    ? t("cancellationPolicy.graceDesc")
                    : t("cancellationPolicy.lateDesc", { refund: refundAmount.toLocaleString(), total: totalPaid.toLocaleString() })}
                </p>
              </div>
            </div>
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
              {isRetrying ? t("retrying") : isPaymentPending ? t("sendMomoPromptNow") : t("retryPayment")}
            </Button>
          )}
          {isVideo && ["CONFIRMED", "ACTIVE"].includes(booking.status) && (
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
          {booking.review && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-50/50 px-4 py-2.5 text-[13px] font-semibold text-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
              <Star size={15} className="fill-amber-400 text-amber-500" />
              <span>{booking.review.rating}/5 Rated</span>
            </div>
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

        {/* Case Documents */}
        <div id="case-documents-section" className="mt-6">
          <CaseDocumentsCard bookingId={booking.id} canUpload />
        </div>

        {/* Cancel Modal */}
        {showCancel && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/30 dark:bg-red-900/10">
            <h3 className="text-[14px] font-bold text-red-800 dark:text-red-300 mb-2">{t("cancelModal.title")}</h3>
            {/* Refund policy disclosure */}
            <div className={`mb-3 rounded-lg p-3 text-[12px] leading-relaxed break-words ${
              isLateCancellation
                ? "bg-amber-100/80 border border-amber-300/50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                : "bg-emerald-100/80 border border-emerald-300/50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
            }`}>
              {isLateCancellation ? (
                <>
                  <p className="font-semibold">{t("cancelModal.lateNoticeTitle")}</p>
                  <p className="mt-1">{t("cancelModal.lateNoticeDesc", { refund: refundAmount.toLocaleString(), compensation: expertCompensation.toLocaleString(), total: totalPaid.toLocaleString() })}</p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 underline"
                    onClick={() => { setShowCancel(false); setShowReschedule(true); }}
                  >
                    <CalendarClock size={13} />
                    {t("cancelModal.rescheduleInstead")}
                  </button>
                </>
              ) : (
                <p className="font-semibold">{t("cancelModal.freeNotice")}</p>
              )}
            </div>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t("cancelModal.reasonPlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2.5 text-[13px] text-brand-dark outline-none placeholder:text-brand-dark/30 focus:border-red-400 dark:bg-black dark:text-white"
            />
            <div className="mt-3 flex flex-wrap gap-2">
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

        {/* Report Issue Form */}
        {showReportIssue && (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/80 p-5 dark:border-amber-900/30 dark:bg-amber-900/10 mb-6">
            <h3 className="text-[14px] font-bold text-amber-950 dark:text-amber-200 mb-1">{t("reportIssueModalTitle")}</h3>
            <p className="text-[12px] text-amber-900/70 dark:text-amber-300/70 mb-3">{t("reportIssueModalDesc")}</p>
            <textarea
              value={issueReason}
              onChange={(e) => setIssueReason(e.target.value)}
              placeholder={t("issueReasonPlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-[13px] text-brand-dark outline-none placeholder:text-brand-dark/30 focus:border-amber-500 dark:bg-black dark:text-white"
            />
            <div className="mt-3 flex gap-2 justify-end">
              <Button
                variant="outline"
                className="rounded-lg border-brand-border/20 px-4 py-2 text-[12px] font-semibold"
                onClick={() => { setShowReportIssue(false); setIssueReason(""); }}
              >
                {t("cancelModal.keepBooking")}
              </Button>
              <Button
                className="rounded-lg bg-amber-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
                disabled={isReporting || issueReason.trim().length < 5}
                onClick={() => {
                  reportIssue({ bookingId: booking.id, reason: issueReason.trim() }, {
                    onSuccess: () => {
                      setShowReportIssue(false);
                      setIssueReason("");
                      toast.success("Issue reported. Escrow auto-release paused.");
                    },
                    onError: (err: any) => toast.error(err.message ?? "Failed to report issue"),
                  });
                }}
              >
                {isReporting ? t("reportingIssue") : t("submitIssue")}
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
    </div>
  );
}
