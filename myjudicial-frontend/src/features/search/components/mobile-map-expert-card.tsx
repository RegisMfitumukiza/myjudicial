"use client";

import { Link } from "@/i18n/routing";
import { Star, BadgeCheck, Navigation, X, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { getLocalizedSpecialty } from "@/shared/constants/specialties";
import type { Lawyer } from "../types";

export function formatSpecialtyName(code: string, tSpecialties?: (k: string) => string): string {
  return getLocalizedSpecialty(code, tSpecialties);
}

function formatDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

type MobileMapExpertCardProps = {
  lawyer: Lawyer;
  onClose: () => void;
};

export function MobileMapExpertCard({ lawyer, onClose }: MobileMapExpertCardProps) {
  const t = useTranslations("search");
  const tSpecialties = useTranslations("specialties");

  const locationText = [lawyer.officeAddress, lawyer.city || lawyer.district]
    .filter(Boolean)
    .join(", ");

  const googleMapsDestination = encodeURIComponent(locationText || lawyer.city || "Kigali, Rwanda");
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${googleMapsDestination}`;

  const primarySpecialty = lawyer.specialties?.[0]
    ? formatSpecialtyName(lawyer.specialties[0], tSpecialties)
    : formatSpecialtyName(lawyer.specialtyLabel || "OTHER", tSpecialties);

  const extraSpecialtiesCount = (lawyer.specialties?.length ?? 0) > 1
    ? (lawyer.specialties.length - 1)
    : 0;

  return (
    <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="relative rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-3.5 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeLawyerDetails")}
          className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground transition z-10"
        >
          <X size={14} />
        </button>

        {/* Header: Avatar + Info */}
        <div className="flex items-center gap-3 pr-7">
          <div className="relative shrink-0">
            <ExpertAvatar src={lawyer.avatarUrl} name={lawyer.name} size="md" />
            {lawyer.online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-[15px] text-foreground truncate leading-snug">
                {lawyer.name}
              </h4>
              {lawyer.verified && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-dark/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-dark dark:bg-white/10 dark:text-white shrink-0">
                  <BadgeCheck size={11} />
                  <span>{t("verified")}</span>
                </span>
              )}
            </div>

            {/* Sub-header: Rating • Specialty • Experience */}
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              {lawyer.rating > 0 ? (
                <div className="flex items-center gap-0.5 text-foreground font-semibold">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  <span>{lawyer.rating.toFixed(1)}</span>
                  <span className="font-normal text-muted-foreground">({lawyer.reviewCount})</span>
                </div>
              ) : (
                <span className="text-[10px] font-semibold text-brand-dark dark:text-white bg-accent px-1.5 py-0.2 rounded">
                  {t("new")}
                </span>
              )}

              <span className="text-muted-foreground/40">•</span>

              <span className="font-medium text-foreground truncate max-w-[130px]">
                {primarySpecialty}
                {extraSpecialtiesCount > 0 && (
                  <span className="text-[10px] text-muted-foreground ml-1 font-normal">+{extraSpecialtiesCount}</span>
                )}
              </span>

              {typeof lawyer.yearsExperience === "number" && lawyer.yearsExperience > 0 && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{lawyer.yearsExperience} {t("yrShort")}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Distance Bar */}
        <div className="mt-2.5 pt-2 border-t border-border/70 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-foreground">
              {lawyer.startingRateRwf > 0
                ? `${lawyer.startingRateRwf.toLocaleString()} RWF`
                : t("contactForPricing")}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {t("rwfPerConsult")}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1">
              <MapPin size={11} className="text-brand-dark dark:text-white" />
              <span>{formatDist(lawyer.distanceKm)} {t("away").toLowerCase()}</span>
            </span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="mt-2.5 flex flex-col min-[360px]:flex-row items-stretch min-[360px]:items-center gap-1.5 min-[360px]:gap-2">
          <Link
            href={`/lawyers/${lawyer.id}/book`}
            className="w-full min-[360px]:flex-1 h-9 rounded-xl bg-brand-dark text-xs font-semibold text-on-brand shadow-sm flex items-center justify-center transition hover:opacity-90 active:scale-[0.98] dark:bg-white dark:text-black"
          >
            {t("bookConsultation")}
          </Link>
          <div className="flex items-center gap-1.5 min-[360px]:flex-1">
            <Link
              href={`/lawyers/${lawyer.id}`}
              className="flex-1 h-9 rounded-xl border border-border bg-card text-xs font-semibold text-foreground shadow-2xs flex items-center justify-center transition hover:bg-accent active:scale-[0.98]"
            >
              {t("viewProfile")}
            </Link>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={t("getDirections")}
              aria-label={t("getDirections")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition active:scale-[0.98]"
            >
              <Navigation size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
