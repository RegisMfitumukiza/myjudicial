"use client";

import { Link } from "@/i18n/routing";
import { Star, BadgeCheck, Navigation, X, MapPin, Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import type { Lawyer } from "../types";

export function formatSpecialtyName(code: string): string {
  const map: Record<string, string> = {
    FAMILY_LAW: "Family Law",
    COMMERCIAL_LAW: "Commercial Law",
    EMPLOYMENT_LAW: "Employment Law",
    LAND_LAW: "Land Law",
    CRIMINAL_LAW: "Criminal Law",
    TAX_LAW: "Tax Law",
    IMMIGRATION_LAW: "Immigration Law",
    CORPORATE_LAW: "Corporate Law",
    CONTRACT_LAW: "Contract Law",
    INTELLECTUAL_PROPERTY: "Intellectual Property",
  };
  return map[code] ?? code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

  const locationText = [lawyer.officeAddress, lawyer.city || lawyer.district]
    .filter(Boolean)
    .join(", ");

  const googleMapsDestination = encodeURIComponent(locationText || lawyer.city || "Kigali, Rwanda");
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${googleMapsDestination}`;

  return (
    <div className="fixed bottom-4 inset-x-3 sm:inset-x-6 z-40 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="relative rounded-2xl border border-border bg-card p-4 shadow-2xl backdrop-blur-md">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close expert details"
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground transition z-10"
        >
          <X size={16} />
        </button>

        {/* Top Header: Avatar + Info */}
        <div className="flex items-start gap-3 pr-8">
          <div className="relative shrink-0">
            <ExpertAvatar src={lawyer.avatarUrl} name={lawyer.name} size="lg" />
            {lawyer.online && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-green-500" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-base text-foreground truncate leading-snug">
                {lawyer.name}
              </h4>
              {lawyer.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-dark/10 px-2 py-0.5 text-[10px] font-semibold text-brand-dark dark:bg-white/10 dark:text-white shrink-0">
                  <BadgeCheck size={11} />
                  <span>{t("verified")}</span>
                </span>
              )}
            </div>

            {/* Sub-header: Rating & Experience */}
            <div className="mt-1 flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
              {lawyer.rating > 0 ? (
                <div className="flex items-center gap-1 text-foreground font-semibold">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{lawyer.rating.toFixed(1)}</span>
                  <span className="font-normal text-muted-foreground">({lawyer.reviewCount})</span>
                </div>
              ) : (
                <span className="text-[11px] font-medium text-brand-dark dark:text-white bg-accent px-1.5 py-0.5 rounded">
                  {t("new")}
                </span>
              )}

              {typeof lawyer.yearsExperience === "number" && lawyer.yearsExperience > 0 && (
                <div className="flex items-center gap-1">
                  <Briefcase size={11} className="text-muted-foreground" />
                  <span>{lawyer.yearsExperience} {t("yrShort")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Specialties Row */}
        {lawyer.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lawyer.specialties.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="inline-flex items-center rounded-md border border-border/80 bg-accent/50 px-2 py-0.5 text-[11px] font-medium text-foreground"
              >
                {formatSpecialtyName(spec)}
              </span>
            ))}
          </div>
        )}

        {/* Pricing & Distance Bar */}
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-foreground leading-none">
              {lawyer.startingRateRwf > 0
                ? `${lawyer.startingRateRwf.toLocaleString()} RWF`
                : t("contactForPricing")}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {t("rwfPerConsult")}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold text-foreground flex items-center justify-end gap-1 leading-none">
              <MapPin size={11} className="text-brand-dark dark:text-white" />
              <span>{formatDist(lawyer.distanceKm)}</span>
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {t("away")}
            </p>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="mt-3 flex items-center gap-2 pt-1">
          <Link
            href={`/lawyers/${lawyer.id}/book`}
            className="flex-1 rounded-xl bg-brand-dark py-2.5 text-center text-xs font-semibold text-on-brand shadow-sm transition hover:opacity-90 dark:bg-white dark:text-black"
          >
            {t("bookConsultation")}
          </Link>
          <Link
            href={`/lawyers/${lawyer.id}`}
            className="flex-1 rounded-xl border border-border bg-card py-2.5 text-center text-xs font-semibold text-foreground shadow-2xs transition hover:bg-accent"
          >
            {t("viewProfile")}
          </Link>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t("getDirections")}
            aria-label={t("getDirections")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <Navigation size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
