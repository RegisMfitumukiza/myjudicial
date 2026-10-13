"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import {
  MapPin, Star, Scale, Shield, LayoutGrid,
  ArrowRight, Search, ChevronDown, ChevronRight,
  ArrowUpDown, Navigation, Loader2, X,
  Bot, BadgeCheck, FileText,
  Banknote, ThumbsUp, CalendarCheck, Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { StarRating } from "@/shared/components/star-rating";
import { SPECIALTY_ICON_MAP, SPECIALTY_ICON_CHIP } from "@/shared/constants/marketplace";
import { getLocalizedSpecialty } from "@/shared/constants/specialties";
import {
  usePracticeAreas,
  useRecommendedExperts,
  useHighestRatedExperts,
  useAvailableTodayExperts,
  useFeaturedReviews,
  usePublicStats,
  type LandingExpert,
  type PracticeArea,
  type FeaturedReview,
  type TimeContext,
} from "@/lib/api/landing";
import { useGeolocation } from "@/features/search/hooks/useGeolocation";
import { SectionRetryBoundary } from "@/shared/components/section-boundary";
import { SectionFadeIn } from "@/shared/components/section-fade-in";

// ─── Constants ────────────────────────────────────────────────────────────────

const SORT_KEYS = [
  { value: "NEAREST", key: "sort.nearest" },
  { value: "HIGHEST_RATED", key: "sort.highestRated" },
  { value: "MOST_EXPERIENCED", key: "sort.mostExperienced" },
  { value: "MOST_REVIEWED", key: "sort.mostReviewed" },
] as const;

const TRUST_BAR_KEYS = [
  { icon: BadgeCheck, key: "bar.verified" },
  { icon: Banknote, key: "bar.transparentPricing" },
  { icon: Shield, key: "bar.mobileMoney" },
  { icon: Bot, key: "bar.aiMatching" },
  { icon: ThumbsUp, key: "bar.realReviews" },
];

const TRUST_WHY_KEYS = [
  { icon: BadgeCheck, titleKey: "trustWhy.verified.title", descKey: "trustWhy.verified.desc" },
  { icon: Shield, titleKey: "trustWhy.escrow.title", descKey: "trustWhy.escrow.desc" },
  { icon: Banknote, titleKey: "trustWhy.momo.title", descKey: "trustWhy.momo.desc" },
  { icon: Star, titleKey: "trustWhy.pricing.title", descKey: "trustWhy.pricing.desc" },
  { icon: ThumbsUp, titleKey: "trustWhy.reviews.title", descKey: "trustWhy.reviews.desc" },
  { icon: CalendarCheck, titleKey: "trustWhy.sameday.title", descKey: "trustWhy.sameday.desc" },
];

// ─── Expert Card ──────────────────────────────────────────────────────────────

function ExpertCard({
  expert,
  variant = "default",
  timeContext = "today",
}: {
  expert: LandingExpert;
  variant?: "recommended" | "available" | "default";
  timeContext?: TimeContext;
}) {
  const t = useTranslations("landing");
  const tSearch = useTranslations("search");
  const tSpecialties = useTranslations("specialties");
  const isOnline = expert.presenceStatus === "ONLINE";
  const specialtyLabel = getLocalizedSpecialty(expert.specialty, tSpecialties);

  return (
    <Link
      href={`/lawyers/${expert.id}`}
      aria-label={tSearch("viewProfileAria", { name: expert.name })}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-brand-dark/5"
    >
      {/* Header: Avatar + Presence Dot + Name + Specialty */}
      <div className="flex items-start gap-2.5 sm:gap-3 p-3.5 sm:p-4 pb-0">
        <div className="relative shrink-0">
          <ExpertAvatar src={expert.avatarUrl} name={expert.name} size="md" />
          {isOnline && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card shadow-xs"
              style={{ backgroundColor: "#10b981" }}
              title={t("card.onlineNow")}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-bold leading-tight text-foreground line-clamp-2 min-h-[2.25rem]"
            title={expert.name}
          >
            {(() => {
              const parts = expert.name.trim().split(/\s+/);
              if (parts.length > 1) {
                return (
                  <>
                    {parts.slice(0, -1).join(" ")}{" "}
                    <span className="inline-flex items-center gap-1">
                      <span>{parts[parts.length - 1]}</span>
                      {expert.verified && (
                        <BadgeCheck size={14} className="shrink-0 text-brand-dark dark:text-white" />
                      )}
                    </span>
                  </>
                );
              }
              return (
                <span className="inline-flex items-center gap-1">
                  <span>{expert.name}</span>
                  {expert.verified && (
                    <BadgeCheck size={14} className="shrink-0 text-brand-dark dark:text-white" />
                  )}
                </span>
              );
            })()}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {specialtyLabel}
            {expert.yearsExperience ? ` · ${t("card.experience", { count: expert.yearsExperience })}` : ""}
          </p>
        </div>
      </div>

      {/* Visual Distinction: Urgency Badges for Available Today vs Trust Badges for Recommended */}
      <div className="flex flex-wrap items-center gap-1.5 px-3.5 sm:px-4 pt-2.5">
        {variant === "available" ? (
          isOnline ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("card.onlineNow")}
            </span>
          ) : timeContext === "tomorrow" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-amber-800 dark:text-amber-300 border border-amber-500/25">
              <CalendarCheck size={11} className="text-amber-700 dark:text-amber-300 shrink-0" />
              {t("card.nextSlotTomorrow")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-brand-dark dark:text-blue-300 border border-brand-dark/20 dark:border-blue-400/30">
              <Clock size={11} className="text-brand-dark dark:text-blue-300 shrink-0" />
              {t("card.openSlotsToday")}
            </span>
          )
        ) : variant === "recommended" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-dark/5 dark:bg-white/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-brand-dark dark:text-white border border-brand-dark/15 dark:border-white/15">
            <BadgeCheck size={11} className="text-brand-dark dark:text-white shrink-0" />
            {t("card.topRatedBadge")}
          </span>
        ) : null}

        {expert.city && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-foreground">
            <MapPin size={9} />{expert.city}
          </span>
        )}
        {expert.languages && expert.languages.slice(0, 2).map((lang) => (
          <span key={lang} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] sm:text-[11px] text-muted-foreground uppercase">
            {lang}
          </span>
        ))}
      </div>

      {/* Footer: Price + Star Rating / Reviews */}
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/50 px-3.5 sm:px-4 pt-3 pb-3.5 sm:pb-4">
        {typeof expert.flatFee === "number" ? (
          <div>
            <p className="text-sm sm:text-base font-bold text-foreground">
              {expert.flatFee.toLocaleString()}{" "}
              <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">{expert.currency}</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">{t("card.consultation")}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("card.feeOnRequest")}</p>
        )}
        <div className="shrink-0 pb-0.5">
          <StarRating rating={expert.rating} reviewCount={expert.reviewCount} size="sm" showCount={variant === "recommended"} />
        </div>
      </div>
    </Link>
  );
}

// ─── Section Row ──────────────────────────────────────────────────────────────

function SectionRow({
  title,
  subtitle,
  viewAllHref,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("landing");
  return (
    <section className={`py-8 sm:py-10 ${className}`}>
      <div className="mx-auto max-w-[1400px] px-3 min-[360px]:px-4 sm:px-6">
        <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
          <div>
            <h2 className="text-lg min-[360px]:text-xl font-bold text-foreground sm:text-2xl break-words">{title}</h2>
            {subtitle && <p className="mt-1 text-xs min-[360px]:text-sm text-muted-foreground break-words">{subtitle}</p>}
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="self-start sm:self-auto shrink-0 flex items-center gap-1 text-xs min-[360px]:text-sm font-semibold text-brand-dark dark:text-white hover:underline"
            >
              {t("sections.viewAll")} <ChevronRight size={14} />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

function ExpertCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-3.5 min-[360px]:p-4">
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
      <div className="mt-3 flex justify-between border-t border-border/50 pt-3">
        <div className="h-5 w-20 rounded bg-muted" />
        <div className="h-4 w-10 rounded bg-muted" />
      </div>
    </div>
  );
}

function PracticeAreaSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-3.5 min-[360px]:p-4">
      <div className="h-10 w-10 rounded-xl bg-muted" />
      <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
      <div className="mt-1.5 h-3 w-1/2 rounded bg-muted" />
    </div>
  );
}

function ExpertHorizontalRow({
  experts,
  isLoading,
  variant = "default",
  timeContext = "today",
}: {
  experts: LandingExpert[];
  isLoading: boolean;
  variant?: "recommended" | "available" | "default";
  timeContext?: TimeContext;
}) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 min-[360px]:-mx-4 min-[360px]:px-4 scrollbar-none sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-[230px] min-[360px]:w-[260px] shrink-0 sm:w-auto">
            <ExpertCardSkeleton />
          </div>
        ))}
      </div>
    );
  }
  if (!experts.length) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-3 px-3 min-[360px]:-mx-4 min-[360px]:px-4 scrollbar-none snap-x snap-mandatory sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-4">
      {experts.map((e) => (
        <div key={e.id} className="w-[230px] min-[360px]:w-[260px] shrink-0 snap-start sm:w-auto">
          <ExpertCard expert={e} variant={variant} timeContext={timeContext} />
        </div>
      ))}
    </div>
  );
}

// ─── Practice Area Card ───────────────────────────────────────────────────────

function PracticeAreaCard({ area }: { area: PracticeArea }) {
  const t = useTranslations("landing");
  const tSpecialties = useTranslations("specialties");
  const Icon = SPECIALTY_ICON_MAP[area.specialty] ?? Scale;
  const label = getLocalizedSpecialty(area.specialty, tSpecialties) || area.label;

  return (
    <Link
      href={`/search?specialty=${encodeURIComponent(area.specialty)}`}
      className="group flex flex-col items-start gap-2.5 sm:gap-3 rounded-2xl border border-border bg-card p-3.5 sm:p-4 text-left transition-all hover:border-brand-dark/40 hover:shadow-md dark:hover:border-white/30 w-full min-w-0"
    >
      <div className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${SPECIALTY_ICON_CHIP} transition-transform group-hover:scale-105`}>
        <Icon size={18} className="sm:hidden" />
        <Icon size={20} className="hidden sm:block" />
      </div>
      <div className="min-w-0 w-full">
        <p className="text-[13px] sm:text-[14px] font-semibold text-foreground group-hover:text-brand-dark dark:group-hover:text-white transition-colors break-words leading-snug">{label}</p>
        <p className="text-[11px] sm:text-[12px] text-muted-foreground mt-0.5 truncate">
          {area.expertCount > 0 ? t("card.expertCount", { count: area.expertCount }) : t("card.onRequest")}
        </p>
      </div>
    </Link>
  );
}

// ─── Review Card ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: FeaturedReview }) {
  const tSpecialties = useTranslations("specialties");
  const specialtyLabel = getLocalizedSpecialty(review.expertSpecialty, tSpecialties);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <StarRating rating={review.rating} showCount={false} size="md" />
        <span className="text-sm font-semibold text-foreground line-clamp-1">{review.expertName}</span>
      </div>
      {review.title && (
        <p className="text-sm font-semibold text-foreground">{review.title}</p>
      )}
      {review.comment && (
        <p className="flex-1 text-sm text-muted-foreground line-clamp-3">{review.comment}</p>
      )}
      <div className="mt-auto flex items-center justify-between border-t border-border pt-2">
        <span className="text-xs text-muted-foreground">{review.clientName}</span>
        <span className="text-xs text-muted-foreground">
          {specialtyLabel}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const t = useTranslations("landing");
  const tSpecialties = useTranslations("specialties");
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const geo = useGeolocation();

  // ── Data fetching — 6 focused API calls ──────────────────────────────────
  const { data: publicStats } = usePublicStats();
  const { data: practiceAreas } = usePracticeAreas();
  const { data: recSection, isLoading: recLoading } = useRecommendedExperts(5);
  const { data: availSection, isLoading: availLoading } = useAvailableTodayExperts(5);
  const { data: ratedSection, isLoading: ratedLoading } = useHighestRatedExperts(5);
  const { data: reviewsSection, isLoading: reviewsLoading } = useFeaturedReviews(6);

  // ── Derived data ─────────────────────────────────────────────────────────
  const recommended = recSection?.data ?? [];
  const availableToday = availSection?.data ?? [];
  const timeContext = availSection?.timeContext || "today";
  const topRated = ratedSection?.data ?? [];
  const reviews = reviewsSection?.data ?? [];

  // ── Visibility guards — each section hides itself when no real data ──────
  const showStats = !!publicStats && (publicStats.totalLawyers > 0 || publicStats.completedConsultations > 0);
  const showPracticeAreas = (practiceAreas?.length ?? 0) > 0;
  const showRecommended = !recLoading && recSection?.source !== "disabled" && recommended.length > 0;
  const showAvailableToday = !availLoading && availSection?.source !== "disabled" && availableToday.length > 0;
  const showTopRated = !ratedLoading && ratedSection?.source !== "disabled" && topRated.length > 0;
  const showReviews = !reviewsLoading && reviewsSection?.source !== "disabled" && reviews.length > 0;

  // ── Dropdown outside-click handlers ──────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    if (sortOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [sortOpen]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setCategoryOpen(false);
    };
    if (categoryOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [categoryOpen]);

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)] pb-12 sm:pb-8">

      {/* ── HERO BANNER — value proposition for first-time visitors ───────── */}
      <div className="bg-background pt-8 pb-6 sm:pt-14 sm:pb-9">
        <div className="mx-auto max-w-4xl px-3 min-[360px]:px-4 sm:px-6 text-center">
          <div className="mx-auto max-w-3xl text-center">
            {/* Verified Network Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 sm:px-3.5 text-xs font-semibold text-foreground mb-3.5 sm:mb-5 shadow-2xs">
              <BadgeCheck size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span className="truncate">{t("hero.badge")}</span>
            </div>

            {/* H1 Title */}
            <h1 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.16] sm:leading-[1.12] break-words text-balance">
              {t("hero.title")}
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-3.5 sm:mt-4 max-w-2xl text-xs min-[360px]:text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-balance break-words">
              {t("hero.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* ── SEARCH ZONE ─────────────────────────────────────────────────── */}
      <div className="relative z-30 bg-background border-y border-border shadow-xs">
        <div className="mx-auto max-w-[1400px] px-3 min-[360px]:px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3 w-full min-w-0">

            {/* Left/Top Group: Specialty picker (sm+) + Full-Width Search Input */}
            <div className="flex flex-1 items-center gap-2 w-full lg:max-w-2xl min-w-0">
              {/* Specialty picker (visible on sm+; on mobile it sits in the scrollable filter strip below) */}
              <div className="relative shrink-0 hidden sm:block" ref={categoryRef}>
                <button
                  onClick={() => setCategoryOpen((v) => !v)}
                  aria-expanded={categoryOpen}
                  aria-haspopup="listbox"
                  aria-label={t("sections.browseAreas")}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-[13px] font-semibold text-foreground shadow-sm transition hover:shadow-md whitespace-nowrap"
                >
                  <LayoutGrid size={14} />
                  <span>{t("card.allExperts")}</span>
                  <ChevronDown size={12} className={`transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
                </button>
                {categoryOpen && (
                  <div role="listbox" aria-label={t("sections.browseAreas")} className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-xl max-h-72 overflow-y-auto">
                    <button
                      role="option"
                      onClick={() => { setCategoryOpen(false); router.push("/search"); }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-accent"
                    >
                      <LayoutGrid size={14} /> {t("card.allExperts")}
                    </button>
                    {practiceAreas?.map((area) => {
                      const Icon = SPECIALTY_ICON_MAP[area.specialty] ?? Scale;
                      const label = getLocalizedSpecialty(area.specialty, tSpecialties) || area.label;
                      return (
                        <button
                          key={area.specialty}
                          role="option"
                          onClick={() => { setCategoryOpen(false); router.push(`/search?specialty=${encodeURIComponent(area.specialty)}`); }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-accent"
                        >
                          <Icon size={14} /> {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Search input — full width on mobile/tablet, max-w-md on desktop */}
              <div className="flex min-w-0 flex-1 items-center rounded-full border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                <input
                  type="text"
                  placeholder={t("search.placeholder")}
                  aria-label={t("search.placeholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`); }}
                  className="flex-1 min-w-0 bg-transparent px-3 min-[360px]:px-4 py-2 sm:py-2.5 text-[12px] min-[360px]:text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="p-1 text-muted-foreground hover:text-foreground transition mr-0.5"
                    aria-label={t("search.clear")}
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  onClick={() => { if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`); }}
                  aria-label={t("search.placeholder")}
                  className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-on-brand transition hover:opacity-90"
                >
                  <Search size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Filters Row — on mobile/tablet it smoothly scrolls horizontally; on lg it sits inline */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5 lg:pb-0 w-full lg:w-auto shrink-0 min-w-0">
              {/* Specialty picker button on small mobile screens (< sm) */}
              <div className="relative shrink-0 sm:hidden">
                <button
                  onClick={() => setCategoryOpen((v) => !v)}
                  aria-expanded={categoryOpen}
                  aria-haspopup="listbox"
                  aria-label={t("sections.browseAreas")}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-foreground shadow-xs whitespace-nowrap"
                >
                  <LayoutGrid size={13} />
                  <span className="max-w-[110px] truncate">{t("card.allExperts")}</span>
                  <ChevronDown size={11} className={`transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Sort */}
              <div className="relative shrink-0" ref={sortRef}>
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  aria-expanded={sortOpen}
                  aria-haspopup="listbox"
                  aria-label={t("sort.highestRated")}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-semibold text-foreground shadow-xs transition hover:shadow-md whitespace-nowrap"
                >
                  <ArrowUpDown size={13} />
                  <span>{t("sort.highestRated")}</span>
                </button>
                {sortOpen && (
                  <div role="listbox" aria-label={t("sort.highestRated")} className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-card py-1.5 shadow-xl">
                    {SORT_KEYS.map((opt) => (
                      <button
                        key={opt.value}
                        role="option"
                        onClick={() => { setSortOpen(false); router.push(`/search?sort=${encodeURIComponent(opt.value)}`); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm transition hover:bg-accent"
                      >
                        {t(opt.key)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Today toggle — visible and prominent on all screen sizes */}
              <button
                onClick={() => router.push("/search?today=1")}
                aria-label={t("search.availableToday")}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card text-foreground hover:shadow-xs px-3 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-semibold shadow-xs transition whitespace-nowrap shrink-0"
              >
                <CalendarCheck size={13} />
                <span>{t("search.availableToday")}</span>
              </button>

              {/* Geolocation */}
              {geo.permission !== "denied" && (
                <button
                  onClick={() => {
                    if (geo.loading) return;
                    if (geo.permission === "granted" && geo.lat && geo.lng) {
                      router.push(`/search?sort=NEAREST&lat=${geo.lat}&lng=${geo.lng}`);
                    } else {
                      geo.requestLocation((lat, lng) => {
                        router.push(`/search?sort=NEAREST&lat=${lat}&lng=${lng}`);
                      });
                    }
                  }}
                  className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-border bg-card shadow-xs text-foreground transition hover:shadow-md shrink-0"
                  title={t("search.nearMe")}
                >
                  {geo.loading ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── LIVE STATS & TRUST PROOF STRIP ───────────────────────────────── */}
      <div className="border-b border-border bg-card/40 py-3 sm:py-4">
        <div className="mx-auto max-w-[1400px] px-3 min-[360px]:px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 sm:gap-x-6">
            {/* Live Metric Badges or Launching State */}
            {showStats ? (
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                {publicStats!.totalLawyers > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-xs min-w-0">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                      <Scale size={14} className="sm:hidden" />
                      <Scale size={15} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs min-[360px]:text-sm sm:text-base font-bold leading-tight text-foreground">
                        {publicStats!.totalLawyers.toLocaleString()}<span className="text-brand-dark dark:text-white">+</span>
                      </p>
                      <p className="text-[10px] min-[360px]:text-[11px] text-muted-foreground leading-none">{t("stats.lawyers")}</p>
                    </div>
                  </div>
                )}
                {publicStats!.totalPracticeAreas > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-xs min-w-0">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                      <LayoutGrid size={14} className="sm:hidden" />
                      <LayoutGrid size={15} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs min-[360px]:text-sm sm:text-base font-bold leading-tight text-foreground">
                        {publicStats!.totalPracticeAreas.toLocaleString()}
                      </p>
                      <p className="text-[10px] min-[360px]:text-[11px] text-muted-foreground leading-none">{t("stats.areas")}</p>
                    </div>
                  </div>
                )}
                {publicStats!.completedConsultations > 0 && (
                  <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-xs min-w-0">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                      <CalendarCheck size={14} className="sm:hidden" />
                      <CalendarCheck size={15} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs min-[360px]:text-sm sm:text-base font-bold leading-tight text-foreground">
                        {publicStats!.completedConsultations.toLocaleString()}<span className="text-brand-dark dark:text-white">+</span>
                      </p>
                      <p className="text-[10px] min-[360px]:text-[11px] text-muted-foreground leading-none">{t("stats.consultations")}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-xs min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <p className="text-xs min-[360px]:text-sm font-semibold text-foreground truncate">
                  {t("stats.onboardingPill")}
                </p>
                <Link
                  href="/sign-up?role=EXPERT"
                  className="shrink-0 text-[11px] min-[360px]:text-xs font-bold text-brand-dark dark:text-white hover:underline flex items-center gap-0.5 ml-1"
                >
                  {t("stats.onboardingCta")} <ChevronRight size={12} />
                </Link>
              </div>
            )}

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-x-3.5 min-[360px]:gap-x-5 gap-y-2 text-[11px] min-[360px]:text-xs font-medium text-muted-foreground">
              {TRUST_BAR_KEYS.map(({ icon: Icon, key }) => (
                <div key={key} className="flex items-center gap-1.5">
                  <Icon size={13} className="text-brand-dark dark:text-white shrink-0" />
                  <span className="break-words">{t(key)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MARKETPLACE BODY ─────────────────────────────────────────────── */}
          {/* ① Browse by Practice Area — the primary discovery tool, shown first */}
          <SectionFadeIn show={showPracticeAreas}>
            <SectionRetryBoundary>
              <SectionRow title={t("sections.browseAreas")} subtitle={t("sections.browseAreasSub")} viewAllHref="/practice-areas" className="bg-background">
                <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {practiceAreas?.map((area) => (
                    <PracticeAreaCard key={area.specialty} area={area} />
                  ))}
                </div>
              </SectionRow>
            </SectionRetryBoundary>
          </SectionFadeIn>

          {/* ② Recommended experts — only renders when verified recommended experts exist */}
          <SectionFadeIn show={showRecommended}>
            <SectionRetryBoundary>
              <SectionRow title={t("sections.recommended")} subtitle={t("sections.recommendedSub")} viewAllHref="/search?sort=RECOMMENDED" className="bg-muted/40">
                <ExpertHorizontalRow experts={recommended} isLoading={false} variant="recommended" />
              </SectionRow>
            </SectionRetryBoundary>
          </SectionFadeIn>

          {/* ③ Available Today / Next Available — dynamic urgency CTA */}
          <SectionFadeIn show={showAvailableToday}>
            <SectionRetryBoundary>
              <SectionRow
                title={
                  timeContext === "tomorrow"
                    ? t("sections.availableTomorrow")
                    : timeContext === "tonight"
                    ? t("sections.availableTonight")
                    : timeContext === "weekend"
                    ? t("sections.availableWeekend")
                    : t("sections.availableToday")
                }
                subtitle={
                  timeContext === "tomorrow"
                    ? t("sections.availableTomorrowSub")
                    : timeContext === "tonight"
                    ? t("sections.availableTonightSub")
                    : timeContext === "weekend"
                    ? t("sections.availableWeekendSub")
                    : t("sections.availableTodaySub")
                }
                viewAllHref={timeContext === "tomorrow" ? "/search?sort=AVAILABLE" : "/search?today=1"}
                className="bg-background"
              >
                <ExpertHorizontalRow
                  experts={availableToday}
                  isLoading={false}
                  variant="available"
                  timeContext={timeContext}
                />
              </SectionRow>
            </SectionRetryBoundary>
          </SectionFadeIn>

          {/* ④ Top Rated — credibility anchor (only renders when rated experts exist) */}
          <SectionFadeIn show={showTopRated}>
            <SectionRetryBoundary>
              <SectionRow title={t("sections.topRated")} subtitle={t("sections.topRatedSub")} viewAllHref="/search?sort=HIGHEST_RATED" className="bg-muted/40">
                <ExpertHorizontalRow experts={topRated} isLoading={false} />
              </SectionRow>
            </SectionRetryBoundary>
          </SectionFadeIn>

          {/* ⑤ What Clients Say — social proof (only renders when verified reviews exist) */}
          <SectionFadeIn show={showReviews}>
            <SectionRetryBoundary>
              <SectionRow title={t("sections.reviews")} subtitle={t("sections.reviewsSub")} className="bg-background">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                </div>
              </SectionRow>
            </SectionRetryBoundary>
          </SectionFadeIn>

          {/* Launch / Advocate Onboarding Banner — shown when no verified experts are live yet */}
          {!showRecommended && !showAvailableToday && (
            <section className="py-8 sm:py-12 bg-background border-b border-border">
              <div className="mx-auto max-w-[1400px] px-3 min-[360px]:px-4 sm:px-6">
                <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-card to-brand-dark/5 dark:to-white/5 p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="max-w-2xl space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold text-foreground">
                      <Scale size={14} className="text-brand-dark dark:text-white shrink-0" />
                      <span>{t("launch.badge")}</span>
                    </div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                      {t("launch.title")}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {t("launch.description")}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <Link
                      href="/sign-up?role=EXPERT"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-dark text-on-brand px-5 py-2.5 text-xs sm:text-sm font-semibold hover:opacity-90 transition text-center shadow-xs"
                    >
                      <span>{t("launch.advocateCta")}</span>
                      <ArrowRight size={14} />
                    </Link>
                    <Link
                      href="/ai"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:bg-accent transition text-center"
                    >
                      <Bot size={14} />
                      <span>{t("launch.aiCta")}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ⑥ How It Works — always visible, 3 steps, links to full page */}
          <section className="bg-muted/40 py-10">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
              <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">{t("howItWorks.title")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("howItWorks.subtitle")}</p>
                </div>
                <Link
                  href="/how-it-works"
                  className="self-start sm:self-auto shrink-0 flex items-center gap-1 text-sm font-semibold text-brand-dark dark:text-white hover:underline"
                >
                  {t("howItWorks.learnMore")} <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3.5 sm:gap-4 sm:grid-cols-3">
                <div className="flex gap-3 min-[360px]:gap-4 rounded-2xl border border-border bg-card p-3.5 min-[360px]:p-5 min-w-0">
                  <div className="flex h-9 w-9 min-[360px]:h-10 min-[360px]:w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10">
                    <Search size={18} className="text-brand-dark dark:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] min-[360px]:text-[14px] font-semibold text-foreground break-words">{t("howItWorks.step1title")}</p>
                    <p className="mt-1 text-xs min-[360px]:text-[13px] text-muted-foreground leading-relaxed break-words">{t("howItWorks.step1text")}</p>
                  </div>
                </div>
                <div className="flex gap-3 min-[360px]:gap-4 rounded-2xl border border-border bg-card p-3.5 min-[360px]:p-5 min-w-0">
                  <div className="flex h-9 w-9 min-[360px]:h-10 min-[360px]:w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10">
                    <FileText size={18} className="text-brand-dark dark:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] min-[360px]:text-[14px] font-semibold text-foreground break-words">{t("howItWorks.step2title")}</p>
                    <p className="mt-1 text-xs min-[360px]:text-[13px] text-muted-foreground leading-relaxed break-words">{t("howItWorks.step2text")}</p>
                  </div>
                </div>
                <div className="flex gap-3 min-[360px]:gap-4 rounded-2xl border border-border bg-card p-3.5 min-[360px]:p-5 min-w-0">
                  <div className="flex h-9 w-9 min-[360px]:h-10 min-[360px]:w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10">
                    <CalendarCheck size={18} className="text-brand-dark dark:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] min-[360px]:text-[14px] font-semibold text-foreground break-words">{t("howItWorks.step3title")}</p>
                    <p className="mt-1 text-xs min-[360px]:text-[13px] text-muted-foreground leading-relaxed break-words">{t("howItWorks.step3text")}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ⑦ AI Assistant CTA — core product differentiator */}
          <section className="bg-background py-8 sm:py-10">
            <div className="mx-auto max-w-[1400px] px-3 min-[360px]:px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 rounded-2xl border border-brand-dark/20 bg-brand-dark/5 dark:border-white/10 dark:bg-white/5 p-4 sm:p-6 lg:p-8">
                <div className="flex h-11 w-11 min-[360px]:h-12 min-[360px]:w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-dark text-on-brand">
                  <Bot size={22} className="min-[360px]:hidden" />
                  <Bot size={24} className="hidden min-[360px]:block sm:hidden" />
                  <Bot size={26} className="hidden sm:block" />
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-foreground break-words">{t("aiCta.title")}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words leading-relaxed">{t("aiCta.subtitle")}</p>
                </div>
                <Link
                  href="/ai"
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 rounded-full bg-brand-dark text-on-brand px-5 py-2.5 sm:px-6 text-sm font-semibold transition hover:opacity-90 text-center"
                >
                  <span>{t("aiCta.button")}</span>
                  <ArrowRight size={14} className="shrink-0" />
                </Link>
              </div>
            </div>
          </section>

          {/* ⑦ Why Trust Us — final reassurance before footer, always present */}
          <section className="bg-background py-8 sm:py-10 border-t border-border">
            <div className="mx-auto max-w-[1400px] px-3 min-[360px]:px-4 sm:px-6">
              <h2 className="mb-4 sm:mb-6 text-lg sm:text-xl font-bold text-foreground sm:text-2xl">{t("trustWhy.title")}</h2>
              <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {TRUST_WHY_KEYS.map(({ icon: Icon, titleKey, descKey }) => (
                  <div key={titleKey} className="flex flex-col gap-2.5 sm:gap-3 rounded-2xl border border-border bg-card p-3.5 min-[360px]:p-5 min-w-0">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-brand-dark/10 shrink-0">
                      <Icon size={18} className="text-brand-dark dark:text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-foreground break-words">{t(titleKey)}</p>
                      <p className="mt-0.5 text-[11px] sm:text-[12px] text-muted-foreground leading-relaxed break-words">{t(descKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
    </div>
  );
}
