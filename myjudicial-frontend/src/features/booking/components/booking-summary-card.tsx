"use client";

import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { getLocalizedServiceName } from "@/shared/utils/service-localization";

interface BookingSummaryData {
  expertName: string;
  serviceName: string;
  date?: Date | string;
  slotStart?: string;
  slotEnd?: string;
  durationMin?: number;
  currency?: string;
  flatFee?: number;
  deliveryMode?: string;
}

interface BookingSummaryCardProps {
  data: BookingSummaryData;
  showTotal?: boolean;
  showDeliveryMode?: boolean;
  compact?: boolean;
}

export function BookingSummaryCard({
  data,
  showTotal = true,
  showDeliveryMode = false,
  compact = false,
}: BookingSummaryCardProps) {
  const t = useTranslations("booking");
  const { expertName, serviceName, date, slotStart, slotEnd, durationMin, currency, flatFee, deliveryMode } = data;

  const dateStr = date instanceof Date ? format(date, "MMMM d, yyyy") : date ?? "—";
  const timeStr = slotStart
    ? `${format(new Date(slotStart), "h:mm a")}${slotEnd ? ` - ${format(new Date(slotEnd), "h:mm a")}` : ""}`
    : "—";
  const fee = flatFee != null ? `${currency ?? "RWF"} ${Number(flatFee).toLocaleString()}` : "—";

  const deliveryLabel = deliveryMode
    ? t(`deliveryMode.${deliveryMode}` as any)
    : deliveryMode;

  const rows = [
    { label: t("expert"), value: expertName || "—" },
    { label: t("service"), value: getLocalizedServiceName(serviceName, t) || t("notSelected") },
    ...(durationMin ? [{ label: t("duration"), value: `${durationMin} min` }] : []),
    { label: t("date"), value: dateStr },
    { label: t("time"), value: timeStr },
    ...(showDeliveryMode && deliveryLabel
      ? [{ label: t("mode"), value: deliveryLabel }]
      : []),
  ];

  if (compact) {
    return (
      <div className="space-y-2 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <span className="text-brand-dark/50 dark:text-white/50 shrink-0">{row.label}</span>
            <span className="font-semibold text-brand-dark dark:text-white text-right truncate min-w-0">{row.value}</span>
          </div>
        ))}
        {showTotal && (
          <div className="border-t border-brand-border/20 pt-2 dark:border-white/20">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-brand-dark dark:text-white shrink-0">{t("total")}</span>
              <span className="font-bold text-brand-dark dark:text-white text-right">{fee}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-border/20 bg-white p-4 min-[360px]:p-5 dark:border-white/20 dark:bg-black">
      <h3 className="mb-4 text-xs min-[360px]:text-[14px] font-bold text-brand-dark dark:text-white">{t("bookingSummary")}</h3>
      <div className="space-y-3 text-xs min-[360px]:text-[13px]">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-2">
            <span className="text-brand-dark/60 dark:text-white/60 shrink-0">{row.label}</span>
            <span className="font-semibold text-brand-dark dark:text-white text-right truncate min-w-0">{row.value}</span>
          </div>
        ))}
        {showTotal && (
          <div className="border-t border-brand-border/20 pt-3 dark:border-white/20">
            <div className="flex justify-between items-center gap-2 text-sm min-[360px]:text-[15px]">
              <span className="font-bold text-brand-dark dark:text-white shrink-0">{t("total")}</span>
              <span className="font-bold text-brand-dark dark:text-white text-right">{fee}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
