"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { ActiveFilterChips } from "./active-filter-chips";
import { CategoryPills } from "./category-pills";
import { FiltersSheet } from "./filters-sheet";
import { MapView } from "./map-view";
import { MobileMapExpertCard } from "./mobile-map-expert-card";
import { NoResultsPanel } from "./no-results-panel";
import { ResultsList } from "./results-list";
import { SearchTopBar } from "./search-top-bar";
import { useExpertSearch } from "../hooks/useExpertSearch";
import { useSearchState } from "../hooks/use-search-state";
import { usePracticeAreas } from "@/lib/api/landing";
import LandingFooter from "@/shared/components/landing/landing-footer";
import { PROXIMITY_OPTIONS } from "../types";
import type { ProximityFilter } from "../types";
import { getLocalizedSpecialty } from "@/shared/constants/specialties";
import { findDistrictCoordinates } from "../constants";

export function SearchPageClient() {
  const t = useTranslations("search");
  const tSpecialties = useTranslations("specialties");
  const {
    filters,
    setFilters,
    center,
    setCenter,
    viewMode,
    mapExpanded,
    setMapExpanded,
    toggleViewMode,
    isMobile,
  } = useSearchState();

  const { data: practiceAreas } = usePracticeAreas();
  const specialtyOptions = useMemo(
    () =>
      (practiceAreas || []).map((a) => ({
        value: a.specialty,
        label: getLocalizedSpecialty(a.specialty, tSpecialties) || a.label,
      })),
    [practiceAreas, tSpecialties]
  );


  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const centerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setHasLocation(true),
        () => setHasLocation(false),
        { timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      if (centerTimerRef.current) clearTimeout(centerTimerRef.current);
    };
  }, []);

  const radiusKm = useMemo(() => {
    if (filters.proximity === "anywhere") return 500;
    const opt = PROXIMITY_OPTIONS.find((p) => p.value === filters.proximity);
    return opt?.km ?? 500;
  }, [filters.proximity]);

  const districtMatch = useMemo(
    () => findDistrictCoordinates(filters.searchQuery),
    [filters.searchQuery]
  );

  // If searchQuery is a recognized district or city, search by coordinates rather than advocate name
  const textSearchParam = districtMatch
    ? undefined
    : filters.searchQuery.trim() || undefined;

  const searchCenter = districtMatch
    ? { lat: districtMatch.lat, lng: districtMatch.lng }
    : center;

  const {
    data: searchResults,
    isLoading,
    isFetching,
  } = useExpertSearch({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: radiusKm,
    specialties: filters.specialties,
    sort: filters.sort,
    limit: 50,
    search: textSearchParam,
    minRating: filters.minRating > 0 ? filters.minRating : undefined,
    minYearsExperience:
      filters.minYearsExperience > 0 ? filters.minYearsExperience : undefined,
    availableToday: filters.availableToday || undefined,
    instantConsult: filters.instantConsultOnly || undefined,
  });

  const allLawyers = searchResults?.lawyers ?? [];

  const filteredLawyers = useMemo(() => {
    return allLawyers.filter((lawyer) => {
      if (
        filters.maxBudgetRwf < 200000 &&
        lawyer.startingRateRwf > filters.maxBudgetRwf
      )
        return false;
      return true;
    });
  }, [allLawyers, filters.maxBudgetRwf]);

  const isLocalRadius = filters.proximity !== "anywhere";
  const shouldFetchStatewideFallback =
    !isLoading &&
    filteredLawyers.length === 0 &&
    isLocalRadius &&
    filters.specialties.length > 0;

  const { data: statewideResults } = useExpertSearch(
    {
      lat: searchCenter.lat,
      lng: searchCenter.lng,
      radius: 500, // Search all Rwanda
      specialties: filters.specialties,
      sort: filters.sort,
      limit: 50,
      search: textSearchParam,
    },
    { enabled: shouldFetchStatewideFallback }
  );

  const statewideLawyers = useMemo(() => {
    const list = statewideResults?.lawyers ?? [];
    return list.filter((lawyer) => {
      if (
        filters.maxBudgetRwf < 200000 &&
        lawyer.startingRateRwf > filters.maxBudgetRwf
      )
        return false;
      return true;
    });
  }, [statewideResults?.lawyers, filters.maxBudgetRwf]);

  const isShowingStatewideFallback =
    filteredLawyers.length === 0 &&
    statewideLawyers.length > 0 &&
    isLocalRadius;

  const displayedLawyers = isShowingStatewideFallback ? statewideLawyers : filteredLawyers;

  const selectedLawyer = useMemo(() => {
    if (!selectedId) return null;
    return displayedLawyers.find((l) => l.id === selectedId) ?? null;
  }, [selectedId, displayedLawyers]);

  const activeContext = useMemo(() => {
    if (isShowingStatewideFallback && filters.specialties.length > 0) {
      const labels = filters.specialties.map((s) => getLocalizedSpecialty(s, tSpecialties));
      const districtLabel = districtMatch?.canonicalName || "this district";
      return {
        title: `${labels[0] || "Specialist"} Advocates Across Rwanda`,
        desc: `No advocates found with physical offices directly in ${districtLabel}. Showing verified ${labels.join(", ")} advocates across Rwanda available for video, phone, or statewide consultations.`,
        onReset: () => setFilters((prev) => ({ ...prev, proximity: "anywhere" })),
      };
    }
    if (filters.sort === "RECOMMENDED") {
      return {
        title: t("contextBannerRecommendedTitle"),
        desc: t("contextBannerRecommendedDesc"),
        onReset: () => setFilters((prev) => ({ ...prev, sort: "NEAREST" })),
      };
    }
    if (filters.availableToday) {
      return {
        title: t("contextBannerAvailableTodayTitle"),
        desc: t("contextBannerAvailableTodayDesc"),
        onReset: () => setFilters((prev) => ({ ...prev, availableToday: false })),
      };
    }
    if (filters.sort === "HIGHEST_RATED") {
      return {
        title: t("contextBannerHighestRatedTitle"),
        desc: t("contextBannerHighestRatedDesc"),
        onReset: () => setFilters((prev) => ({ ...prev, sort: "NEAREST" })),
      };
    }
    if (filters.specialties.length > 0) {
      const labels = filters.specialties.map((s) => {
        return getLocalizedSpecialty(s, tSpecialties);
      });
      const title =
        labels.length === 1
          ? t("specialistsIn", { specialty: labels[0] })
          : t("practiceAreasCount", {
              count: labels.length,
              areas: `${labels.slice(0, 2).join(", ")}${labels.length > 2 ? "..." : ""}`,
            });
      return {
        title,
        desc: t("verifiedAdvocatesInSpecialties", { specialties: labels.join(", ") }),
        onReset: () => setFilters((prev) => ({ ...prev, specialties: [] })),
      };
    }
    return null;
  }, [isShowingStatewideFallback, filters.sort, filters.availableToday, filters.specialties, tSpecialties, setFilters, t]);

  const activeFilterCount = useMemo(() => {
    let count = filters.specialties.length;
    if (filters.maxBudgetRwf < 200000) count++;
    if (filters.instantConsultOnly) count++;
    if (filters.proximity !== "anywhere") count++;
    if (filters.minRating > 0) count++;
    if (filters.minYearsExperience > 0) count++;
    if (filters.availableToday) count++;
    return count;
  }, [filters]);

  const handleMapCenterChange = useCallback(
    (lat: number, lng: number) => {
      if (centerTimerRef.current) clearTimeout(centerTimerRef.current);
      centerTimerRef.current = setTimeout(
        () => setCenter({ lat, lng }),
        400
      );
    },
    [setCenter]
  );

  const handleSelect = useCallback(
    (id: string) => setSelectedId((prev) => (prev === id ? null : id)),
    []
  );


  const handleExpandSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, proximity: "anywhere" }));
  }, [setFilters]);

  const handleRemoveFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      specialties: [],
      maxBudgetRwf: 200000,
      proximity: "anywhere",
      instantConsultOnly: false,
      minRating: 0,
      minYearsExperience: 0,
      availableToday: false,
      searchQuery: "",
    }));
  }, [setFilters]);

  const handleSearchAllRwanda = useCallback(() => {
    setFilters((prev) => ({ ...prev, proximity: "anywhere" }));
    setCenter({ lat: -1.9441, lng: 30.0619 });
  }, [setFilters, setCenter]);

  const handleRequestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(loc);
        setCenter(loc);
        setFilters((prev) => ({ ...prev, sort: "NEAREST" }));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [setCenter, setFilters]);

  const handleUserLocationChange = useCallback(
    (loc: { lat: number; lng: number }) => {
      setUserLocation(loc);
      setCenter(loc);
      setFilters((prev) => ({ ...prev, sort: "NEAREST" }));
    },
    [setCenter, setFilters]
  );

  const handleProximityChange = useCallback(
    (value: ProximityFilter) => {
      setFilters((prev) => ({ ...prev, proximity: value }));
      setSelectedId(null);
    },
    [setFilters]
  );

  const showMap = viewMode === "split" || (isMobile && mapExpanded);
  const hasResults = displayedLawyers.length > 0;

  return (
    <div
      className={`flex w-full flex-col ${
        showMap ? "h-[calc(100vh-4rem)] overflow-hidden" : "min-h-[calc(100vh-4rem)] bg-background justify-between"
      }`}
    >
      <SearchTopBar
        searchQuery={filters.searchQuery}
        onSearchQueryChange={(value) =>
          setFilters((prev) => ({ ...prev, searchQuery: value }))
        }
        onSearch={() => {}}
        onOpenFilters={() => setFiltersOpen(true)}
        activeFilterCount={activeFilterCount}
        viewMode={viewMode}
        onToggleMap={toggleViewMode}
        isMobile={isMobile}
      />

      <CategoryPills
        filters={filters}
        onChange={setFilters}
        specialties={specialtyOptions}
      />

      <div
        className={`relative flex-1 min-h-0 overflow-hidden ${
          showMap
            ? "grid grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_460px] xl:grid-cols-[minmax(0,1fr)_500px] 2xl:grid-cols-[minmax(0,1fr)_540px]"
            : "flex flex-col"
        }`}
      >
        {showMap && (
          <div className="relative min-h-0 min-w-0">
            <MapView
              lawyers={displayedLawyers}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={handleSelect}
              center={searchCenter}
              onCenterChange={handleMapCenterChange}
              searchRadiusKm={radiusKm}
              userLocation={userLocation}
              onUserLocationChange={handleUserLocationChange}
              isMobile={isMobile}
            />
          </div>
        )}

        <aside
          className={`bg-background ${
            showMap
              ? "hidden lg:flex lg:flex-col overflow-hidden border-l border-border"
              : "w-full max-w-[1400px] mx-auto"
          }`}
        >
          {showMap && (
            <div className="shrink-0 border-b border-border bg-card/30 px-5 py-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("searchRadius")}
                </p>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {t(
                    PROXIMITY_OPTIONS.find((p) => p.value === filters.proximity)
                      ?.labelKey || "allRwanda"
                  )}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {PROXIMITY_OPTIONS.map((p) => {
                  const active = filters.proximity === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => handleProximityChange(p.value)}
                      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs ${
                        active
                          ? "border-brand-dark bg-brand-dark text-on-brand shadow-xs"
                          : "border-border bg-background text-foreground hover:bg-accent hover:border-brand-dark/40"
                      }`}
                    >
                      {t(p.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isFetching && !isLoading && (
            <div className="h-0.5 w-full shrink-0 overflow-hidden bg-muted">
              <div className="h-full w-2/5 animate-[shimmer_1.5s_infinite] bg-brand-dark" />
            </div>
          )}

          <ActiveFilterChips
            filters={filters}
            onChange={setFilters}
            specialties={specialtyOptions}
          />

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {isLoading ? (
              <ResultsList
                lawyers={[]}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onSelect={handleSelect}
                isLoading={true}
                viewMode={viewMode}
                activeContext={activeContext}
              />
            ) : hasResults ? (
              <ResultsList
                lawyers={displayedLawyers}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onSelect={handleSelect}
                isLoading={false}
                viewMode={viewMode}
                activeContext={activeContext}
              />
            ) : (
              <NoResultsPanel
                onExpandSearch={handleExpandSearch}
                onSearchAllRwanda={handleSearchAllRwanda}
                onRemoveFilters={handleRemoveFilters}
                hasLocation={hasLocation}
                onRequestLocation={handleRequestLocation}
                currentRadius={filters.proximity}
                onSetRadius={(r: ProximityFilter) =>
                  setFilters((prev) => ({ ...prev, proximity: r }))
                }
              />
            )}
          </div>
        </aside>
      </div>

      {isMobile && !mapExpanded && (
        <button
          type="button"
          onClick={toggleViewMode}
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-on-brand shadow-lg transition hover:opacity-90 dark:bg-white dark:text-black"
        >
          {t("showMap")}
        </button>
      )}

      {isMobile && mapExpanded && !selectedLawyer && (
        <button
          type="button"
          onClick={toggleViewMode}
          className="fixed bottom-6 sm:bottom-8 left-1/2 z-30 -translate-x-1/2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-on-brand shadow-xl transition-all duration-200 hover:opacity-90 dark:bg-white dark:text-black"
        >
          {t("showList")}
        </button>
      )}

      {isMobile && mapExpanded && selectedLawyer && (
        <MobileMapExpertCard
          lawyer={selectedLawyer}
          onClose={() => setSelectedId(null)}
        />
      )}

      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={setFilters}
        specialties={specialtyOptions}
      />

      {!showMap && <LandingFooter />}
    </div>
  );
}
