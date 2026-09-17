"use client";

import { useMemo } from "react";
import { X, Zap, Clock, Star, Briefcase, MapPin, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SearchFilters } from "../types";
import { PROXIMITY_OPTIONS } from "../types";

type SpecialtyOption = { value: string; label: string };

type ActiveFilterChipsProps = {
  filters: SearchFilters;
  onChange: (updater: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => void;
  specialties: SpecialtyOption[];
};

export function ActiveFilterChips({
  filters,
  onChange,
  specialties,
}: ActiveFilterChipsProps) {
  const t = useTranslations("search");

  const chips = useMemo(() => {
    const list: Array<{
      key: string;
      label: string;
      icon?: typeof Star;
      onRemove: () => void;
    }> = [];

    // Selected specialties
    for (const spec of filters.specialties) {
      const match = specialties.find((s) => s.value === spec);
      const label = match?.label ?? spec.replace(/_/g, " ");
      list.push({
        key: `spec-${spec}`,
        label,
        onRemove: () =>
          onChange((prev) => ({
            ...prev,
            specialties: prev.specialties.filter((s) => s !== spec),
          })),
      });
    }

    // Available today
    if (filters.availableToday) {
      list.push({
        key: "availableToday",
        label: t("availableToday"),
        icon: Zap,
        onRemove: () =>
          onChange((prev) => ({ ...prev, availableToday: false })),
      });
    }

    // Instant consult
    if (filters.instantConsultOnly) {
      list.push({
        key: "instantConsult",
        label: t("instantConsult"),
        icon: Clock,
        onRemove: () =>
          onChange((prev) => ({ ...prev, instantConsultOnly: false })),
      });
    }

    // Rating
    if (filters.minRating > 0) {
      list.push({
        key: "minRating",
        label: t("starsPlus", { stars: filters.minRating }),
        icon: Star,
        onRemove: () => onChange((prev) => ({ ...prev, minRating: 0 })),
      });
    }

    // Experience
    if (filters.minYearsExperience > 0) {
      list.push({
        key: "minYearsExperience",
        label: t("yearsPlus", { years: filters.minYearsExperience }),
        icon: Briefcase,
        onRemove: () =>
          onChange((prev) => ({ ...prev, minYearsExperience: 0 })),
      });
    }

    // Budget
    if (filters.maxBudgetRwf < 200000) {
      list.push({
        key: "maxBudget",
        label: t("budgetMax", {
          max: Math.round(filters.maxBudgetRwf / 1000),
        }),
        icon: DollarSign,
        onRemove: () =>
          onChange((prev) => ({ ...prev, maxBudgetRwf: 200000 })),
      });
    }

    // Proximity
    if (filters.proximity !== "anywhere") {
      const opt = PROXIMITY_OPTIONS.find((p) => p.value === filters.proximity);
      list.push({
        key: "proximity",
        label: opt ? t(opt.labelKey) : filters.proximity,
        icon: MapPin,
        onRemove: () =>
          onChange((prev) => ({ ...prev, proximity: "anywhere" })),
      });
    }

    return list;
  }, [filters, specialties, onChange, t]);

  if (chips.length === 0) return null;

  function clearAll() {
    onChange((prev) => ({
      ...prev,
      specialties: [],
      maxBudgetRwf: 200000,
      proximity: "anywhere",
      instantConsultOnly: false,
      minRating: 0,
      minYearsExperience: 0,
      availableToday: false,
    }));
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 border-b border-border bg-card/60 px-4 py-2 text-xs"
      role="region"
      aria-label={t("filtersTitle")}
    >
      <span className="text-[11px] font-semibold text-muted-foreground mr-1">
        {t("filtersTitle")}:
      </span>
      {chips.map((chip) => {
        const Icon = chip.icon;
        return (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-foreground transition hover:border-brand-dark/40"
          >
            {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
            <span>{chip.label}</span>
            <button
              type="button"
              onClick={chip.onRemove}
              className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              aria-label={`Remove filter ${chip.label}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        );
      })}
      <button
        type="button"
        onClick={clearAll}
        className="ml-auto text-[11px] font-semibold text-brand-dark hover:underline dark:text-white transition"
      >
        {t("clearAll")}
      </button>
    </div>
  );
}
