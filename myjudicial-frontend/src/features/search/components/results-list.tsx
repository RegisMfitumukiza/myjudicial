"use client";

import { useEffect, useRef } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { LawyerCard } from "./lawyer-card";
import type { Lawyer } from "../types";

export type ActiveContextInfo = {
  title: string;
  desc: string;
  onReset: () => void;
};

type ResultsListProps = {
  lawyers: Lawyer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  isLoading: boolean;
  viewMode?: "split" | "list" | "map";
  activeContext?: ActiveContextInfo | null;
  distanceAnchorLabel?: string;
};

export function ResultsList({
  lawyers,
  selectedId,
  onSelect,
  hoveredId,
  onHover,
  isLoading,
  viewMode = "split",
  activeContext,
  distanceAnchorLabel,
}: ResultsListProps) {
  const t = useTranslations("search");
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [selectedId]);

  const isGrid = viewMode === "list";

  if (isLoading) {
    return (
      <div className={isGrid ? "p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-[1400px] mx-auto" : "p-3 sm:p-4 space-y-3"}>
        {Array.from({ length: isGrid ? 9 : 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-4">
            <div className="flex gap-3">
              <div className="h-12 w-12 shrink-0 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={isGrid ? "p-4 sm:p-6 max-w-[1400px] mx-auto" : "p-3 sm:p-4 space-y-3"}>
      {/* Active Curation Banner */}
      {activeContext && (
        <div className="mb-4 rounded-2xl border border-brand-dark/20 bg-brand-dark/[0.04] p-3 min-[360px]:p-4 dark:border-white/15 dark:bg-white/[0.04] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white dark:bg-white dark:text-black">
                <Sparkles size={15} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h4 className="text-[13px] sm:text-[14px] font-bold text-foreground break-words">{activeContext.title}</h4>
                  <span className="rounded-full bg-brand-dark/10 px-2 py-0.5 text-[10px] font-semibold text-brand-dark dark:bg-white/10 dark:text-white shrink-0">
                    {t("showingCurated")}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] min-[360px]:text-[12px] text-muted-foreground leading-relaxed break-words">
                  {activeContext.desc}
                </p>
              </div>
            </div>
            <button
              onClick={activeContext.onReset}
              className="self-start sm:self-center shrink-0 flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition shadow-xs"
            >
              <RotateCcw size={11} />
              <span>{t("resetToAll")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider font-mono">
          {t("resultsCount", { count: lawyers.length })}
        </p>
      </div>

      {/* Cards List or Grid */}
      <div className={isGrid ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
        {lawyers.map((lawyer) => (
          <div
            key={lawyer.id}
            ref={lawyer.id === selectedId ? selectedRef : undefined}
            className="min-w-0"
          >
            <LawyerCard
              lawyer={lawyer}
              selected={lawyer.id === selectedId}
              onClick={() => onSelect(lawyer.id)}
              onHover={onHover}
              distanceAnchorLabel={distanceAnchorLabel}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
