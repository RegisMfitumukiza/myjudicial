"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
  Info,
  Lock,
  ArrowRight,
  Edit2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/components/ui/button";
import { useBooking } from "../hooks/useBooking";
import { BookingSummaryCard } from "./booking-summary-card";
import { apiFetch } from "@/lib/api/client";
import { MNO_OPTIONS } from "../constants";

interface MomoPaymentTrackerProps {
  bookingId: string;
  expertName: string;
  serviceName: string;
  date?: Date;
  slotStart?: string;
  slotEnd?: string;
  amount: number;
  currency?: string;
  timezone?: string;
  initialPhone: string;
  initialMNO: string;
  onBackToEdit?: () => void;
}

type TrackerState = "WAITING" | "CONFIRMED" | "FAILED" | "EXPIRED";

function cleanDigits(phone?: string | null): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

function formatPhoneForDisplay(phone?: string | null): string {
  const digits = cleanDigits(phone);
  if (!digits) return "";
  if (digits.length === 9) {
    return `+250 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone ?? "";
}

function detectNetwork(phone: string): "MTN" | "Airtel" | null {
  const local = cleanDigits(phone);
  if (local.startsWith("78") || local.startsWith("79")) return "MTN";
  if (local.startsWith("72") || local.startsWith("73")) return "Airtel";
  return null;
}

const TOTAL_WAIT_SECONDS = 90;

export function MomoPaymentTracker({
  bookingId,
  expertName,
  serviceName,
  date,
  slotStart,
  slotEnd,
  amount,
  currency = "RWF",
  timezone,
  initialPhone,
  initialMNO,
  onBackToEdit,
}: MomoPaymentTrackerProps) {
  const t = useTranslations("booking");

  const [status, setStatus] = useState<TrackerState>("WAITING");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_WAIT_SECONDS);
  const [currentPhone, setCurrentPhone] = useState<string>(initialPhone);
  const [currentMNO, setCurrentMNO] = useState<string>(initialMNO);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);
  const [newPhoneInput, setNewPhoneInput] = useState<string>(initialPhone);
  const [newMNOInput, setNewMNOInput] = useState<string>(initialMNO);

  // Poll booking status every 2.5 seconds while waiting
  const { booking } = useBooking(bookingId, {
    enabled: status === "WAITING",
    refetchInterval: status === "WAITING" ? 2500 : false,
  });

  // Watch booking changes for payment confirmation or failure
  useEffect(() => {
    if (!booking) return;

    if (booking.paymentStatus === "PAID" || booking.status === "CONFIRMED") {
      setStatus("CONFIRMED");
    } else if (booking.paymentStatus === "FAILED" || booking.status === "CANCELLED") {
      setStatus("FAILED");
    }
  }, [booking]);

  // Countdown timer for USSD approval window
  useEffect(() => {
    if (status !== "WAITING") return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus("EXPIRED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Handle retry payment push
  const handleRetryPayment = async (phoneToUse?: string, mnoToUse?: string) => {
    const rawTargetPhone = (phoneToUse ?? currentPhone).trim();
    const digitsOnly = rawTargetPhone.replace(/\D/g, "");
    let cleanPhone = "";
    if (digitsOnly.length === 9) cleanPhone = `0${digitsOnly}`;
    else if (digitsOnly.length === 10 && digitsOnly.startsWith("0")) cleanPhone = digitsOnly;
    else if (digitsOnly.length === 12 && digitsOnly.startsWith("250")) cleanPhone = `+${digitsOnly}`;
    else cleanPhone = digitsOnly;

    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error(t("invalidPhoneNumber"));
      return;
    }

    const selectedMno = mnoToUse ?? currentMNO;

    try {
      setIsRetrying(true);
      await apiFetch<{ success: boolean; message: string }>(
        `/bookings/${bookingId}/retry-payment`,
        {
          method: "POST",
          body: {
            paymentMNO: selectedMno,
            paymentPhoneNumber: cleanPhone,
          },
        }
      );

      setCurrentPhone(cleanPhone);
      setCurrentMNO(selectedMno);
      setIsEditingPhone(false);
      setSecondsRemaining(TOTAL_WAIT_SECONDS);
      setStatus("WAITING");
      toast.success(t("promptResentSuccess"));
    } catch (err: any) {
      toast.error(err?.message || t("retryFailed"));
    } finally {
      setIsRetrying(false);
    }
  };

  const progressPercentage = (secondsRemaining / TOTAL_WAIT_SECONDS) * 100;

  return (
    <div className="mx-auto max-w-lg px-3 min-[360px]:px-4 py-8 sm:py-12 sm:px-6">
      <AnimatePresence mode="wait">
        {/* ======================================================== */}
        {/* 1. STATE: AWAITING PAYMENT (LIVE WAITING)                */}
        {/* ======================================================== */}
        {status === "WAITING" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-border bg-card p-5 min-[360px]:p-7 sm:p-8 text-center shadow-lg"
          >
            {/* Animated Phone / Radar Visual */}
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-dark/15 opacity-75" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-dark/10 border border-brand-dark/20 text-brand-dark dark:text-brand-light">
                <Smartphone className="h-8 w-8 animate-pulse text-brand-dark dark:text-brand-light" />
              </div>
            </div>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              {t("awaitingMomoApproval")}
            </div>

            <h2 className="text-lg min-[360px]:text-xl font-bold text-foreground">
              {t("redirectingToPayment")}
            </h2>

            <p className="mt-2 text-xs min-[360px]:text-sm text-muted-foreground leading-relaxed">
              {t("momoPromptSent", {
                amount: amount.toLocaleString(),
                currency,
                phone: formatPhoneForDisplay(currentPhone),
                mno: currentMNO,
              })}
            </p>

            {/* Countdown timer & progress bar */}
            <div className="mt-5 rounded-xl border border-border/80 bg-muted/40 p-4">
              <div className="flex items-center justify-between text-xs font-medium text-foreground mb-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-brand-dark" />
                  {t("waitingSecondsRemaining", { seconds: secondsRemaining })}
                </span>
                <span className="text-[11px] font-semibold text-brand-dark">
                  {Math.floor(secondsRemaining / 60)}:
                  {String(secondsRemaining % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-brand-dark transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Step-by-step guidance */}
            <div className="mt-5 space-y-2.5 text-left text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/50 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark/10 text-[11px] font-bold text-brand-dark">
                  1
                </span>
                <p className="leading-tight pt-0.5">{t("approvalStep1")}</p>
              </div>
              <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/50 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark/10 text-[11px] font-bold text-brand-dark">
                  2
                </span>
                <p className="leading-tight pt-0.5">{t("approvalStep2")}</p>
              </div>
              <div className="flex items-start gap-2.5 rounded-lg border border-border/50 bg-background/50 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dark/10 text-[11px] font-bold text-brand-dark">
                  3
                </span>
                <p className="leading-tight pt-0.5">{t("approvalStep3")}</p>
              </div>
            </div>

            {/* USSD Helper Prompt */}
            {currentMNO === "MTN" && (
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
                <Info className="h-3.5 w-3.5 shrink-0 text-brand-dark" />
                <span>{t("ussdFallbackHint")}</span>
              </div>
            )}

            {/* Escrow badge */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3 text-emerald-600" />
              <span>{t("escrowBadgeText")}</span>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 2. STATE: CONFIRMED (PAYMENT SUCCESSFUL)                 */}
        {/* ======================================================== */}
        {status === "CONFIRMED" && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-2xl border border-emerald-500/20 bg-card p-5 min-[360px]:p-8 sm:p-10 text-center shadow-xl"
          >
            {/* Green Celebration Checkmark */}
            <div className="mx-auto mb-4 sm:mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-8 ring-emerald-500/5">
              <CheckCircle2 size={36} className="text-emerald-600 animate-in zoom-in-75 duration-300" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("securedByEscrow")}
            </div>

            <h2 className="text-xl min-[360px]:text-2xl font-bold text-foreground">
              {t("paymentConfirmed")}
            </h2>

            <p className="mt-2 text-xs min-[360px]:text-sm text-muted-foreground">
              {t("paymentConfirmedDesc", { expert: expertName })}
            </p>

            {/* Summary Card */}
            <div className="mx-auto mt-6 max-w-sm rounded-xl border border-border bg-muted/60 p-4 text-left shadow-sm">
              <BookingSummaryCard
                data={{
                  expertName,
                  serviceName,
                  date,
                  slotStart,
                  slotEnd,
                  currency,
                  flatFee: amount,
                  timezone,
                }}
                compact
              />
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col min-[360px]:flex-row justify-center gap-2.5 sm:gap-3">
              <Button asChild className="w-full min-[360px]:w-auto rounded-xl bg-brand-dark text-xs text-on-brand hover:bg-brand-dark/90 py-2.5">
                <Link href={`/bookings/${bookingId}`}>
                  {t("viewBooking")} <ArrowRight size={14} className="ml-1.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full min-[360px]:w-auto rounded-xl border-border text-xs py-2.5">
                <Link href="/client/dashboard">{t("goToDashboard")}</Link>
              </Button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* 3. STATE: EXPIRED / FAILED (RECOVERY & RETRY)            */}
        {/* ======================================================== */}
        {(status === "EXPIRED" || status === "FAILED") && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-border bg-card p-5 min-[360px]:p-8 sm:p-10 text-center shadow-lg"
          >
            {/* Alert visual */}
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertCircle size={36} />
            </div>

            <h2 className="text-lg min-[360px]:text-xl font-bold text-foreground">
              {t("paymentFailedOrExpired")}
            </h2>

            <p className="mt-2 text-xs min-[360px]:text-sm text-muted-foreground leading-relaxed">
              {t("paymentFailedOrExpiredDesc")}
            </p>

            {/* Primary Action: Resend MoMo Prompt */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={() => handleRetryPayment(currentPhone, currentMNO)}
                disabled={isRetrying}
                className="w-full rounded-xl bg-brand-dark py-3 text-sm text-on-brand hover:bg-brand-dark/90 flex items-center justify-center gap-2"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {t("resendingPrompt")}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {t("resendPrompt")} ({formatPhoneForDisplay(currentPhone)})
                  </>
                )}
              </Button>

              {/* Edit phone / network toggle */}
              {!isEditingPhone ? (
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-brand-dark hover:underline font-medium"
                >
                  <Edit2 className="h-3 w-3" />
                  {t("changeNumberOrNetwork")}
                </button>
              ) : (
                <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-left">
                  <p className="text-xs font-semibold text-foreground mb-2">
                    {t("changeNumberOrNetwork")}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {MNO_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNewMNOInput(opt.value)}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium text-center transition-all ${
                          newMNOInput === opt.value
                            ? "border-brand-dark bg-brand-dark/10 text-brand-dark font-bold"
                            : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="tel"
                    value={newPhoneInput}
                    onChange={(e) => {
                      setNewPhoneInput(e.target.value);
                      const detected = detectNetwork(e.target.value);
                      if (detected) setNewMNOInput(detected);
                    }}
                    placeholder={t("mobileNumberPlaceholder")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand-dark mb-3"
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleRetryPayment(newPhoneInput, newMNOInput)}
                      disabled={isRetrying}
                      className="flex-1 rounded-lg bg-brand-dark text-xs text-on-brand"
                    >
                      {t("sendPromptToNewNumber")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingPhone(false)}
                      className="rounded-lg border-border text-xs"
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Back to booking details */}
            {onBackToEdit && (
              <div className="mt-5 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={onBackToEdit}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {t("backToBooking")}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
