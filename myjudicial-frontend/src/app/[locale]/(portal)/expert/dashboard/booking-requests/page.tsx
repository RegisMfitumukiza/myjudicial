"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Check, Clock, Loader2 } from "lucide-react";
import {
  useGetBookings,
  usePostBookingsIdCancel,
  getGetBookingsQueryKey,
} from "@/api/generated";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
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

function formatScheduled(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingRequestsPage() {
  const t = useTranslations("expertDashboard_booking-requests");
  const queryClient = useQueryClient();
  const { isBookingFirst } = usePaymentMode();
  const { data, isLoading, isError } = useGetBookings({ status: "PENDING", limit: 50 });
  const { mutate: cancelBooking, isPending: isCancelling } = usePostBookingsIdCancel();
  const { mutate: acceptBooking, isPending: isAccepting } = useAcceptBooking();
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const bookings = data?.status === 200 ? data.data.data : [];

  function submitAccept(bookingId: string) {
    setAcceptingId(bookingId);
    acceptBooking(bookingId, {
      onSuccess: () => {
        toast.success(t("acceptSuccess"));
        setAcceptingId(null);
      },
      onError: (error) => {
        setAcceptingId(null);
        toast.error(getErrorMessage(error, t("acceptError")));
      },
    });
  }

  function submitDecline(bookingId: string) {
    if (reason.trim().length < 5) {
      toast.error(t("declineReasonError"));
      return;
    }
    cancelBooking(
      { id: bookingId, data: { reason: reason.trim() } },
      {
        onSuccess: () => {
          toast.success(t("declineSuccess"));
          setDecliningId(null);
          setReason("");
          queryClient.invalidateQueries({ queryKey: getGetBookingsQueryKey({ status: "PENDING", limit: 50 }) });
        },
        onError: (error) => {
          toast.error(getErrorMessage(error, t("declineError")));
        },
      }
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="mt-6">
        {isLoading ? (
          <SkeletonList count={3} itemClassName="h-24" />
        ) : isError ? (
          <ErrorState message={t("loadError")} />
        ) : bookings.length === 0 ? (
          <EmptyState icon={Clock} title={t("emptyState")} />
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const clientName = b.citizen ? `${b.citizen.firstName} ${b.citizen.lastName}` : t("clientFallback");
              const initials = clientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              const isDeclining = decliningId === b.id;
              const isAccepting = acceptingId === b.id;

              return (
                <div
                  key={b.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary dark:bg-primary/20">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{clientName}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        {b.service?.name ?? t("serviceFallback")} &middot;
                        <Clock size={11} className="inline" /> {formatScheduled(b.scheduledStart)}
                      </p>
                    </div>
                    <StatusBadge tone="pending">
                      {isBookingFirst ? t("awaitingConfirmation") : t("awaitingPayment")}
                    </StatusBadge>
                    {!isDeclining && !isAccepting && isBookingFirst && (
                      <Button size="xs" onClick={() => submitAccept(b.id)} disabled={isAccepting}>
                        {isAccepting ? <Loader2 className="animate-spin" /> : <Check />} {t("acceptButton")}
                      </Button>
                    )}
                    {!isDeclining && (
                      <Button
                        size="xs"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => { setDecliningId(b.id); setReason(""); }}
                      >
                        <X /> {t("declineButton")}
                      </Button>
                    )}
                  </div>

                  {isDeclining && (
                    <div className="mt-4 border-t border-border pt-4">
                      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                        {t("declineReasonLabel")}
                      </label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={2}
                        placeholder={t("declineReasonPlaceholder")}
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => { setDecliningId(null); setReason(""); }}
                        >
                          {t("cancelButton")}
                        </Button>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => submitDecline(b.id)}
                          disabled={isCancelling}
                        >
                          {isCancelling ? <Loader2 className="animate-spin" /> : <X />}
                          {t("confirmDeclineButton")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
