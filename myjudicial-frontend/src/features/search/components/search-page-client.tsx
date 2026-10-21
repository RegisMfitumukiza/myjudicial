"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

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
import { useDeviceLocation } from "../hooks/useDeviceLocation";
import { calculateHaversineDistanceKm } from "../utils/geo";
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
    clearCenter,
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
  const [manualMapCenter, setManualMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Modern device geolocation with continuous live tracking & zero stale cache
  const {
    userLocation,
    status: geoStatus,
    requestLocation,
  } = useDeviceLocation();

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

  // Search origin resolution:
  // 1. Explicit district search (e.g. "Musanze") takes precedence
  // 2. User clicked "Search this area" on the map (in-memory exploration)
  // 3. User's live device GPS location
  // 4. Default fallback: Kigali City Center
  const searchCenter = useMemo(() => {
    if (districtMatch) {
      return { lat: districtMatch.lat, lng: districtMatch.lng };
    }
    if (manualMapCenter) {
      return manualMapCenter;
    }
    if (userLocation) {
      return userLocation;
    }
    return center;
  }, [districtMatch, manualMapCenter, center, userLocation]);

  const distanceAnchorLabel = useMemo(() => {
    if (districtMatch) {
      return t("fromLocation", { location: districtMatch.canonicalName });
    }
    if (manualMapCenter && !userLocation) {
      return t("fromCityCenter");
    }
    if (userLocation) {
      return t("fromYou");
    }
    return t("fromCityCenter");
  }, [districtMatch, manualMapCenter, userLocation, t]);

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
  // Trigger statewide fallback when a local radius returned zero results —
  // either for a specialty filter or a district search (both narrow the radius)
  const shouldFetchStatewideFallback =
    !isLoading &&
    filteredLawyers.length === 0 &&
    isLocalRadius &&
    (filters.specialties.length > 0 || !!districtMatch);

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

  const baseLawyers = isShowingStatewideFallback ? statewideLawyers : filteredLawyers;

  // Compute live geometric geodesic distance from user's live position when available
  const displayedLawyers = useMemo(() => {
    return baseLawyers
      .map((lawyer) => {
        if (userLocation && !districtMatch && !manualMapCenter && lawyer.lat && lawyer.lng) {
          const liveDist = calculateHaversineDistanceKm(
            userLocation.lat,
            userLocation.lng,
            lawyer.lat,
            lawyer.lng
          );
          return {
            ...lawyer,
            distanceKm: Number(liveDist.toFixed(2)),
          };
        }
        return lawyer;
      })
      .sort((a, b) => {
        if (filters.sort === "NEAREST") {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
      });
  }, [baseLawyers, userLocation, districtMatch, manualMapCenter, filters.sort]);

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
    if (isShowingStatewideFallback && districtMatch) {
      const districtLabel = districtMatch.canonicalName;
      return {
        title: `Advocates Across Rwanda`,
        desc: `No verified advocates found with offices in ${districtLabel} yet. Showing all advocates across Rwanda — many offer video and phone consultations nationwide.`,
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
      setCenter({ lat, lng });
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
    setManualMapCenter(null);
    clearCenter();
    requestLocation(true);
    setFilters((prev) => ({ ...prev, sort: "NEAREST" }));
  }, [clearCenter, requestLocation, setFilters]);

  const handleUserLocationChange = useCallback(
    () => {
      setManualMapCenter(null);
      clearCenter();
      requestLocation(true);
      setFilters((prev) => ({ ...prev, sort: "NEAREST" }));
    },
    [clearCenter, requestLocation, setFilters]
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
        specialties={specialtyOptions}
        onSelectSpecialty={(s) =>
          setFilters((prev) => ({ ...prev, specialties: [s] }))
        }
        lawyers={displayedLawyers}
        onSelectLawyer={(id) => handleSelect(id)}
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
              onHover={setHoveredId}
              center={searchCenter}
              onCenterChange={handleMapCenterChange}
              searchRadiusKm={radiusKm}
              userLocation={userLocation}
              onUserLocationChange={handleUserLocationChange}
              distanceAnchorLabel={distanceAnchorLabel}
              isMobile={isMobile}
              isLoading={isLoading}
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

          {!userLocation && !districtMatch && !manualMapCenter && geoStatus !== "loading" && geoStatus !== "idle" && (
            <div className="px-5 py-2 bg-muted/40 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                <span className="truncate">{t("fromCityCenter")}</span>
              </span>
              <button
                type="button"
                onClick={handleRequestLocation}
                className="font-semibold text-brand-dark dark:text-white hover:underline shrink-0 ml-2 cursor-pointer"
              >
                {t("useMyLocation")}
              </button>
            </div>
          )}

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
                distanceAnchorLabel={distanceAnchorLabel}
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
                distanceAnchorLabel={distanceAnchorLabel}
              />
            ) : (
              <NoResultsPanel
                onExpandSearch={handleExpandSearch}
                onSearchAllRwanda={handleSearchAllRwanda}
                onRemoveFilters={handleRemoveFilters}
                hasLocation={Boolean(userLocation)}
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
          distanceAnchorLabel={distanceAnchorLabel}
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
