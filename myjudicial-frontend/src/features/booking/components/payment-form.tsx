"use client";

import { Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { MNO_OPTIONS } from "../constants";

interface PaymentFormProps {
  paymentMNO: string;
  paymentPhone: string;
  onMNOChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  showLabel?: boolean;
  compact?: boolean;
}

export function PaymentForm({
  paymentMNO,
  paymentPhone,
  onMNOChange,
  onPhoneChange,
  showLabel = true,
  compact = false,
}: PaymentFormProps) {
  const t = useTranslations("booking");
  return (
    <div className="space-y-3">
      {showLabel && (
        <div className="flex items-center gap-2">
          <Smartphone size={14} />
          <p className="text-xs font-bold uppercase tracking-wider text-brand-dark/50 dark:text-white/50">
            {t("paymentDetails")}
          </p>
        </div>
      )}
      <div>
        <label className="mb-1 block text-[12px] font-semibold text-brand-dark dark:text-white">
          {t("network")}
        </label>
        <select
          value={paymentMNO}
          onChange={(e) => onMNOChange(e.target.value)}
          className={`w-full rounded-lg border border-brand-border/20 bg-white text-[13px] text-brand-dark outline-none focus:border-brand-dark dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white ${
            compact ? "px-3 py-2.5" : "px-4 py-3"
          }`}
        >
          {MNO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[12px] font-semibold text-brand-dark dark:text-white">
          {t("mobileNumber")}
        </label>
        <input
          type="text"
          placeholder={t("mobileNumberPlaceholder")}
          value={paymentPhone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={`w-full rounded-lg border border-brand-border/20 bg-white text-[13px] text-brand-dark outline-none placeholder:text-brand-dark/30 focus:border-brand-dark dark:border-white/20 dark:bg-black dark:text-white dark:placeholder:text-white/30 dark:focus:border-white ${
            compact ? "px-3 py-2.5" : "px-4 py-3"
          }`}
        />
      </div>
    </div>
  );
}
