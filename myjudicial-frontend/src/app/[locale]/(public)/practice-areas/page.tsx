"use client";

import { Link } from "@/i18n/routing";
import { ArrowRight, Bot, Scale, Heart, Briefcase, Users, Building2, Shield, Landmark, Globe, Gavel, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePracticeAreas } from "@/lib/api/landing";

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

export default function PracticeAreasPage() {
  const t = useTranslations("practiceAreasPage");
  const { data: practiceAreas, isLoading } = usePracticeAreas();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-dark/[.06] to-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 bg-brand-dark/5 px-3 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-dark/70">
              {t("hero.badge")}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>
        </div>
      </section>

      {/* Grid Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl border border-border bg-card" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {practiceAreas?.map((area) => {
                const Icon = ICON_MAP[area.specialty] ?? Scale;
                return (
                  <Link
                    key={area.specialty}
                    href={`/experts?specialty=${area.specialty}`}
                    className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-dark/30 hover:shadow-lg"
                  >
                    <div>
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-dark/10 transition-colors group-hover:bg-brand-dark group-hover:text-on-brand">
                        <Icon size={24} className="text-brand-dark transition-colors group-hover:text-on-brand" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{area.label}</h3>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                      <span className="text-sm font-medium text-muted-foreground">
                        {area.expertCount === 1
                          ? t("grid.expertsCount", { count: area.expertCount })
                          : t("grid.expertsCountPlural", { count: area.expertCount })}
                      </span>
                      <ArrowRight size={16} className="text-brand-dark opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <Bot size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-on-brand sm:text-4xl">{t("cta.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-on-brand/70">{t("cta.subtitle")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/ai"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand-dark shadow-lg transition hover:bg-white/90"
            >
              {t("cta.useAi")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/experts"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-sm font-bold text-on-brand transition hover:bg-white/10"
            >
              {t("cta.browseAll")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
