"use client";

import { useTranslations } from "next-intl";
import { Briefcase, ArrowRight, ExternalLink } from "lucide-react";
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
  excellent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  very_good: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  good: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  fair: "bg-muted text-muted-foreground",
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

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isTop
          ? "border-brand-dark bg-brand-dark/5"
          : "border-border bg-card hover:border-brand-dark/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <ExpertAvatar src={recommendation.expert.profile_image_url} name={recommendation.expert.full_name} size="md" />
          {rank != null && (
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-on-brand">
              {rank}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col min-[340px]:flex-row min-[340px]:items-start justify-between gap-1 min-[340px]:gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {recommendation.expert.full_name}
                </h4>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available
                </span>
              </div>
              <p className="text-xs text-muted-foreground break-words">
                {recommendation.expert.specialties
                  ?.map((s) => getLocalizedSpecialty(s, tSpecialties))
                  .join(", ") ?? ""}
              </p>
            </div>
            <div className="self-start min-[340px]:self-auto flex items-center gap-1 rounded-full bg-brand-dark px-2 py-0.5 text-[10px] min-[360px]:text-[11px] font-bold text-on-brand shrink-0">
              {t("recommendations.matchScore", { score: matchPercent })}
            </div>
          </div>

          <div className="mt-2 mb-1 flex items-center">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${QUALITY_COLORS[recommendation.match_quality] || QUALITY_COLORS.fair}`}>
              {QUALITY_EMOJIS[recommendation.match_quality] ?? ""}
              {recommendation.match_quality === "excellent" && t("recommendations.excellent")}
              {recommendation.match_quality === "very_good" && t("recommendations.veryGood")}
              {recommendation.match_quality === "good" && t("recommendations.good")}
              {recommendation.match_quality === "fair" && t("recommendations.fair")}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <StarRating rating={recommendation.expert.rating ?? 0} reviewCount={recommendation.expert.review_count} size="sm" />
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {recommendation.expert.years_of_experience ?? 0}{t("yearsExpUnit")}
            </span>
          </div>

          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("recommendations.startingAt", { rate: (recommendation.expert.base_consultation_fee ?? recommendation.expert.hourly_rate ?? 0).toLocaleString() })}
          </p>

          {recommendation.explanation.summary && (
            <p className="mt-1.5 text-[11px] text-muted-foreground italic">
              {recommendation.explanation.summary}
            </p>
          )}

          {recommendation.explanation.strengths.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {recommendation.explanation.strengths.slice(0, 2).map((s) => (
                <p key={s} className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  + {s}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <Link
          href={`/lawyers/${recommendation.expert.id}/book`}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-dark px-3 py-2 text-xs font-semibold text-on-brand transition-colors hover:bg-brand-dark/90"
        >
          {t("recommendations.bookNow")}
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href={`/lawyers/${recommendation.expert.id}`}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
        >
          <ExternalLink className="h-3 w-3" />
          {t("recommendations.viewProfile")}
        </Link>
      </div>
    </div>
  );
}
