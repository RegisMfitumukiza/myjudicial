"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { LawyerCard } from "./lawyer-card";
import type { Lawyer } from "../types";

type ResultsListProps = {
  lawyers: Lawyer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
};

export function ResultsList({ lawyers, selectedId, onSelect, isLoading }: ResultsListProps) {
  const t = useTranslations("search");
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-3">
            <div className="flex gap-3">
              <div className="h-14 w-14 shrink-0 rounded-full bg-muted" />
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
    <div className="space-y-2 px-4 sm:px-6 py-4 sm:py-6">
      <p className="px-1 text-sm text-muted-foreground">
        {t("resultsCount", { count: lawyers.length })}
      </p>
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
  );
}
