"use client";

import { useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Clock, Video, X, Check, Loader2, History, XCircle, MessageSquare, CalendarClock } from "lucide-react";
import {
  useGetBookings,
  usePostBookingsIdCancel,
  getGetBookingsQueryKey,
  getChatConversationsByBookingBookingId,
  type Booking,
} from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";
import { useAcceptBooking } from "@/features/booking/hooks/useAcceptBooking";
import { usePaymentMode } from "@/features/settings/hooks/usePaymentMode";

type Tab = "pending" | "active" | "completed" | "cancelled";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const TAB_ICON: Record<Tab, React.ElementType> = {
  pending: Clock,
  active: Video,
  completed: History,
  cancelled: XCircle,
};

const JOINABLE_WINDOW_MS = 15 * 60 * 1000;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatScheduled(iso: string): string {
  return `${formatDate(iso)} at ${formatTime(iso)}`;
}

export default function BookingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("features.experts");
  const { data, isLoading, isError } = useGetBookings({ limit: 100 });
  const { mutate: cancelBooking, isPending: isCancelling } = usePostBookingsIdCancel();
  const { isBookingFirst } = usePaymentMode();
  const { mutate: acceptBooking } = useAcceptBooking();

  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [resolvingChatId, setResolvingChatId] = useState<string | null>(null);

  function submitAccept(bookingId: string) {
    setAcceptingId(bookingId);
    acceptBooking(bookingId, {
      onSuccess: () => {
        toast.success("Booking accepted. The client has been notified.");
        setAcceptingId(null);
      },
      onError: (error) => {
        setAcceptingId(null);
        toast.error(error instanceof Error ? error.message : "Failed to accept booking");
      },
    });
  }

  async function handleMessage(bookingId: string) {
    setResolvingChatId(bookingId);
    try {
      const result = await getChatConversationsByBookingBookingId(bookingId);
      if (result.status === 200) {
        router.push(`/expert/dashboard/messages?conversationId=${result.data.data.id}`);
      } else {
        toast.error(t("profileUpdateFailed"));
      }
    } catch {
      toast.error(t("profileUpdateFailed"));
    } finally {
      setResolvingChatId(null);
    }
  }

  const bookings: Booking[] = data?.status === 200 ? data.data.data : [];

  const grouped = useMemo(() => {
    const result: Record<Tab, Booking[]> = { pending: [], active: [], completed: [], cancelled: [] };
    for (const b of bookings) {
      if (b.status === "PENDING") result.pending.push(b);
      else if (b.status === "CONFIRMED" || b.status === "ACTIVE") result.active.push(b);
      else if (b.status === "COMPLETED") result.completed.push(b);
      else result.cancelled.push(b);
    }
    result.active.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
    return result;
  }, [bookings]);

  const items = grouped[activeTab];
  const Icon = TAB_ICON[activeTab];

  function submitDecline(bookingId: string) {
    if (reason.trim().length < 5) {
      toast.error(t("profileUpdateFailed"));
      return;
    }
    cancelBooking(
      { id: bookingId, data: { reason: reason.trim() } },
      {
        onSuccess: () => {
          toast.success(t("profileUpdated"));
          setDecliningId(null);
          setReason("");
          queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey({ limit: 100 }) });
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : t("profileUpdateFailed"));
        },
      }
    );
  }

  function handleJoin(bookingId: string) {
    router.push(`/expert/dashboard/consultations/${bookingId}/join`);
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">Bookings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage all your consultation bookings in one place
        </p>
      </div>

      <div className="mb-6 flex gap-6 border-b border-brand-border/10 dark:border-gray-700">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 text-sm font-medium transition ${
              activeTab === key
                ? "border-b-2 border-brand-blue text-brand-blue"
                : "text-gray-500 hover:text-brand-dark dark:text-gray-400 dark:hover:text-gray-100"
            }`}
          >
            {label}
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
              {grouped[key].length}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-brand-border/20 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          Failed to load bookings. Please try again.
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-brand-border/20 bg-white p-10 text-center shadow-md dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <Icon size={28} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {activeTab === "pending" && "No pending booking requests."}
            {activeTab === "active" && "No active consultations."}
            {activeTab === "completed" && "No completed consultations yet."}
            {activeTab === "cancelled" && "No cancelled bookings."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((b) => {
            const clientName = b.citizen ? `${b.citizen.firstName} ${b.citizen.lastName}` : "Client";
            const initials = clientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const isDeclining = decliningId === b.id;
            const isAccepting = acceptingId === b.id;

            if (activeTab === "pending") {
              return (
                <Link
                  key={b.id}
                  href={`/expert/dashboard/bookings/${b.id}`}
                  className="block rounded-xl border border-brand-border/20 bg-white p-5 shadow-md transition-colors hover:bg-brand-canvas dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-bold text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">{clientName}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        {b.service?.name ?? "Consultation"} &middot;
                        {formatScheduled(b.scheduledStart)}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {isBookingFirst ? "Awaiting Confirmation" : "Awaiting Payment"}
                    </span>
                    {!isDeclining && !isAccepting && isBookingFirst && (
                      <button
                        onClick={(e) => { e.preventDefault(); submitAccept(b.id); }}
                        disabled={isAccepting}
                        className="flex items-center gap-1 rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-60 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-950/30"
                      >
                        {isAccepting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Accept
                      </button>
                    )}
                    {!isDeclining && (
                      <button
                        onClick={(e) => { e.preventDefault(); setDecliningId(b.id); setReason(""); }}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <X size={14} /> Decline
                      </button>
                    )}
                  </div>
                  {isDeclining && (
                    <div className="mt-4 border-t border-brand-border/10 pt-4 dark:border-gray-800">
                      <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Reason for declining (min. 5 characters)
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                        placeholder="e.g. Schedule conflict, unable to take this case..."
                        className="w-full rounded-lg border border-brand-border/30 px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => { setDecliningId(null); setReason(""); }}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitDecline(b.id)}
                          disabled={isCancelling}
                          className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          {isCancelling ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                          Confirm Decline
                        </button>
                      </div>
                    </div>
                  )}
                </Link>
              );
            }

            if (activeTab === "active") {
              const startsInMs = new Date(b.scheduledStart).getTime() - Date.now();
              const canJoin = b.status === "ACTIVE" || startsInMs <= JOINABLE_WINDOW_MS;

              return (
                <Link
                  key={b.id}
                  href={`/expert/dashboard/bookings/${b.id}`}
                  className="block rounded-xl border border-brand-border/20 bg-white p-4 shadow-md transition-colors hover:bg-brand-canvas dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20">
                      <Video size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">{clientName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {b.service?.name ?? "Consultation"} &middot; {formatScheduled(b.scheduledStart)}
                      </p>
                    </div>
                    {b.pendingRescheduleStart && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <CalendarClock size={10} />
                        Reschedule Requested
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); handleMessage(b.id); }}
                      disabled={resolvingChatId === b.id}
                      className="flex items-center gap-1.5 rounded-lg border border-brand-border/20 px-3 py-2 text-xs font-semibold text-brand-dark hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                    >
                      {resolvingChatId === b.id ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                      Message
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); handleJoin(b.id); }}
                      disabled={!canJoin}
                      className="flex items-center gap-1.5 rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Video size={14} />
                      {canJoin ? "Join Call" : "Not yet time"}
                    </button>
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={b.id}
                href={`/expert/dashboard/bookings/${b.id}`}
                className="block rounded-xl border border-brand-border/20 bg-white p-4 shadow-md transition-colors hover:bg-brand-canvas dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-bold text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">{clientName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {b.service?.name ?? "Consultation"} &middot; {formatScheduled(b.scheduledStart)}
                    </p>
                    {activeTab === "cancelled" && b.cancellationReason && (
                      <p className="mt-1 text-xs text-red-500">
                        Reason: {b.cancellationReason}
                      </p>
                    )}
                  </div>
                  {activeTab === "completed" && (
                    <button
                      onClick={() => handleMessage(b.id)}
                      disabled={resolvingChatId === b.id}
                      className="flex items-center gap-1.5 rounded-lg border border-brand-border/20 px-3 py-2 text-xs font-semibold text-brand-dark hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                    >
                      {resolvingChatId === b.id ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                      Message
                    </button>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      activeTab === "completed"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {activeTab === "completed" ? "Completed" : "Cancelled"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
