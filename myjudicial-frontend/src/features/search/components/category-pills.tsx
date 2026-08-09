"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { SearchFilters } from "../types";

type SpecialtyOption = { value: string; label: string };

type CategoryPillsProps = {
  filters: SearchFilters;
  onChange: (filters: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => void;
  specialties: SpecialtyOption[];
};

export function CategoryPills({ filters, onChange, specialties }: CategoryPillsProps) {
  const t = useTranslations("search");

  function toggleSpecialty(s: string) {
    onChange((prev) => {
      const isOnlyActive = prev.specialties.length === 1 && prev.specialties[0] === s;
      return { ...prev, specialties: isOnlyActive ? [] : [s] };
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-border bg-background px-3 py-2.5 scrollbar-hide sm:px-4 lg:px-6">
      <button
        type="button"
        onClick={() => onChange((prev) => ({ ...prev, specialties: [] }))}
        className={cn(
          "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:px-4",
          filters.specialties.length === 0
            ? "border-brand-dark bg-brand-dark text-on-brand"
            : "border-border bg-card text-foreground hover:border-brand-dark/50 hover:bg-accent"
        )}
      >
        {t("all")}
      </button>
      {specialties.map((s) => {
        const active = filters.specialties.includes(s.value);
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => toggleSpecialty(s.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:px-4",
              active
                ? "border-brand-dark bg-brand-dark text-on-brand"
                : "border-border bg-card text-foreground hover:border-brand-dark/50 hover:bg-accent"
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
