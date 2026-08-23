"use client";

import { Link } from "@/i18n/routing";
import { MapPin, ArrowRight } from "lucide-react";
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

function ExpertCard({ expert }: { expert: { id: string; name: string; specialty: string | null; rating: number | null; reviewCount: number; city: string | null; flatFee: number | null; currency: string; avatarUrl: string | null } }) {
  const t = useTranslations("expertDashboard_featured-experts");
  return (
    <Link
      href={`/lawyers/${expert.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-brand-dark/5">
        <ExpertAvatar src={expert.avatarUrl} name={expert.name} size="xl" className="h-full w-full rounded-none" />
        {expert.rating !== null && (
          <div className="absolute right-2.5 top-2.5 rounded-full bg-background/95 px-2 py-1 shadow-sm backdrop-blur">
            <StarRating rating={expert.rating} reviewCount={expert.reviewCount} size="sm" />
          </div>
        )}
      </div>

      <div className="space-y-1.5 p-3">
        <p className="truncate text-[13px] font-bold leading-tight text-foreground">{expert.name}</p>

        <div className="flex items-center justify-between gap-2">
          {expert.specialty && (
            <span className="truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {humanizeSpecialty(expert.specialty)}
            </span>
          )}
          {expert.city && (
            <div className="flex shrink-0 items-center gap-0.5 text-[11px] text-muted-foreground">
              <MapPin size={10} /><span>{expert.city}</span>
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between border-t border-border/50 pt-1.5">
          {expert.flatFee !== null ? (
            <p className="text-[13px] text-foreground">
              <span className="font-bold">{expert.flatFee.toLocaleString()}</span>{" "}
              <span className="font-normal text-muted-foreground">{expert.currency}</span>
            </p>
          ) : (
            <p className="text-[13px] text-muted-foreground">{t("feeNotSet")}</p>
          )}
          <span className="text-[11px] font-semibold text-brand-dark opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {t("view")}
          </span>
        </div>
      </div>
    </Link>
  );
}

type ExpertItem = { id: string; name: string; specialty: string | null; rating: number | null; reviewCount: number; city: string | null; flatFee: number | null; currency: string; avatarUrl: string | null };

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
            <div key={i} className="animate-pulse">
              <div className="aspect-square w-full rounded-2xl bg-muted" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
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
  const { data: newest, isLoading: newestLoading } = useNewestExperts(6);
  const { data: mostBooked, isLoading: mostBookedLoading } = useMostBookedExperts(6);
  const { data: highestRated, isLoading: highestRatedLoading } = useHighestRatedExperts(6);
  const { data: availableToday, isLoading: availableTodayLoading } = useAvailableTodayExperts(6);

  const newestList = newest ?? [];
  const mostBookedList = mostBooked ?? [];
  const highestRatedList = highestRated ?? [];
  const availableTodayList = availableToday ?? [];

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
              <div key={i} className="animate-pulse">
                <div className="aspect-square w-full rounded-2xl bg-muted" />
                <div className="mt-3 space-y-2">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-1/2 rounded bg-muted" />
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
