"use client";

import { Clock, Phone, MapPin, Mail, Video, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface ServiceCardService {
  id: string;
  name: string;
  description?: string;
  category?: string;
  deliveryMode?: string;
  durationMin: number;
  flatFee: number;
  currency?: string;
}

interface ServiceCardProps {
  service: ServiceCardService;
  isSelected?: boolean;
  onSelect: (service: ServiceCardService) => void;
  layout?: "list" | "grid";
  showArrow?: boolean;
}

const DELIVERY_ICONS: Record<string, typeof Phone> = {
  PHONE: Phone,
  IN_PERSON: MapPin,
  EMAIL: Mail,
  VIDEO: Video,
};

export function ServiceCard({ service, isSelected = false, onSelect, layout = "list", showArrow = true }: ServiceCardProps) {
  const t = useTranslations("booking");
  const DeliveryIcon = DELIVERY_ICONS[service.deliveryMode ?? "VIDEO"] ?? Video;

  const categoryLabel = service.category
    ? t(`category.${service.category}` as any)
    : null;
  const deliveryLabel = service.deliveryMode
    ? t(`deliveryMode.${service.deliveryMode}` as any)
    : null;

  if (layout === "grid") {
    return (
      <button
        type="button"
        onClick={() => onSelect(service)}
        className={`rounded-xl border p-4 text-left transition-all ${
          isSelected
            ? "border-brand-dark bg-brand-dark/5 ring-1 ring-brand-dark dark:border-white dark:bg-white/10"
            : "border-brand-border/20 hover:border-brand-dark/30 hover:bg-brand-dark/5 dark:border-white/20 dark:hover:border-white/40"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-brand-dark dark:text-white">{service.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {categoryLabel && (
                <span className="rounded bg-brand-dark/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-dark/60 dark:bg-white/10 dark:text-white/60">
                  {categoryLabel}
                </span>
              )}
              {deliveryLabel && (
                <span className="rounded bg-brand-dark/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-dark/60 dark:bg-white/10 dark:text-white/60">
                  {deliveryLabel}
                </span>
              )}
            </div>
          </div>
          <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
            isSelected ? "bg-brand-dark text-white dark:bg-white dark:text-black" : "bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white"
          }`}>
            {t("durationMinutes", { minutes: service.durationMin })}
          </span>
        </div>
        {service.description && (
          <p className="mt-1 text-xs text-brand-dark/50 dark:text-white/50">{service.description}</p>
        )}
        <p className="mt-2 text-sm font-bold text-brand-dark dark:text-white">
          {service.currency ?? "RWF"} {Number(service.flatFee).toLocaleString()}
        </p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className={`flex w-full items-start justify-between gap-4 rounded-xl border p-4 text-left transition-colors ${
        isSelected
          ? "border-brand-dark bg-brand-dark/5 dark:border-white dark:bg-white/5"
          : "border-brand-border/20 hover:bg-brand-dark/5 hover:border-brand-dark/30 dark:border-white/20 dark:hover:bg-white/5"
      }`}
    >
      <div className="flex-1">
        <h3 className="text-[15px] font-bold text-brand-dark dark:text-white">{service.name}</h3>
        <div className="mt-1 flex flex-wrap gap-1">
          {categoryLabel && (
            <span className="rounded bg-brand-dark/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-dark/60 dark:bg-white/10 dark:text-white/60">
              {categoryLabel}
            </span>
          )}
          {deliveryLabel && (
            <span className="inline-flex items-center gap-0.5 rounded bg-brand-dark/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-dark/60 dark:bg-white/10 dark:text-white/60">
              <DeliveryIcon size={10} />
              {deliveryLabel}
            </span>
          )}
        </div>
        {service.description && (
          <p className="mt-1 text-[13px] text-brand-dark/60 dark:text-white/60">{service.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-[12px] text-brand-dark/50 dark:text-white/50">
          <Clock size={12} />
          <span>{t("durationMinutes", { minutes: service.durationMin })}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="text-[18px] font-bold text-brand-dark dark:text-white">
          {service.currency ?? "RWF"} {Number(service.flatFee).toLocaleString()}
        </p>
        {showArrow && <ArrowRight size={16} className="text-brand-dark/40 dark:text-white/40" />}
      </div>
    </button>
  );
}
