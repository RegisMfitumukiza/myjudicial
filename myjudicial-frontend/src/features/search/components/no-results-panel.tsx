"use client";

import { SearchX, MapPin, Filter, Globe, Locate, ChevronRight, Bot, Scale } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { ProximityFilter } from "../types";
import { PROXIMITY_OPTIONS } from "../types";

type NoResultsPanelProps = {
  onExpandSearch: () => void;
  onSearchAllRwanda: () => void;
  onRemoveFilters: () => void;
  hasLocation: boolean;
  onRequestLocation: () => void;
  currentRadius: ProximityFilter;
  onSetRadius: (r: ProximityFilter) => void;
};

export function NoResultsPanel({
  onExpandSearch,
  onSearchAllRwanda,
  onRemoveFilters,
  hasLocation,
  onRequestLocation,
  currentRadius,
  onSetRadius,
}: NoResultsPanelProps) {
  const t = useTranslations("search");

  const currentIdx = PROXIMITY_OPTIONS.findIndex((p) => p.value === currentRadius);
  const nextRadius = currentIdx < PROXIMITY_OPTIONS.length - 1
    ? PROXIMITY_OPTIONS[currentIdx + 1]
    : null;

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
        <SearchX className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-bold text-foreground">{t("noResultsTitle")}</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        {t("noResultsMessage")}
      </p>

      <div className="mt-6 w-full max-w-xs space-y-3">
        {nextRadius && (
          <button
            type="button"
            onClick={() => onSetRadius(nextRadius.value)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-dark py-2.5 text-sm font-semibold text-on-brand transition hover:opacity-90"
          >
            <MapPin className="h-4 w-4" />
            {t("expandToRadius", { radius: t(nextRadius.labelKey) })}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRemoveFilters}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            <Filter className="h-4 w-4" />
            {t("removeFilters")}
          </button>

          <button
            type="button"
            onClick={onSearchAllRwanda}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            <Globe className="h-4 w-4" />
            {t("allRwanda")}
          </button>
        </div>

        {!hasLocation && (
          <button
            type="button"
            onClick={onRequestLocation}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            <Locate className="h-4 w-4" />
            {t("useMyLocation")}
          </button>
        )}

        <div className="rounded-lg border border-border bg-accent/50 px-3 py-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">{t("searchTipsTitle")}</p>
          <ul className="mt-1.5 space-y-1 text-left text-[11px] text-muted-foreground">
            <li>{t("tip1")}</li>
            <li>{t("tip2")}</li>
            <li>{t("tip3")}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-card/60 p-3.5 text-left space-y-2">
          <p className="text-[11px] font-semibold text-foreground">{t("launchAssistanceTitle")}</p>
          <div className="flex flex-col gap-1.5 text-xs">
            <Link
              href="/ai"
              className="inline-flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 font-medium text-foreground hover:bg-accent transition"
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <Bot size={14} className="text-brand-dark dark:text-white shrink-0" />
                <span className="truncate">{t("launchAssistanceAi")}</span>
              </span>
              <ChevronRight size={13} className="text-muted-foreground shrink-0" />
            </Link>
            <Link
              href="/sign-up?role=EXPERT"
              className="inline-flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 font-medium text-foreground hover:bg-accent transition"
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <Scale size={14} className="text-brand-dark dark:text-white shrink-0" />
                <span className="truncate">{t("launchAssistanceAdvocate")}</span>
              </span>
              <ChevronRight size={13} className="text-muted-foreground shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
