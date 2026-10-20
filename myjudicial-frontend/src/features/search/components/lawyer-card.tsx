"use client";

import { useMemo } from "react";
import { Link } from "@/i18n/routing";
import { MapPin, ShieldCheck, BadgeCheck, Clock } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { StarRating } from "@/shared/components/star-rating";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { getLocalizedSpecialty } from "@/shared/constants/specialties";
import { getLocalizedLanguage } from "@/shared/constants/languages";
import type { Lawyer } from "../types";

type LawyerCardProps = {
  lawyer: Lawyer;
  selected?: boolean;
  onClick?: () => void;
  onHover?: (id: string | null) => void;
  distanceAnchorLabel?: string;
};

export function LawyerCard({ lawyer, selected, onClick, onHover, distanceAnchorLabel }: LawyerCardProps) {
  const t = useTranslations("search");
  const tSpecialties = useTranslations("specialties");
  const locale = useLocale();

  const locationLabel = useMemo(() => {
    if (lawyer.officeAddress) {
      if (lawyer.city && !lawyer.officeAddress.toLowerCase().includes(lawyer.city.toLowerCase())) {
        return `${lawyer.officeAddress}, ${lawyer.city}`;
      }
      return lawyer.officeAddress;
    }
    return lawyer.city || null;
  }, [lawyer.officeAddress, lawyer.city]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover?.(lawyer.id)}
      onMouseLeave={() => onHover?.(null)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      aria-label={t("viewProfileAria", { name: lawyer.name })}
      className={`group relative flex gap-3 sm:gap-3.5 rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 ${
        selected
          ? "border-brand-dark bg-accent/60 shadow-md ring-2 ring-brand-dark/40 dark:border-white dark:ring-white/40 dark:bg-white/[0.06]"
          : "border-border bg-card hover:border-brand-dark/40 hover:shadow-md hover:bg-card/90"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Avatar */}
      <Link
        href={`/lawyers/${lawyer.id}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        aria-hidden="true"
        className="relative shrink-0 block transition-transform group-hover:scale-[1.03]"
      >
        <ExpertAvatar
          src={lawyer.avatarUrl}
          name={lawyer.name}
          size="md"
          className="h-12 w-12 sm:h-13 sm:w-13 text-sm shadow-2xs"
          shape="circle"
        />
        {lawyer.online && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card shadow-2xs"
            style={{ backgroundColor: "#10b981", boxShadow: "0 0 0 3px rgba(16,185,129,0.15)" }}
            title="Available now"
          />
        )}
      </Link>

      {/* Info Body */}
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Row 1: Name + Verified + Rating */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-sm sm:text-[15px] text-foreground leading-snug line-clamp-2">
              <Link
                href={`/lawyers/${lawyer.id}`}
                onClick={(e) => e.stopPropagation()}
                className="transition-colors hover:text-brand-dark hover:underline dark:hover:text-white"
              >
                {lawyer.name}
              </Link>
            </h3>
            {lawyer.verified && (
              <span
                className="inline-flex items-center gap-0.5 rounded-full bg-brand-dark/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-dark dark:bg-white/10 dark:text-white shrink-0"
                title="Verified by Rwanda Bar Association"
              >
                <ShieldCheck className="h-3 w-3" />
                <span>{t("verified")}</span>
              </span>
            )}
          </div>
          <div className="shrink-0 flex items-center">
            <StarRating rating={lawyer.rating} reviewCount={lawyer.reviewCount} size="sm" />
          </div>
        </div>

        {/* Row 2: Specialty badge & Experience */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-brand-dark/20 bg-brand-dark/[0.05] px-2.5 py-0.5 text-[11px] font-semibold text-brand-dark dark:border-white/15 dark:bg-white/[0.08] dark:text-white truncate max-w-[200px]">
            {getLocalizedSpecialty(lawyer.specialtyLabel, tSpecialties)}
          </span>
          {lawyer.specialties && lawyer.specialties.length > 1 && (
            <span className="rounded-full border border-border/80 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              +{lawyer.specialties.length - 1}
            </span>
          )}
          {lawyer.yearsExperience != null && lawyer.yearsExperience > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
              <Clock className="h-3 w-3 text-muted-foreground/70" />
              <span>{lawyer.yearsExperience} {t("yrShort")}</span>
            </span>
          )}
        </div>

        {/* Row 3: Distance & Languages */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] sm:text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 shrink-0">
            <MapPin className="h-3 w-3 text-muted-foreground/70" />
            <span>
              {lawyer.distanceKm.toFixed(1)} {t("km")}{distanceAnchorLabel ? ` ${distanceAnchorLabel}` : ""}
            </span>
            {locationLabel && <span className="text-muted-foreground/70">• {locationLabel}</span>}
          </span>
          {lawyer.languages && lawyer.languages.length > 0 && (
            <span className="truncate text-muted-foreground/80">
              • {lawyer.languages.slice(0, 2).map((l) => getLocalizedLanguage(l, locale)).join(", ")}
            </span>
          )}
        </div>

        {/* Row 4: Price & CTAs */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
          <div className="min-w-0">
            {lawyer.startingRateRwf > 0 ? (
              <p className="text-sm sm:text-[15px] font-extrabold text-foreground leading-tight">
                {lawyer.startingRateRwf.toLocaleString()}{" "}
                <span className="text-[10px] sm:text-[11px] font-normal text-muted-foreground">{t("rwfPerConsult")}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground font-medium">{t("contactForPricing")}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href={`/lawyers/${lawyer.id}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition text-center shadow-2xs"
            >
              {t("viewProfile")}
            </Link>
            <Link
              href={`/lawyers/${lawyer.id}/book`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl bg-brand-dark px-3 py-1.5 text-xs font-bold text-on-brand hover:opacity-90 dark:bg-white dark:text-black transition shadow-2xs text-center"
            >
              {t("bookConsultationShort")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
