"use client";

import { Search, SlidersHorizontal, Map as MapIcon, List } from "lucide-react";
import { ThemeToggle } from "@/shared/components/theme-toggle";
import { Logo } from "@/shared/components/logo";
import { ProfileMenu } from "@/shared/components/profile-menu";
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

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-[1400px] h-16 items-center gap-3 px-4 sm:px-6">
      {/* Logo */}
      <div className="flex shrink-0 items-center">
        <Logo iconSize={22} fontSize="text-[18px]" />
      </div>

      {/* Search Pill */}
      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-full max-w-xl items-center rounded-full border border-border bg-card shadow-sm transition-shadow focus-within:border-brand-dark focus-within:ring-1 focus-within:ring-brand-dark/20 hover:shadow-md">
          <input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
            placeholder={t("searchPlaceholder")}
            className="flex-1 bg-transparent px-4 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onSearch}
            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-on-brand transition hover:opacity-90"
          >
            <Search size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onOpenFilters}
          className="relative flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-[13px] font-medium text-foreground transition hover:bg-accent hover:shadow-sm sm:px-4"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("filters")}</span>
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-dark text-[10px] font-bold text-on-brand">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Map toggle - desktop */}
        {!isMobile && (
          <button
            type="button"
            onClick={onToggleMap}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-[13px] font-medium text-foreground transition hover:bg-accent hover:shadow-sm sm:px-4"
          >
            {viewMode === "map" ? <List className="h-3.5 w-3.5" /> : <MapIcon className="h-3.5 w-3.5" />}
            {viewMode === "map" ? t("useList") : t("useMap")}
          </button>
        )}

        <div className="flex items-center gap-1.5 border-l border-border pl-2 sm:pl-3">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
      </div>
    </header>
  );
}
