"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { CategoryPills } from "./category-pills";
import { FiltersSheet } from "./filters-sheet";
import { MapView } from "./map-view";
import { NoResultsPanel } from "./no-results-panel";
import { ResultsList } from "./results-list";
import { SearchTopBar } from "./search-top-bar";
import { useExpertSearch } from "../hooks/useExpertSearch";
import { useSearchState } from "../hooks/use-search-state";
import { usePracticeAreas } from "@/lib/api/landing";
import { PROXIMITY_OPTIONS } from "../types";
import type { ProximityFilter } from "../types";

export function SearchPageClient() {
  const t = useTranslations("search");
  const {
    filters,
    setFilters,
    center,
    setCenter,
    viewMode,
    mapExpanded,
    setMapExpanded,
    isMobile,
  } = useSearchState();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const { data: practiceAreas } = usePracticeAreas();
  const specialtyOptions = useMemo(
    () =>
      (practiceAreas || []).map((a) => ({
        value: a.specialty,
        label: a.label,
      })),
    [practiceAreas]
  );

  const radiusKm = useMemo(() => {
    const opt = PROXIMITY_OPTIONS.find((p) => p.value === filters.proximity);
    return opt?.km ?? 100;
  }, [filters.proximity]);

  const {
    data: searchResults,
    isLoading,
    isFetching,
  } = useExpertSearch({
    lat: center.lat,
    lng: center.lng,
    radius: radiusKm,
    specialty: filters.specialties[0],
    sort: filters.sort,
    limit: 50,
    search: filters.searchQuery.trim() || undefined,
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.specialties.length > 0) count++;
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

  const handleToggleMap = useCallback(() => {
    setMapExpanded((prev) => !prev);
  }, [setMapExpanded]);

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
  const hasResults = filteredLawyers.length > 0;

  return (
    <div
      className={`flex w-full flex-col ${
        showMap ? "h-screen overflow-hidden" : "min-h-screen bg-background"
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
        onToggleMap={handleToggleMap}
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
            ? "grid grid-rows-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_400px]"
            : "flex flex-col"
        }`}
      >
        {showMap && (
          <div className="relative min-h-0 min-w-0">
            <MapView
              lawyers={filteredLawyers}
              selectedId={selectedId}
              onSelect={handleSelect}
              center={center}
              onCenterChange={handleMapCenterChange}
              searchRadiusKm={radiusKm}
              userLocation={userLocation}
              onUserLocationChange={handleUserLocationChange}
            />
          </div>
        )}

        <aside
          className={`bg-background ${
            showMap
              ? "hidden lg:flex lg:flex-col overflow-hidden"
              : "w-full max-w-[1400px] mx-auto"
          }`}
        >
          {showMap && (
            <div className="shrink-0 border-b border-border px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("searchRadius")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PROXIMITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleProximityChange(p.value)}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                      filters.proximity === p.value
                        ? "bg-brand-dark text-on-brand"
                        : "bg-accent text-foreground hover:bg-accent/80"
                    }`}
                  >
                    {t(p.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isFetching && !isLoading && (
            <div className="h-0.5 w-full shrink-0 overflow-hidden bg-muted">
              <div className="h-full w-2/5 animate-[shimmer_1.5s_infinite] bg-brand-dark" />
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <ResultsList
                lawyers={[]}
                selectedId={selectedId}
                onSelect={handleSelect}
                isLoading={true}
              />
            ) : hasResults ? (
              <ResultsList
                lawyers={filteredLawyers}
                selectedId={selectedId}
                onSelect={handleSelect}
                isLoading={false}
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
          onClick={handleToggleMap}
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-on-brand shadow-lg transition hover:opacity-90"
        >
          {t("showMap")}
        </button>
      )}

      {isMobile && mapExpanded && (
        <button
          type="button"
          onClick={handleToggleMap}
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-on-brand shadow-lg transition hover:opacity-90"
        >
          {t("showList")}
        </button>
      )}

      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={setFilters}
        specialties={specialtyOptions}
      />

    </div>
  );
}
