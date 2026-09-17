"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import {
  ArrowRight, Bot, Scale, Heart, Briefcase, Users, Building2,
  Shield, Landmark, Globe, Gavel, Lightbulb, Search, X,
  BadgeCheck, Sparkles, CheckCircle2, ArrowUpDown
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePracticeAreas } from "@/lib/api/landing";
import { cn } from "@/lib/utils";

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

type CategoryTab = "ALL" | "BUSINESS" | "CIVIL";
type SortOption = "MOST_EXPERTS" | "ALPHABETICAL";

const BUSINESS_SPECIALTIES = new Set([
  "COMMERCIAL_LAW",
  "CORPORATE_LAW",
  "CONTRACT_LAW",
  "TAX_LAW",
  "INTELLECTUAL_PROPERTY",
]);

const CIVIL_SPECIALTIES = new Set([
  "FAMILY_LAW",
  "LAND_LAW",
  "EMPLOYMENT_LAW",
  "CRIMINAL_LAW",
  "IMMIGRATION_LAW",
]);

interface SpecialtyDetail {
  description: string;
  topics: string[];
}

const SPECIALTY_DETAILS: Record<string, SpecialtyDetail> = {
  COMMERCIAL_LAW: {
    description: "Commercial disputes, trade contracts, business debt recovery, and cross-border transactions under Rwandan commercial law.",
    topics: ["Trade Agreements", "Commercial Litigation", "Debt Recovery", "Distribution Contracts"],
  },
  CONTRACT_LAW: {
    description: "Drafting, reviewing, and enforcing binding agreements, non-disclosure pacts, and resolving breach of contract disputes.",
    topics: ["Contract Drafting & Review", "Breach of Contract", "NDAs & Service Agreements", "Commercial Mediation"],
  },
  CORPORATE_LAW: {
    description: "RDB business formation, shareholder structures, corporate governance, mergers, and legal compliance for companies in Rwanda.",
    topics: ["RDB Company Registration", "Shareholder Agreements", "M&A & Restructuring", "Corporate Compliance"],
  },
  CRIMINAL_LAW: {
    description: "Defense representation and legal counsel for RIB investigations, prosecution bail hearings, and court trial defense.",
    topics: ["RIB Investigations", "Bail Hearings", "Financial & Economic Crimes", "Court Trial Defense"],
  },
  TAX_LAW: {
    description: "Rwanda Revenue Authority (RRA) compliance, tax dispute litigation, customs appeals, and corporate tax structuring.",
    topics: ["RRA Tax Audits", "Tax Dispute Appeals", "VAT & Customs Compliance", "Corporate Tax Planning"],
  },
  IMMIGRATION_LAW: {
    description: "Work permits (Classes A through G), investor and business visas, permanent residency, and Rwandan dual citizenship.",
    topics: ["Work Permits (Class A–G)", "Investor & Business Visas", "Residency Permits", "Dual Citizenship"],
  },
  FAMILY_LAW: {
    description: "Compassionate legal counsel for divorce proceedings, child custody, matrimonial property regimes, and inheritance succession.",
    topics: ["Divorce & Separation", "Child Custody & Support", "Inheritance & Succession", "Matrimonial Regimes"],
  },
  INTELLECTUAL_PROPERTY: {
    description: "Protecting trademarks, patents, industrial designs, copyrights, and brand enforcement registered with RDB.",
    topics: ["RDB Trademark Registration", "Brand Infringement", "Copyright Protection", "Patent Filing"],
  },
  EMPLOYMENT_LAW: {
    description: "Resolving workplace disputes, wrongful termination claims, employment contract negotiations, and labor inspectorate mediation.",
    topics: ["Unfair Dismissal Claims", "Employment Contracts", "Severance Calculations", "Workplace Mediation"],
  },
  LAND_LAW: {
    description: "Comprehensive legal assistance for land title transfers, RLMUA registration, boundary conflicts, and commercial leases.",
    topics: ["Land Title Transfers", "RLMUA Registration", "Boundary Disputes", "Commercial Leases"],
  },
};

export default function PracticeAreasPage() {
  const t = useTranslations("practiceAreasPage");
  const { data: practiceAreas, isLoading } = usePracticeAreas();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<CategoryTab>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOption>("MOST_EXPERTS");

  const filteredAreas = useMemo(() => {
    if (!practiceAreas) return [];
    let list = [...practiceAreas];

    // Filter by tab
    if (activeTab === "BUSINESS") {
      list = list.filter((area) => BUSINESS_SPECIALTIES.has(area.specialty));
    } else if (activeTab === "CIVIL") {
      list = list.filter((area) => CIVIL_SPECIALTIES.has(area.specialty));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((area) => {
        const details = SPECIALTY_DETAILS[area.specialty];
        const matchesLabel = area.label.toLowerCase().includes(q);
        const matchesDesc = details?.description.toLowerCase().includes(q);
        const matchesTopics = details?.topics.some((topic) => topic.toLowerCase().includes(q));
        return matchesLabel || matchesDesc || matchesTopics;
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortOrder === "MOST_EXPERTS") {
        const diff = (b.expertCount || 0) - (a.expertCount || 0);
        return diff !== 0 ? diff : a.label.localeCompare(b.label);
      }
      return a.label.localeCompare(b.label);
    });

    return list;
  }, [practiceAreas, activeTab, searchQuery, sortOrder]);

  const hasSearch = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-muted/30 via-background to-background pt-12 pb-10 sm:pt-16 sm:pb-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-xs">
            <BadgeCheck size={14} className="text-brand-dark dark:text-white" />
            <span>{t("hero.badge")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-3.5 max-w-2xl text-base sm:text-lg text-muted-foreground">
            {t("hero.subtitle")}
          </p>

          {/* Interactive Search Input */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative flex items-center rounded-2xl border border-border bg-card shadow-sm transition-all focus-within:border-brand-dark focus-within:ring-2 focus-within:ring-brand-dark/10 dark:focus-within:border-white/40">
              <div className="pl-4 text-muted-foreground">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="w-full bg-transparent px-3.5 py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mr-3 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {hasSearch && (
              <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground px-2">
                <span>
                  {t("search.resultsCount", { count: filteredAreas.length, total: practiceAreas?.length ?? 10 })}
                </span>
                <button
                  onClick={() => setSearchQuery("")}
                  className="font-medium text-brand-dark dark:text-white hover:underline"
                >
                  {t("search.clear")}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          {/* Category Tabs & Sort Controls */}
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "ALL"
                    ? "bg-brand-dark text-on-brand shadow-xs dark:bg-white dark:text-black"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {t("tabs.all")} ({practiceAreas?.length ?? 10})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("BUSINESS")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "BUSINESS"
                    ? "bg-brand-dark text-on-brand shadow-xs dark:bg-white dark:text-black"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {t("tabs.business")} (5)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("CIVIL")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === "CIVIL"
                    ? "bg-brand-dark text-on-brand shadow-xs dark:bg-white dark:text-black"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {t("tabs.civil")} (5)
              </button>
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <ArrowUpDown size={14} className="text-muted-foreground" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOption)}
                aria-label={t("sort.label")}
                className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none transition focus:border-brand-dark hover:bg-accent cursor-pointer"
              >
                <option value="MOST_EXPERTS">{t("sort.mostExperts")}</option>
                <option value="ALPHABETICAL">{t("sort.alphabetical")}</option>
              </select>
            </div>
          </div>
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-card p-6" />
              ))}
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Search size={26} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t("search.noResults")}</h3>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{t("search.noResultsSub")}</p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSearchQuery("")}
                  className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-xs hover:bg-accent transition"
                >
                  {t("search.clear")}
                </button>
                <Link
                  href="/ai"
                  className="rounded-xl bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:opacity-90 transition dark:bg-white dark:text-black"
                >
                  {t("cta.useAi")}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Practice Area Cards */}
              {filteredAreas.map((area) => {
                const Icon = ICON_MAP[area.specialty] ?? Scale;
                const details = SPECIALTY_DETAILS[area.specialty];

                return (
                  <Link
                    key={area.specialty}
                    href={`/search?specialty=${area.specialty}`}
                    className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-dark/40 hover:shadow-md dark:hover:border-white/30"
                  >
                    <div>
                      {/* Icon & Count Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark transition-all duration-200 group-hover:bg-brand-dark group-hover:text-white group-hover:scale-105 dark:bg-white/10 dark:text-white dark:group-hover:bg-white dark:group-hover:text-black shadow-xs">
                          <Icon size={24} className="transition-colors" />
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-1 text-xs font-semibold text-foreground">
                          {area.expertCount === 1
                            ? t("grid.expertsCount", { count: area.expertCount })
                            : t("grid.expertsCountPlural", { count: area.expertCount })}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="mt-4 text-lg font-bold text-foreground transition-colors group-hover:text-brand-dark dark:group-hover:text-white">
                        {area.label}
                      </h3>

                      {/* Description */}
                      {details?.description && (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                          {details.description}
                        </p>
                      )}

                      {/* Common Topics Tags */}
                      {details?.topics && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {details.topics.map((topic) => (
                            <span
                              key={topic}
                              className="inline-flex items-center rounded-lg bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-foreground"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer Link */}
                    <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs font-semibold text-brand-dark dark:text-white">
                      <span>{t("grid.findLawyers")}</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Refined Bottom CTA */}
      <section className="border-t border-border bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card via-card to-muted/40 p-8 sm:p-12 text-center shadow-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
              <Bot size={28} />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {t("cta.title")}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t("cta.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/ai"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 dark:bg-white dark:text-black"
              >
                <Sparkles size={15} />
                <span>{t("cta.useAi")}</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3 text-sm font-semibold text-foreground shadow-xs transition hover:bg-accent"
              >
                <span>{t("cta.browseAll")}</span>
              </Link>
            </div>

            {/* Reassuring trust strip */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-border/60 pt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-brand-dark dark:text-white" />
                <span>{t("cta.trust1")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-brand-dark dark:text-white" />
                <span>{t("cta.trust2")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-brand-dark dark:text-white" />
                <span>{t("cta.trust3")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
