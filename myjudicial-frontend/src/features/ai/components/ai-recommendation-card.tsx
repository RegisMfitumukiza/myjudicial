"use client";

import { useTranslations } from "next-intl";
import { Briefcase, ArrowRight, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { StarRating } from "@/shared/components/star-rating";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { getLocalizedSpecialty } from "@/shared/constants/specialties";
import type { ExpertRecommendation } from "../types";

type AiRecommendationCardProps = {
  recommendation: ExpertRecommendation;
  rank?: number;
  isTop?: boolean;
};

const QUALITY_COLORS: Record<string, string> = {
  excellent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  very_good: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  good: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  fair: "bg-muted text-muted-foreground border-border",
};

const QUALITY_EMOJIS: Record<string, string> = {
  excellent: "⭐ ",
  very_good: "✅ ",
  good: "👍 ",
  fair: "",
};

export function AiRecommendationCard({ recommendation, rank, isTop }: AiRecommendationCardProps) {
  const t = useTranslations("ai");
  const tSpecialties = useTranslations("specialties");

  const matchPercent = Math.round(recommendation.score * 100);
  const fee = recommendation.expert.base_consultation_fee ?? recommendation.expert.hourly_rate ?? 0;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
        isTop
          ? "border-brand-dark/40 bg-gradient-to-b from-brand-dark/[0.04] to-card ring-1 ring-brand-dark/20 shadow-xs"
          : "border-border/80 bg-card hover:border-brand-dark/30 hover:shadow-xs"
      }`}
    >
      {/* Top Banner for Rank 1 */}
      {isTop && (
        <div className="mb-3 flex items-center justify-between border-b border-brand-dark/15 pb-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark dark:text-white">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Top Matched Legal Counsel</span>
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Highest Relevance
          </span>
        </div>
      )}

      <div className="flex items-start gap-3.5">
        {/* Avatar with rank */}
        <div className="relative shrink-0">
          <ExpertAvatar
            src={recommendation.expert.profile_image_url}
            name={recommendation.expert.full_name}
            size="md"
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl shadow-xs"
          />
          {rank != null && (
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-on-brand shadow-xs">
              {rank}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-start justify-between gap-1 min-[420px]:gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-foreground truncate">
                  {recommendation.expert.full_name}
                </h4>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-dark/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-dark dark:bg-white/10 dark:text-white shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available
                </span>
              </div>

              <p className="text-xs text-muted-foreground mt-0.5 break-words">
                {recommendation.expert.specialties
                  ?.map((s) => getLocalizedSpecialty(s, tSpecialties))
                  .join(", ") ?? ""}
              </p>
            </div>

            {/* Match Score Badge */}
            <div className="self-start min-[420px]:self-auto flex items-center gap-1 rounded-full bg-brand-dark px-2.5 py-1 text-xs font-bold text-on-brand shrink-0 shadow-2xs">
              {t("recommendations.matchScore", { score: matchPercent })}
            </div>
          </div>

          {/* Match Quality & Stats */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-muted-foreground">
            <span className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${QUALITY_COLORS[recommendation.match_quality] || QUALITY_COLORS.fair}`}>
              {QUALITY_EMOJIS[recommendation.match_quality] ?? ""}
              {recommendation.match_quality === "excellent" && t("recommendations.excellent")}
              {recommendation.match_quality === "very_good" && t("recommendations.veryGood")}
              {recommendation.match_quality === "good" && t("recommendations.good")}
              {recommendation.match_quality === "fair" && t("recommendations.fair")}
            </span>

            <StarRating rating={recommendation.expert.rating ?? 0} reviewCount={recommendation.expert.review_count} size="sm" />

            <span className="inline-flex items-center gap-1 font-medium">
              <Briefcase className="h-3 w-3 text-muted-foreground/70" />
              {recommendation.expert.years_of_experience ?? 0} {t("yearsExpUnit")}
            </span>
          </div>

          {/* Rate */}
          <div className="pt-0.5">
            <p className="text-xs sm:text-sm font-extrabold text-foreground">
              {fee > 0 ? (
                <>
                  {fee.toLocaleString()}{" "}
                  <span className="text-[11px] font-normal text-muted-foreground">RWF / consultation</span>
                </>
              ) : (
                <span className="text-xs font-medium text-muted-foreground">Consultation rate on request</span>
              )}
            </p>
          </div>

          {/* AI Explanation Summary */}
          {recommendation.explanation.summary && (
            <p className="text-xs text-muted-foreground/90 italic leading-snug">
              &ldquo;{recommendation.explanation.summary}&rdquo;
            </p>
          )}

          {/* Key Match Strengths */}
          {recommendation.explanation.strengths.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {recommendation.explanation.strengths.slice(0, 3).map((s) => (
                <span key={s} className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.07] px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  + {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Action Bar */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-2">
        <Link
          href={`/lawyers/${recommendation.expert.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted shadow-2xs"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>{t("recommendations.viewProfile")}</span>
        </Link>
        <Link
          href={`/lawyers/${recommendation.expert.id}/book`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-dark px-3 py-2 text-xs font-bold text-on-brand transition-all hover:bg-brand-dark/90 shadow-2xs"
        >
          <span>{t("recommendations.bookNow")}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
