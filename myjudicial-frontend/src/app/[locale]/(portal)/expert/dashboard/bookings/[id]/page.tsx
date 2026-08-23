"use client";

import { use, useState, useCallback } from "react";
import { Link, useRouter } from "@/i18n/routing";
import {
  CalendarDays, Clock, Loader2, AlertCircle,
  ArrowLeft, Video, XCircle, CheckCircle, MessageSquare, User, CalendarClock,
  FileText, CreditCard, Stethoscope, Brain, Sparkles, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { toast } from "sonner";
import { useCancelBooking } from "@/features/booking/hooks/useCancelBooking";
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
  { key: "PENDING", label: "Created", order: 1 },
  { key: "CONFIRMED", label: "Paid", order: 2 },
  { key: "ACTIVE", label: "Active", order: 3 },
  { key: "COMPLETED", label: "Done", order: 4 },
] as const;

const STATUS_ORDER: Record<string, number> = {
  PENDING: 1, CONFIRMED: 2, ACTIVE: 3, COMPLETED: 4, CANCELLED: -1, REFUNDED: -1,
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  ACTIVE: "bg-green-50 text-green-700 ring-green-600/20",
  COMPLETED: "bg-brand-dark/5 text-brand-dark dark:bg-white/10 dark:text-white ring-brand-dark/20",
  CANCELLED: "bg-red-50 text-red-700 ring-red-600/20",
  REFUNDED: "bg-purple-50 text-purple-700 ring-purple-600/20",
};

export default function ExpertBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { booking, isLoading, error } = useBooking(id);
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const { mutate: rescheduleBooking, isPending: isRescheduling } = useRescheduleBooking();
  const { mutate: approveReschedule, isPending: isApproving } = useApproveReschedule();
  const { mutate: declineReschedule, isPending: isDeclining } = useDeclineReschedule();
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [isResolvingChat, setIsResolvingChat] = useState(false);

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
        toast.error("No conversation found for this booking. Use 'Message Client' to start one.");
        return;
      }
      sendChatMessage(
        { data: { conversationId: result.data.data.id, content: summaryText.trim() } },
        {
          onSuccess: () => {
            setSummarySent(true);
            toast.success("Consultation summary sent to client.");
          },
          onError: (err) => {
            toast.error(err.message || "Failed to send summary.");
          },
        },
      );
    } catch {
      toast.error("Could not find chat conversation for this booking.");
    }
  }, [summaryText, booking, isSendingSummary, sendChatMessage]);

  async function handleMessageClient() {
    if (!booking) return;
    setIsResolvingChat(true);
    try {
      const result = await getChatConversationsByBookingBookingId(booking.id);
      if (result.status === 200) {
        router.push(`/expert/dashboard/messages?conversationId=${result.data.data.id}`);
      } else {
        toast.error("Conversation isn't available for this booking yet.");
      }
    } catch {
      toast.error("Conversation isn't available for this booking yet.");
    } finally {
      setIsResolvingChat(false);
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
        <p className="text-brand-alert font-medium">Failed to load booking</p>
        <p className="mt-1 text-[13px] text-brand-dark/50 dark:text-white/50 mb-6">{error?.message ?? "Booking not found"}</p>
        <Button asChild variant="outline" className="border-brand-border/20 text-xs">
          <Link href="/expert/dashboard/bookings">Back to Bookings</Link>
        </Button>
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
      onError: (err: Error) => toast.error(`Failed to decline: ${err.message}`),
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
    <main className="flex h-full flex-col bg-white dark:bg-black overflow-y-auto">
      <div className="mx-auto w-full max-w-[780px] flex-1 px-6 py-8">
        {/* Back */}
        <Link
          href="/expert/dashboard/bookings"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark/50 hover:text-brand-dark dark:text-white/50 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Bookings
        </Link>

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-extrabold text-brand-dark dark:text-white tracking-tight">
              {booking.service?.name ?? "Consultation"}
            </h1>
            <p className="mt-1.5 text-[14px] text-brand-dark/50 dark:text-white/50">
              with {clientName}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ring-1 ring-inset ${STATUS_STYLE[booking.status] ?? STATUS_STYLE.PENDING}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              booking.status === "ACTIVE" ? "bg-green-500 animate-pulse" :
              booking.status === "CONFIRMED" ? "bg-blue-500" :
              booking.status === "PENDING" ? "bg-amber-500" :
              "bg-current"
            }`} />
            {booking.status}
          </span>
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
          <div className="mb-8 rounded-2xl border border-brand-border/15 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-dark/40 dark:text-white/40 mb-5">Progress</h2>
            <div className="flex items-center gap-0">
              {STATUS_STEPS.map((step, i) => {
                const isReached = currentOrder >= step.order;
                const isCurrent = currentOrder === step.order;
                return (
                  <div key={step.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                        isCurrent
                          ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-md"
                          : isReached
                            ? "bg-brand-dark text-white dark:bg-white dark:text-black"
                            : "bg-brand-dark/8 text-brand-dark/30 dark:bg-white/8 dark:text-white/30"
                      }`}>
                        {isReached ? <CheckCircle size={14} /> : step.order}
                      </div>
                      <span className={`text-[12px] font-semibold hidden sm:inline whitespace-nowrap ${
                        isCurrent ? "text-brand-dark dark:text-white" : isReached ? "text-brand-dark/70 dark:text-white/70" : "text-brand-dark/30 dark:text-white/30"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-3 ${
                        currentOrder > step.order ? "bg-brand-dark dark:bg-white" : "bg-brand-dark/10 dark:bg-white/10"
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
          <div className="mb-8 rounded-2xl border border-red-200/60 bg-red-50/50 p-5 dark:border-red-900/30 dark:bg-red-950/20">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-red-800 dark:text-red-300">
                  {booking.status === "CANCELLED" ? "Booking Cancelled" : "Booking Refunded"}
                </h3>
                {booking.cancellationReason && (
                  <p className="mt-1 text-[12px] text-red-600/80 dark:text-red-400/80">{booking.cancellationReason}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
          {/* Schedule */}
          <div className="rounded-2xl border border-brand-border/15 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/5">
                <CalendarDays size={14} className="text-brand-dark/60 dark:text-white/60" />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-dark/40 dark:text-white/40">Schedule</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[14px] font-semibold text-brand-dark dark:text-white">{formatDate(booking.scheduledStart)}</p>
                <p className="text-[12px] text-brand-dark/40 dark:text-white/40 mt-0.5">Date</p>
              </div>
              <div className="h-px bg-brand-border/10 dark:bg-white/10" />
              <div>
                <p className="text-[14px] font-semibold text-brand-dark dark:text-white">
                  {formatTime(booking.scheduledStart)} — {formatTime(booking.scheduledEnd)}
                </p>
                <p className="text-[12px] text-brand-dark/40 dark:text-white/40 mt-0.5">
                  Duration: {formatDuration(booking.scheduledStart, booking.scheduledEnd)}
                </p>
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="rounded-2xl border border-brand-border/15 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/5">
                <User size={14} className="text-brand-dark/60 dark:text-white/60" />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-dark/40 dark:text-white/40">Client</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-dark/8 dark:bg-white/8 text-[13px] font-bold text-brand-dark/60 dark:text-white/60">
                {clientInitials}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-brand-dark dark:text-white">{clientName}</p>
                {booking.citizen?.email && (
                  <p className="text-[12px] text-brand-dark/40 dark:text-white/40 mt-0.5">{booking.citizen.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Service */}
          <div className="rounded-2xl border border-brand-border/15 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/5">
                <Stethoscope size={14} className="text-brand-dark/60 dark:text-white/60" />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-dark/40 dark:text-white/40">Service</h3>
            </div>
            <p className="text-[14px] font-semibold text-brand-dark dark:text-white">{booking.service?.name ?? "Consultation"}</p>
            <p className="text-[13px] font-bold text-brand-dark/70 dark:text-white/70 mt-1">
              RWF {booking.service?.flatFee?.toLocaleString() ?? "—"}
            </p>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-brand-border/15 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/5">
                <CreditCard size={14} className="text-brand-dark/60 dark:text-white/60" />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-dark/40 dark:text-white/40">Payment</h3>
            </div>
            <div className="space-y-2.5">
              {booking.paymentStatus === "NOT_REQUIRED" ? (
                <p className="text-[12px] text-brand-dark/50 dark:text-white/50">
                  Payment will be requested once you confirm this booking.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-brand-dark/40 dark:text-white/40">Status</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                      booking.paymentStatus === "PAID" ? "bg-green-50 text-green-700 ring-green-600/20" :
                      "bg-amber-50 text-amber-700 ring-amber-600/20"
                    }`}>
                      {booking.paymentStatus}
                    </span>
                  </div>
                  {booking.expertPayout != null && (
                    <>
                      <div className="h-px bg-brand-border/10 dark:bg-white/10" />
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-brand-dark/40 dark:text-white/40">Your Payout</span>
                        <span className="text-[14px] font-bold text-brand-dark dark:text-white">
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
          <div className="mb-8 rounded-2xl border border-brand-border/15 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/5">
                  <FileText size={14} className="text-brand-dark/60 dark:text-white/60" />
                </div>
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-dark/40 dark:text-white/40">Client Notes</h3>
              </div>
              {!aiAnalysis && !analyzeMutation.isPending && (
                <button
                  onClick={handleAnalyzeCase}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-dark/10 px-3 py-1.5 text-[12px] font-semibold text-brand-dark transition-colors hover:bg-brand-dark/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  <Sparkles size={12} />
                  AI Analysis
                </button>
              )}
            </div>
            <p className="text-[13px] leading-relaxed text-brand-dark/70 dark:text-white/70">{booking.citizenNotes}</p>
            {analyzeMutation.isPending && (
              <div className="flex items-center gap-2 mt-3 py-3 text-[13px] text-brand-dark/50 dark:text-white/50">
                <Loader2 size={14} className="animate-spin" />
                Analyzing case with AI...
              </div>
            )}
            {aiAnalysis && (
              <div className="mt-4">
                <AiAnalysisCard analysis={aiAnalysis} />
              </div>
            )}
            {aiError && (
              <p className="text-[12px] text-red-600 dark:text-red-400 mt-2">{aiError}</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {["CONFIRMED", "ACTIVE"].includes(booking.status) && (
            <Button
              className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-[13px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canJoin}
              onClick={() => router.push(`/expert/dashboard/consultations/${booking.id}/join`)}
            >
              <Video size={15} />
              {canJoin ? "Join Consultation" : "Not yet time"}
            </Button>
          )}
          {canMessage && (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border-brand-border/20 px-6 py-3 text-[13px] font-semibold text-brand-dark dark:text-white"
              disabled={isResolvingChat}
              onClick={handleMessageClient}
            >
              {isResolvingChat ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
              Message Client
            </Button>
          )}
          {["CONFIRMED", "COMPLETED"].includes(booking.status) && (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border-brand-border/20 px-6 py-3 text-[13px] font-semibold text-brand-dark dark:text-white"
              onClick={() => downloadICS({
                id: booking.id,
                expertName: clientName,
                serviceName: booking.service?.name ?? "Consultation",
                start: booking.scheduledStart,
                end: booking.scheduledEnd,
              })}
            >
              <CalendarDays size={15} />
              Add to Calendar
            </Button>
          )}
          {canReschedule && !showReschedule && (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border-brand-border/20 px-6 py-3 text-[13px] font-semibold text-brand-dark dark:text-white"
              onClick={() => setShowReschedule(true)}
            >
              <CalendarClock size={15} />
              Reschedule
            </Button>
          )}
          {canDecline && !showDecline && (
            <Button
              variant="outline"
              className="inline-flex items-center gap-2 rounded-xl border-red-200 px-6 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => setShowDecline(true)}
            >
              <XCircle size={15} />
              Decline
            </Button>
          )}
        </div>

        {/* Decline Panel */}
        {showDecline && (
          <div className="mt-4 rounded-2xl border border-red-200/60 bg-red-50/50 p-5 dark:border-red-900/30 dark:bg-red-950/20">
            <h3 className="text-[14px] font-bold text-red-800 dark:text-red-300 mb-3">Decline this booking?</h3>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Reason for declining (min. 5 characters)"
              rows={3}
              className="w-full rounded-xl border border-red-200/60 bg-white px-4 py-3 text-[13px] text-brand-dark outline-none placeholder:text-brand-dark/30 focus:border-red-400 dark:border-red-900/30 dark:bg-black dark:text-white"
            />
            <div className="mt-3 flex gap-2">
              <Button
                className="rounded-xl bg-red-600 px-5 py-2.5 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                disabled={isCancelling || declineReason.trim().length < 5}
                onClick={handleDecline}
              >
                {isCancelling ? "Declining..." : "Confirm Decline"}
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-brand-border/20 px-5 py-2.5 text-[12px] font-semibold"
                onClick={() => { setShowDecline(false); setDeclineReason(""); }}
              >
                Keep Booking
              </Button>
            </div>
          </div>
        )}

        {/* Post-Consultation Notes + Summary (only for COMPLETED) */}
        {booking.status === "COMPLETED" && (
          <div className="mt-6 rounded-2xl border border-brand-border/15 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-dark/5 dark:bg-white/5">
                <MessageSquare size={14} className="text-brand-dark/60 dark:text-white/60" />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-dark/40 dark:text-white/40">Post-Consultation Summary</h3>
            </div>

            {/* Step 1: Draft raw notes */}
            {!notesAnalysis && (
              <>
                <p className="text-[12px] text-brand-dark/50 dark:text-white/50 mb-3">
                  Step 1: Write your consultation notes. AI will structure them into a professional summary for the client.
                </p>
                <textarea
                  value={consultationNotes}
                  onChange={(e) => setConsultationNotes(e.target.value)}
                  placeholder="Write your consultation notes here - key issues discussed, advice given, follow-up actions, etc."
                  rows={5}
                  className="w-full rounded-xl border border-brand-border/20 bg-brand-dark/3 px-4 py-3 text-[13px] text-brand-dark outline-none placeholder:text-brand-dark/30 focus:border-brand-dark/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20"
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={handleAnalyzeNotes}
                    disabled={!consultationNotes.trim() || notesMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-dark px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-brand-dark"
                  >
                    {notesMutation.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Brain size={12} />
                    )}
                    {notesMutation.isPending ? "Generating Summary..." : "Generate Summary"}
                  </button>
                </div>
                {notesMutation.isPending && (
                  <div className="flex items-center gap-2 mt-3 py-3 text-[13px] text-brand-dark/50 dark:text-white/50">
                    <Loader2 size={14} className="animate-spin" />
                    AI is structuring your notes into a professional summary...
                  </div>
                )}
                {notesError && (
                  <p className="text-[12px] text-red-600 dark:text-red-400 mt-2">{notesError}</p>
                )}
              </>
            )}

            {/* Step 2: Review & edit the AI-generated summary */}
            {notesAnalysis && !summarySent && (
              <>
                <p className="text-[12px] text-brand-dark/50 dark:text-white/50 mb-2">
                  Step 2: Review the AI-generated summary below. Edit as needed, then send to client.
                </p>
                <AiAnalysisCard analysis={notesAnalysis} />
                <div className="mt-4">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-dark/40 dark:text-white/40 mb-1 block">
                    Editable Summary (will be sent to client)
                  </label>
                  <textarea
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    rows={10}
                    className="w-full rounded-xl border border-brand-border/20 bg-brand-dark/3 px-4 py-3 text-[13px] text-brand-dark outline-none placeholder:text-brand-dark/30 focus:border-brand-dark/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20 font-mono"
                  />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={handleSendSummary}
                    disabled={!summaryText.trim() || isSendingSummary}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-dark px-5 py-2.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 dark:bg-white dark:text-brand-dark"
                  >
                    {isSendingSummary ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    {isSendingSummary ? "Sending..." : "Send Consultation Summary"}
                  </button>
                  <button
                    onClick={() => { setNotesAnalysis(null); setSummaryText(""); }}
                    className="rounded-lg border border-brand-border/20 px-4 py-2.5 text-[12px] font-semibold text-brand-dark/60 dark:text-white/60 transition-colors hover:bg-brand-dark/5 dark:hover:bg-white/5"
                  >
                    Start Over
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Confirmation */}
            {summarySent && (
              <div className="rounded-xl bg-brand-dark/5 px-5 py-6 dark:bg-white/5 text-center">
                <CheckCircle size={28} className="text-brand-dark/40 dark:text-white/40 mx-auto mb-2" />
                <p className="text-[14px] font-semibold text-brand-dark dark:text-white">Summary sent to client</p>
                <p className="text-[12px] text-brand-dark/50 dark:text-white/50 mt-1">
                  The consultation summary has been delivered to the client&apos;s inbox.
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
    </main>
  );
}
