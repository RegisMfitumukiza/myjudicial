"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import {
  Search, MapPin, X, ChevronDown, ChevronUp,
  Menu, Scale, Shield, Globe, Heart,
  Lightbulb, Landmark, Building2, LayoutGrid,
  Users, Gavel, ArrowUpDown, Navigation, Loader2, Briefcase,
} from "lucide-react";
import { StarRating } from "@/shared/components/star-rating";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { ProfileMenu } from "@/shared/components/profile-menu";
import { Logo } from "@/shared/components/logo";
import { MapView } from "@/features/search/components/map-view";
import { ExpertAvatar } from "@/shared/components/expert-avatar";
import { useExpertSearch } from "@/features/search/hooks/useExpertSearch";
import { useGeolocation } from "@/features/search/hooks/useGeolocation";
import { usePracticeAreas } from "@/lib/api/landing";
import type { Lawyer } from "@/features/search/types";
import { useTranslations, useLocale } from "next-intl";
import HeroSection from "@/shared/components/landing/hero-section";
import TrustIndicators from "@/shared/components/landing/trust-indicators";
import HowItWorks from "@/shared/components/landing/how-it-works";
import WhyMyJudicial from "@/shared/components/landing/why-myjudicial";
import PracticeAreas from "@/shared/components/landing/practice-areas";
import FeaturedExperts from "@/shared/components/landing/featured-experts";
import Testimonials from "@/shared/components/landing/testimonials";
import FaqSection from "@/shared/components/landing/faq-section";
import LandingFooter from "@/shared/components/landing/landing-footer";

const ICON_MAP: Record<string, React.ElementType> = {
  FAMILY_LAW: Heart,
  COMMERCIAL_LAW: Briefcase,
  EMPLOYMENT_LAW: Users,
  LAND_LAW: Building2,
  CRIMINAL_LAW: Shield,
  TAX_LAW: Landmark,
  IMMIGRATION_LAW: Globe,
  CORPORATE_LAW: Scale,
  CONTRACT_LAW: Gavel,
  INTELLECTUAL_PROPERTY: Lightbulb,
};

const SORT_OPTIONS = [
  { value: "NEAREST", label: "Nearest" },
  { value: "HIGHEST_RATED", label: "Highest Rated" },
  { value: "MOST_EXPERIENCED", label: "Most Experienced" },
  { value: "MOST_REVIEWED", label: "Most Reviewed" },
] as const;

function ExpertCard({ expert, selected, onSelect }: { expert: Lawyer; selected: boolean; onSelect: () => void }) {
  return (
    <Link
      href={`/lawyers/${expert.id}`}
      onClick={onSelect}
      className={`group block overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-200 ${
        selected
          ? "border-[rgb(36,85,141)] ring-2 ring-[rgb(36,85,141)]/20 shadow-md"
          : "border-border hover:-translate-y-0.5 hover:shadow-lg"
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-brand-dark/5">
        <ExpertAvatar src={expert.avatarUrl} name={expert.name} size="xl" className="h-full w-full rounded-none" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {expert.verified && (
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 shadow-sm backdrop-blur">
            <Shield size={10} className="text-foreground/70" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/70">Verified</span>
          </div>
        )}
        <div className="absolute right-2.5 top-2.5 rounded-full bg-background/95 px-2 py-1 shadow-sm backdrop-blur">
          <StarRating rating={expert.rating} reviewCount={expert.reviewCount} size="sm" />
        </div>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="truncate text-[13px] font-bold leading-tight text-foreground">{expert.name}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{expert.specialtyLabel}</span>
          <div className="flex shrink-0 items-center gap-0.5 text-[11px] text-muted-foreground"><MapPin size={10} /><span>{expert.district}</span></div>
        </div>
        <div className="flex items-baseline justify-between border-t border-border/50 pt-1.5">
          <p className="text-[13px] text-foreground">
            <span className="font-bold">{(expert.startingRateRwf / 1000).toFixed(0)}k RWF</span>{" "}
            <span className="font-normal text-muted-foreground">/hr</span>
          </p>
          <span className="text-[11px] font-semibold text-brand-dark opacity-0 transition-opacity duration-300 group-hover:opacity-100">View</span>
        </div>
      </div>
    </Link>
  );
}

export function ExpertsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("search");
  const tPublic = useTranslations("public");

  // Read initial state from URL
  const initialSearch = searchParams.get("q") ?? "";
  const initialSpecialty = searchParams.get("specialty") ?? null;
  const initialSort = searchParams.get("sort") ?? "NEAREST";
  const initialLat = searchParams.get("lat") ? Number(searchParams.get("lat")) : null;
  const initialLng = searchParams.get("lng") ? Number(searchParams.get("lng")) : null;

  const [search, setSearch] = useState(initialSearch);
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(initialSpecialty);
  const [sort, setSort] = useState<string>(initialSort);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const locale = useLocale();
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const geo = useGeolocation(initialLat && initialLng ? { lat: initialLat, lng: initialLng } : undefined);

  // Persist filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (activeSpecialty) params.set("specialty", activeSpecialty);
    if (sort !== "NEAREST") params.set("sort", sort);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [search, activeSpecialty, sort, router]);

  // Auto-scroll to expert list when arriving with a specialty filter (e.g. from landing page practice areas)
  useEffect(() => {
    if (initialSpecialty) {
      const timer = setTimeout(() => {
        document.getElementById("expert-list")?.scrollIntoView({ behavior: "smooth" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let ticking = false;
    const h = () => { if (!ticking) { requestAnimationFrame(() => { setSearchCollapsed(window.scrollY > 80); ticking = false; }); ticking = true; } };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const { data: session } = useSession();
  const { user: authUser } = useAuth();
  const { data: practiceAreas } = usePracticeAreas();
  const { data: searchResults, isLoading, error } = useExpertSearch({
    lat: geo.lat,
    lng: geo.lng,
    radius: 20,
    limit: 50,
    search: search.trim() || undefined,
    specialty: activeSpecialty || undefined,
    sort,
  });
  const experts = searchResults?.lawyers ?? [];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (langRef.current && !langRef.current.contains(e.target as Node)) setLanguageOpen(false); };
    if (languageOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [languageOpen]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false); };
    if (sortOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [sortOpen]);

  const q = search.trim().toLowerCase();
  const filteredExperts = experts.filter((e) => !q || e.name.toLowerCase().includes(q) || e.specialtyLabel.toLowerCase().includes(q));

  const activeLabel = activeSpecialty
    ? practiceAreas?.find((a) => a.specialty === activeSpecialty)?.label ?? "Experts"
    : "All Experts";
  const ActiveIcon = activeSpecialty ? (ICON_MAP[activeSpecialty] ?? Scale) : LayoutGrid;

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
    // On mobile, scroll the selected card into view
    if (window.innerWidth < 1024) {
      const el = document.getElementById(`expert-card-${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const currentSort = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── Navigation bar (single, clean) ── */}
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-3 sm:px-4 lg:px-6 h-14 sm:h-16">
          <Logo iconOnly={false} iconSize={18} fontSize="text-[14px]" href="/" className="shrink-0" />

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="relative hidden sm:block" ref={langRef}>
              <button onClick={() => setLanguageOpen((o) => !o)}
                className="flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-2 text-[11px] font-semibold text-brand-dark/70 transition-colors hover:border-slate-400 hover:text-brand-dark dark:border-slate-700 dark:text-gray-300 dark:hover:border-slate-500 dark:hover:text-gray-100">
                <Globe size={13} />
                <span className="hidden md:inline">{locale.toUpperCase()}</span>
                <ChevronDown size={11} className={`transition-transform ${languageOpen ? "rotate-180" : ""}`} />
              </button>
              {languageOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-border bg-card py-1 shadow-xl">
                  {[{ code: "en", label: "English" }, { code: "fr", label: "Francais" }, { code: "rw", label: "Kinyarwanda" }].map(({ code, label }) => (
                    <button key={code} onClick={() => { router.replace(pathname, { locale: code }); setLanguageOpen(false); }}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors ${locale === code ? "bg-accent font-bold text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                      <span className={`h-2 w-2 rounded-full ${locale === code ? "bg-brand-dark" : "bg-transparent"}`} />{label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden sm:block"><ThemeToggle /></div>
            <ProfileMenu />
            <button onClick={() => setMobileOpen((v) => !v)} className="flex items-center gap-1 rounded-full border border-brand-border p-1.5 text-brand-dark transition-colors hover:shadow-md lg:hidden dark:border-slate-700 dark:text-gray-100" aria-label="Toggle menu">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="border-t border-border bg-background px-4 py-3 shadow-lg lg:hidden">
            <nav className="space-y-1">
              <div className="sm:hidden">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Language</p>
                <div className="flex gap-2 px-3 py-2">
                  {[{ code: "en", label: "EN" }, { code: "fr", label: "FR" }, { code: "rw", label: "RW" }].map(({ code, label }) => (
                    <button key={code} onClick={() => { router.replace(pathname, { locale: code }); setMobileOpen(false); }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${locale === code ? "border-brand-dark bg-brand-dark text-on-brand" : "border-border text-muted-foreground hover:bg-accent"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2 sm:hidden">
                <span className="text-sm font-medium text-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Log In</Link>
              <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Sign Up</Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── Floating search & filters ── */}
      <div className="sticky top-14 sm:top-16 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <AnimatePresence mode="wait">
          {searchCollapsed ? (
            <motion.div key="pill" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="flex justify-center px-4 py-3">
              <button onClick={() => { setSearchCollapsed(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-md hover:shadow-lg transition-shadow">
                <span className="text-xs font-medium text-foreground/80 whitespace-nowrap">
                  {activeLabel}<span className="mx-1 text-muted-foreground">|</span>{search || "Search..."}
                </span>
                <span className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-dark"><Search size={11} className="text-on-brand" /></span>
              </button>
            </motion.div>
          ) : (
            <motion.div key="filters" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="flex justify-center px-4 py-3">
              <div className="flex w-full max-w-3xl items-center gap-2 sm:gap-2.5">
                {/* Search bar */}
                <div className="flex flex-1 items-center rounded-full border border-border bg-card shadow-md">
                  <div className="relative shrink-0">
                    <button onClick={() => setCategoryOpen((v) => !v)} className="flex items-center gap-1.5 rounded-l-full pl-3 pr-2 py-2.5 text-[12px] font-medium text-foreground/80 transition-colors hover:bg-accent">
                      <ActiveIcon size={14} />
                      <span className="hidden md:inline whitespace-nowrap max-w-[100px] truncate">{activeLabel}</span>
                      <ChevronDown size={12} className={`hidden sm:block transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
                    </button>
                    {categoryOpen && (
                      <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card py-1.5 shadow-xl max-h-80 overflow-y-auto">
                        <button onClick={() => { setActiveSpecialty(null); setCategoryOpen(false); }}
                          className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${activeSpecialty === null ? "bg-brand-dark/10 font-bold text-brand-dark dark:bg-white/10 dark:text-white" : "text-brand-dark/70 hover:bg-gray-50 hover:text-brand-dark dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"}`}>
                          <LayoutGrid size={15} />All Experts
                        </button>
                        {practiceAreas?.map((area) => {
                          const Icon = ICON_MAP[area.specialty] ?? Scale;
                          return (
                            <button key={area.specialty} onClick={() => { setActiveSpecialty(area.specialty); setCategoryOpen(false); }}
                              className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${activeSpecialty === area.specialty ? "bg-brand-dark/10 font-bold text-brand-dark dark:bg-white/10 dark:text-white" : "text-brand-dark/70 hover:bg-gray-50 hover:text-brand-dark dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"}`}>
                              <Icon size={15} />{area.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="hidden sm:block h-5 w-px bg-border" />
                  <input type="text" placeholder="Search name or specialty" value={search} onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground" />
                  <button className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-on-brand transition hover:bg-brand-dark/90"><Search size={14} /></button>
                </div>

                {/* Sort */}
                <div className="relative shrink-0" ref={sortRef}>
                  <button onClick={() => setSortOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2.5 text-[12px] font-medium text-foreground/80 transition-colors hover:bg-accent shadow-md">
                    <ArrowUpDown size={13} />
                    <span className="hidden sm:inline">{currentSort.label}</span>
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-border bg-card py-1.5 shadow-xl">
                      {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value} onClick={() => { setSort(opt.value); setSortOpen(false); }}
                          className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors ${sort === opt.value ? "bg-brand-dark/10 font-bold text-brand-dark dark:bg-white/10 dark:text-white" : "text-brand-dark/70 hover:bg-gray-50 hover:text-brand-dark dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"}`}>
                          <span className={`h-2 w-2 rounded-full ${sort === opt.value ? "bg-brand-dark" : "bg-transparent"}`} />{opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Map toggle */}
                <button onClick={() => setMapVisible(!mapVisible)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2.5 text-[12px] font-medium transition-colors shadow-md ${mapVisible ? "border-brand-dark bg-brand-dark text-on-brand" : "border-border text-muted-foreground hover:bg-accent bg-card"}`}>
                  <MapPin size={13} />
                  <span className="hidden sm:inline">{mapVisible ? "Hide Map" : "Map"}</span>
                </button>

                {/* Geolocation */}
                {geo.permission !== "denied" && !geo.loading && (
                  <button onClick={() => geo.requestLocation()}
                    className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2.5 text-[12px] font-medium text-muted-foreground shadow-md transition-colors hover:bg-accent"
                    title="Search near my location">
                    <Navigation size={13} />
                  </button>
                )}
                {geo.loading && (
                  <div className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2.5 text-[12px] text-muted-foreground shadow-md">
                    <Loader2 size={13} className="animate-spin" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hero — hidden when map is open on mobile for more screen real estate */}
      <div className={mobileMapOpen ? "hidden lg:block" : ""}>
        <HeroSection />
      </div>

      {/* Main content: list + map */}
      <div id="expert-list" className={`mx-auto flex w-full max-w-[1400px] flex-1 scroll-mt-[140px] ${mapVisible ? "lg:divide-x lg:divide-brand-border" : ""}`}>
        {/* Expert list */}
        <div ref={listRef} className={`flex-1 overflow-auto px-4 sm:px-6 py-6 sm:py-8 ${mapVisible ? "max-w-full lg:max-w-[55%]" : "max-w-full"}`}>
          {filteredExperts.length === 0 && !isLoading && !error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h3 className="text-lg font-bold text-foreground">{t("title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
              <button onClick={() => { setSearch(""); setActiveSpecialty(null); }} className="mt-4 rounded-lg bg-brand-dark px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-dark/90">{t("clearAll")}</button>
            </div>
          ) : (
            <div>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="text-[18px] sm:text-[20px] font-bold text-foreground">{activeLabel}</h2>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {isLoading ? "Loading..." : `${filteredExperts.length} ${filteredExperts.length === 1 ? "expert" : "experts"} found`}
                  </p>
                </div>
                {/* Mobile map toggle */}
                <button onClick={() => setMobileMapOpen(true)}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-sm lg:hidden">
                  <MapPin size={12} /> Show Map
                </button>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-5 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-2xl border border-border bg-card">
                      <div className="aspect-square w-full rounded-t-2xl bg-muted" />
                      <div className="p-3 space-y-2"><div className="h-3 w-3/4 rounded bg-muted" /><div className="h-3 w-1/2 rounded bg-muted" /><div className="h-3 w-2/3 rounded bg-muted" /></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-xl border border-border bg-card p-6 text-center"><p className="text-sm text-muted-foreground">{t("loadingSearch")}</p></div>
              ) : (
                <div className={`grid gap-4 sm:gap-5 ${mapVisible ? "grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"}`}>
                  {filteredExperts.map((expert) => (
                    <div key={expert.id} id={`expert-card-${expert.id}`}>
                      <ExpertCard expert={expert} selected={expert.id === selectedId} onSelect={() => handleSelect(expert.id)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop map panel */}
        {mapVisible && (
          <div className="hidden lg:block sticky top-[65px] h-[calc(100vh-65px)] w-[45%] shrink-0 overflow-hidden">
            <div className="relative h-full w-full">
              <MapView
                lawyers={filteredExperts}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile full-screen map overlay */}
      <AnimatePresence>
        {mobileMapOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[60] flex flex-col bg-background lg:hidden"
          >
            {/* Mobile map header */}
            <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                {filteredExperts.length} expert{filteredExperts.length === 1 ? "" : "s"} on map
              </p>
              <button onClick={() => setMobileMapOpen(false)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                <X size={12} /> Close
              </button>
            </div>
            {/* Map takes remaining space */}
            <div className="relative flex-1">
              <MapView
                lawyers={filteredExperts}
                selectedId={selectedId}
                onSelect={handleSelect}
              />
            </div>
            {/* Bottom card preview when selected */}
            <AnimatePresence>
              {selectedId && (() => {
                const selected = filteredExperts.find((e) => e.id === selectedId);
                if (!selected) return null;
                return (
                  <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="absolute bottom-0 inset-x-0 z-10 p-3"
                  >
                    <Link href={`/lawyers/${selected.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3 shadow-xl">
                      <ExpertAvatar src={selected.avatarUrl} name={selected.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{selected.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{selected.specialtyLabel}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-foreground">{(selected.startingRateRwf / 1000).toFixed(0)}k</p>
                        <p className="text-[10px] text-muted-foreground">RWF/hr</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <TrustIndicators />
      <PracticeAreas />
      <HowItWorks />
      <WhyMyJudicial />
      <FeaturedExperts />
      <Testimonials />
      <FaqSection />
      <LandingFooter />
    </div>
  );
}
