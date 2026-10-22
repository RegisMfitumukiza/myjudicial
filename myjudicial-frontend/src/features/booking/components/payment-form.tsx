"use client";

import { CheckCircle2, Clock, Info, Smartphone, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { MNO_OPTIONS } from "../constants";

interface PaymentFormProps {
  paymentMNO: string;
  paymentPhone: string;
  onMNOChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  registeredPhone?: string | null;
  showLabel?: boolean;
  compact?: boolean;
}

function cleanDigits(phone?: string | null): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250")) {
    digits = digits.slice(3);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits;
}

export function formatPhoneForInput(phone?: string | null): string {
  const digits = cleanDigits(phone);
  if (!digits) return "";
  return digits.length === 9 ? `0${digits}` : digits;
}

function detectNetwork(phone: string): "MTN" | "Airtel" | null {
  const local = cleanDigits(phone);
  if (local.startsWith("78") || local.startsWith("79")) {
    return "MTN";
  }
  if (local.startsWith("72") || local.startsWith("73")) {
    return "Airtel";
  }
  return null;
}

export function PaymentForm({
  paymentMNO,
  paymentPhone,
  onMNOChange,
  onPhoneChange,
  registeredPhone,
  showLabel = true,
  compact = false,
}: PaymentFormProps) {
  const t = useTranslations("booking");
  const detectedNetwork = detectNetwork(paymentPhone);

  const registeredDigits = cleanDigits(registeredPhone);
  const currentDigits = cleanDigits(paymentPhone);
  const isUsingRegisteredPhone = Boolean(registeredDigits && registeredDigits === currentDigits);

  // If Airtel is selected but unavailable, auto-switch to MTN
  useEffect(() => {
    const airtelOpt = MNO_OPTIONS.find((o) => o.value === "Airtel");
    if (paymentMNO === "Airtel" && airtelOpt?.status === "unavailable") {
      onMNOChange("MTN");
    }
  }, [paymentMNO, onMNOChange]);

  const handlePhoneInputChange = (val: string) => {
    onPhoneChange(val);
    const network = detectNetwork(val);
    if (network && network !== paymentMNO) {
      const targetOpt = MNO_OPTIONS.find((o) => o.value === network);
      // Only auto-switch if the detected network is available
      if (targetOpt?.status === "active") {
        onMNOChange(network);
      }
    }
  };

  return (
    <div className="space-y-3.5">
      {showLabel && (
        <div className="flex items-center gap-2">
          <Smartphone size={14} className="text-brand-dark/70 dark:text-white/70" />
          <p className="text-xs font-bold uppercase tracking-wider text-brand-dark/60 dark:text-white/60">
            {t("paymentDetails")}
          </p>
        </div>
      )}

      {/* Network / Provider Selection Cards */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[12px] font-semibold text-brand-dark dark:text-white">
            {t("network")}
          </label>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Zap size={12} className="fill-emerald-500 text-emerald-500" />
            {t("instantAndStable")}
          </span>
        </div>

        <div className={compact ? "flex flex-col gap-2.5" : "grid grid-cols-1 sm:grid-cols-2 gap-2.5"}>
          {MNO_OPTIONS.map((opt) => {
            const isSelected = paymentMNO === opt.value;
            const isMTN = opt.value === "MTN";
            const isUnavailable = opt.status === "unavailable";

            return (
              <button
                key={opt.value}
                type="button"
                disabled={isUnavailable}
                onClick={() => !isUnavailable && onMNOChange(opt.value)}
                className={`group relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  isUnavailable
                    ? "cursor-not-allowed opacity-55 border-brand-border/15 bg-brand-light/30 dark:border-white/8 dark:bg-white/5"
                    : isSelected
                    ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-950/20 dark:ring-amber-400/20 shadow-sm cursor-pointer"
                    : "border-brand-border/20 bg-white/70 hover:border-brand-border/40 hover:bg-white dark:border-white/10 dark:bg-black/40 dark:hover:border-white/20 dark:hover:bg-black/60 cursor-pointer"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Radio indicator */}
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                        isUnavailable
                          ? "border-brand-border/25 bg-transparent dark:border-white/15"
                          : isSelected
                          ? "border-amber-600 bg-amber-500 dark:border-amber-400"
                          : "border-brand-border/40 bg-transparent dark:border-white/30"
                      }`}
                    >
                      {isSelected && !isUnavailable && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>

                    <span className={`text-[13px] font-bold ${isUnavailable ? "text-brand-dark/45 dark:text-white/35" : "text-brand-dark dark:text-white"}`}>
                      {opt.label}
                    </span>
                  </div>

                  {/* Badges */}
                  {isMTN ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs shrink-0">
                      <Zap size={10} className="fill-white" />
                      {t("recommendedMethod")}
                    </span>
                  ) : isUnavailable ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-dark/8 dark:bg-white/8 border border-brand-border/20 dark:border-white/10 px-2 py-0.5 text-[10px] font-semibold text-brand-dark/45 dark:text-white/40 shrink-0">
                      <Clock size={10} />
                      {t("airtelUnavailable")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                      <CheckCircle2 size={10} className="text-emerald-600 dark:text-emerald-400" />
                      {t("activeMethod")}
                    </span>
                  )}
                </div>

                <p className={`mt-1.5 pl-6 text-[11px] leading-relaxed ${isUnavailable ? "text-brand-dark/40 dark:text-white/35 italic" : "text-brand-dark/65 dark:text-white/65"}`}>
                  {isMTN ? t("mtnMoMoDesc") : t("airtelMoneyDesc")}
                </p>
              </button>
            );
          })}
        </div>

        {/* Airtel coming-soon callout — shown below the cards */}
        {MNO_OPTIONS.some((o) => o.value === "Airtel" && o.status === "unavailable") && (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-brand-dark/4 dark:bg-white/4 border border-brand-border/15 dark:border-white/10 px-3 py-2.5">
            <Info size={13} className="mt-0.5 shrink-0 text-brand-dark/50 dark:text-white/40" />
            <p className="text-[11px] leading-relaxed text-brand-dark/60 dark:text-white/55">
              {t("airtelWarningDesc")}
            </p>
          </div>
        )}
      </div>

      {/* Phone Number Input */}
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label className="block text-[12px] font-semibold text-brand-dark dark:text-white">
            {t("mobileNumber")}
          </label>
          {registeredDigits ? (
            <div className="text-[11px]">
              {isUsingRegisteredPhone ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 size={11} />
                  {t("usingRegisteredPhone")}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePhoneInputChange(formatPhoneForInput(registeredPhone))}
                  className="text-primary hover:underline font-medium cursor-pointer"
                >
                  {t("useRegisteredPhone")}
                </button>
              )}
            </div>
          ) : null}
        </div>
        <div
          className={`flex items-stretch rounded-lg border border-brand-border/20 bg-white dark:border-white/20 dark:bg-black overflow-hidden focus-within:border-brand-dark dark:focus-within:border-white transition-colors ${
            compact ? "h-10" : "h-11"
          }`}
        >
          <div className="flex items-center gap-1.5 px-3 border-r border-brand-border/20 dark:border-white/10 bg-brand-light/50 dark:bg-white/5 select-none">
            <span className="text-sm">🇷🇼</span>
            <span className="text-[12px] font-semibold text-brand-dark/70 dark:text-white/70">
              +250
            </span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder={t("mobileNumberPlaceholder")}
            value={paymentPhone}
            onChange={(e) => handlePhoneInputChange(e.target.value)}
            className="flex-1 px-3 bg-transparent text-[13px] text-brand-dark dark:text-white outline-none placeholder:text-brand-dark/30 dark:placeholder:text-white/30"
          />
        </div>

        {/* Registered phone helper hint */}
        {registeredDigits && isUsingRegisteredPhone && (
          <p className="mt-1 text-[11px] text-brand-dark/55 dark:text-white/55">
            {t("prefilledPhoneHint")}
          </p>
        )}

        {/* Dynamic Contextual Helper Messages */}
        <div className="mt-1.5">
          {detectedNetwork === "MTN" ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} className="shrink-0" />
              <span>{t("phoneDetectedMtn")}</span>
            </div>
          ) : (
            <p className="text-[11px] text-brand-dark/50 dark:text-white/50">
              {t("phoneHintMtn")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
