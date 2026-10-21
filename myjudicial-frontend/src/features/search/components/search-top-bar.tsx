"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, SlidersHorizontal, Map as MapIcon, List, X, MapPin, Scale, User } from "lucide-react";
import { useTranslations } from "next-intl";

const RWANDA_DISTRICTS = [
  // Kigali Districts
  { name: "Nyarugenge", province: "Kigali" },
  { name: "Gasabo", province: "Kigali" },
  { name: "Kicukiro", province: "Kigali" },
  // Kigali — Nyarugenge neighborhoods
  { name: "Nyamirambo", province: "Nyarugenge, Kigali" },
  { name: "Muhima", province: "Nyarugenge, Kigali" },
  { name: "Gitega", province: "Nyarugenge, Kigali" },
  { name: "Biryogo", province: "Nyarugenge, Kigali" },
  // Kigali — Gasabo neighborhoods
  { name: "Gishushu", province: "Gasabo, Kigali" },
  { name: "Kimironko", province: "Gasabo, Kigali" },
  { name: "Remera", province: "Gasabo, Kigali" },
  { name: "Kacyiru", province: "Gasabo, Kigali" },
  { name: "Gisozi", province: "Gasabo, Kigali" },
  { name: "Kibagabaga", province: "Gasabo, Kigali" },
  { name: "Ndera", province: "Gasabo, Kigali" },
  // Kigali — Kicukiro neighborhoods
  { name: "Niboye", province: "Kicukiro, Kigali" },
  { name: "Kagarama", province: "Kicukiro, Kigali" },
  { name: "Gatenga", province: "Kicukiro, Kigali" },
  { name: "Kanombe", province: "Kicukiro, Kigali" },
  { name: "Masaka", province: "Kicukiro, Kigali" },
  // Northern Province
  { name: "Musanze", province: "Northern Province" },
  { name: "Gicumbi", province: "Northern Province" },
  { name: "Rulindo", province: "Northern Province" },
  { name: "Gakenke", province: "Northern Province" },
  { name: "Burera", province: "Northern Province" },
  // Southern Province
  { name: "Huye", province: "Southern Province" },
  { name: "Muhanga", province: "Southern Province" },
  { name: "Nyanza", province: "Southern Province" },
  { name: "Ruhango", province: "Southern Province" },
  { name: "Gisagara", province: "Southern Province" },
  { name: "Nyaruguru", province: "Southern Province" },
  { name: "Nyamagabe", province: "Southern Province" },
  // Western Province
  { name: "Rubavu", province: "Western Province" },
  { name: "Rusizi", province: "Western Province" },
  { name: "Karongi", province: "Western Province" },
  { name: "Nyabihu", province: "Western Province" },
  { name: "Ngororero", province: "Western Province" },
  { name: "Rutsiro", province: "Western Province" },
  { name: "Nyamasheke", province: "Western Province" },
  // Eastern Province
  { name: "Rwamagana", province: "Eastern Province" },
  { name: "Nyagatare", province: "Eastern Province" },
  { name: "Bugesera", province: "Eastern Province" },
  { name: "Kayonza", province: "Eastern Province" },
  { name: "Kirehe", province: "Eastern Province" },
  { name: "Ngoma", province: "Eastern Province" },
  { name: "Gatsibo", province: "Eastern Province" },
];

type SearchTopBarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  viewMode: string;
  onToggleMap: () => void;
  isMobile: boolean;
  specialties?: Array<{ value: string; label: string }>;
  onSelectSpecialty?: (specialty: string) => void;
  lawyers?: Array<{ id: string; name: string; specialtyLabel?: string }>;
  onSelectLawyer?: (id: string) => void;
};

export function SearchTopBar({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onOpenFilters,
  activeFilterCount,
  viewMode,
  onToggleMap,
  isMobile,
  specialties,
  onSelectSpecialty,
  lawyers,
  onSelectLawyer,
}: SearchTopBarProps) {
  const t = useTranslations("search");

  // Keep local input state for silky-smooth 60fps typing without dropped keystrokes
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Track what value this component dispatched to avoid echoing it back into localQuery
  const lastDispatchedRef = useRef(searchQuery);
  // Track focus so that while the user is actively inside the input, router transitions never overwrite text
  const isFocusedRef = useRef(false);

  // Sync from props ONLY when the change comes from outside (e.g. filter chips, browser back/forward)
  useEffect(() => {
    // If this prop update is an echo of what we dispatched, ignore it
    if (searchQuery === lastDispatchedRef.current) {
      return;
    }

    // While the user has focus on the input, never overwrite their typing/backspacing
    // unless an external reset completely emptied the query
    if (isFocusedRef.current) {
      if (searchQuery === "" && localQuery !== "") {
        lastDispatchedRef.current = "";
        setLocalQuery("");
      }
      return;
    }

    // External change (e.g. page navigation, chip removed, browser back/forward)
    lastDispatchedRef.current = searchQuery;
    setLocalQuery(searchQuery);
  }, [searchQuery, localQuery]);

  // Click outside listener to dismiss autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const triggerDebounce = useCallback(
    (val: string) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        lastDispatchedRef.current = val;
        onSearchQueryChange(val);
      }, 400);
    },
    [onSearchQueryChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalQuery(val);
    setDropdownOpen(true);
    triggerDebounce(val);
  };

  const handleCommitImmediate = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    lastDispatchedRef.current = localQuery;
    onSearchQueryChange(localQuery);
    setDropdownOpen(false);
    onSearch();
  };

  const handleClear = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    lastDispatchedRef.current = "";
    setLocalQuery("");
    onSearchQueryChange("");
    setDropdownOpen(false);
    onSearch();
  };

  const handleSelectDistrict = (districtName: string) => {
    setLocalQuery(districtName);
    lastDispatchedRef.current = districtName;
    onSearchQueryChange(districtName);
    setDropdownOpen(false);
  };

  const handleSelectSpecialtyItem = (specialtyValue: string) => {
    setLocalQuery("");
    lastDispatchedRef.current = "";
    onSearchQueryChange("");
    onSelectSpecialty?.(specialtyValue);
    setDropdownOpen(false);
  };

  const handleSelectLawyerItem = (lawyer: { id: string; name: string }) => {
    setLocalQuery(lawyer.name);
    lastDispatchedRef.current = lawyer.name;
    onSearchQueryChange(lawyer.name);
    onSelectLawyer?.(lawyer.id);
    setDropdownOpen(false);
  };

  const trimmed = localQuery.trim().toLowerCase();

  const matchingDistricts = useMemo(() => {
    if (!trimmed) return [];
    return RWANDA_DISTRICTS.filter(
      (d) =>
        d.name.toLowerCase().includes(trimmed) ||
        d.province.toLowerCase().includes(trimmed)
    ).slice(0, 3);
  }, [trimmed]);

  const matchingSpecialties = useMemo(() => {
    if (!trimmed || !specialties) return [];
    return specialties
      .filter((s) => s.label.toLowerCase().includes(trimmed))
      .slice(0, 3);
  }, [trimmed, specialties]);

  const matchingLawyers = useMemo(() => {
    if (!trimmed || !lawyers) return [];
    return lawyers
      .filter((l) => l.name.toLowerCase().includes(trimmed))
      .slice(0, 3);
  }, [trimmed, lawyers]);

  const hasMatches =
    matchingDistricts.length > 0 ||
    matchingSpecialties.length > 0 ||
    matchingLawyers.length > 0;

  const isSplit = viewMode === "split";
  const isFixedLayout = isSplit || viewMode === "map";

  return (
    <div
      className={`z-40 border-b border-border bg-background ${
        isFixedLayout
          ? "relative"
          : "sticky top-[var(--header-offset,4rem)] transition-[top] duration-300 ease-in-out"
      }`}
    >
      <div
        className={`flex h-12 sm:h-14 items-center gap-2 sm:gap-3 px-3 sm:px-6 ${
          isSplit ? "w-full" : "mx-auto max-w-[1400px]"
        }`}
      >
        {/* Search Pill + Autocomplete Dropdown */}
        <div ref={containerRef} className="relative flex flex-1 items-center justify-center">
          <div className="flex w-full max-w-xl items-center rounded-full border border-border bg-card p-1 sm:p-1.5 shadow-2xs transition-all focus-within:border-brand-dark focus-within:ring-2 focus-within:ring-brand-dark/15 hover:shadow-xs hover:border-border/80">
            <input
              value={localQuery}
              onChange={handleInputChange}
              onFocus={() => {
                isFocusedRef.current = true;
                setDropdownOpen(true);
              }}
              onBlur={() => {
                isFocusedRef.current = false;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommitImmediate();
                if (e.key === "Escape") setDropdownOpen(false);
              }}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="flex-1 min-w-0 bg-transparent pl-3.5 sm:pl-4 pr-2 py-1 text-xs sm:text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            {localQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition mr-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={handleCommitImmediate}
              aria-label={t("searchPlaceholder")}
              className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-on-brand transition-all hover:opacity-90 active:scale-95 shadow-2xs dark:bg-white dark:text-black cursor-pointer"
            >
              <Search size={13} className="sm:hidden" strokeWidth={2.5} />
              <Search size={14} className="hidden sm:block" strokeWidth={2.5} />
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {dropdownOpen && hasMatches && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-full max-w-xl z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in slide-in-from-top-1 duration-150">
              {matchingDistricts.length > 0 && (
                <div className="p-2 border-b border-border/60 last:border-b-0">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("districtsOrCities")}
                  </div>
                  {matchingDistricts.map((d) => (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => handleSelectDistrict(d.name)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-xl hover:bg-accent transition-colors text-xs sm:text-[13px] text-foreground cursor-pointer"
                    >
                      <MapPin className="h-4 w-4 text-brand-dark dark:text-blue-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground">{d.name}</span>
                        <span className="text-muted-foreground text-[11px] ml-1.5 font-normal">
                          · {d.province}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {matchingSpecialties.length > 0 && (
                <div className="p-2 border-b border-border/60 last:border-b-0">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("practiceAreasTitle")}
                  </div>
                  {matchingSpecialties.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => handleSelectSpecialtyItem(s.value)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-xl hover:bg-accent transition-colors text-xs sm:text-[13px] text-foreground cursor-pointer"
                    >
                      <Scale className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground">{s.label}</span>
                        <span className="text-muted-foreground text-[11px] ml-1.5 font-normal">
                          · {t("legalSpecialty")}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {matchingLawyers.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("verifiedAdvocates")}
                  </div>
                  {matchingLawyers.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleSelectLawyerItem(l)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-xl hover:bg-accent transition-colors text-xs sm:text-[13px] text-foreground cursor-pointer"
                    >
                      <User className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground">{l.name}</span>
                        {l.specialtyLabel && (
                          <span className="text-muted-foreground text-[11px] ml-1.5 font-normal">
                            · {l.specialtyLabel}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenFilters}
            className="relative flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-[13px] font-medium text-foreground transition hover:bg-accent hover:shadow-sm"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("filters")}</span>
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-on-brand">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Map / List toggle - desktop */}
          {!isMobile && (
            <button
              type="button"
              onClick={onToggleMap}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-[13px] font-medium text-foreground transition hover:bg-accent hover:shadow-sm sm:px-4"
            >
              {viewMode === "split" ? (
                <>
                  <List className="h-3.5 w-3.5" />
                  <span>{t("gridDirectory")}</span>
                </>
              ) : (
                <>
                  <MapIcon className="h-3.5 w-3.5" />
                  <span>{t("splitDirectory")}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
