"use client";

import { useMemo, useState, useRef } from "react";
import { Link } from "@/i18n/routing";
import {
  Search,
  ChevronDown,
  HelpCircle,
  Mail,
  ArrowRight,
  X,
  ShieldCheck,
  Scale,
  Users,
  Wallet,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

type CategoryKey = "all" | "clients" | "advocates" | "escrow" | "trust";

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark
            key={i}
            className="rounded-xs bg-brand-dark/15 dark:bg-white/20 text-foreground font-semibold px-1 py-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function FaqsClient() {
  const t = useTranslations("faqsPage");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const questionsContainerRef = useRef<HTMLDivElement>(null);

  const CATEGORIES: {
    key: CategoryKey;
    label: string;
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    count: number;
  }[] = [
    { key: "all", label: t("categories.all"), Icon: HelpCircle, count: 16 },
    { key: "clients", label: t("categories.clients"), Icon: Users, count: 5 },
    { key: "advocates", label: t("categories.advocates"), Icon: Scale, count: 4 },
    { key: "escrow", label: t("categories.escrow"), Icon: Wallet, count: 4 },
    { key: "trust", label: t("categories.trust"), Icon: ShieldCheck, count: 3 },
  ];

  const POPULAR_TAGS = [
    t("search.tagEscrow"),
    t("search.tagDiaspora"),
    t("search.tagMoMo"),
    t("search.tagCourt"),
    t("search.tagCancel"),
  ];

  // All 16 structured items
  const ALL_ITEMS = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const itemKey = `item${i + 1}` as const;
      return {
        id: itemKey,
        category: t(`items.${itemKey}.category`) as "clients" | "advocates" | "escrow" | "trust",
        q: t(`items.${itemKey}.q`),
        a: t(`items.${itemKey}.a`),
      };
    });
  }, [t]);

  // Filtered items by category & search query
  const filteredItems = useMemo(() => {
    return ALL_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const qLower = item.q.toLowerCase();
      const aLower = item.a.toLowerCase();
      const queryLower = searchQuery.toLowerCase().trim();

      return qLower.includes(queryLower) || aLower.includes(queryLower);
    });
  }, [ALL_ITEMS, selectedCategory, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const handleCategorySelect = (key: CategoryKey) => {
    setSelectedCategory(key);
    // If user is scrolled down, smoothly scroll to top of questions list without violent jumps
    if (questionsContainerRef.current) {
      const rect = questionsContainerRef.current.getBoundingClientRect();
      if (rect.top < 80) {
        questionsContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "clients":
        return t("categories.clients");
      case "advocates":
        return t("categories.advocates");
      case "escrow":
        return t("categories.escrow");
      case "trust":
        return t("categories.trust");
      default:
        return category;
    }
  };

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── 1. Hero & Unified Control Center ─────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[0.04] via-background to-background pt-14 pb-10 sm:pt-20 sm:pb-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          {/* Hero Badge */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <HelpCircle size={14} className="text-brand-dark dark:text-white shrink-0" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* Search Box */}
          <div className="mx-auto mt-8 max-w-2xl relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("hero.searchPlaceholder")}
              className="h-13 w-full rounded-2xl border border-border bg-card pl-12 pr-10 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus:border-brand-dark dark:focus:border-white focus:ring-2 focus:ring-brand-dark/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Popular Search Shortcuts */}
          <div className="mx-auto mt-4 max-w-2xl flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Sparkles size={12} className="text-brand-dark dark:text-white" />
              {t("search.popularTagsLabel")}
            </span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="rounded-lg border border-border/80 bg-card px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition shadow-2xs font-mono text-[11px]"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Non-Sticky Category Filter Pills (Unified with Hero) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 pt-2">
            {CATEGORIES.map(({ key, label, Icon, count }) => {
              const isSelected = selectedCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategorySelect(key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                    isSelected
                      ? "bg-brand-dark text-white dark:bg-white dark:text-black font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-card border border-border bg-background"
                  }`}
                >
                  <Icon size={14} className={isSelected ? "text-white dark:text-black" : "text-muted-foreground"} />
                  <span>{label}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                      isSelected
                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 2. Questions Section with Stable Height ─────────────────── */}
      <section
        ref={questionsContainerRef}
        className="py-12 sm:py-16 bg-muted/20 flex-1 min-h-[550px]"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Search Result Counter & Active Filter Badge */}
          {isSearching && (
            <div className="mb-6 flex items-center justify-between border-b border-border pb-3 text-xs sm:text-sm text-muted-foreground">
              <span>
                {t("search.resultsCount", { count: filteredItems.length })}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="font-semibold text-brand-dark dark:text-white hover:underline flex items-center gap-1"
              >
                <X size={14} />
                {t("search.clear")}
              </button>
            </div>
          )}

          {filteredItems.length > 0 ? (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                // Auto-expand items when searching, otherwise respect manual toggle
                const isOpen = isSearching ? true : !!openItems[item.id];

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all ${
                      isOpen
                        ? "border-border bg-card shadow-xs ring-1 ring-border"
                        : "border-border bg-card hover:border-border/80"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-foreground focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <div className="pr-4 space-y-1.5">
                        <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                          {getCategoryBadge(item.category)}
                        </span>
                        <div className="text-foreground leading-snug">
                          <HighlightMatch text={item.q} query={searchQuery} />
                        </div>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-muted-foreground transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180 text-foreground" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                        <HighlightMatch text={item.a} query={searchQuery} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center max-w-md mx-auto my-8">
              <Search className="mx-auto h-8 w-8 text-muted-foreground/60 mb-3" />
              <h3 className="text-base font-bold text-foreground">
                {t("emptyState.noResults")}
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {t("emptyState.suggestion")}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition"
              >
                {t("emptyState.clearSearch")}
              </button>
            </div>
          )}

          {/* ── 3. Direct Support Escalation Card ──────────────────────── */}
          <div className="mt-14 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 text-brand-dark dark:text-white font-bold text-xs uppercase tracking-widest font-mono mb-2">
                  <Mail size={14} />
                  <span>Kigali Support Team</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground">
                  {t("cta.title")}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("cta.subtitle")}
                </p>
                <div className="mt-2 text-xs text-muted-foreground font-mono">
                  {t("cta.emailSupport")}
                </div>
              </div>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-6 py-3 text-xs sm:text-sm font-bold shadow-xs transition shrink-0"
              >
                {t("cta.contact")} <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
