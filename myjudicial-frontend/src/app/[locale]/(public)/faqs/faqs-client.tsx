"use client";

import { useMemo, useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Mail,
  ArrowRight,
  X,
  ShieldCheck,
  Scale,
  Users,
  Wallet,
  Link2,
  Check,
  Copy,
  Phone,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlatformSettings } from "@/lib/api/settings";

export type CategoryKey = "all" | "clients" | "advocates" | "escrow" | "trust";

/**
 * Normalizes CMS & admin categories to the public knowledge base taxonomy.
 * Seamlessly maps legacy/CMS inputs ('experts', 'billing', 'security', 'general')
 * to standard platform categories without data loss.
 */
export function normalizeFaqCategory(raw?: string): CategoryKey | "general" {
  const cat = (raw || "").toLowerCase().trim();
  if (cat === "experts" || cat === "advocates" || cat === "lawyers") return "advocates";
  if (cat === "billing" || cat === "escrow" || cat === "payments") return "escrow";
  if (
    cat === "security" ||
    cat === "trust" ||
    cat === "privacy" ||
    cat === "compliance" ||
    cat === "ethics"
  ) {
    return "trust";
  }
  if (cat === "clients" || cat === "citizens" || cat === "bookings") return "clients";
  return "general";
}

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

function FaqsContent() {
  const t = useTranslations("faqsPage");
  const { settings } = usePlatformSettings();
  const searchParams = useSearchParams();

  const supplementalFaqs = settings?.supplementalFaqs || [];

  // Dynamic Support Contact details from CMS settings
  const activeEmail = settings?.supportEmail || "support@myjudicial.com";
  const activeHotline = settings?.hotlinePhone;
  const activeHours = settings?.supportWorkingHours;

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [targetedId, setTargetedId] = useState<string | null>(null);

  // URL Query Params Hydration
  const categoryParam = searchParams.get("category");
  const queryParam = searchParams.get("q") || "";

  const initialCategory: CategoryKey =
    categoryParam && ["clients", "advocates", "escrow", "trust"].includes(categoryParam)
      ? (categoryParam as CategoryKey)
      : "all";

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const heroSearchInputRef = useRef<HTMLInputElement>(null);

  // Sync state to URL without hard reloading
  const syncUrlState = (cat: CategoryKey, q: string) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (cat !== "all") params.set("category", cat);
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", newUrl);
  };

  // Keyboard navigation & Shortcuts: "/" focuses search, "Escape" clears & blurs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        if (heroSearchInputRef.current) {
          if (typeof heroSearchInputRef.current.scrollIntoView === "function") {
            heroSearchInputRef.current.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
          heroSearchInputRef.current.focus?.();
        }
      } else if (e.key === "Escape" && document.activeElement === heroSearchInputRef.current) {
        setSearchQuery("");
        heroSearchInputRef.current?.blur();
        syncUrlState(selectedCategory, "");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCategory]);

  // All structured items: dynamic CMS published items, or fallback to the 16 core trilingual defaults
  const ALL_ITEMS = useMemo(() => {
    const core = Array.from({ length: 16 }, (_, i) => {
      const itemKey = `item${i + 1}` as const;
      const rawCat = t(`items.${itemKey}.category`);
      return {
        id: itemKey,
        category: normalizeFaqCategory(rawCat),
        q: t(`items.${itemKey}.q`),
        a: t(`items.${itemKey}.a`),
      };
    });

    if (!supplementalFaqs || supplementalFaqs.length === 0) {
      return core;
    }

    // When the admin has populated the full FAQ set in CMS (item IDs starting with "item" or "faq-"),
    // CMS takes full ownership of the FAQ list so admins can delete, edit, or reorder items.
    const hasPopulatedCore = supplementalFaqs.some(
      (f) => f.id.startsWith("item") || f.id.startsWith("faq-")
    );

    if (hasPopulatedCore) {
      return supplementalFaqs.map((faq) => ({
        id: faq.id,
        category: normalizeFaqCategory(faq.category),
        q: faq.question,
        a: faq.answer,
      }));
    }

    // Pure supplemental items (e.g. sup-1, sup-2) appended to core
    const supplemental = supplementalFaqs.map((faq) => ({
      id: faq.id,
      category: normalizeFaqCategory(faq.category),
      q: faq.question,
      a: faq.answer,
    }));

    return [...core, ...supplemental];
  }, [t, supplementalFaqs]);

  // Handle URL hash deep-linking on arrival or change (#item10)
  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const matched = ALL_ITEMS.find((item) => item.id === hash);
      if (matched) {
        setTargetedId(matched.id);
        setOpenItems((prev) => ({ ...prev, [matched.id]: true }));
        // If the targeted item belongs to a specific category, ensure that category or "all" is visible
        if (matched.category !== "general" && matched.category !== selectedCategory) {
          setSelectedCategory("all");
        }
        setTimeout(() => {
          const el = document.getElementById(matched.id);
          if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [ALL_ITEMS]);

  const CATEGORIES: {
    key: CategoryKey;
    label: string;
    Icon: React.ComponentType<{ size?: number; className?: string }>;
    count: number;
  }[] = [
    { key: "all", label: t("categories.all"), Icon: HelpCircle, count: ALL_ITEMS.length },
    {
      key: "clients",
      label: t("categories.clients"),
      Icon: Users,
      count: ALL_ITEMS.filter((i) => i.category === "clients").length,
    },
    {
      key: "advocates",
      label: t("categories.advocates"),
      Icon: Scale,
      count: ALL_ITEMS.filter((i) => i.category === "advocates").length,
    },
    {
      key: "escrow",
      label: t("categories.escrow"),
      Icon: Wallet,
      count: ALL_ITEMS.filter((i) => i.category === "escrow").length,
    },
    {
      key: "trust",
      label: t("categories.trust"),
      Icon: ShieldCheck,
      count: ALL_ITEMS.filter((i) => i.category === "trust").length,
    },
  ];

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
    syncUrlState(key, searchQuery);

    if (questionsContainerRef.current) {
      if (typeof questionsContainerRef.current.getBoundingClientRect === "function") {
        const rect = questionsContainerRef.current.getBoundingClientRect();
        if (rect.top < 120 && typeof questionsContainerRef.current.scrollIntoView === "function") {
          questionsContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else if (typeof questionsContainerRef.current.scrollIntoView === "function") {
        questionsContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    syncUrlState(selectedCategory, val);
  };

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Expand All / Collapse All Toggle
  const isAllExpanded = useMemo(() => {
    if (filteredItems.length === 0) return false;
    return filteredItems.every((item) => (isSearching ? true : !!openItems[item.id]));
  }, [filteredItems, openItems, isSearching]);

  const toggleAll = () => {
    if (isAllExpanded) {
      setOpenItems({});
    } else {
      const allOpenMap: Record<string, boolean> = {};
      filteredItems.forEach((item) => {
        allOpenMap[item.id] = true;
      });
      setOpenItems(allOpenMap);
    }
  };

  const copyFaqLink = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(id);
      window.history.replaceState(null, "", `#${id}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyEmail = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(activeEmail);
      }
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
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
      case "general":
        return t("categories.general");
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
          <div className="mx-auto max-w-3xl text-center">
            {/* Unified Platform Hero Badge */}
            <div className="mb-3.5 sm:mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <HelpCircle size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span>{t("hero.badge")}</span>
            </div>

            <h1 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.16] sm:leading-[1.12] text-balance break-words">
              {t("hero.title")}
            </h1>

            <p className="mx-auto mt-3.5 sm:mt-4 max-w-2xl text-xs min-[360px]:text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-balance break-words">
              {t("hero.subtitle")}
            </p>
          </div>

          {/* Hero Search Pill (Clean, full-width, centered with keyboard shortcut) */}
          <div className="mx-auto mt-6 max-w-2xl">
            <div className="flex w-full items-center rounded-full border border-border bg-card shadow-xs hover:shadow-md transition-shadow focus-within:border-brand-dark dark:focus-within:border-white focus-within:ring-2 focus-within:ring-brand-dark/10">
              <div className="pl-4 text-muted-foreground shrink-0">
                <Search size={16} />
              </div>
              <input
                ref={heroSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (typeof questionsContainerRef.current?.scrollIntoView === "function") {
                      questionsContainerRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }
                }}
                placeholder={t("hero.searchPlaceholder")}
                aria-label={t("hero.searchPlaceholder")}
                className="flex-1 min-w-0 bg-transparent px-3 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />

              {/* Keyboard Shortcut Indicator */}
              {!searchQuery && (
                <kbd
                  aria-hidden="true"
                  className="hidden min-[480px]:inline-flex items-center rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground mr-1.5 select-none"
                  title={t("shortcutHint")}
                >
                  /
                </kbd>
              )}

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition mr-1"
                  aria-label={t("search.clear")}
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (typeof questionsContainerRef.current?.scrollIntoView === "function") {
                    questionsContainerRef.current.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
                className="mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-dark text-white dark:bg-white dark:text-black transition hover:opacity-90 shadow-2xs"
                aria-label={t("hero.searchPlaceholder")}
              >
                <Search size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Two-Column Knowledge Hub Body ─────────────────────────── */}
      <section className="pt-6 pb-12 sm:pt-8 sm:pb-16 bg-muted/20 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Mobile Category Scroll (Sticky under header on Mobile/Tablet, Hidden on Desktop) */}
          <div className="lg:hidden sticky top-[var(--header-offset,4rem)] z-30 transition-[top] duration-300 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 bg-background/95 backdrop-blur-md border-b border-border/80 mb-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-2xs">
            <div className="flex items-center gap-2 min-w-max">
              {CATEGORIES.map(({ key, label, Icon, count }) => {
                const isSelected = selectedCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={(e) => {
                      handleCategorySelect(key);
                      if (typeof e.currentTarget?.scrollIntoView === "function") {
                        e.currentTarget.scrollIntoView({
                          behavior: "smooth",
                          inline: "center",
                          block: "nearest",
                        });
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? "bg-brand-dark text-white dark:bg-white dark:text-black font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground border border-border bg-card/80 active:bg-muted"
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
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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

              {/* Dynamic Support & Contact Card in Sidebar */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-brand-dark dark:text-white font-bold text-xs uppercase tracking-widest font-mono">
                  <Mail size={14} />
                  <span>{t("kigaliTeam")}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("kigaliNotice")}
                </p>

                {/* Live Dynamic Support Channels */}
                <div className="space-y-2 pt-1 border-t border-border/60 text-xs">
                  {/* Email */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground truncate">
                      {activeEmail}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-foreground hover:bg-muted transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      title={t("cta.copyEmail")}
                    >
                      {copiedEmail ? (
                        <>
                          <Check size={11} className="text-emerald-500" />
                          <span>{t("cta.emailCopied")}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>{t("cta.copyEmail")}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Hotline (if configured) */}
                  {activeHotline && (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Phone size={12} className="shrink-0 text-foreground" />
                      <a
                        href={`tel:${activeHotline}`}
                        className="hover:text-foreground hover:underline truncate"
                      >
                        {activeHotline}
                      </a>
                    </div>
                  )}

                  {/* Hours (if configured) */}
                  {activeHours && (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Clock size={12} className="shrink-0 text-foreground" />
                      <span className="truncate">{activeHours}</span>
                    </div>
                  )}
                </div>

                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-accent transition w-full justify-center shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>{t("cta.contact")}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </aside>

            {/* Right Column: Questions Accordion & Live Results */}
            <main ref={questionsContainerRef} className="lg:col-span-8 min-h-[550px] space-y-4 scroll-mt-28 lg:scroll-mt-24">
              {/* Active Category Header, Controls & Search Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
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

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  {/* Expand All / Collapse All Button */}
                  {filteredItems.length > 1 && (
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {isAllExpanded ? (
                        <>
                          <ChevronUp size={13} />
                          <span>{t("collapseAll")}</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={13} />
                          <span>{t("expandAll")}</span>
                        </>
                      )}
                    </button>
                  )}

                  {isSearching && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange("")}
                      className="text-xs font-semibold text-brand-dark dark:text-white hover:underline flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                    >
                      <X size={13} />
                      {t("search.clear")}
                    </button>
                  )}
                </div>
              </div>

              {filteredItems.length > 0 ? (
                <div className="space-y-3">
                  {filteredItems.map((item) => {
                    const isOpen = isSearching ? true : !!openItems[item.id];
                    const isTargeted = targetedId === item.id;
                    const isCopied = copiedId === item.id;

                    return (
                      <article
                        key={item.id}
                        id={item.id}
                        className={`rounded-2xl border transition-all scroll-mt-28 ${
                          isTargeted
                            ? "border-brand-dark/60 dark:border-white/60 bg-card shadow-sm ring-2 ring-brand-dark/20 dark:ring-white/20"
                            : isOpen
                            ? "border-border bg-card shadow-xs ring-1 ring-border"
                            : "border-border bg-card hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-start justify-between p-4 sm:p-5 gap-2">
                          <button
                            id={`faq-trigger-${item.id}`}
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            aria-expanded={isOpen}
                            aria-controls={`faq-answer-${item.id}`}
                            className="flex-1 flex items-start justify-between text-left text-sm sm:text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                          >
                            <div className="pr-3 space-y-1.5">
                              <span className="inline-block rounded-md bg-muted/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                                {getCategoryBadge(item.category)}
                              </span>
                              <div className="text-foreground leading-snug break-words">
                                <HighlightMatch text={item.q} query={searchQuery} />
                              </div>
                            </div>
                            <ChevronDown
                              size={18}
                              className={`text-muted-foreground transition-transform duration-200 shrink-0 mt-1 ${
                                isOpen ? "rotate-180 text-foreground" : ""
                              }`}
                            />
                          </button>

                          {/* 1-Click Copy Link Anchor Button */}
                          <button
                            type="button"
                            onClick={(e) => copyFaqLink(item.id, e)}
                            className="p-1 text-muted-foreground/60 hover:text-foreground transition rounded-md hover:bg-muted shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-0.5"
                            title={isCopied ? t("questionLinkCopied") : t("copyQuestionLink")}
                            aria-label={isCopied ? t("questionLinkCopied") : t("copyQuestionLink")}
                          >
                            {isCopied ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Link2 size={14} />
                            )}
                          </button>
                        </div>

                        {isOpen && (
                          <div
                            id={`faq-answer-${item.id}`}
                            role="region"
                            aria-labelledby={`faq-trigger-${item.id}`}
                            className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3 break-words"
                          >
                            <HighlightMatch text={item.a} query={searchQuery} />
                          </div>
                        )}
                      </article>
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
                      handleSearchChange("");
                      handleCategorySelect("all");
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t("emptyState.clearSearch")}
                  </button>
                </div>
              )}

              {/* Mobile Escalation Card (Visible on mobile/tablet, hidden on desktop where sidebar handles it) */}
              <div className="lg:hidden mt-8 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-brand-dark dark:text-white font-bold text-xs uppercase tracking-widest font-mono">
                      <Mail size={14} />
                      <span>{t("kigaliTeam")}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      {t("cta.title")}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t("cta.subtitle")}
                    </p>
                    <div className="pt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[11px]">{activeEmail}</span>
                      {activeHotline && <span>· {activeHotline}</span>}
                    </div>
                  </div>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-5 py-2.5 text-xs font-bold shadow-xs transition shrink-0 w-full sm:w-auto justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

export function FaqsSkeleton() {
  return (
    <div className="min-h-screen bg-background" role="status" aria-busy="true" aria-label="Loading frequently asked questions">
      {/* Hero Skeleton */}
      <section className="border-b border-border bg-gradient-to-b from-muted/50 to-background py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <div className="mx-auto h-9 w-64 rounded-xl bg-muted animate-pulse motion-reduce:animate-none mb-4" />
          <div className="mx-auto h-4 w-96 max-w-full rounded-md bg-muted animate-pulse motion-reduce:animate-none mb-8" />
          <div className="mx-auto h-12 max-w-xl rounded-xl bg-muted animate-pulse motion-reduce:animate-none" />
        </div>
      </section>

      {/* Categories & Accordions Skeleton */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-8">
          <div className="flex flex-wrap justify-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 w-28 rounded-full bg-muted animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse motion-reduce:animate-none" />
                  <div className="h-4 w-4 rounded-full bg-muted animate-pulse motion-reduce:animate-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function FaqsClient() {
  return (
    <Suspense fallback={<FaqsSkeleton />}>
      <FaqsContent />
    </Suspense>
  );
}
