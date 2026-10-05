"use client";

import { useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { Clock, Video, X, Check, Loader2, History, XCircle, MessageSquare, CalendarClock, MapPin, Phone, FileText } from "lucide-react";
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
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  PageHeader,
  EmptyState,
  SkeletonList,
  ErrorState,
  StatusBadge,
} from "@/shared/components/dashboard";
import { getErrorMessage } from "@/lib/utils";

type Tab = "pending" | "active" | "completed" | "cancelled";

const TAB_KEYS: Tab[] = ["pending", "active", "completed", "cancelled"];

const TAB_ICON: Record<Tab, React.ElementType> = {
  pending: Clock,
  active: Video,
  completed: History,
  cancelled: XCircle,
};

const JOINABLE_WINDOW_MS = 15 * 60 * 1000;

export default function BookingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("expertDashboard_bookings");
  const locale = useLocale();
  const { data, isLoading, isError } = useGetBookings({ limit: 100 });
  const { mutate: cancelBooking, isPending: isCancelling } = usePostBookingsIdCancel();
  const { isBookingFirst } = usePaymentMode();
  const { mutate: acceptBooking } = useAcceptBooking();

  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [resolvingChatId, setResolvingChatId] = useState<string | null>(null);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatScheduled(iso: string): string {
    return `${formatDate(iso)} at ${formatTime(iso)}`;
  }

  function submitAccept(bookingId: string) {
    setAcceptingId(bookingId);
    acceptBooking(bookingId, {
      onSuccess: () => {
        toast.success(t("toasts.acceptSuccess"));
        setAcceptingId(null);
      },
      onError: (error) => {
        setAcceptingId(null);
        toast.error(getErrorMessage(error, t("toasts.acceptError")));
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
        toast.error(t("toasts.chatUnavailable"));
      }
    } catch {
      toast.error(t("toasts.chatUnavailable"));
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
      toast.error(t("toasts.declineMinLength"));
      return;
    }
    cancelBooking(
      { id: bookingId, data: { reason: reason.trim() } },
      {
        onSuccess: () => {
          toast.success(t("toasts.declineSuccess"));
          setDecliningId(null);
          setReason("");
          queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey({ limit: 100 }) });
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, t("toasts.declineError")));
        },
      }
    );
  }

  function handleJoin(bookingId: string) {
    router.push(`/expert/dashboard/consultations/${bookingId}/join`);
  }

  return (
    <div className="p-2.5 min-[360px]:p-4 pb-16 sm:p-6 sm:pb-8 lg:p-8 min-w-0">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5 max-w-full overflow-x-auto scrollbar-none">
            {TAB_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`shrink-0 ${
                  activeTab === key
                    ? "rounded-md bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                    : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                }`}
              >
                {t(`tabs.${key}` as any)}
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary dark:bg-white/10 dark:text-white">
                  {grouped[key].length}
                </span>
              </button>
            ))}
          </div>
        }
      />

      <div className="mt-6">
        {isLoading ? (
          <SkeletonList count={3} itemClassName="h-24" />
        ) : isError ? (
          <ErrorState message={t("toasts.loadError")} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Icon}
            title={t(`empty.${activeTab}` as any)}
          />
        ) : (
          <div className="space-y-4">
            {items.map((b) => {
              const clientName = b.citizen ? `${b.citizen.firstName} ${b.citizen.lastName}` : t("details.client");
              const initials = clientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              const isDeclining = decliningId === b.id;
              const isAccepting = acceptingId === b.id;
              const deliveryMode = (b.service as any)?.deliveryMode ?? "VIDEO";
              const deliveryModeLabel = deliveryMode === "IN_PERSON"
                ? t("deliveryModes.inPerson")
                : deliveryMode === "PHONE"
                  ? t("deliveryModes.phone")
                  : deliveryMode === "EMAIL"
                    ? t("deliveryModes.document")
                    : t("deliveryModes.video");

              if (activeTab === "pending") {
                return (
                  <Link
                    key={b.id}
                    href={`/expert/dashboard/bookings/${b.id}`}
                    className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/20">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{clientName}</p>
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                            {deliveryModeLabel}
                          </span>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          {b.service?.name ?? t("details.service")} &middot;
                          {formatScheduled(b.scheduledStart)}
                        </p>
                      </div>
                      <StatusBadge tone="pending">
                        {isBookingFirst ? t("status.awaitingConfirmation") : t("status.awaitingPayment")}
                      </StatusBadge>
                      {!isDeclining && !isAccepting && isBookingFirst && (
                        <Button
                          size="xs"
                          onClick={(e) => { e.preventDefault(); submitAccept(b.id); }}
                          disabled={isAccepting}
                        >
                          {isAccepting ? <Loader2 className="animate-spin" /> : <Check />} {t("actions.accept")}
                        </Button>
                      )}
                      {!isDeclining && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={(e) => { e.preventDefault(); setDecliningId(b.id); setReason(""); }}
                        >
                          <X /> {t("actions.decline")}
                        </Button>
                      )}
                    </div>
                    {isDeclining && (
                      <div className="mt-4 border-t border-border pt-4">
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                          {t("actions.reasonLabel")}
                        </label>
                        <Textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          rows={2}
                          placeholder={t("actions.reasonPlaceholder")}
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => { setDecliningId(null); setReason(""); }}
                          >
                            {t("actions.cancel")}
                          </Button>
                          <Button
                            size="xs"
                            variant="destructive"
                            onClick={() => submitDecline(b.id)}
                            disabled={isCancelling}
                          >
                            {isCancelling ? <Loader2 className="animate-spin" /> : <X />}
                            {t("actions.confirmDecline")}
                          </Button>
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
                    className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                        {deliveryMode === "IN_PERSON" ? (
                          <MapPin className="h-[18px] w-[18px] text-emerald-600 dark:text-emerald-400" />
                        ) : deliveryMode === "PHONE" ? (
                          <Phone className="h-[18px] w-[18px] text-blue-600 dark:text-blue-400" />
                        ) : deliveryMode === "EMAIL" ? (
                          <FileText className="h-[18px] w-[18px] text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Video className="h-[18px] w-[18px]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{clientName}</p>
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                            {deliveryModeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {b.service?.name ?? t("details.service")} &middot; {formatScheduled(b.scheduledStart)}
                        </p>
                      </div>
                      {b.pendingRescheduleStart && (
                        <StatusBadge tone="pending" className="px-2 py-0.5 text-[10px]">
                          <CalendarClock className="h-2.5 w-2.5" />
                          {t("status.rescheduleRequested")}
                        </StatusBadge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.preventDefault(); handleMessage(b.id); }}
                        disabled={resolvingChatId === b.id}
                      >
                        {resolvingChatId === b.id ? <Loader2 className="animate-spin" /> : <MessageSquare />}
                        {t("actions.message")}
                      </Button>
                      {deliveryMode === "VIDEO" ? (
                        <Button
                          size="sm"
                          onClick={(e) => { e.preventDefault(); handleJoin(b.id); }}
                          disabled={!canJoin}
                        >
                          <Video />
                          {canJoin ? t("actions.joinCall") : t("actions.notYetTime")}
                        </Button>
                      ) : deliveryMode === "IN_PERSON" ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <MapPin size={12} />
                          <span>{t("deliveryModes.office")}</span>
                        </span>
                      ) : deliveryMode === "PHONE" ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                          <Phone size={12} />
                          <span>{t("deliveryModes.phoneCall")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                          <FileText size={12} />
                          <span>{t("deliveryModes.documents")}</span>
                        </span>
                      )}
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={b.id}
                  href={`/expert/dashboard/bookings/${b.id}`}
                  className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/20">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{clientName}</p>
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                          {deliveryModeLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {b.service?.name ?? t("details.service")} &middot; {formatScheduled(b.scheduledStart)}
                      </p>
                      {activeTab === "cancelled" && b.cancellationReason && (
                        <p className="mt-1 text-xs text-destructive">
                          {t("details.reason", { reason: b.cancellationReason })}
                        </p>
                      )}
                    </div>
                    {activeTab === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.preventDefault(); handleMessage(b.id); }}
                        disabled={resolvingChatId === b.id}
                      >
                        {resolvingChatId === b.id ? <Loader2 className="animate-spin" /> : <MessageSquare />}
                        {t("actions.message")}
                      </Button>
                    )}
                    <StatusBadge tone={activeTab === "completed" ? "success" : "destructive"}>
                      {activeTab === "completed" ? t("status.completed") : t("status.cancelled")}
                    </StatusBadge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
