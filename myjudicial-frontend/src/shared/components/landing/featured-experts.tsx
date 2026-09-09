"use client";

import { Link } from "@/i18n/routing";
import { MapPin, ArrowRight, BadgeCheck } from "lucide-react";
import { StarRating } from "@/shared/components/star-rating";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { useNewestExperts, useMostBookedExperts, useHighestRatedExperts, useAvailableTodayExperts } from "@/lib/api/landing";
import { useTranslations } from "next-intl";

function humanizeSpecialty(s: string): string {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function ExpertCard({ expert }: { expert: { id: string; name: string; specialty: string | null; rating: number | null; reviewCount: number; city: string | null; flatFee: number | null; currency: string; avatarUrl: string | null; verified?: boolean } }) {
  const t = useTranslations("expertDashboard_featured-experts");
  return (
    <Link
      href={`/lawyers/${expert.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Header: Avatar + Name */}
      <div className="flex items-start gap-3 p-4 pb-0">
        <ExpertAvatar src={expert.avatarUrl} name={expert.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold leading-tight text-foreground line-clamp-1">{expert.name}</p>
            {expert.verified && (
              <BadgeCheck size={13} className="shrink-0 text-brand-dark dark:text-white" />
            )}
          </div>
          {expert.rating !== null && (
            <div className="mt-0.5">
              <StarRating rating={expert.rating} reviewCount={expert.reviewCount} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Body: Tags */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2.5">
        {expert.specialty && (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {humanizeSpecialty(expert.specialty)}
          </span>
        )}
        {expert.city && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            <MapPin size={9} />{expert.city}
          </span>
        )}
      </div>

      {/* Footer: Price */}
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/50 px-4 pt-3 pb-4">
        {expert.flatFee !== null ? (
          <div>
            <p className="text-base font-bold text-foreground">{expert.flatFee.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{expert.currency}</span></p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("feeNotSet")}</p>
        )}
        <span className="text-xs font-semibold text-brand-dark dark:text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {t("view")}
        </span>
      </div>
    </Link>
  );
}

type ExpertItem = { id: string; name: string; specialty: string | null; rating: number | null; reviewCount: number; city: string | null; flatFee: number | null; currency: string; avatarUrl: string | null; verified?: boolean };

function ExpertGrid({ title, description, experts, isLoading }: {
  title: string;
  description: string;
  experts: ExpertItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
              </div>
              <div className="mt-3 flex gap-1.5">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-5 w-12 rounded-full bg-muted" />
              </div>
              <div className="mt-3 border-t border-border/50 pt-3">
                <div className="h-5 w-20 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (experts.length === 0) return null;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-6">
        {experts.slice(0, 6).map((expert) => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </div>
    </div>
  );
}

export default function FeaturedExperts() {
  const t = useTranslations("expertDashboard_featured-experts");
  const { data: newestSection, isLoading: newestLoading } = useNewestExperts(6);
  const { data: mostBookedSection, isLoading: mostBookedLoading } = useMostBookedExperts(6);
  const { data: highestRatedSection, isLoading: highestRatedLoading } = useHighestRatedExperts(6);
  const { data: availableTodaySection, isLoading: availableTodayLoading } = useAvailableTodayExperts(6);

  const newestList = newestSection?.data ?? [];
  const mostBookedList = mostBookedSection?.data ?? [];
  const highestRatedList = highestRatedSection?.data ?? [];
  const availableTodayList = availableTodaySection?.data ?? [];

  // Deduplicate: track seen IDs across all sections
  const seen = new Set<string>();
  const dedupe = (list: ExpertItem[]) => {
    const result: ExpertItem[] = [];
    for (const e of list) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        result.push(e);
      }
    }
    return result;
  };

  const sections = [
    { title: t("highestRated"), description: t("highestRatedDesc"), experts: dedupe(highestRatedList), isLoading: highestRatedLoading },
    { title: t("availableToday"), description: t("availableTodayDesc"), experts: dedupe(availableTodayList), isLoading: availableTodayLoading },
    { title: t("mostBooked"), description: t("mostBookedDesc"), experts: dedupe(mostBookedList), isLoading: mostBookedLoading },
    { title: t("recentlyJoined"), description: t("recentlyJoinedDesc"), experts: dedupe(newestList), isLoading: newestLoading },
  ];

  // Filter to only sections with data
  const visibleSections = sections.filter((s) => !s.isLoading && s.experts.length > 0);
  const anyLoading = sections.some((s) => s.isLoading);
  const totalExperts = visibleSections.reduce((sum, s) => sum + s.experts.length, 0);

  if (anyLoading) {
    return (
      <section className="bg-brand-dark/[.03] py-10 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-dark">{t("ourExperts")}</p>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{t("trustedLegalProfessionals")}</h2>
            <p className="mt-3 text-base text-muted-foreground">{t("expertsSubtitle")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  <div className="h-5 w-16 rounded-full bg-muted" />
                  <div className="h-5 w-12 rounded-full bg-muted" />
                </div>
                <div className="mt-3 border-t border-border/50 pt-3">
                  <div className="h-5 w-20 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (totalExperts === 0) return null;

  return (
    <section className="bg-brand-dark/[.03] py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-dark">{t("ourExperts")}</p>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t("trustedLegalProfessionals")}
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            {t("expertsSubtitle")}
          </p>
        </div>

        {visibleSections.length === 1 ? (
          <ExpertGrid
            title={t("featuredExperts")}
            description={t("featuredExpertsDesc")}
            experts={visibleSections[0].experts}
            isLoading={false}
          />
        ) : (
          <div className="space-y-12">
            {visibleSections.map((section) => (
              <ExpertGrid
                key={section.title}
                title={section.title}
                description={section.description}
                experts={section.experts}
                isLoading={false}
              />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <button
            onClick={() => document.getElementById("expert-list")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-sm font-bold text-on-brand transition hover:bg-brand-dark/90"
          >
            {t("browseAllExperts")} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
