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
  isLoading: boolean;
  viewMode?: "split" | "list" | "map";
  activeContext?: ActiveContextInfo | null;
};

export function ResultsList({
  lawyers,
  selectedId,
  onSelect,
  isLoading,
  viewMode = "split",
  activeContext,
}: ResultsListProps) {
  const t = useTranslations("search");
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  const isGrid = viewMode === "list";

  if (isLoading) {
    return (
      <div className={`p-4 sm:p-6 ${isGrid ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-[1400px] mx-auto" : "space-y-3"}`}>
        {Array.from({ length: isGrid ? 9 : 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
            <div className="flex gap-3">
              <div className="h-12 w-12 shrink-0 rounded-full bg-muted" />
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
    <div className={`p-4 sm:p-6 ${isGrid ? "max-w-[1400px] mx-auto" : "space-y-3"}`}>
      {/* Active Curation Banner */}
      {activeContext && (
        <div className="mb-4 rounded-2xl border border-brand-dark/20 bg-brand-dark/[0.04] p-3.5 sm:p-4 dark:border-white/15 dark:bg-white/[0.04] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-dark text-white dark:bg-white dark:text-black">
                <Sparkles size={15} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[13px] sm:text-[14px] font-bold text-foreground">{activeContext.title}</h4>
                  <span className="rounded-full bg-brand-dark/10 px-2 py-0.5 text-[10px] font-semibold text-brand-dark dark:bg-white/10 dark:text-white">
                    {t("showingCurated")}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground leading-relaxed">
                  {activeContext.desc}
                </p>
              </div>
            </div>
            <button
              onClick={activeContext.onReset}
              className="self-start sm:self-center shrink-0 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted transition shadow-xs"
            >
              <RotateCcw size={11} />
              <span>{t("resetToAll")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-sm font-medium text-muted-foreground">
          {t("resultsCount", { count: lawyers.length })}
        </p>
      </div>

      {/* Cards List or Grid */}
      <div className={isGrid ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-2.5"}>
        {lawyers.map((lawyer) => (
          <div
            key={lawyer.id}
            ref={lawyer.id === selectedId ? selectedRef : undefined}
          >
            <LawyerCard
              lawyer={lawyer}
              selected={lawyer.id === selectedId}
              onClick={() => onSelect(lawyer.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
