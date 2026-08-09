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
        toast.error(error instanceof Error ? error.message : t("acceptError"));
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
          toast.error(error instanceof Error ? error.message : t("declineError"));
        },
      }
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("description")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-brand-border/20 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {t("loadError")}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-brand-border/20 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="text-sm text-gray-400 dark:text-gray-500">{t("emptyState")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const clientName = b.citizen ? `${b.citizen.firstName} ${b.citizen.lastName}` : t("clientFallback");
            const initials = clientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            const isDeclining = decliningId === b.id;
            const isAccepting = acceptingId === b.id;

            return (
              <div key={b.id} className="rounded-xl border border-brand-border/20 bg-white p-5 shadow-md dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-sm font-bold text-brand-blue dark:bg-brand-blue/20 dark:text-blue-300">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">{clientName}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      {b.service?.name ?? t("serviceFallback")} &middot;
                      <Clock size={11} className="inline" /> {formatScheduled(b.scheduledStart)}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {isBookingFirst ? t("awaitingConfirmation") : t("awaitingPayment")}
                  </span>
                  {!isDeclining && !isAccepting && isBookingFirst && (
                    <button
                      onClick={() => submitAccept(b.id)}
                      disabled={isAccepting}
                      className="flex items-center gap-1 rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-60 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-950/30"
                    >
                      {isAccepting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t("acceptButton")}
                    </button>
                  )}
                  {!isDeclining && (
                    <button
                      onClick={() => { setDecliningId(b.id); setReason(""); }}
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <X size={14} /> {t("declineButton")}
                    </button>
                  )}
                </div>

                {isDeclining && (
                  <div className="mt-4 border-t border-brand-border/10 pt-4 dark:border-gray-800">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {t("declineReasonLabel")}
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      placeholder={t("declineReasonPlaceholder")}
                      className="w-full rounded-lg border border-brand-border/30 px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => { setDecliningId(null); setReason(""); }}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        {t("cancelButton")}
                      </button>
                      <button
                        onClick={() => submitDecline(b.id)}
                        disabled={isCancelling}
                        className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {isCancelling ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                        {t("confirmDeclineButton")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
