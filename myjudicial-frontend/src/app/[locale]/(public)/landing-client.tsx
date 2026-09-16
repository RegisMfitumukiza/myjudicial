"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import {
  MapPin, Star, Scale, Shield, LayoutGrid,
  ArrowRight, Search, ChevronDown, ChevronRight,
  ArrowUpDown, Navigation, Loader2, X,
  Bot, BadgeCheck, FileText,
  Banknote, ThumbsUp, CalendarCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { StarRating } from "@/shared/components/star-rating";
import { SPECIALTY_ICON_MAP, SPECIALTY_ICON_CHIP } from "@/shared/constants/marketplace";
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
} from "@/lib/api/landing";
import { useExpertSearch } from "@/features/search/hooks/useExpertSearch";
import { useGeolocation } from "@/features/search/hooks/useGeolocation";
import { useRecentlyViewed, trackExpertView } from "@/features/search/hooks/use-recently-viewed";
import { useSavedExperts } from "@/features/search/hooks/use-saved-experts";
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

function ExpertCard({ expert }: { expert: LandingExpert }) {
  const t = useTranslations("landing");
  const isOnline = expert.presenceStatus === "ONLINE";

  return (
    <Link
      href={`/lawyers/${expert.id}`}
      onClick={() => trackExpertView(expert)}
      aria-label={`View profile of ${expert.name}`}
      className="group flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-brand-dark/5"
    >
      {/* Header: Avatar + Name + Rating */}
      <div className="flex items-start gap-3 p-4 pb-0">
        <div className="relative shrink-0">
          <ExpertAvatar src={expert.avatarUrl} name={expert.name} size="md" />
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-green-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold leading-tight text-foreground line-clamp-1">{expert.name}</p>
            {expert.verified && (
              <BadgeCheck size={13} className="shrink-0 text-brand-dark dark:text-white" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1 capitalize">
            {expert.specialty?.replace(/_/g, " ").toLowerCase()}
            {expert.yearsExperience ? ` · ${expert.yearsExperience}yr${expert.yearsExperience !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <div className="shrink-0">
          <StarRating rating={expert.rating} reviewCount={expert.reviewCount} size="sm" showCount={false} />
        </div>
      </div>

      {/* Body: Tags row */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2.5">
        {expert.city && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            <MapPin size={9} />{expert.city}
          </span>
        )}
        {expert.languages && expert.languages.slice(0, 2).map((lang) => (
          <span key={lang} className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {lang}
          </span>
        ))}
      </div>

      {/* Footer: Price + CTA */}
      <div className="mt-auto flex items-end justify-between gap-2 border-t border-border/50 px-4 pt-3 pb-4">
        {typeof expert.flatFee === "number" ? (
          <div>
            <p className="text-base font-bold text-foreground">{expert.flatFee.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{expert.currency}</span></p>
            <p className="text-[11px] text-muted-foreground">{t("card.consultation")}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("card.feeOnRequest")}</p>
        )}
        <span className="text-xs font-semibold text-brand-dark dark:text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {t("card.view")} <ChevronRight size={12} className="inline" />
        </span>
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
    <section className={`py-10 ${className}`}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="shrink-0 flex items-center gap-1 text-sm font-semibold text-brand-dark dark:text-white hover:underline"
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
    <div className="animate-pulse rounded-2xl border border-border bg-card p-4">
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
    <div className="animate-pulse rounded-2xl border border-border bg-card p-4">
      <div className="h-10 w-10 rounded-xl bg-muted" />
      <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
      <div className="mt-1.5 h-3 w-1/2 rounded bg-muted" />
    </div>
  );
}

function ExpertHorizontalRow({
  experts,
  isLoading,
}: {
  experts: LandingExpert[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <ExpertCardSkeleton key={i} />)}
      </div>
    );
  }
  if (!experts.length) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {experts.map((e) => <ExpertCard key={e.id} expert={e} />)}
    </div>
  );
}

// ─── Practice Area Card ───────────────────────────────────────────────────────

function PracticeAreaCard({ area, active, onClick }: { area: PracticeArea; active: boolean; onClick: () => void }) {
  const Icon = SPECIALTY_ICON_MAP[area.specialty] ?? Scale;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all w-full ${
        active
          ? "border-brand-dark bg-brand-dark text-on-brand shadow-md scale-[1.02]"
          : "border-border bg-card hover:border-brand-dark/30 hover:shadow-sm"
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-white/20 dark:bg-black/15" : SPECIALTY_ICON_CHIP}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className={`text-[14px] font-semibold ${active ? "text-on-brand" : "text-foreground"}`}>{area.label}</p>
        <p className={`text-[12px] ${active ? "text-on-brand/70" : "text-muted-foreground"}`}>
          {area.expertCount} expert{area.expertCount !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}

// ─── Review Card ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: FeaturedReview }) {
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
        <span className="text-xs text-muted-foreground capitalize">
          {review.expertSpecialty?.replace(/_/g, " ").toLowerCase()}
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const t = useTranslations("landing");
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get("q") ?? "";
  const initialSpecialty = searchParams.get("specialty") ?? null;
  const initialSort = searchParams.get("sort") ?? "HIGHEST_RATED";
  const initialAvailToday = searchParams.get("availableToday") === "true";

  const [search, setSearch] = useState(initialSearch);
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(initialSpecialty);
  const [sort, setSort] = useState<string>(initialSort);
  const [availToday, setAvailToday] = useState(initialAvailToday);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [isExploring, setIsExploring] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const geo = useGeolocation();

  // ── Data fetching — 6 focused API calls ──────────────────────────────────
  const { data: publicStats } = usePublicStats();
  const { data: practiceAreas, isLoading: areasLoading } = usePracticeAreas();
  const { data: recSection, isLoading: recLoading } = useRecommendedExperts(5);
  const { data: availSection, isLoading: availLoading } = useAvailableTodayExperts(5);
  const { data: ratedSection, isLoading: ratedLoading } = useHighestRatedExperts(5);
  const { data: reviewsSection, isLoading: reviewsLoading } = useFeaturedReviews(6);

  // ── Derived data ─────────────────────────────────────────────────────────
  const recommended = recSection?.data ?? [];
  const availableToday = availSection?.data ?? [];
  const topRated = ratedSection?.data ?? [];
  const reviews = reviewsSection?.data ?? [];

  // ── Visibility guards — each section hides itself when no real data ──────
  const showStats = !!publicStats && (publicStats.totalLawyers > 0 || publicStats.completedConsultations > 0);
  const showPracticeAreas = !areasLoading && (practiceAreas?.length ?? 0) > 0;
  const showRecommended = !recLoading && recSection?.source !== "disabled" && recommended.length > 0;
  const showAvailableToday = !availLoading && availSection?.source !== "disabled" && availableToday.length > 0;
  const showTopRated = !ratedLoading && ratedSection?.source !== "disabled" && topRated.length > 0;
  const showReviews = !reviewsLoading && reviewsSection?.source !== "disabled" && reviews.length > 0;

  // ── Personalization — localStorage, no API call ───────────────────────────
  const recentlyViewed = useRecentlyViewed();
  const showRecentlyViewed = recentlyViewed.length > 0;
  const { saved, toggleSave } = useSavedExperts();
  const showSaved = saved.length > 0;

  const clearRecentlyViewed = useCallback(() => {
    try { localStorage.removeItem("mj_recently_viewed"); window.location.reload(); } catch { /* noop */ }
  }, []);

  const clearSaved = useCallback(() => {
    saved.forEach((e) => toggleSave(e));
  }, [saved, toggleSave]);

  // ── Search results (only when user is actively exploring) ─────────────────
  const { data: searchResults, isLoading: searchLoading } = useExpertSearch(
    isExploring
      ? {
          lat: geo.lat,
          lng: geo.lng,
          radius: 50,
          limit: 20,
          search: search.trim() || undefined,
          specialty: activeSpecialty || undefined,
          sort,
          availableToday: availToday || undefined,
        }
      : { limit: 0, sort: "HIGHEST_RATED" },
    { enabled: isExploring }
  );

  // ── URL sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isExploring) return;
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (activeSpecialty && activeSpecialty !== "all") params.set("specialty", activeSpecialty);
    if (availToday) params.set("availableToday", "true");
    if (sort !== "HIGHEST_RATED") params.set("sort", sort);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [search, activeSpecialty, availToday, sort, isExploring, router]);

  useEffect(() => {
    if (searchParams.toString() === "") {
      setSearch(""); setActiveSpecialty(null); setAvailToday(false);
      setSort("HIGHEST_RATED"); setIsExploring(false);
    } else {
      const q = searchParams.get("q") || "";
      const specialty = searchParams.get("specialty");
      const avail = searchParams.get("availableToday") === "true";
      const s = searchParams.get("sort") || "HIGHEST_RATED";
      setSearch(q);
      setActiveSpecialty(specialty === "all" ? null : specialty);
      setAvailToday(avail);
      setSort(s);
      setIsExploring(true);
    }
  }, [searchParams]);

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

  const activateExplore = useCallback(() => setIsExploring(true), []);

  const handleAreaClick = useCallback((specialty: string | null) => {
    setActiveSpecialty(specialty);
    activateExplore();
  }, [activateExplore]);

  const clearFilters = useCallback(() => {
    setSearch(""); setActiveSpecialty(null); setAvailToday(false);
    setSort("HIGHEST_RATED"); setIsExploring(false);
    router.replace("?", { scroll: false });
  }, [router]);

  const activeLabel = practiceAreas?.find((a) => a.specialty === activeSpecialty)?.label ?? t("card.allExperts");
  const ActiveIcon = activeSpecialty ? (SPECIALTY_ICON_MAP[activeSpecialty] ?? Scale) : LayoutGrid;
  const currentSortKey = SORT_KEYS.find((o) => o.value === sort) ?? SORT_KEYS[1];
  const displayExperts = isExploring ? (searchResults?.lawyers ?? []) : [];
  const hasFilters = isExploring;

  return (
    <div className="bg-background min-h-[calc(100vh-4rem)]">

      {/* ── STICKY SEARCH ZONE ────────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            <div className="flex flex-1 items-center gap-2 min-w-[300px] max-w-2xl">

              {/* Specialty picker */}
              <div className="relative shrink-0" ref={categoryRef}>
                <button
                  onClick={() => setCategoryOpen((v) => !v)}
                  aria-expanded={categoryOpen}
                  aria-haspopup="listbox"
                  aria-label={t("sections.browseAreas")}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-[13px] font-semibold text-foreground shadow-sm transition hover:shadow-md"
                >
                  <ActiveIcon size={14} />
                  <span>{activeLabel}</span>
                  <ChevronDown size={12} className={`transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
                </button>
                {categoryOpen && (
                  <div role="listbox" aria-label={t("sections.browseAreas")} className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-xl max-h-72 overflow-y-auto">
                    <button
                      role="option"
                      aria-selected={activeSpecialty === null}
                      onClick={() => { setActiveSpecialty(null); setCategoryOpen(false); activateExplore(); }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${activeSpecialty === null ? "bg-accent font-bold" : "hover:bg-accent"}`}
                    >
                      <LayoutGrid size={14} /> {t("card.allExperts")}
                    </button>
                    {practiceAreas?.map((area) => {
                      const Icon = SPECIALTY_ICON_MAP[area.specialty] ?? Scale;
                      return (
                        <button
                          key={area.specialty}
                          role="option"
                          aria-selected={activeSpecialty === area.specialty}
                          onClick={() => { setActiveSpecialty(area.specialty); setCategoryOpen(false); activateExplore(); }}
                          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${activeSpecialty === area.specialty ? "bg-accent font-bold" : "hover:bg-accent"}`}
                        >
                          <Icon size={14} /> {area.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Search input */}
              <div className="flex min-w-0 flex-1 items-center rounded-full border border-border bg-card shadow-sm hover:shadow-md transition-shadow max-w-md">
                <input
                  type="text"
                  placeholder={t("search.placeholder")}
                  aria-label={t("search.placeholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`); }}
                  className="flex-1 min-w-0 bg-transparent px-4 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => { if (search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`); }}
                  aria-label={t("search.placeholder")}
                  className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-on-brand transition hover:opacity-90"
                >
                  <Search size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Filters Group */}
            <div className="flex items-center gap-2 flex-wrap">

              {/* Sort */}
              <div className="relative shrink-0" ref={sortRef}>
                <button
                  onClick={() => setSortOpen((v) => !v)}
                  aria-expanded={sortOpen}
                  aria-haspopup="listbox"
                  aria-label={t(currentSortKey.key)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2.5 text-[13px] font-semibold text-foreground shadow-sm transition hover:shadow-md"
                >
                  <ArrowUpDown size={13} />
                  <span className="hidden sm:inline">{t(currentSortKey.key)}</span>
                </button>
                {sortOpen && (
                  <div role="listbox" aria-label={t(currentSortKey.key)} className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-card py-1.5 shadow-xl">
                    {SORT_KEYS.map((opt) => (
                      <button
                        key={opt.value}
                        role="option"
                        aria-selected={sort === opt.value}
                        onClick={() => { setSort(opt.value); setSortOpen(false); activateExplore(); }}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition ${sort === opt.value ? "bg-accent font-bold" : "hover:bg-accent"}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${sort === opt.value ? "bg-foreground" : "bg-transparent"}`} />
                        {t(opt.key)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Today toggle */}
              <button
                onClick={() => { setAvailToday(!availToday); activateExplore(); }}
                aria-pressed={availToday}
                aria-label={t("search.availableToday")}
                className={`hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-2.5 text-[13px] font-semibold shadow-sm transition ${
                  availToday
                    ? "border-brand-dark bg-brand-dark text-on-brand"
                    : "border-border bg-card text-foreground hover:shadow-md"
                }`}
              >
                <CalendarCheck size={13} /> {t("search.availableToday")}
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
                  className="flex items-center justify-center h-9 w-9 rounded-full border border-border bg-card shadow-sm text-foreground transition hover:shadow-md"
                  title={t("search.nearMe")}
                >
                  {geo.loading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                </button>
              )}

              {/* Clear filters */}
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition">
                  <X size={13} /> {t("search.clear")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVE SEARCH RESULTS (when user is exploring from landing) ──── */}
      {isExploring && (
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
          {searchLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => <ExpertCardSkeleton key={i} />)}
            </div>
          ) : displayExperts.length === 0 ? (
            <div className="flex flex-col items-center py-24 text-center">
              <Scale size={40} className="mb-4 text-muted-foreground/40" />
              <h3 className="text-lg font-bold text-foreground">{t("empty.noResults")}</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">{t("empty.noResultsSub")}</p>
              <button onClick={clearFilters} className="mt-6 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition hover:opacity-90">
                {t("empty.clearAll")}
              </button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{t("empty.resultsCount", { count: displayExperts.length })}</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {displayExperts.map((e) => (
                  <ExpertCard key={e.id} expert={{
                    id: e.id,
                    name: e.name,
                    specialty: e.specialties[0] ?? null,
                    specialties: e.specialties,
                    rating: e.rating || null,
                    reviewCount: e.reviewCount,
                    city: e.city ?? e.district ?? null,
                    flatFee: e.baseConsultationFee ?? null,
                    currency: "RWF",
                    avatarUrl: e.avatarUrl,
                    yearsExperience: e.yearsExperience ?? null,
                    languages: e.languages ?? [],
                    verified: e.verified,
                    presenceStatus: e.presenceStatus,
                  }} />
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Link
                  href={`/search?${[
                    activeSpecialty ? `specialty=${encodeURIComponent(activeSpecialty)}` : "",
                    sort && sort !== "HIGHEST_RATED" ? `sort=${encodeURIComponent(sort)}` : "",
                    availToday ? "today=1" : "",
                  ].filter(Boolean).join("&")}`}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-dark/30 bg-card px-6 py-2.5 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-brand-dark hover:text-on-brand dark:border-white/30 dark:text-white dark:hover:bg-white dark:hover:text-black"
                >
                  {t("search.viewAllOnSearch")} <ArrowRight size={15} />
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TRUST BAR — quick 1-line social proof ────────────────────────── */}
      {!isExploring && (
        <div className="border-b border-border bg-background">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
              {TRUST_BAR_KEYS.map(({ icon: Icon, key }) => (
                <div key={key} className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                  <Icon size={12} className="text-brand-dark dark:text-white" /> {t(key)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HERO — value proposition for first-time visitors ─────────────── */}
      {!isExploring && (
        <div className="bg-background pt-12 pb-8">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {t("hero.subtitle")}
            </p>

            {/* ── LIVE STATS — real data from /experts/stats/public ── */}
            {showStats && (
              <div className="mt-8 flex flex-wrap gap-8">
                {publicStats!.totalLawyers > 0 && (
                  <div>
                    <p className="text-2xl font-bold text-foreground sm:text-3xl">
                      {publicStats!.totalLawyers.toLocaleString()}
                      <span className="text-brand-dark">+</span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t("stats.lawyers")}</p>
                  </div>
                )}
                {publicStats!.completedConsultations > 0 && (
                  <div>
                    <p className="text-2xl font-bold text-foreground sm:text-3xl">
                      {publicStats!.completedConsultations.toLocaleString()}
                      <span className="text-brand-dark">+</span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t("stats.consultations")}</p>
                  </div>
                )}
                {publicStats!.totalPracticeAreas > 0 && (
                  <div>
                    <p className="text-2xl font-bold text-foreground sm:text-3xl">
                      {publicStats!.totalPracticeAreas.toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t("stats.areas")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MARKETPLACE BODY (hidden while user is filtering) ────────────── */}
      {!isExploring && (
        <>
          {/* ① Browse by Practice Area — the primary discovery tool, shown first */}
          {areasLoading ? (
            <SectionRow title={t("sections.browseAreas")} subtitle={t("sections.browseAreasSub")} viewAllHref="/practice-areas" className="bg-background">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => <PracticeAreaSkeleton key={i} />)}
              </div>
            </SectionRow>
          ) : (
            <SectionFadeIn show={showPracticeAreas}>
              <SectionRetryBoundary>
                <SectionRow title={t("sections.browseAreas")} subtitle={t("sections.browseAreasSub")} viewAllHref="/practice-areas" className="bg-background">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {practiceAreas?.map((area) => (
                      <PracticeAreaCard key={area.specialty} area={area} active={activeSpecialty === area.specialty} onClick={() => handleAreaClick(area.specialty)} />
                    ))}
                  </div>
                </SectionRow>
              </SectionRetryBoundary>
            </SectionFadeIn>
          )}

          {/* ② Recommended experts — Bayesian blend of rating + reviews + bookings */}
          {recLoading ? (
            <SectionRow title={t("sections.recommended")} subtitle={t("sections.recommendedSub")} viewAllHref="/search" className="bg-muted/40">
              <ExpertHorizontalRow experts={[]} isLoading />
            </SectionRow>
          ) : (
            <SectionFadeIn show={showRecommended}>
              <SectionRetryBoundary>
                <SectionRow title={t("sections.recommended")} subtitle={t("sections.recommendedSub")} viewAllHref="/search" className="bg-muted/40">
                  <ExpertHorizontalRow experts={recommended} isLoading={false} />
                </SectionRow>
              </SectionRetryBoundary>
            </SectionFadeIn>
          )}

          {/* ③ Available Today — urgency / immediate-need CTA (only renders when lawyers are available) */}
          <SectionFadeIn show={showAvailableToday}>
            <SectionRetryBoundary>
              <SectionRow title={t("sections.availableToday")} subtitle={t("sections.availableTodaySub")} viewAllHref="/search?today=1" className="bg-background">
                <ExpertHorizontalRow experts={availableToday} isLoading={false} />
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

          {/* ⑥ How It Works — always visible, 3 steps, links to full page */}
          <section className="bg-muted/40 py-10">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
              <div className="mb-8 flex items-end justify-between gap-4">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">{t("howItWorks.title")}</h2>
                <Link
                  href="/how-it-works"
                  className="shrink-0 flex items-center gap-1 text-sm font-semibold text-brand-dark dark:text-white hover:underline"
                >
                  {t("howItWorks.learnMore")} <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10">
                    <Search size={18} className="text-brand-dark dark:text-white" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{t("howItWorks.step1title")}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{t("howItWorks.step1text")}</p>
                  </div>
                </div>
                <div className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10">
                    <FileText size={18} className="text-brand-dark dark:text-white" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{t("howItWorks.step2title")}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{t("howItWorks.step2text")}</p>
                  </div>
                </div>
                <div className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10">
                    <CalendarCheck size={18} className="text-brand-dark dark:text-white" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">{t("howItWorks.step3title")}</p>
                    <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{t("howItWorks.step3text")}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ⑦ AI Assistant CTA — core product differentiator */}
          <section className="bg-background py-10">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-brand-dark/20 bg-brand-dark/5 dark:border-white/10 dark:bg-white/5 px-6 py-8">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-dark text-on-brand">
                  <Bot size={26} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-foreground">{t("aiCta.title")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t("aiCta.subtitle")}</p>
                </div>
                <Link
                  href="/ai"
                  className="shrink-0 flex items-center gap-2 rounded-full bg-brand-dark text-on-brand px-6 py-2.5 text-sm font-semibold transition hover:opacity-90"
                >
                  {t("aiCta.button")} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>

          {/* ⑦ Recently Viewed — personalization, appears after first profile visit */}
          <SectionFadeIn show={showRecentlyViewed}>
            <SectionRetryBoundary>
              <SectionRow title={t("sections.recentlyViewed")} subtitle={t("sections.recentlyViewedSub")} className="bg-background">
                <div className="relative">
                  <ExpertHorizontalRow experts={recentlyViewed} isLoading={false} />
                  <button
                    onClick={clearRecentlyViewed}
                    className="absolute top-0 right-0 -mt-1 text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    {t("sections.clearAll")}
                  </button>
                </div>
              </SectionRow>
            </SectionRetryBoundary>
          </SectionFadeIn>

          {/* ⑧ Saved Experts — personalization, appears after first save */}
          <SectionFadeIn show={showSaved}>
            <SectionRetryBoundary>
              <SectionRow title={t("sections.savedExperts")} subtitle={t("sections.savedExpertsSub")} className="bg-muted/40">
                <div className="relative">
                  <ExpertHorizontalRow experts={saved} isLoading={false} />
                  <button
                    onClick={clearSaved}
                    className="absolute top-0 right-0 -mt-1 text-xs text-muted-foreground hover:text-foreground transition"
                  >
                    {t("sections.clearAll")}
                  </button>
                </div>
              </SectionRow>
            </SectionRetryBoundary>
          </SectionFadeIn>

          {/* ⑨ Why Trust Us — final reassurance before footer, always present */}
          <section className="bg-background py-10 border-t border-border">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
              <h2 className="mb-6 text-xl font-bold text-foreground sm:text-2xl">{t("trustWhy.title")}</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {TRUST_WHY_KEYS.map(({ icon: Icon, titleKey, descKey }) => (
                  <div key={titleKey} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10">
                      <Icon size={18} className="text-brand-dark dark:text-white" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{t(titleKey)}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">{t(descKey)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
