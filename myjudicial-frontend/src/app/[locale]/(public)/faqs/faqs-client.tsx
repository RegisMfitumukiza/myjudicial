"use client";

import { useMemo, useState, useRef, useEffect } from "react";
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
  const heroSearchInputRef = useRef<HTMLInputElement>(null);

  // Press "/" to focus search from anywhere
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        if (heroSearchInputRef.current) {
          heroSearchInputRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          heroSearchInputRef.current.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    // Smoothly ensure questions header is in view without jumping
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

  const activeCategory =
    CATEGORIES.find((c) => c.key === selectedCategory) || CATEGORIES[0];

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── 1. Hero & Search Control Center ─────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[0.04] via-background to-background pt-9 pb-7 sm:pt-12 sm:pb-9">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <HelpCircle size={14} className="text-brand-dark dark:text-white shrink-0" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-2.5 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* Hero Search Pill (Clean, full-width, centered) */}
          <div className="mx-auto mt-6 max-w-2xl">
            <div className="flex w-full items-center rounded-full border border-border bg-card shadow-xs hover:shadow-md transition-shadow focus-within:border-brand-dark dark:focus-within:border-white focus-within:ring-2 focus-within:ring-brand-dark/10">
              <div className="pl-4.5 text-muted-foreground shrink-0">
                <Search size={16} />
              </div>
              <input
                ref={heroSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    questionsContainerRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
                placeholder={t("hero.searchPlaceholder")}
                aria-label={t("hero.searchPlaceholder")}
                className="flex-1 min-w-0 bg-transparent px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition mr-1"
                  aria-label={t("search.clear")}
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  questionsContainerRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-dark text-white dark:bg-white dark:text-black transition hover:opacity-90 shadow-2xs"
                aria-label={t("hero.searchPlaceholder")}
              >
                <Search size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Popular Search Shortcuts */}
          <div className="mx-auto mt-3 max-w-2xl flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Sparkles size={12} className="text-brand-dark dark:text-white" />
              {t("search.popularTagsLabel")}
            </span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="rounded-full border border-border/80 bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition shadow-2xs"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Two-Column Knowledge Hub Body ─────────────────────────── */}
      <section className="pt-6 pb-12 sm:pt-8 sm:pb-16 bg-muted/20 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Mobile Category Scroll (Visible on Mobile/Tablet, Hidden on Desktop) */}
          <div className="lg:hidden mb-6 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-2 min-w-max">
              {CATEGORIES.map(({ key, label, Icon, count }) => {
                const isSelected = selectedCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCategorySelect(key)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-brand-dark text-white dark:bg-white dark:text-black font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground border border-border bg-card"
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

          {/* Grid Layout: 4 cols Left Sidebar (Sticky) + 8 cols Right Content */}
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Left Column: Desktop Sticky Category Sidebar */}
            <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-3 shadow-xs">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  {t("sidebarTitle")}
                </div>
                <nav className="space-y-1">
                  {CATEGORIES.map(({ key, label, Icon, count }) => {
                    const isSelected = selectedCategory === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCategorySelect(key)}
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all text-left ${
                          isSelected
                            ? "bg-brand-dark text-white dark:bg-white dark:text-black font-bold shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <Icon size={16} className={isSelected ? "text-white dark:text-black" : "text-muted-foreground"} />
                          <span className="truncate">{label}</span>
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold shrink-0 ${
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
                </nav>
              </div>

              {/* Quick Contact Card in Sidebar */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                <div className="flex items-center gap-2 text-brand-dark dark:text-white font-bold text-xs uppercase tracking-widest font-mono mb-2">
                  <Mail size={14} />
                  <span>{t("kigaliTeam")}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("kigaliNotice")}
                </p>
                <div className="mt-3 text-[11px] text-muted-foreground font-mono">
                  {t("cta.emailSupport")}
                </div>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-accent transition w-full justify-center shadow-2xs"
                >
                  <span>{t("cta.contact")}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </aside>

            {/* Right Column: Questions Accordion & Live Results */}
            <main ref={questionsContainerRef} className="lg:col-span-8 min-h-[550px] space-y-4 scroll-mt-24">
              {/* Active Category Header & Search Status */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    {activeCategory.label}
                  </h2>
                  {isSearching ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("search.resultsCount", { count: filteredItems.length })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("verifiedAnswers", { count: filteredItems.length })}
                    </p>
                  )}
                </div>

                {isSearching && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-xs font-semibold text-brand-dark dark:text-white hover:underline flex items-center gap-1"
                  >
                    <X size={13} />
                    {t("search.clear")}
                  </button>
                )}
              </div>

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
                            <span className="inline-block rounded-md bg-muted/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
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

              {/* Mobile Escalation Card (Visible on mobile/tablet, hidden on desktop where sidebar handles it) */}
              <div className="lg:hidden mt-8 rounded-3xl border border-border bg-card p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-brand-dark dark:text-white font-bold text-xs uppercase tracking-widest font-mono mb-1.5">
                      <Mail size={14} />
                      <span>{t("kigaliTeam")}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {t("cta.title")}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("cta.subtitle")}
                    </p>
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-5 py-2.5 text-xs font-bold shadow-xs transition shrink-0"
                  >
                    {t("cta.contact")} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}
