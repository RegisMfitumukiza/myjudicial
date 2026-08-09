"use client";

import { useState } from "react";
import { CalendarClock, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ReschedulePendingBannerProps {
  currentStart: string;
  currentEnd: string;
  pendingStart: string;
  pendingEnd: string;
  reason?: string | null;
  requestedBy: string;
  currentUserId: string;
  isApproving: boolean;
  isDeclining: boolean;
  onApprove: () => void;
  onDecline: (reason?: string) => void;
}

export function ReschedulePendingBanner({
  currentStart,
  currentEnd,
  pendingStart,
  pendingEnd,
  reason,
  requestedBy,
  currentUserId,
  isApproving,
  isDeclining,
  onApprove,
  onDecline,
}: ReschedulePendingBannerProps) {
  const t = useTranslations("expertDashboard_reschedule-pending-banner");
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const isRequester = requestedBy === currentUserId;
  const currentDate = new Date(currentStart);
  const pendingDate = new Date(pendingStart);
  const pendingEndDate = new Date(pendingEnd);
  const durationMin = Math.round((pendingEndDate.getTime() - pendingDate.getTime()) / 60000);

  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-dark/20 bg-brand-dark/5 p-5 dark:border-white/20 dark:bg-white/5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-dark/10 dark:bg-white/10">
          <CalendarClock size={20} className="text-brand-dark dark:text-white" />
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-brand-dark dark:text-white">
            {isRequester ? t("requestSent") : t("requestPending")}
          </h3>
          <p className="text-[12px] text-brand-dark/60 dark:text-white/60">
            {isRequester
              ? t("waitingForResponse")
              : t("otherPartyRequested")}
          </p>
        </div>
      </div>

      {/* Time Comparison */}
      <div className="rounded-xl border border-brand-border/20 bg-white p-4 dark:border-white/20 dark:bg-black mb-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          {/* Current */}
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-1">
              {t("current")}
            </p>
            <p className="text-[14px] font-bold text-brand-dark dark:text-white">
              {currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <p className="text-[12px] text-brand-dark/60 dark:text-white/60">
              {currentDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark/10 dark:bg-white/10">
            <CalendarClock size={14} className="text-brand-dark dark:text-white" />
          </div>

          {/* Requested New */}
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-1">
              {t("requested")}
            </p>
            <p className="text-[14px] font-bold text-brand-dark dark:text-white">
              {pendingDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
            <p className="text-[12px] text-brand-dark/60 dark:text-white/60">
              {pendingDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} &middot; {t("durationMin", { durationMin })}
            </p>
          </div>
        </div>
      </div>

      {/* Reason */}
      {reason && (
        <div className="rounded-xl bg-brand-dark/5 p-3 dark:bg-white/5 mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-dark/50 dark:text-white/50 mb-1">
            {t("reason")}
          </p>
          <p className="text-[13px] text-brand-dark dark:text-white">{reason}</p>
        </div>
      )}

      {/* Actions — only for the OTHER party (not the requester) */}
      {!isRequester && (
        <div className="space-y-3">
          {showDeclineReason ? (
            <div className="space-y-3">
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder={t("declineReasonPlaceholder")}
                rows={2}
                className="w-full rounded-lg border border-brand-border/20 bg-white px-4 py-3 text-[13px] text-brand-dark outline-none placeholder:text-brand-dark/30 focus:border-brand-dark dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-white/30 dark:focus:border-white"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    onDecline(declineReason.trim() || undefined);
                    setDeclineReason("");
                    setShowDeclineReason(false);
                  }}
                  disabled={isDeclining}
                  className="rounded-lg bg-red-600 px-4 py-2 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                >
                  {isDeclining ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <X className="mr-1" size={12} />}
                  {t("confirmDecline")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowDeclineReason(false); setDeclineReason(""); }}
                  className="rounded-lg border-brand-border/20 px-4 py-2 text-[12px] font-semibold"
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={onApprove}
                disabled={isApproving}
                className="flex-1 rounded-xl bg-brand-dark py-3 text-[13px] font-semibold text-white hover:opacity-90 dark:bg-white dark:text-black"
              >
                {isApproving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1" size={14} />
                )}
                {t("acceptReschedule")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeclineReason(true)}
                disabled={isDeclining}
                className="flex-1 rounded-xl border-red-300 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
              >
                <X className="mr-1" size={14} />
                {t("decline")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
