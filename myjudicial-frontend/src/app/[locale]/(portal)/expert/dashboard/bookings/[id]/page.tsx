"use client";

import { use, useState, useCallback } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import {
  CalendarDays, Loader2,
  ArrowLeft, Video, XCircle, CheckCircle, Check, MessageSquare, User, CalendarClock,
  FileText, CreditCard, Briefcase, MapPin, Phone, Brain, Sparkles, Send,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { StatusBadge, LoadingSpinner, ErrorState, type StatusTone } from "@/shared/components/dashboard";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { toast } from "sonner";
import { useCancelBooking } from "@/features/booking/hooks/useCancelBooking";
import { useAcceptBooking } from "@/features/booking/hooks/useAcceptBooking";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";
import { useRescheduleBooking } from "@/features/booking/hooks/useRescheduleBooking";
import { useApproveReschedule, useDeclineReschedule } from "@/features/booking/hooks/useApproveDeclineReschedule";
import { RescheduleModal } from "@/features/booking/components/reschedule-modal";
import { ReschedulePendingBanner } from "@/features/booking/components/reschedule-pending-banner";
import { downloadICS } from "@/features/booking/lib/ics";
import { getChatConversationsByBookingBookingId } from "@/api/generated";
import { useCaseAnalysis } from "@/features/ai/hooks/use-case-analysis";
import { usePostChatMessages } from "@/api/generated";
import { AiAnalysisCard } from "@/features/ai/components/ai-analysis-card";
import type { CaseAnalysis } from "@/features/ai/types";
import { getErrorMessage } from "@/lib/utils";
import { CaseDocumentsCard } from "@/features/documents/components/case-documents-card";

function formatDuration(start: string, end: string) {
  const diff = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return `${diff}`;
}

const STATUS_STEPS = [
  { key: "PENDING", labelKey: "created", order: 1 },
  { key: "CONFIRMED", labelKey: "paid", order: 2 },
  { key: "ACTIVE", labelKey: "active", order: 3 },
  { key: "COMPLETED", labelKey: "done", order: 4 },
] as const;

const STATUS_ORDER: Record<string, number> = {
  PENDING: 1, CONFIRMED: 2, ACTIVE: 3, COMPLETED: 4, CANCELLED: -1, REFUNDED: -1,
};

const STATUS_TONE: Record<string, StatusTone> = {
  PENDING: "pending",
  CONFIRMED: "active",
  ACTIVE: "active",
  COMPLETED: "success",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default function ExpertBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("expertDashboard_bookings");
  const locale = useLocale();

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }

  const { booking, isLoading, error } = useBooking(id);
  const { isBookingFirst } = usePaymentMode();
  const { mutate: acceptBooking, isPending: isAccepting } = useAcceptBooking();
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const { mutate: rescheduleBooking, isPending: isRescheduling } = useRescheduleBooking();
  const { mutate: approveReschedule, isPending: isApproving } = useApproveReschedule();
  const { mutate: declineReschedule, isPending: isDeclining } = useDeclineReschedule();
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [isResolvingChat, setIsResolvingChat] = useState(false);

  function handleAccept() {
    if (!booking) return;
    acceptBooking(booking.id, {
      onSuccess: () => {
        toast.success(t("toasts.acceptSuccess"));
      },
      onError: (err) => {
        toast.error(getErrorMessage(err, t("toasts.acceptError")));
      },
    });
  }

  const analyzeMutation = useCaseAnalysis();
  const [aiAnalysis, setAiAnalysis] = useState<CaseAnalysis | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [consultationNotes, setConsultationNotes] = useState("");
  const [notesAnalysis, setNotesAnalysis] = useState<CaseAnalysis | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const notesMutation = useCaseAnalysis();
  const [summaryText, setSummaryText] = useState("");
  const [summarySent, setSummarySent] = useState(false);
  const { mutate: sendChatMessage, isPending: isSendingSummary } = usePostChatMessages();

  const handleAnalyzeCase = useCallback(async () => {
    const notes = booking?.citizenNotes;
    if (!notes || analyzeMutation.isPending) return;
    setAiError(null);
    try {
      const result = await analyzeMutation.mutateAsync({ text: notes });
      setAiAnalysis(result.analysis);
    } catch {
      setAiError("Could not analyze case. Please try again.");
    }
  }, [booking, analyzeMutation]);

  const handleAnalyzeNotes = useCallback(async () => {
    if (!consultationNotes.trim() || notesMutation.isPending) return;
    setNotesError(null);
    try {
      const result = await notesMutation.mutateAsync({ text: consultationNotes.trim() });
      setNotesAnalysis(result.analysis);
      const a = result.analysis;
      const parts = [
        a.reasoning && `**Case Analysis**\n${a.reasoning}`,
        a.possible_legal_issues?.length && `**Legal Issues Identified**\n${a.possible_legal_issues.map((i: string) => `- ${i}`).join("\n")}`,
        a.key_entities?.length && `**Key Entities**\n${a.key_entities.map((e: string) => `- ${e}`).join("\n")}`,
        a.suggested_documents?.length && `**Suggested Documents**\n${a.suggested_documents.map((d: string | { document: string; reason: string }) => `- ${typeof d === "string" ? d : d.document}`).join("\n")}`,
        `**Specialty:** ${a.specialty?.replace(/_/g, " ")}`,
        `**Urgency:** ${a.urgency_level?.replace(/_/g, " ")}`,
        `**Jurisdiction:** ${a.jurisdiction || "N/A"}`,
      ].filter(Boolean);
      setSummaryText(parts.join("\n\n"));
    } catch {
      setNotesError("Could not analyze notes. Please try again.");
    }
  }, [consultationNotes, notesMutation]);

  const handleSendSummary = useCallback(async () => {
    if (!summaryText.trim() || !booking || isSendingSummary) return;
    try {
      const result = await getChatConversationsByBookingBookingId(booking.id);
      if (result.status !== 200 || !result.data?.data?.id) {
        toast.error(t("toasts.noChatFound"));
        return;
      }
      sendChatMessage(
        { data: { conversationId: result.data.data.id, content: summaryText.trim() } },
        {
          onSuccess: () => {
            setSummarySent(true);
            toast.success(t("toasts.summarySent"));
          },
          onError: (err) => {
            toast.error(getErrorMessage(err, t("toasts.summaryError")));
          },
        },
      );
    } catch {
      toast.error(t("toasts.chatUnavailable"));
    }
  }, [summaryText, booking, isSendingSummary, sendChatMessage, t]);

  async function handleMessageClient() {
    if (!booking) return;
    setIsResolvingChat(true);
    try {
      const result = await getChatConversationsByBookingBookingId(booking.id);
      if (result.status === 200) {
        router.push(`/expert/dashboard/messages?conversationId=${result.data.data.id}`);
      } else {
        toast.error(t("toasts.chatUnavailable"));
      }
    } catch {
      toast.error(t("toasts.chatUnavailable"));
    } finally {
      setIsResolvingChat(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <ErrorState
          title={t("toasts.loadError")}
          message={t("toasts.bookingNotFound")}
          action={
            <Button variant="outline" asChild>
              <Link href="/expert/dashboard/bookings">{t("actions.backToBookings")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const JOINABLE_WINDOW_MS = 15 * 60 * 1000;
  const canDecline = booking.status === "PENDING";
  const startsInMs = new Date(booking.scheduledStart).getTime() - Date.now();
  const canJoin = (booking.status === "ACTIVE" || (booking.status === "CONFIRMED" && startsInMs <= JOINABLE_WINDOW_MS)) && startsInMs > -JOINABLE_WINDOW_MS;
  const canMessage = ["CONFIRMED", "ACTIVE", "COMPLETED"].includes(booking.status);
  const canReschedule = ["PENDING", "CONFIRMED"].includes(booking.status) && new Date(booking.scheduledStart) > new Date();
  const currentOrder = STATUS_ORDER[booking.status] ?? 0;
  const isCancelledOrRefunded = ["CANCELLED", "REFUNDED"].includes(booking.status);

  function handleDecline() {
    if (!booking || !declineReason.trim() || declineReason.trim().length < 5) return;
    cancelBooking({ bookingId: booking.id, reason: declineReason.trim() }, {
      onSuccess: () => { setShowDecline(false); setDeclineReason(""); },
      onError: (err) => toast.error(getErrorMessage(err, "Failed to decline booking.")),
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

  const clientName = `${booking.citizen?.firstName ?? ""} ${booking.citizen?.lastName ?? ""}`.trim() || "Client";
  const clientInitials = clientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex-1 min-w-0">
      <div className="mx-auto w-full max-w-[780px] p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
        {/* Back */}
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-6 text-muted-foreground">
          <Link href="/expert/dashboard/bookings">
            <ArrowLeft />
            {t("actions.backToBookings")}
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {booking.service?.name ?? t("details.service")}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("details.withClient", { name: clientName })}
            </p>
          </div>
          <StatusBadge tone={STATUS_TONE[booking.status] ?? "pending"}>
            {t(`status.${booking.status.toLowerCase()}` as any, { defaultValue: booking.status })}
          </StatusBadge>
        </div>

        {/* Pending Reschedule Banner */}
        {booking.pendingRescheduleStart && booking.pendingRescheduleEnd && (
          <div className="mb-8">
            <ReschedulePendingBanner
              currentStart={booking.scheduledStart}
              currentEnd={booking.scheduledEnd}
              pendingStart={booking.pendingRescheduleStart}
              pendingEnd={booking.pendingRescheduleEnd}
              reason={booking.pendingRescheduleReason}
              requestedBy={booking.pendingRescheduleRequestedBy ?? ""}
              currentUserId={booking.expertId}
              isApproving={isApproving}
              isDeclining={isDeclining}
              onApprove={() => approveReschedule({ bookingId: booking.id })}
              onDecline={(reason) => declineReschedule({ bookingId: booking.id, reason })}
            />
          </div>
        )}

        {/* Status Timeline */}
        {!isCancelledOrRefunded && (
          <div className="mb-8 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm overflow-x-auto scrollbar-none">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-5">{t("details.progress")}</h2>
            <div className="flex items-center gap-0 min-w-[480px]">
              {STATUS_STEPS.map((step, i) => {
                const isReached = currentOrder >= step.order;
                const isCurrent = currentOrder === step.order;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold transition-all ${
                        isCurrent
                          ? "bg-primary text-on-brand shadow-md"
                          : isReached
                            ? "bg-primary text-on-brand"
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {isReached ? <CheckCircle size={14} /> : step.order}
                      </div>
                      <span className={`text-xs font-medium hidden sm:inline whitespace-nowrap ${
                        isCurrent ? "text-foreground" : isReached ? "text-muted-foreground" : "text-muted-foreground/60"
                      }`}>
                        {step.key === "CONFIRMED" && isBookingFirst ? t("status.confirmed") : t(`status.${step.labelKey}` as any)}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-3 ${
                        currentOrder > step.order ? "bg-primary" : "bg-border"
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
          <div className="mb-8 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-destructive">
                  {booking.status === "CANCELLED" ? t("details.bookingCancelled") : t("details.bookingRefunded")}
                </h3>
                {booking.cancellationReason && (
                  <p className="mt-1 text-xs text-destructive/80">
                    {t("details.reason", { reason: booking.cancellationReason })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
          {/* Schedule */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <CalendarDays size={14} />
              </div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("details.schedule")}</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{formatDate(booking.scheduledStart)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("details.date")}</p>
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {formatTime(booking.scheduledStart)} — {formatTime(booking.scheduledEnd)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("details.duration", { duration: formatDuration(booking.scheduledStart, booking.scheduledEnd) })}
                </p>
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <User size={14} />
              </div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("details.client")}</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/20">
                {clientInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{clientName}</p>
                {booking.citizen?.email && (
                  <p className="text-xs text-muted-foreground mt-0.5">{booking.citizen.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Service */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Briefcase size={14} />
                </div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("details.service")}</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary">
                {((booking as any).service?.deliveryMode === "IN_PERSON") ? (
                  <>
                    <MapPin size={10} />
                    <span>{t("deliveryModes.inPerson")}</span>
                  </>
                ) : ((booking as any).service?.deliveryMode === "PHONE") ? (
                  <>
                    <Phone size={10} />
                    <span>{t("deliveryModes.phoneCall")}</span>
                  </>
                ) : ((booking as any).service?.deliveryMode === "EMAIL") ? (
                  <>
                    <FileText size={10} />
                    <span>{t("deliveryModes.documents")}</span>
                  </>
                ) : (
                  <>
                    <Video size={10} />
                    <span>{t("deliveryModes.videoCall")}</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">{booking.service?.name ?? t("details.service")}</p>
            {(booking.service as any)?.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{(booking.service as any).description}</p>
            )}
            <p className="text-sm font-medium text-foreground mt-1.5">
              RWF {booking.service?.flatFee?.toLocaleString() ?? "—"}
            </p>
            {((booking as any).service?.deliveryMode === "IN_PERSON") && (booking as any).expert?.officeAddress && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 border-t border-border pt-2">
                <MapPin size={11} className="shrink-0 text-primary" />
                <span>{t("details.officeLocation", { address: `${(booking as any).expert.officeAddress}${(booking as any).expert?.city ? `, ${(booking as any).expert.city}` : ""}` })}</span>
              </p>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <CreditCard size={14} />
              </div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("details.payment")}</h3>
            </div>
            <div className="space-y-2.5">
              {booking.paymentStatus === "NOT_REQUIRED" ? (
                <p className="text-xs text-muted-foreground">
                  {t("details.paymentPendingNotice")}
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("details.statusLabel")}</span>
                    <StatusBadge
                      tone={booking.paymentStatus === "PAID" ? "success" : "pending"}
                      className="px-2 py-0.5 text-[10px]"
                    >
                      {booking.paymentStatus}
                    </StatusBadge>
                  </div>
                  {booking.expertPayout != null && (
                    <>
                      <div className="h-px bg-border" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{t("details.yourPayout")}</span>
                        <span className="text-sm font-semibold text-foreground">
                          RWF {Number(booking.expertPayout).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Client notes + AI analysis */}
        {booking.citizenNotes && (
          <div className="mb-8 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText size={14} />
                </div>
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("ai.clientNotes")}</h3>
              </div>
              {!aiAnalysis && !analyzeMutation.isPending && (
                <Button size="sm" onClick={handleAnalyzeCase}>
                  <Sparkles size={12} />
                  {t("ai.aiAnalysis")}
                </Button>
              )}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{booking.citizenNotes}</p>
            {analyzeMutation.isPending && (
              <div className="flex items-center gap-2 mt-3 py-3 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                {t("ai.analyzing")}
              </div>
            )}
            {aiAnalysis && (
              <div className="mt-4">
                <AiAnalysisCard analysis={aiAnalysis} />
              </div>
            )}
            {aiError && (
              <p className="text-xs text-destructive mt-2">{aiError}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {booking.status === "PENDING" && isBookingFirst && (
            <Button
              size="lg"
              disabled={isAccepting}
              onClick={handleAccept}
            >
              {isAccepting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {t("actions.accept")}
            </Button>
          )}
          {["CONFIRMED", "ACTIVE"].includes(booking.status) && ((booking as any).service?.deliveryMode ?? "VIDEO") === "VIDEO" && (
            <Button
              size="lg"
              disabled={!canJoin}
              onClick={() => router.push(`/expert/dashboard/consultations/${booking.id}/join`)}
            >
              <Video size={15} />
              {canJoin ? t("actions.joinCall") : t("actions.notYetTime")}
            </Button>
          )}
          {["CONFIRMED", "ACTIVE"].includes(booking.status) && (booking as any).service?.deliveryMode === "PHONE" && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm">
              <Phone size={15} className="text-primary" />
              <span>{t("details.callClientAt", { phone: (booking as any).citizen?.phone || "Registered Phone" })}</span>
            </div>
          )}
          {["CONFIRMED", "ACTIVE"].includes(booking.status) && (booking as any).service?.deliveryMode === "IN_PERSON" && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50/50 px-4 py-2.5 text-sm font-medium text-emerald-800 shadow-sm dark:bg-emerald-950/20 dark:text-emerald-300">
              <MapPin size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>{t("details.inPersonAppointment")}</span>
            </div>
          )}
          {["CONFIRMED", "ACTIVE"].includes(booking.status) && (booking as any).service?.deliveryMode === "EMAIL" && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const el = document.getElementById("case-documents-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <FileText size={15} />
              {t("actions.reviewDocuments")}
            </Button>
          )}
          {canMessage && (
            <Button
              variant="outline"
              size="lg"
              disabled={isResolvingChat}
              onClick={handleMessageClient}
            >
              {isResolvingChat ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
              {t("actions.messageClient")}
            </Button>
          )}
          {["CONFIRMED", "COMPLETED"].includes(booking.status) && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => downloadICS({
                id: booking.id,
                expertName: clientName,
                serviceName: booking.service?.name ?? t("details.service"),
                start: booking.scheduledStart,
                end: booking.scheduledEnd,
              })}
            >
              <CalendarDays size={15} />
              {t("actions.addToCalendar")}
            </Button>
          )}
          {canReschedule && !showReschedule && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowReschedule(true)}
            >
              <CalendarClock size={15} />
              {t("actions.reschedule")}
            </Button>
          )}
          {canDecline && !showDecline && (
            <Button
              variant="outline"
              size="lg"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setShowDecline(true)}
            >
              <XCircle size={15} />
              {t("actions.decline")}
            </Button>
          )}
        </div>

        {/* Case Documents */}
        <div id="case-documents-section" className="mt-6">
          <CaseDocumentsCard bookingId={booking.id} canUpload />
        </div>

        {/* Decline Panel */}
        {showDecline && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
            <h3 className="text-sm font-semibold text-destructive mb-3">{t("actions.declineTitle")}</h3>
            <Textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder={t("actions.reasonPlaceholder")}
              rows={3}
            />
            <div className="mt-3 flex gap-2">
              <Button
                variant="destructive"
                disabled={isCancelling || declineReason.trim().length < 5}
                onClick={handleDecline}
              >
                {isCancelling ? t("actions.declining") : t("actions.confirmDecline")}
              </Button>
              <Button variant="outline" onClick={() => { setShowDecline(false); setDeclineReason(""); }}>
                {t("actions.keepBooking")}
              </Button>
            </div>
          </div>
        )}

        {/* Post-Consultation Notes + Summary (only for COMPLETED) */}
        {booking.status === "COMPLETED" && (
          <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <MessageSquare size={14} />
              </div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("ai.summaryTitle")}</h3>
            </div>

            {/* Step 1: Draft raw notes */}
            {!notesAnalysis && (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  {t("ai.step1Desc")}
                </p>
                <Textarea
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder={t("ai.notesPlaceholder")}
                  rows={5}
                />
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={handleAnalyzeNotes}
                    disabled={!consultationNotes.trim() || notesMutation.isPending}
                  >
                    {notesMutation.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Brain size={12} />
                    )}
                    {notesMutation.isPending ? t("ai.generatingSummary") : t("ai.generateSummary")}
                  </Button>
                </div>
                {notesMutation.isPending && (
                  <div className="flex items-center gap-2 mt-3 py-3 text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" />
                    {t("ai.structuringSummary")}
                  </div>
                )}
                {notesError && (
                  <p className="text-xs text-destructive mt-2">{notesError}</p>
                )}
              </>
            )}

            {/* Step 2: Review & edit the AI-generated summary */}
            {notesAnalysis && !summarySent && (
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  {t("ai.step2Desc")}
                </p>
                <AiAnalysisCard analysis={notesAnalysis} />
                <div className="mt-4">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 block">
                    {t("ai.editableSummaryLabel")}
                  </label>
                  <Textarea
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    rows={10}
                    className="font-mono"
                  />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={handleSendSummary}
                    disabled={!summaryText.trim() || isSendingSummary}
                  >
                    {isSendingSummary ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    {isSendingSummary ? t("ai.sendingSummary") : t("ai.sendSummary")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setNotesAnalysis(null); setSummaryText(""); }}
                  >
                    {t("ai.startOver")}
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Confirmation */}
            {summarySent && (
              <div className="rounded-xl bg-muted px-5 py-6 text-center">
                <CheckCircle size={28} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">{t("ai.summarySentTitle")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("ai.summarySentDesc")}
                </p>
              </div>
            )}
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
            durationMin={60}
            isPending={isRescheduling}
            onReschedule={handleReschedule}
            onClose={() => setShowReschedule(false)}
          />
        )}
      </div>
    </div>
  );
}
