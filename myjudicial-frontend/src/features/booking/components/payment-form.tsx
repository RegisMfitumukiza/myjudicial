"use client";

import { AlertTriangle, CheckCircle2, Smartphone, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const isAirtelSelected = paymentMNO === "Airtel";
  const isAirtelPhoneOnMtn = detectedNetwork === "Airtel" && paymentMNO === "MTN";

  const registeredDigits = cleanDigits(registeredPhone);
  const currentDigits = cleanDigits(paymentPhone);
  const isUsingRegisteredPhone = Boolean(registeredDigits && registeredDigits === currentDigits);

  const handlePhoneInputChange = (val: string) => {
    onPhoneChange(val);
    const network = detectNetwork(val);
    if (network && network !== paymentMNO) {
      onMNOChange(network);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {MNO_OPTIONS.map((opt) => {
            const isSelected = paymentMNO === opt.value;
            const isMTN = opt.value === "MTN";

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onMNOChange(opt.value)}
                className={`group relative flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? isMTN
                      ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-950/20 dark:ring-amber-400/20 shadow-sm"
                      : "border-rose-400 bg-rose-50/50 ring-2 ring-rose-400/20 dark:border-rose-500/60 dark:bg-rose-950/20 dark:ring-rose-500/20 shadow-sm"
                    : "border-brand-border/20 bg-white/70 hover:border-brand-border/40 hover:bg-white dark:border-white/10 dark:bg-black/40 dark:hover:border-white/20 dark:hover:bg-black/60"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Radio indicator */}
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? isMTN
                            ? "border-amber-600 bg-amber-500 dark:border-amber-400"
                            : "border-rose-600 bg-rose-500 dark:border-rose-400"
                          : "border-brand-border/40 bg-transparent dark:border-white/30"
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>

                    <span className="text-[13px] font-bold text-brand-dark dark:text-white">
                      {opt.label}
                    </span>
                  </div>

                  {/* Badges */}
                  {isMTN ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      <Zap size={10} className="fill-white" />
                      {t("recommendedMethod")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                      <AlertTriangle size={10} />
                      {t("networkDown")}
                    </span>
                  )}
                </div>

                <p className="mt-1.5 pl-6 text-[11px] leading-relaxed text-brand-dark/65 dark:text-white/65">
                  {isMTN ? t("mtnMoMoDesc") : t("airtelMoneyDesc")}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advisory Callout when Airtel is selected */}
      {isAirtelSelected && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 dark:border-amber-900/40 dark:bg-amber-950/30">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 space-y-1">
              <h4 className="text-[12px] font-bold text-amber-950 dark:text-amber-200">
                {t("airtelWarningTitle")}
              </h4>
              <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-300/90">
                {t("airtelWarningDesc")}
              </p>
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => onMNOChange("MTN")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-amber-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Zap size={12} className="fill-white" />
                  {t("switchToMtn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Number Input */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-[12px] font-semibold text-brand-dark dark:text-white">
            {t("mobileNumber")}
          </label>
          {registeredDigits ? (
            <div className="text-[11px]">
              {isUsingRegisteredPhone ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
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

        {/* Dynamic Contextual Helper Messages */}
        <div className="mt-1.5">
          {isAirtelPhoneOnMtn ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle size={12} className="shrink-0" />
              <span>{t("phoneMismatchAirtelWarning")}</span>
            </div>
          ) : detectedNetwork === "MTN" ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} className="shrink-0" />
              <span>{t("phoneDetectedMtn")}</span>
            </div>
          ) : (
            <p className="text-[11px] text-brand-dark/50 dark:text-white/50">
              {paymentMNO === "MTN" ? t("phoneHintMtn") : t("phoneHintAirtel")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
