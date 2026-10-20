"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SearchFilters, SortOption, ProximityFilter } from "../types";
import { findDistrictCoordinates } from "../constants";

export type MapCenter = { lat: number; lng: number };

export function useSearchState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const filters = parseFiltersFromParams(searchParams);

  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const districtParam = searchParams.get("district") ?? searchParams.get("city") ?? searchParams.get("q");
  const districtCoords = findDistrictCoordinates(districtParam);

  const hasExplicitCenter = Boolean(latParam && lngParam);

  const center: MapCenter = {
    lat: latParam ? Number(latParam) : districtCoords ? districtCoords.lat : -1.9441,
    lng: lngParam ? Number(lngParam) : districtCoords ? districtCoords.lng : 30.0619,
  };

  const setFilters = useCallback(
    (updater: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => {
      const current = parseFiltersFromParams(
        new URLSearchParams(window.location.search)
      );
      const next = typeof updater === "function" ? updater(current) : updater;
      syncToUrl(next, router);
    },
    [router]
  );

  const setCenter = useCallback(
    (c: MapCenter) => {
      const params = new URLSearchParams(window.location.search);
      params.set("lat", c.lat.toFixed(5));
      params.set("lng", c.lng.toFixed(5));
      router.replace(`/search?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  const clearCenter = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("lat");
    params.delete("lng");
    params.delete("district");
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [router]);

  const viewParam = searchParams.get("view");
  const [mapExpanded, setMapExpanded] = useState(false);

  // Desktop: default split, toggled to list via ?view=list
  // Mobile: default list, toggled to map via mapExpanded
  const effectiveView: "split" | "list" | "map" = isMobile
    ? (mapExpanded ? "map" : "list")
    : (viewParam === "list" ? "list" : "split");

  const toggleViewMode = useCallback(() => {
    if (isMobile) {
      setMapExpanded((prev) => !prev);
    } else {
      const params = new URLSearchParams(window.location.search);
      if (viewParam === "list") {
        params.delete("view");
      } else {
        params.set("view", "list");
      }
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }
  }, [isMobile, viewParam, router]);

  return {
    filters,
    setFilters,
    center,
    setCenter,
    clearCenter,
    hasExplicitCenter,
    viewMode: effectiveView,
    mapExpanded,
    setMapExpanded,
    toggleViewMode,
    isMobile,
  };
}

function parseFiltersFromParams(params: URLSearchParams): SearchFilters {
  const specialtyRaw = params.get("specialty");
  const specialties = specialtyRaw
    ? specialtyRaw.split(",").filter(Boolean)
    : [];

  const rawQ = params.get("q") ?? params.get("district") ?? "";

  return {
    searchQuery: rawQ,
    specialties,
    sort: (params.get("sort") as SortOption) ?? "NEAREST",
    proximity: validateProximity(params.get("proximity")),
    maxBudgetRwf: params.has("maxBudget")
      ? Number(params.get("maxBudget"))
      : 200000,
    instantConsultOnly: params.get("instant") === "1",
    minRating: params.has("minRating")
      ? Number(params.get("minRating"))
      : 0,
    minYearsExperience: params.has("minExp")
      ? Number(params.get("minExp"))
      : 0,
    availableToday:
      params.get("today") === "1" || params.get("availableToday") === "true",
  };
}

function validateProximity(raw: string | null): ProximityFilter {
  const valid: ProximityFilter[] = ["5km", "10km", "20km", "50km", "anywhere"];
  if (raw && valid.includes(raw as ProximityFilter)) return raw as ProximityFilter;
  return "anywhere";
}

function syncToUrl(filters: SearchFilters, router: ReturnType<typeof useRouter>) {
  const params = new URLSearchParams();

  if (filters.searchQuery) params.set("q", filters.searchQuery);
  if (filters.specialties.length > 0)
    params.set("specialty", filters.specialties.join(","));
  if (filters.sort !== "NEAREST") params.set("sort", filters.sort);
  if (filters.proximity !== "anywhere") params.set("proximity", filters.proximity);
  if (filters.maxBudgetRwf < 200000) params.set("maxBudget", String(filters.maxBudgetRwf));
  if (filters.instantConsultOnly) params.set("instant", "1");
  if (filters.minRating > 0) params.set("minRating", String(filters.minRating));
  if (filters.minYearsExperience > 0) params.set("minExp", String(filters.minYearsExperience));
  if (filters.availableToday) params.set("today", "1");

  // Check if searchQuery is a Rwandan district or city
  const districtMatch = findDistrictCoordinates(filters.searchQuery);
  const existing = new URLSearchParams(window.location.search);
  const hadOldDistrict = existing.has("district");

  if (districtMatch) {
    params.set("lat", districtMatch.lat.toFixed(5));
    params.set("lng", districtMatch.lng.toFixed(5));
    params.set("district", districtMatch.canonicalName);
    // Auto-apply a local radius so PostGIS actually filters by distance from the district.
    // Only override if the user hasn't manually chosen a radius yet.
    if (!filters.proximity || filters.proximity === "anywhere") {
      params.set("proximity", "20km");
    }
  } else {
    // If the query was a district before and is now cleared or changed to a non-district,
    // do NOT copy over the old district or old district coordinates!
    // Only preserve manual lat/lng if the user panned the map manually without a district query.
    if (!hadOldDistrict) {
      if (existing.has("lat")) params.set("lat", existing.get("lat")!);
      if (existing.has("lng")) params.set("lng", existing.get("lng")!);
    }
  }

  if (existing.has("view")) params.set("view", existing.get("view")!);

  router.replace(`/search?${params.toString()}`, { scroll: false });
}
