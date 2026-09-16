"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SearchFilters, SortOption, ProximityFilter } from "../types";

export type MapCenter = { lat: number; lng: number };

export function useSearchState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const filters = parseFiltersFromParams(searchParams);

  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const center: MapCenter = {
    lat: latParam ? Number(latParam) : -1.9441,
    lng: lngParam ? Number(lngParam) : 30.0619,
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

  const viewParam = searchParams.get("view");
  const viewMode = viewParam === "list" ? "list" : isMobile ? "list" : "split";
  const [mapExpanded, setMapExpanded] = useState(false);
  const effectiveView = viewParam === "list" ? "list" : mapExpanded ? "map" : viewMode;

  return {
    filters,
    setFilters,
    center,
    setCenter,
    viewMode: effectiveView,
    mapExpanded,
    setMapExpanded,
    isMobile,
  };
}

function parseFiltersFromParams(params: URLSearchParams): SearchFilters {
  const specialtyRaw = params.get("specialty");
  const specialties = specialtyRaw
    ? specialtyRaw.split(",").filter(Boolean)
    : [];

  return {
    searchQuery: params.get("q") ?? "",
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

  const existing = new URLSearchParams(window.location.search);
  if (existing.has("lat")) params.set("lat", existing.get("lat")!);
  if (existing.has("lng")) params.set("lng", existing.get("lng")!);

  router.replace(`/search?${params.toString()}`, { scroll: false });
}
