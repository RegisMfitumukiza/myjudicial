"use client";

import { ArrowRight, Heart, Shield, Briefcase, Building2, Gavel, Users, Landmark, Lightbulb, Scale, Globe } from "lucide-react";
import { usePracticeAreas } from "@/lib/api/landing";
import { useTranslations } from "next-intl";

const ICON_MAP: Record<string, React.ElementType> = {
  FAMILY_LAW: Heart,
  COMMERCIAL_LAW: Briefcase,
  EMPLOYMENT_LAW: Users,
  LAND_LAW: Building2,
  CRIMINAL_LAW: Shield,
  TAX_LAW: Landmark,
  IMMIGRATION_LAW: Globe,
  CORPORATE_LAW: Scale,
  CONTRACT_LAW: Gavel,
  INTELLECTUAL_PROPERTY: Lightbulb,
};

export default function PracticeAreas() {
  const t = useTranslations("public");
  const { data: areas, isLoading } = usePracticeAreas();

  if (isLoading) {
    return (
      <section className="w-full bg-background py-10 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-3 h-8 w-96 animate-pulse rounded bg-muted" />
                <div className="mt-4 h-4 w-72 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-3xl bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!areas || areas.length === 0) return null;

  return (
    <section className="w-full bg-background py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("practiceAreas.badge")}
              </p>
              <h3 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("practiceAreas.title")}
              </h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                {t("practiceAreas.subtitle")}
              </p>
            </div>
            <button
              onClick={() => document.getElementById("expert-list")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-accent"
            >
              {t("practiceAreas.viewAll")} <ArrowRight size={16} />
            </button>
          </div>

          <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {areas.map((area) => {
              const Icon = ICON_MAP[area.specialty] || Gavel;
              return (
                <a
                  key={area.specialty}
                  href={`/experts?specialty=${area.specialty}`}
                  className="group overflow-hidden rounded-3xl border border-border bg-card p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground/70 transition group-hover:bg-brand-dark group-hover:text-on-brand">
                    <Icon size={20} />
                  </div>
                  <p className="text-lg font-semibold text-foreground">{area.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {area.expertCount} {area.expertCount === 1 ? t("practiceAreas.lawyer") : t("practiceAreas.lawyers")}
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
