"use client";

import { Link } from "@/i18n/routing";
import { MapPin, ShieldCheck, BadgeCheck, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { StarRating } from "@/shared/components/star-rating";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import type { Lawyer } from "../types";

type LawyerCardProps = {
  lawyer: Lawyer;
  selected?: boolean;
  onClick?: () => void;
};

export function LawyerCard({ lawyer, selected, onClick }: LawyerCardProps) {
  const t = useTranslations("search");

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      aria-label={`View profile of ${lawyer.name}`}
      className={`flex gap-3 rounded-xl border p-3 transition-all duration-200 ${
        selected
          ? "border-brand-dark bg-accent shadow-md ring-1 ring-brand-dark/20 dark:border-white dark:ring-white/20"
          : "border-border bg-card hover:border-brand-dark/30 hover:shadow-sm"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <ExpertAvatar src={lawyer.avatarUrl} name={lawyer.name} size="lg" />
        {lawyer.online && (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-green-500" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <h3 className="truncate text-[15px] font-semibold text-foreground">
              {lawyer.name}
            </h3>
            {lawyer.verified && (
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-dark dark:text-white" />
            )}
          </div>
          <div className="flex shrink-0 items-center">
            <StarRating rating={lawyer.rating} reviewCount={lawyer.reviewCount} size="sm" />
          </div>
        </div>

        {/* Specialty badge */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-brand-dark/10 px-2 py-0.5 text-[11px] font-medium text-brand-dark dark:bg-white/10 dark:text-white">
            {lawyer.specialtyLabel}
          </span>
          {lawyer.verified && (
            <span className="flex items-center gap-0.5 rounded-full bg-brand-dark/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-dark dark:bg-white/10 dark:text-white">
              <BadgeCheck className="h-3 w-3" />
              {t("verified")}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {lawyer.distanceKm.toFixed(1)} {t("km")}
          </span>
          {lawyer.yearsExperience != null && lawyer.yearsExperience > 0 && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              {lawyer.yearsExperience}{t("yrShort")}
            </span>
          )}
          {lawyer.languages && lawyer.languages.length > 0 && (
            <span className="line-clamp-1">{lawyer.languages.slice(0, 2).join(", ")}</span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            {lawyer.startingRateRwf > 0 ? (
              <p className="text-[15px] font-bold text-foreground">
                {lawyer.startingRateRwf.toLocaleString()}{" "}
                <span className="text-[11px] font-normal text-muted-foreground">{t("rwfPerConsult")}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("contactForPricing")}</p>
            )}
          </div>
          <Link
            href={`/lawyers/${lawyer.id}/book`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 rounded-lg bg-brand-dark px-3 py-1.5 text-[12px] font-semibold text-on-brand transition hover:opacity-90"
          >
            {t("book")}
          </Link>
        </div>
      </div>
    </div>
  );
}
