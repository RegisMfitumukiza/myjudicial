"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import {
  MapPin, Star, Scale, Shield, Globe, Heart,
  Lightbulb, Landmark, Building2, LayoutGrid,
  Users, Gavel, ArrowRight, Search, ChevronDown,
  ArrowUpDown, Navigation, Loader2, X, Briefcase,
  CheckCircle2, Bot, FileText, Clock, BadgeCheck,
  Banknote, ThumbsUp, CalendarCheck, Video, Phone,
  Mail, ExternalLink, ChevronRight
} from "lucide-react";
import { useTranslations } from "next-intl";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { StarRating } from "@/shared/components/star-rating";
import {
  usePracticeAreas,
  useRecommendedExperts,
  useMostBookedExperts,
  useHighestRatedExperts,
  useAvailableTodayExperts,
  useLegalServices,
  type ExpertSummary,
  type LegalServiceSummary,
  type PracticeArea,
} from "@/lib/api/landing";
import { useExpertSearch } from "@/features/search/hooks/useExpertSearch";
import { useGeolocation } from "@/features/search/hooks/useGeolocation";

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  FAMILY_LAW: Heart, COMMERCIAL_LAW: Briefcase, EMPLOYMENT_LAW: Users,
  LAND_LAW: Building2, CRIMINAL_LAW: Shield, TAX_LAW: Landmark,
  IMMIGRATION_LAW: Globe, CORPORATE_LAW: Scale, CONTRACT_LAW: Gavel,
  INTELLECTUAL_PROPERTY: Lightbulb,
};

const PRACTICE_AREA_COLORS: Record<string, string> = {
  FAMILY_LAW: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
  COMMERCIAL_LAW: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  EMPLOYMENT_LAW: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  LAND_LAW: "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  CRIMINAL_LAW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  TAX_LAW: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  IMMIGRATION_LAW: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
  CORPORATE_LAW: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  CONTRACT_LAW: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  INTELLECTUAL_PROPERTY: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
};

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

const TRUST_ITEMS = TRUST_BAR_KEYS;

const POPULAR_SEARCH_ITEMS = [
  { key: "popularSearches.items.family", href: "/search?specialty=FAMILY_LAW" },
  { key: "popularSearches.items.criminal", href: "/search?specialty=CRIMINAL_LAW" },
  { key: "popularSearches.items.property", href: "/search?specialty=LAND_LAW" },
  { key: "popularSearches.items.employment", href: "/search?specialty=EMPLOYMENT_LAW" },
  { key: "popularSearches.items.business", href: "/search?specialty=COMMERCIAL_LAW" },
  { key: "popularSearches.items.immigration", href: "/search?specialty=IMMIGRATION_LAW" },
  { key: "popularSearches.items.tax", href: "/search?specialty=TAX_LAW" },
  { key: "popularSearches.items.divorce", href: "/search?specialty=FAMILY_LAW&q=divorce" },
  { key: "popularSearches.items.inheritance", href: "/search?specialty=FAMILY_LAW&q=inheritance" },
];

const RESOURCE_ITEMS = [
  { labelKey: "resources.items.helpCenter", href: "/help", descKey: "resources.items.helpCenterDesc" },
  { labelKey: "resources.items.legalGuides", href: "/resources", descKey: "resources.items.legalGuidesDesc" },
  { labelKey: "resources.items.faqs", href: "/faqs", descKey: "resources.items.faqsDesc" },
  { labelKey: "resources.items.howBooking", href: "/how-it-works", descKey: "resources.items.howBookingDesc" },
  { labelKey: "resources.items.paymentSecurity", href: "/help", descKey: "resources.items.paymentSecurityDesc" },
  { labelKey: "resources.items.aiGuide", href: "/ai", descKey: "resources.items.aiGuideDesc" },
];

const DELIVERY_ICONS: Record<string, React.ElementType> = {
  VIDEO: Video, PHONE: Phone, EMAIL: Mail, IN_PERSON: MapPin,
};

const TRUST_WHY_KEYS = [
  { icon: BadgeCheck, titleKey: "trustWhy.verified.title", descKey: "trustWhy.verified.desc" },
  { icon: Shield, titleKey: "trustWhy.escrow.title", descKey: "trustWhy.escrow.desc" },
  { icon: Banknote, titleKey: "trustWhy.momo.title", descKey: "trustWhy.momo.desc" },
  { icon: Star, titleKey: "trustWhy.pricing.title", descKey: "trustWhy.pricing.desc" },
  { icon: ThumbsUp, titleKey: "trustWhy.reviews.title", descKey: "trustWhy.reviews.desc" },
  { icon: CalendarCheck, titleKey: "trustWhy.sameday.title", descKey: "trustWhy.sameday.desc" },
];

const PARTNERS = [
  { name: "MTN Mobile Money", short: "MTN" },
  { name: "Airtel Money", short: "Airtel" },
  { name: "AzamPay", short: "AzamPay" },
  { name: "Rwanda Bar Association", short: "RBA" },
  { name: "Ministry of Justice", short: "MINIJUST" },
];

// ─── Expert Card ──────────────────────────────────────────────────────────────

function ExpertCard({ expert }: { expert: ExpertSummary }) {
  const t = useTranslations("landing");
  const isOnline = expert.presenceStatus === "ONLINE";

  return (
    <Link href={`/lawyers/${expert.id}`} className="group block">
      {/* Photo */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
        <ExpertAvatar src={expert.avatarUrl} name={expert.name} size="xl" className="h-full w-full rounded-none" />

        {/* Verified badge */}
        {expert.verified && (
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-background/95 px-2 py-0.5 shadow backdrop-blur text-[11px] font-semibold text-foreground">
            <BadgeCheck size={11} className="text-brand-dark dark:text-white" /> {t("card.verified")}
          </div>
        )}

        {/* Rating */}
        <div className="absolute right-2.5 top-2.5 rounded-full bg-background/95 px-2 py-0.5 shadow backdrop-blur">
          <StarRating rating={expert.rating} reviewCount={expert.reviewCount} size="sm" />
        </div>

        {/* Online indicator */}
        {isOnline && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-background/95 px-2 py-0.5 shadow backdrop-blur text-[11px] font-semibold text-green-600 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> {t("card.online")}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-2.5 space-y-0.5">
        <div className="flex items-start justify-between gap-1">
          <p className="text-[14px] font-semibold leading-tight text-foreground line-clamp-1">{expert.name}</p>
        </div>
        <p className="text-[13px] text-muted-foreground line-clamp-1 capitalize">
          {expert.specialty?.replace(/_/g, " ").toLowerCase()}
          {expert.yearsExperience ? ` · ${expert.yearsExperience}yr${expert.yearsExperience !== 1 ? "s" : ""}` : ""}
        </p>
        {expert.city && (
          <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
            <MapPin size={11} />{expert.city}
          </div>
        )}
        {expert.languages && expert.languages.length > 0 && (
          <p className="text-[12px] text-muted-foreground line-clamp-1">
            {expert.languages.slice(0, 2).join(" · ")}
          </p>
        )}
        <div className="pt-0.5">
          {typeof expert.flatFee === "number" ? (
            <p className="text-[14px] text-foreground">
              <span className="font-semibold">{expert.flatFee.toLocaleString()} {expert.currency}</span>
              <span className="text-muted-foreground font-normal text-[12px] ml-1">{t("card.consultation")}</span>
            </p>
          ) : (
            <p className="text-[13px] text-muted-foreground">{t("card.feeOnRequest")}</p>
          )}
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
    <div className="animate-pulse">
      <div className="aspect-[4/3] w-full rounded-2xl bg-muted" />
      <div className="mt-2.5 space-y-1.5">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-3 w-2/3 rounded bg-muted" />
      </div>
    </div>
  );
}

function ExpertHorizontalRow({
  experts,
  isLoading,
}: {
  experts: ExpertSummary[];
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
  const Icon = ICON_MAP[area.specialty] ?? Scale;
  const colorClass = PRACTICE_AREA_COLORS[area.specialty] ?? "bg-muted text-foreground";
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all w-full ${
        active
          ? "border-brand-dark bg-brand-dark text-white dark:border-white dark:bg-white dark:text-brand-dark shadow-md scale-[1.02]"
          : "border-border bg-card hover:border-brand-dark/30 hover:shadow-sm"
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "bg-white/20" : colorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className={`text-[14px] font-semibold ${active ? "text-white dark:text-brand-dark" : "text-foreground"}`}>{area.label}</p>
        <p className={`text-[12px] ${active ? "text-white/70 dark:text-brand-dark/70" : "text-muted-foreground"}`}>
          {area.expertCount} expert{area.expertCount !== 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}

// ─── Legal Service Card ───────────────────────────────────────────────────────

function ServiceCard({ service }: { service: LegalServiceSummary }) {
  const t = useTranslations("landing");
  const DeliveryIcon = DELIVERY_ICONS[service.deliveryMode] ?? Video;
  return (
    <Link href={`/lawyers/${service.expertId}`} className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] font-semibold text-foreground line-clamp-2 leading-snug">{service.name}</p>
        <span className="shrink-0 flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          <DeliveryIcon size={10} /> {service.deliveryMode.replace("_", " ")}
        </span>
      </div>
      {service.description && (
        <p className="text-[13px] text-muted-foreground line-clamp-2">{service.description}</p>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        <div>
          <p className="text-[12px] text-muted-foreground">{service.expertName}</p>
          {service.expertCity && (
            <p className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><MapPin size={10} />{service.expertCity}</p>
          )}
        </div>
        <div className="text-right">
          {typeof service.flatFee === "number" ? (
            <p className="text-[14px] font-bold text-foreground">
              {service.flatFee.toLocaleString()} <span className="text-[11px] font-normal">{service.currency}</span>
            </p>
          ) : (
            <p className="text-[12px] text-muted-foreground">{t("card.onRequest")}</p>
          )}
          <p className="text-[11px] text-muted-foreground">{service.durationMin} min</p>
        </div>
      </div>
    </Link>
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
  const [isExploring, setIsExploring] = useState(false); // whether user has interacted with filters

  const sortRef = useRef<HTMLDivElement>(null);
  const geo = useGeolocation();

  const { data: practiceAreas, isLoading: areasLoading } = usePracticeAreas();
  const { data: recommended, isLoading: recLoading } = useRecommendedExperts(5);
  const { data: availableToday, isLoading: availLoading } = useAvailableTodayExperts(5);
  const { data: mostBooked, isLoading: bookedLoading } = useMostBookedExperts(5);
  const { data: topRated, isLoading: ratedLoading } = useHighestRatedExperts(5);
  const { data: services, isLoading: servicesLoading } = useLegalServices(8);

  // Whether each data section should be visible
  const showRecommended = !recLoading && recommended && recommended.length > 0;
  const showAvailableToday = !availLoading && availableToday && availableToday.length > 0;
  const showPracticeAreas = !areasLoading && practiceAreas && practiceAreas.length > 0;
  const showMostBooked = !bookedLoading && mostBooked && mostBooked.length > 0;
  const showTopRated = !ratedLoading && topRated && topRated.length > 0;
  const showServices = !servicesLoading && services && services.length > 0;

  // Search results (only when user is actively exploring)
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
      : { limit: 0, sort: "HIGHEST_RATED" }, // skip query when not exploring
    { enabled: isExploring }
  );

  // Sync state TO URL when user interacts with filters
  useEffect(() => {
    if (!isExploring) return;
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (activeSpecialty && activeSpecialty !== "all") params.set("specialty", activeSpecialty);
    if (availToday) params.set("availableToday", "true");
    if (sort !== "HIGHEST_RATED") params.set("sort", sort);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [search, activeSpecialty, availToday, sort, isExploring, router]);

  // Sync state FROM URL to support direct navigation (e.g. clicking View All links or Logo)
  useEffect(() => {
    if (searchParams.toString() === "") {
      // User navigated back to bare /, reset everything
      setSearch("");
      setActiveSpecialty(null);
      setAvailToday(false);
      setSort("HIGHEST_RATED");
      setIsExploring(false);
    } else {
      // User clicked a link with search params, sync state and explore
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

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    if (sortOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [sortOpen]);

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
  const ActiveIcon = activeSpecialty ? (ICON_MAP[activeSpecialty] ?? Scale) : LayoutGrid;
  const currentSortKey = SORT_KEYS.find((o) => o.value === sort) ?? SORT_KEYS[1];
  const displayExperts = isExploring ? (searchResults?.lawyers ?? []) : [];
  const hasFilters = isExploring;

  return (
    <div className="min-h-screen bg-background">
      {/* ── STICKY SEARCH ZONE ───────────────────────────────────────────── */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            <div className="flex flex-1 items-center gap-2 min-w-[300px] max-w-2xl">

            {/* Specialty picker */}
            <div className="relative shrink-0">
              <button
                onClick={() => setCategoryOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-[13px] font-semibold text-foreground shadow-sm transition hover:shadow-md"
              >
                <ActiveIcon size={14} />
                <span>{activeLabel}</span>
                <ChevronDown size={12} className={`transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
              </button>
              {categoryOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-2 shadow-xl max-h-72 overflow-y-auto">
                  <button
                    onClick={() => { setActiveSpecialty(null); setCategoryOpen(false); activateExplore(); }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${activeSpecialty === null ? "bg-accent font-bold" : "hover:bg-accent"}`}
                  >
                    <LayoutGrid size={14} /> {t("card.allExperts")}
                  </button>
                  {practiceAreas?.map((area) => {
                    const Icon = ICON_MAP[area.specialty] ?? Scale;
                    return (
                      <button
                        key={area.specialty}
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
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (e.target.value) activateExplore(); }}
                onKeyDown={(e) => { if (e.key === "Enter") activateExplore(); }}
                className="flex-1 min-w-0 bg-transparent px-4 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={activateExplore}
                className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-white dark:text-black transition hover:opacity-90"
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
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2.5 text-[13px] font-semibold text-foreground shadow-sm transition hover:shadow-md"
              >
                <ArrowUpDown size={13} />
                <span className="hidden sm:inline">{t(currentSortKey.key)}</span>
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-card py-1.5 shadow-xl">
                  {SORT_KEYS.map((opt) => (
                    <button
                      key={opt.value}
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
              className={`hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-2.5 text-[13px] font-semibold shadow-sm transition ${
                availToday
                  ? "border-brand-dark bg-brand-dark text-white dark:border-white dark:bg-white dark:text-brand-dark"
                  : "border-border bg-card text-foreground hover:shadow-md"
              }`}
            >
              <CalendarCheck size={13} /> {t("search.availableToday")}
            </button>

            {/* Geolocation → opens unified Search Experience */}
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

      {/* ── ACTIVE SEARCH RESULTS ─────────────────────────────────────────── */}
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
                {displayExperts.map((e: any) => (
                  <ExpertCard key={e.id} expert={{ ...e, specialty: e.specialties?.[0] ?? null, specialties: e.specialties ?? [], flatFee: e.baseConsultationFee ?? null } as ExpertSummary} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TRUST INDICATORS (compact) ────────────────────────────────────── */}
      {!isExploring && (
        <div className="border-b border-border bg-background">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
              {TRUST_ITEMS.map(({ icon: Icon, key: key }) => (
                <div key={key} className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                  <Icon size={12} className="text-brand-dark dark:text-white" /> {t(key)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MARKETPLACE BODY (only when not in search mode) ────────────────── */}
      {!isExploring && (
        <>
          {/* 1. Recommended — skeleton while loading, hide when empty */}
          {recLoading ? (
            <SectionRow title={t("sections.recommended")} subtitle={t("sections.recommendedSub")} viewAllHref="/?sort=HIGHEST_RATED" className="bg-background">
              <ExpertHorizontalRow experts={[]} isLoading />
            </SectionRow>
          ) : showRecommended && (
            <SectionRow title={t("sections.recommended")} subtitle={t("sections.recommendedSub")} viewAllHref="/?sort=HIGHEST_RATED" className="bg-background">
              <ExpertHorizontalRow experts={recommended} isLoading={false} />
            </SectionRow>
          )}

          {/* 2. Available Today */}
          {availLoading ? (
            <SectionRow title={t("sections.availableToday")} subtitle={t("sections.availableTodaySub")} viewAllHref="/?availableToday=true" className="bg-muted/40">
              <ExpertHorizontalRow experts={[]} isLoading />
            </SectionRow>
          ) : showAvailableToday && (
            <SectionRow title={t("sections.availableToday")} subtitle={t("sections.availableTodaySub")} viewAllHref="/?availableToday=true" className="bg-muted/40">
              <ExpertHorizontalRow experts={availableToday} isLoading={false} />
            </SectionRow>
          )}

          {/* 3. Practice Areas */}
          {showPracticeAreas && (
            <SectionRow title={t("sections.browseAreas")} subtitle={t("sections.browseAreasSub")} viewAllHref="/?specialty=all" className="bg-background">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {practiceAreas.map((area) => (
                  <PracticeAreaCard key={area.specialty} area={area} active={activeSpecialty === area.specialty} onClick={() => handleAreaClick(area.specialty)} />
                ))}
              </div>
            </SectionRow>
          )}

          {/* 4. Most Booked */}
          {bookedLoading ? (
            <SectionRow title={t("sections.mostBooked")} subtitle={t("sections.mostBookedSub")} viewAllHref="/?sort=MOST_REVIEWED" className="bg-muted/40">
              <ExpertHorizontalRow experts={[]} isLoading />
            </SectionRow>
          ) : showMostBooked && (
            <SectionRow title={t("sections.mostBooked")} subtitle={t("sections.mostBookedSub")} viewAllHref="/?sort=MOST_REVIEWED" className="bg-muted/40">
              <ExpertHorizontalRow experts={mostBooked} isLoading={false} />
            </SectionRow>
          )}

          {/* 5. Top Rated */}
          {ratedLoading ? (
            <SectionRow title={t("sections.topRated")} subtitle={t("sections.topRatedSub")} viewAllHref="/?sort=HIGHEST_RATED" className="bg-background">
              <ExpertHorizontalRow experts={[]} isLoading />
            </SectionRow>
          ) : showTopRated && (
            <SectionRow title={t("sections.topRated")} subtitle={t("sections.topRatedSub")} viewAllHref="/?sort=HIGHEST_RATED" className="bg-background">
              <ExpertHorizontalRow experts={topRated} isLoading={false} />
            </SectionRow>
          )}

          {/* 6. Legal Services */}
          {showServices && (
            <SectionRow title={t("sections.browseServices")} subtitle={t("sections.browseServicesSub")} viewAllHref="/practice-areas" className="bg-muted/40">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {services.map((s) => <ServiceCard key={s.id} service={s} />)}
              </div>
            </SectionRow>
          )}

          {/* 7. AI Assistant CTA */}
          <section className="bg-background py-10">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-brand-dark/20 bg-brand-dark/5 dark:border-white/10 dark:bg-white/5 px-6 py-8">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-dark dark:bg-white">
                  <Bot size={26} className="text-white dark:text-black" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-foreground">{t("aiCta.title")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t("aiCta.subtitle")}</p>
                </div>
                <Link
                   href="/ai"
                  className="shrink-0 flex items-center gap-2 rounded-full bg-brand-dark dark:bg-white px-6 py-2.5 text-sm font-semibold text-white dark:text-black transition hover:opacity-90"
                >
                  {t("aiCta.button")} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>

          {/* 8. Popular Searches */}
          <SectionRow
            title={t("popularSearches.title")}
            subtitle={t("popularSearches.subtitle")}
            className="bg-muted/40"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {POPULAR_SEARCH_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-3 text-[13px] font-medium text-foreground transition hover:border-brand-dark/30 hover:shadow-sm"
                >
                  <span className="line-clamp-1">{t(item.key)}</span>
                  <ExternalLink size={11} className="shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </SectionRow>

          {/* 9. Legal Resources */}
          <SectionRow
            title={t("resources.title")}
            subtitle={t("resources.subtitle")}
            className="bg-background"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {RESOURCE_ITEMS.map((r) => (
                <Link
                  key={r.labelKey}
                  href={r.href}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <FileText size={18} className="text-foreground/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground group-hover:underline">{t(r.labelKey)}</p>
                    <p className="text-[12px] text-muted-foreground line-clamp-1">{t(r.descKey)}</p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </SectionRow>

          {/* 10. Trust & Security */}
          <section className="bg-muted/40 py-10">
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

          {/* 11. Partners */}
          <section className="bg-background py-10 border-b border-border">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
              <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("partnersSection")}</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {PARTNERS.map((p) => (
                  <div
                    key={p.name}
                    title={p.name}
                    className="flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-bold text-muted-foreground transition hover:text-foreground hover:border-brand-dark/30"
                  >
                    {p.short}
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
