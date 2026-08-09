"use client";

import { Star, Briefcase, MapPin, Zap, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { SearchFilters, ProximityFilter } from "../types";
import { PROXIMITY_OPTIONS } from "../types";

type SpecialtyOption = { value: string; label: string };

type FiltersSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SearchFilters;
  onChange: (filters: SearchFilters | ((prev: SearchFilters) => SearchFilters)) => void;
  specialties: SpecialtyOption[];
};

const RATING_OPTIONS = [0, 3, 4, 4.5] as const;
const EXPERIENCE_OPTIONS = [0, 2, 5, 10] as const;

export function FiltersSheet({ open, onOpenChange, filters, onChange, specialties }: FiltersSheetProps) {
  const t = useTranslations("search");

  function toggleSpecialty(s: string) {
    onChange((prev) => {
      const has = prev.specialties.includes(s);
      return {
        ...prev,
        specialties: has
          ? prev.specialties.filter((x) => x !== s)
          : [...prev.specialties, s],
      };
    });
  }

  function clearAll() {
    onChange((prev) => ({
      ...prev,
      searchQuery: "",
      specialties: [],
      maxBudgetRwf: 200000,
      proximity: "anywhere" as ProximityFilter,
      instantConsultOnly: false,
      minRating: 0,
      minYearsExperience: 0,
      availableToday: false,
    }));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[320px] overflow-y-auto bg-background sm:w-[380px]">
        <SheetHeader>
          <SheetTitle className="text-foreground">{t("filtersTitle")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-8 pt-2">
          {/* Specialty */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("specialtyLabel")}</p>
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => {
                const active = filters.specialties.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleSpecialty(s.value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition",
                      active
                        ? "bg-brand-dark text-on-brand"
                        : "bg-accent text-foreground hover:bg-accent/80"
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("budgetLabel")}</p>
              <span className="text-xs font-semibold text-foreground">
                {t("budgetMax", { max: Math.round(filters.maxBudgetRwf / 1000) })}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={200000}
              step={5000}
              value={filters.maxBudgetRwf}
              onChange={(e) => onChange((prev) => ({ ...prev, maxBudgetRwf: Number(e.target.value) }))}
              className="w-full accent-brand-dark"
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>0</span>
              <span>100k</span>
              <span>200k+</span>
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("minRatingLabel")}</p>
            <div className="grid grid-cols-4 gap-2">
              {RATING_OPTIONS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, minRating: val }))}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition",
                    filters.minRating === val
                      ? "bg-brand-dark text-on-brand"
                      : "bg-accent text-foreground hover:bg-accent/80"
                  )}
                >
                  {val > 0 && <Star className="h-3 w-3" />}
                  {val > 0 ? t("starsPlus", { stars: val }) : t("any")}
                </button>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("experienceLabel")}</p>
            <div className="grid grid-cols-4 gap-2">
              {EXPERIENCE_OPTIONS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, minYearsExperience: val }))}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition",
                    filters.minYearsExperience === val
                      ? "bg-brand-dark text-on-brand"
                      : "bg-accent text-foreground hover:bg-accent/80"
                  )}
                >
                  {val > 0 && <Briefcase className="h-3 w-3" />}
                  {val > 0 ? t("yearsPlus", { years: val }) : t("any")}
                </button>
              ))}
            </div>
          </div>

          {/* Proximity */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("proximityLabel")}</p>
            <div className="grid grid-cols-3 gap-2">
              {PROXIMITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onChange((prev) => ({ ...prev, proximity: p.value }))}
                  className={cn(
                    "rounded-lg py-2 text-xs font-semibold transition",
                    filters.proximity === p.value
                      ? "bg-brand-dark text-on-brand"
                      : "bg-accent text-foreground hover:bg-accent/80"
                  )}
                >
                  {t(p.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Available Today */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("availabilityLabel")}</p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <Zap className="h-3.5 w-3.5 text-brand-dark dark:text-white" />
                {t("availableToday")}
              </span>
              <Switch
                checked={filters.availableToday}
                onCheckedChange={(v) => onChange((prev) => ({ ...prev, availableToday: v }))}
              />
            </div>
          </div>

          {/* Instant Consult */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-3.5 w-3.5 text-brand-dark dark:text-white" />
              {t("instantConsult")}
            </span>
            <Switch
              checked={filters.instantConsultOnly}
              onCheckedChange={(v) => onChange((prev) => ({ ...prev, instantConsultOnly: v }))}
            />
          </div>

          {/* Clear All */}
          <button
            type="button"
            onClick={clearAll}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("clearAll")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
