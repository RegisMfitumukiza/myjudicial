"use client";

import { Search, SlidersHorizontal, Map as MapIcon, List } from "lucide-react";
import { useTranslations } from "next-intl";

type SearchTopBarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  viewMode: string;
  onToggleMap: () => void;
  isMobile: boolean;
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
}: SearchTopBarProps) {
  const t = useTranslations("search");

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
      {/* Search Pill */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-full max-w-xl items-center rounded-full border border-border bg-card shadow-sm transition-shadow focus-within:border-brand-dark focus-within:ring-1 focus-within:ring-brand-dark/20 hover:shadow-md">
          <input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="flex-1 bg-transparent px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onSearch}
            aria-label={t("searchPlaceholder")}
            className="mr-1 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-on-brand transition hover:opacity-90"
          >
            <Search size={13} className="sm:hidden" strokeWidth={2.5} />
            <Search size={14} className="hidden sm:block" strokeWidth={2.5} />
          </button>
        </div>
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
