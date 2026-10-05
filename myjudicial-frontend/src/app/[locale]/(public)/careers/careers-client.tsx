"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  BrainCircuit,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  Languages,
  Laptop,
  Link2,
  Mail,
  MapPin,
  Scale,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Users2,
  Video,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlatformSettings, type CareerRoleItem, type PlatformPublicSettings } from "@/lib/api/settings";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";

const FAQ_IDS = ["location", "contact", "include", "languages"] as const;

const TECH_TAGS: Record<string, string[]> = {
  marketplace: ["Next.js 15", "Leaflet GIS", "Multi-Filter Search"],
  payments: ["Mobile Money", "Escrow Ledger", "Regulated Gateways"],
  ai: ["Legal NLP Intake", "Taxonomy Classification", "Smart Triage"],
  video: ["WebRTC P2P", "Session Isolation", "Zero Server Recording"],
  verification: ["AES-256 at Rest", "RBA Roll Verification", "Audit Trail"],
  localization: ["Kinyarwanda", "English", "French"],
};

export default function CareersClient() {
  const t = useTranslations("careersPage");
  const { settings } = usePlatformSettings();
  const activeCareersEmail = settings.careersEmail || "careers@myjudicial.com";

  // A role is only shown when it is not explicitly unpublished.
  const openRoles: CareerRoleItem[] = useMemo(
    () => (settings.careersOpenRoles || []).filter((role) => role.published !== false),
    [settings.careersOpenRoles]
  );

  const hiringStatus = settings.careersHiringStatus || "TALENT_POOL";
  const hasActiveRoles = hiringStatus === "ACTIVELY_HIRING" && openRoles.length > 0;

  // Editorial Hero Content from CMS (with fallback to localized default copy)
  const activeHeroTitle = settings.careersHeroTitle?.trim() || t("hero.title");
  const activeHeroSubtitle = settings.careersHeroSubtitle?.trim() || t("hero.subtitle");

  const officeAddress = [settings.officeBuilding, settings.officeStreet, settings.officeDistrict]
    .filter(Boolean)
    .join(", ");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CareerRoleItem | null>(null);
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeHashRole, setActiveHashRole] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Deep linking: detect #role-id on mount & hash change, scroll & expand
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && hash !== "positions") {
        setActiveHashRole(hash);
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 350);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const scrollToPositions = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById("positions");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", "#positions");
    }
  }, []);

  // Dynamic departments derived from active open roles
  const departments = useMemo(() => {
    const set = new Set<string>();
    openRoles.forEach((role) => {
      if (role.department?.trim()) {
        set.add(role.department.trim());
      }
    });
    return Array.from(set).sort();
  }, [openRoles]);

  const filteredRoles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return openRoles.filter((role) => {
      const matchesDept = selectedDept === "ALL" || role.department?.trim() === selectedDept;
      if (!matchesDept) return false;
      if (!q) return true;

      const inTitle = role.title?.toLowerCase().includes(q);
      const inDept = role.department?.toLowerCase().includes(q);
      const inLoc = role.location?.toLowerCase().includes(q);
      const inType = role.type?.toLowerCase().includes(q);
      const inDesc = role.description?.toLowerCase().includes(q);
      const inReqs = role.requirements?.some((r) => r.toLowerCase().includes(q));
      const inResp = role.responsibilities?.some((r) => r.toLowerCase().includes(q));

      return Boolean(inTitle || inDept || inLoc || inType || inDesc || inReqs || inResp);
    });
  }, [openRoles, selectedDept, searchQuery]);

  const WHY_PILLARS = [
    { id: "access", Icon: Scale },
    { id: "transparency", Icon: Coins },
    { id: "verification", Icon: ShieldCheck },
    { id: "impact", Icon: HeartHandshake },
  ];

  const PROBLEM_SPACES = [
    { id: "marketplace", Icon: Search },
    { id: "payments", Icon: Wallet },
    { id: "ai", Icon: BrainCircuit },
    { id: "video", Icon: Video },
    { id: "verification", Icon: FileCheck2 },
    { id: "localization", Icon: Languages },
  ];

  const BENEFITS = [
    { id: "compensation", Icon: Coins },
    { id: "health", Icon: HeartHandshake },
    { id: "hardware", Icon: Laptop },
    { id: "office", Icon: Building2 },
    { id: "growth", Icon: GraduationCap },
    { id: "impact", Icon: Scale },
  ];

  const PRINCIPLES = [
    { id: "p1", Icon: Users2 },
    { id: "p2", Icon: ShieldAlert },
    { id: "p3", Icon: CheckCircle2 },
    { id: "p4", Icon: Wrench },
  ];

  const openApplicationModal = useCallback((role: CareerRoleItem | null = null) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  }, []);

  const closeApplicationModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedRole(null);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── 1. Hero Section ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-10 sm:py-16 lg:py-20">
        {/* Subtle decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-brand-dark/10 blur-3xl dark:bg-white/5"
        />

        <div className="mx-auto max-w-4xl px-3 min-[360px]:px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Unified Category Badge & Live Recruitment Posture Pill */}
            <div className="mb-3.5 sm:mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <Briefcase size={14} className="shrink-0 text-brand-dark dark:text-white" />
              <span className="truncate">{t("hero.badge")}</span>
              <span className="text-muted-foreground/40" aria-hidden="true">
                •
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  {hiringStatus === "ACTIVELY_HIRING" ? (
                    <>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </>
                  ) : hiringStatus === "TALENT_POOL" ? (
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                  ) : (
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </span>
                <span
                  className={
                    hiringStatus === "ACTIVELY_HIRING"
                      ? "font-bold text-emerald-700 dark:text-emerald-300"
                      : "font-medium text-foreground/90"
                  }
                >
                  {hiringStatus === "ACTIVELY_HIRING"
                    ? `${t("hero.hiringActive")}${openRoles.length > 0 ? ` (${openRoles.length})` : ""}`
                    : hiringStatus === "TALENT_POOL"
                    ? t("hero.hiringTalentPool")
                    : t("hero.hiringPaused")}
                </span>
              </span>
            </div>

            <h1 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.16] sm:leading-[1.12] text-balance break-words">
              {activeHeroTitle}
            </h1>

            <p className="mx-auto mt-3.5 sm:mt-4 max-w-2xl text-xs min-[360px]:text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-balance break-words">
              {activeHeroSubtitle}
            </p>
          </div>

          <div className="mx-auto mt-7 flex w-full max-w-xs flex-col items-center justify-center gap-3 min-[440px]:max-w-none min-[440px]:flex-row sm:mt-8">
            {hasActiveRoles ? (
              <a
                href="#positions"
                onClick={scrollToPositions}
                className="inline-flex w-full min-[440px]:w-auto cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-sm font-bold text-on-brand shadow-sm transition-all hover:bg-brand-dark/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Briefcase size={16} className="shrink-0" />
                <span>{t("hero.viewOpenings")}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => openApplicationModal(null)}
                className="inline-flex w-full min-[440px]:w-auto cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-sm font-bold text-on-brand shadow-sm transition-all hover:bg-brand-dark/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Mail size={16} className="shrink-0" />
                <span>{t("hero.sendInterest")}</span>
              </button>
            )}

            <Link
              href="/about"
              className="inline-flex w-full min-[440px]:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-2xs transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span>{t("hero.learnAbout")}</span>
              <ArrowRight size={14} className="shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Why Build With MyJudicial ─────────────────────────────────── */}
      <section className="border-b border-border bg-card py-12 min-[360px]:py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge={t("whyMyJudicial.badge")}
            title={t("whyMyJudicial.title")}
            subtitle={t("whyMyJudicial.subtitle")}
          />

          <div className="grid gap-4 min-[360px]:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_PILLARS.map(({ id, Icon }) => (
              <article
                key={id}
                className="flex flex-col rounded-2xl border border-border bg-background p-4 shadow-2xs transition-colors hover:border-foreground/20 min-[360px]:p-6"
              >
                <IconBadge>
                  <Icon size={20} />
                </IconBadge>
                <h3 className="text-sm font-bold text-foreground min-[360px]:text-base">
                  {t(`whyMyJudicial.${id}.title`)}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground min-[360px]:text-sm">
                  {t(`whyMyJudicial.${id}.desc`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. What We Work On (With Tech Chips) ────────────────────────── */}
      <section className="border-b border-border bg-background py-12 min-[360px]:py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge={t("whatWeWorkOn.badge")}
            title={t("whatWeWorkOn.title")}
            subtitle={t("whatWeWorkOn.subtitle")}
          />

          <div className="grid gap-4 min-[360px]:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEM_SPACES.map(({ id, Icon }) => (
              <article
                key={id}
                className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-2xs transition-colors hover:border-foreground/20 min-[360px]:p-6"
              >
                <div className="flex items-center justify-between">
                  <IconBadge>
                    <Icon size={20} />
                  </IconBadge>
                </div>

                <h3 className="text-sm font-bold text-foreground min-[360px]:text-base">
                  {t(`whatWeWorkOn.${id}.title`)}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground min-[360px]:mt-2 min-[360px]:text-sm">
                  {t(`whatWeWorkOn.${id}.desc`)}
                </p>

                {/* Tech focus chips */}
                {TECH_TAGS[id] && (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/40 pt-3">
                    {TECH_TAGS[id].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] font-medium text-foreground/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Perks & Benefits (Tier-1 Tech Grade) ──────────────────────── */}
      <section className="border-b border-border bg-card py-12 min-[360px]:py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge={t("benefits.badge")}
            title={t("benefits.title")}
            subtitle={t("benefits.subtitle")}
          />

          <div className="grid gap-4 min-[360px]:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ id, Icon }) => (
              <article
                key={id}
                className="flex flex-col rounded-2xl border border-border bg-background p-4 shadow-2xs transition-colors hover:border-foreground/20 min-[360px]:p-6"
              >
                <IconBadge>
                  <Icon size={20} />
                </IconBadge>
                <h3 className="text-sm font-bold text-foreground min-[360px]:text-base">
                  {t(`benefits.${id}.title`)}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground min-[360px]:text-sm">
                  {t(`benefits.${id}.desc`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. How We Work (Principles) ─────────────────────────────────── */}
      <section className="border-b border-border bg-muted/15 py-12 min-[360px]:py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge={t("howWeWork.badge")}
            title={t("howWeWork.title")}
            subtitle={t("howWeWork.subtitle")}
          />

          <div className="grid gap-4 min-[360px]:gap-6 sm:grid-cols-2">
            {PRINCIPLES.map(({ id, Icon }) => (
              <article
                key={id}
                className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-2xs transition-colors hover:border-foreground/20 min-[360px]:p-6"
              >
                <div className="mb-3 flex items-center gap-3">
                  <IconBadge>
                    <Icon size={18} />
                  </IconBadge>
                  <h3 className="text-sm font-bold text-foreground min-[360px]:text-base">
                    {t(`howWeWork.${id}.title`)}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground min-[360px]:text-sm">
                  {t(`howWeWork.${id}.desc`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Open Positions (With Dynamic Department Filtering) ────────── */}
      <section
        id="positions"
        className="scroll-mt-20 border-b border-border bg-background py-12 min-[360px]:py-16 sm:py-24"
      >
        <div className="mx-auto max-w-4xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-[11px] font-semibold text-foreground shadow-2xs">
              <Briefcase size={13} className="shrink-0 text-brand-dark dark:text-white" />
              <span>{t("openings.badge")}</span>
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground min-[360px]:text-3xl">
              {t("openings.title")}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-muted-foreground min-[360px]:text-sm">
              {t("openings.subtitle")}
            </p>
          </div>

          {hasActiveRoles ? (
            <div className="space-y-6">
              {/* Search Bar & Department Filter Controls */}
              <div className="space-y-4">
                <div className="mx-auto max-w-md">
                  <div className="relative flex items-center">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3.5 text-muted-foreground"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("openings.searchPlaceholder")}
                      className="w-full rounded-2xl border border-border bg-card py-2.5 pl-10 pr-9 text-xs text-foreground shadow-2xs placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        aria-label={t("openings.clearSearch")}
                        className="absolute right-3 cursor-pointer rounded-full p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {departments.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDept("ALL")}
                      className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                        selectedDept === "ALL"
                          ? "bg-brand-dark text-on-brand dark:bg-white dark:text-black"
                          : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {t("openings.filterAll")} ({openRoles.length})
                    </button>

                    {departments.map((dept) => {
                      const count = openRoles.filter((r) => r.department?.trim() === dept).length;
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setSelectedDept(dept)}
                          className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                            selectedDept === dept
                              ? "bg-brand-dark text-on-brand dark:bg-white dark:text-black"
                              : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {dept} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Filtered Positions List */}
              {filteredRoles.length > 0 ? (
                <div className="space-y-4">
                  {filteredRoles.map((role) => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      defaultExpanded={openRoles.length <= 2 || activeHashRole === role.id}
                      isTargeted={activeHashRole === role.id}
                      onApply={() => openApplicationModal(role)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {searchQuery.trim()
                      ? t("openings.noSearchResults")
                      : t("openings.emptyFiltered")}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedDept("ALL");
                    }}
                    className="mt-3 cursor-pointer text-xs font-bold text-brand-dark underline hover:opacity-80 dark:text-white"
                  >
                    {t("openings.resetFilters")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State / Talent Pool Card */
            <div className="space-y-4 rounded-3xl border border-border bg-card p-6 text-center shadow-2xs min-[360px]:p-8 sm:p-12">
              <IconBadge>
                <Briefcase size={22} />
              </IconBadge>

              <div className="mx-auto max-w-lg space-y-2">
                <h3 className="text-lg font-bold text-foreground sm:text-xl">
                  {t("openings.empty.title")}
                </h3>
                <p className="text-balance text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {t("openings.empty.subtitle")}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => openApplicationModal(null)}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 py-2.5 text-xs font-bold text-on-brand shadow-2xs transition hover:bg-brand-dark/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white dark:text-black dark:hover:bg-white/90 sm:text-sm"
                >
                  <Mail size={15} />
                  <span>{t("openings.empty.cta")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 7. Frequently Asked Questions ────────────────────────────────── */}
      <section className="bg-muted/15 py-12 min-[360px]:py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <SectionHeading
            badge={t("faqs.badge")}
            title={t("faqs.title")}
            subtitle={t("faqs.subtitle")}
          />

          <div className="space-y-3">
            {FAQ_IDS.map((id, index) => {
              const isOpen = openFaqId === id;
              const panelId = `careers-faq-panel-${id}`;

              return (
                <div
                  key={id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-colors hover:border-foreground/20"
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenFaqId(isOpen ? null : id)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left text-xs font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring min-[360px]:text-sm sm:p-5 sm:text-base"
                    >
                      <span className="flex items-start gap-2.5">
                        <HelpCircle
                          size={16}
                          className="mt-0.5 shrink-0 text-brand-dark dark:text-white"
                        />
                        <span>{t(`faqs.q${index + 1}`)}</span>
                      </span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </h3>

                  {isOpen && (
                    <div
                      id={panelId}
                      className="border-t border-border/40 px-4 pb-4 pt-0 text-xs leading-relaxed text-muted-foreground min-[360px]:text-sm sm:px-5 sm:pb-5"
                    >
                      <p className="mt-3">{t(`faqs.a${index + 1}`)}</p>
                      {id === "location" && officeAddress && (
                        <p className="mt-2 flex items-start gap-1.5 break-words font-medium text-foreground">
                          <MapPin size={13} className="mt-0.5 shrink-0 text-muted-foreground" />
                          <span>{officeAddress}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 8. In-App Direct Application Modal / Drawer ─────────────────── */}
      {isModalOpen && (
        <ApplicationModal
          role={selectedRole}
          careersEmail={activeCareersEmail}
          settings={settings}
          onClose={closeApplicationModal}
        />
      )}
    </div>
  );
}

/* ── Section Presentational Components ───────────────────────────────────── */

function SectionHeading({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground min-[360px]:text-[11px]">
        {badge}
      </span>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground min-[360px]:text-2xl sm:text-3xl">
        {title}
      </h2>
      <p className="mx-auto mt-2.5 max-w-2xl text-xs text-muted-foreground min-[360px]:text-sm sm:mt-3 sm:text-base">
        {subtitle}
      </p>
    </div>
  );
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark shadow-2xs min-[360px]:mb-4 min-[360px]:h-11 min-[360px]:w-11 dark:bg-white/10 dark:text-white">
      {children}
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-foreground">
        {title}
      </h4>
      <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
        {items.map((item, i) => (
          <li key={`${item}-${i}`} className="flex gap-2">
            <span
              aria-hidden="true"
              className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground"
            />
            <span className="break-words">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleCard({
  role,
  defaultExpanded = false,
  isTargeted = false,
  onApply,
}: {
  role: CareerRoleItem;
  defaultExpanded?: boolean;
  isTargeted?: boolean;
  onApply: () => void;
}) {
  const t = useTranslations("careersPage");
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isTargeted) {
      setIsExpanded(true);
    }
  }, [isTargeted]);

  const copyRoleLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#${role.id}`;
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const hasDetails = Boolean(
    role.description ||
      role.responsibilities?.length ||
      role.requirements?.length ||
      role.niceToHave?.length ||
      role.applicationInstructions
  );

  return (
    <article
      id={role.id}
      className={`rounded-2xl border bg-card p-4 shadow-2xs transition-all duration-200 sm:p-6 ${
        isTargeted
          ? "border-brand-dark ring-2 ring-brand-dark/20 dark:border-white dark:ring-white/20"
          : "border-border hover:border-foreground/20"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-base font-bold text-foreground sm:text-lg">
              {role.title}
            </h3>
            {role.type && (
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-foreground/80">
                {role.type}
              </span>
            )}
            <button
              type="button"
              onClick={copyRoleLink}
              title={copiedLink ? t("openings.roleLinkCopied") : t("openings.copyRoleLink")}
              aria-label={copiedLink ? t("openings.roleLinkCopied") : t("openings.copyRoleLink")}
              className="inline-flex cursor-pointer items-center gap-1 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {copiedLink ? (
                <>
                  <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {t("openings.roleLinkCopied")}
                  </span>
                </>
              ) : (
                <Link2 size={13} />
              )}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {role.department && (
              <span className="font-semibold text-foreground/90">{role.department}</span>
            )}
            {role.department && role.location && <span aria-hidden="true">&bull;</span>}
            {role.location && <span>{role.location}</span>}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
          {hasDetails && (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground shadow-2xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-initial"
            >
              <span>{isExpanded ? t("openings.hideDetails") : t("openings.viewDetails")}</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>
          )}

          <button
            type="button"
            onClick={onApply}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-2.5 text-xs font-bold text-on-brand shadow-2xs transition hover:bg-brand-dark/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-white dark:text-black dark:hover:bg-white/90 sm:flex-initial"
          >
            <span>{t("openings.applyDirect")}</span>
            <ArrowRight size={13} />
          </button>

          {role.applyUrl && /^https?:\/\//i.test(role.applyUrl) && (
            <a
              href={role.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${role.title} — ${t("openings.externalPortal")}`}
              className="rounded-xl border border-border bg-background p-2.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {hasDetails && isExpanded && (
        <div className="mt-4 border-t border-border/60 pt-4">
          {role.description && (
            <p className="whitespace-pre-line break-words text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {role.description}
            </p>
          )}
          <DetailList title={t("openings.responsibilities")} items={role.responsibilities || []} />
          <DetailList title={t("openings.requirements")} items={role.requirements || []} />
          <DetailList title={t("openings.niceToHave")} items={role.niceToHave || []} />
          {role.applicationInstructions && (
            <div>
              <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-foreground">
                {t("openings.applicationInstructions")}
              </h4>
              <p className="mt-1.5 whitespace-pre-line break-words text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {role.applicationInstructions}
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   In-App Application Drawer / Modal
   Supports both instant in-browser submission with validation & mail client fallback
   ───────────────────────────────────────────────────────────────────────── */

interface ApplicationModalProps {
  role: CareerRoleItem | null;
  careersEmail: string;
  settings?: PlatformPublicSettings;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function ApplicationModal({ role, careersEmail, settings: propSettings, onClose }: ApplicationModalProps) {
  const t = useTranslations("careersPage.expressionModal");
  const { settings: hookSettings } = usePlatformSettings();
  const settings = propSettings || hookSettings;

  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Field Requirements configured by Admin in CMS
  const reqPhone = Boolean(settings?.careersRequirePhone);
  const reqLinkedIn = Boolean(settings?.careersRequireLinkedIn);
  const reqPortfolio = Boolean(settings?.careersRequirePortfolio);
  const reqResume = settings?.careersRequireResume ?? true;
  const reqCoverNote = settings?.careersRequireCoverNote ?? true;

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");

  // Dual-mode resume state
  const [resumeTab, setResumeTab] = useState<"upload" | "link">("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeLink, setResumeLink] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [coverNote, setCoverNote] = useState("");
  const [showTips, setShowTips] = useState(false);

  // Anti-Bot: Honeypot & speed trap defense
  const formRenderTs = useRef(Date.now()).current;
  const [honeypot, setHoneypot] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  // Focus trap & escape key handler
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(careersEmail);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }, [careersEmail]);

  const handleSelectedFile = (file: File) => {
    setFormError("");
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    const validExtensions = [".pdf", ".docx", ".doc"];
    const fileExt = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setFormError("Only PDF and DOCX files are supported.");
      return;
    }
    if (file.size > maxSizeBytes) {
      setFormError("Resume file size must not exceed 10MB.");
      return;
    }
    setResumeFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim() || !email.trim()) {
      setFormError(t("validationError"));
      return;
    }

    if (reqPhone && !phone.trim()) {
      setFormError(t("validationError"));
      return;
    }

    if (reqLinkedIn && !linkedin.trim()) {
      setFormError(t("validationError"));
      return;
    }

    if (reqPortfolio && !portfolio.trim()) {
      setFormError(t("validationError"));
      return;
    }

    if (reqResume) {
      if (resumeTab === "upload" && !resumeFile) {
        setFormError(t("validationError"));
        return;
      }
      if (resumeTab === "link" && !resumeLink.trim()) {
        setFormError(t("validationError"));
        return;
      }
    }

    if (reqCoverNote && !coverNote.trim()) {
      setFormError(t("validationError"));
      return;
    }

    setIsSubmitting(true);

    try {
      let resumeBase64: string | undefined;
      if (resumeTab === "upload" && resumeFile) {
        resumeBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(resumeFile);
          reader.onload = () => {
            const res = String(reader.result || "");
            const b64 = res.includes(",") ? res.split(",")[1] : res;
            resolve(b64);
          };
          reader.onerror = () => reject(new Error("Failed to read resume file"));
        });
      }

      const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
      const prefix = (process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1").replace(/\/+$/, "");
      const response = await fetch(`${base}${prefix}/content/careers/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: role?.id,
          roleTitle: role?.title,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          portfolio: portfolio.trim() || undefined,
          resumeLink: resumeTab === "link" ? resumeLink.trim() : undefined,
          resumeFileName: resumeTab === "upload" && resumeFile ? resumeFile.name : undefined,
          resumeBase64,
          coverNote: coverNote.trim(),
          website_url: honeypot.trim() || undefined,
          _form_render_ts: formRenderTs,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || t("submissionFailed"));
      }

      setIsSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("submissionFailed");
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checklist = [t("guide1"), t("guide2"), t("guide3"), t("guide4"), t("guide5")];

  const resumeDetailString =
    resumeTab === "upload" && resumeFile
      ? `Attached: ${resumeFile.name} (${(resumeFile.size / (1024 * 1024)).toFixed(2)} MB)`
      : resumeLink.trim() || "[Resume URL]";

  const emailSubject = role ? t("emailSubjectRole", { roleTitle: role.title }) : t("emailSubject");
  const emailBody = [
    t("emailGreeting"),
    "",
    role ? t("emailIntroRole", { roleTitle: role.title }) : t("emailIntro"),
    "",
    `Applicant Name: ${fullName.trim() || "[Your Name]"}`,
    `Applicant Email: ${email.trim() || "[Your Email]"}`,
    `Applicant Phone: ${phone.trim() || "[N/A]"}`,
    `Resume: ${resumeDetailString}`,
    `LinkedIn: ${linkedin.trim() || "[LinkedIn URL]"}`,
    `Portfolio / GitHub: ${portfolio.trim() || "[Portfolio URL]"}`,
    "",
    `Cover Note:`,
    coverNote.trim() || "[Please write your introduction here]",
    "",
    t("emailSignoff"),
  ].join("\n");

  const mailtoUrl = `mailto:${careersEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(careersEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(careersEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in duration-200 sm:p-4"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative max-h-[92vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-3xl border border-border bg-card p-5 shadow-2xl outline-none animate-in zoom-in-95 duration-200 min-[360px]:p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-4 top-4 cursor-pointer rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X size={18} />
        </button>

        {isSubmitted ? (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              {t("successTitle")}
            </h2>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {t("successMessage")}
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-brand-dark px-6 py-2.5 text-xs font-bold text-on-brand shadow-sm transition hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 sm:text-sm"
              >
                {t("close")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <span className="mb-1 block font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {role ? t("roleSubtitle", { roleTitle: role.title }) : t("subtitle")}
              </span>
              <h2 id={titleId} className="pr-8 text-xl font-bold text-foreground sm:text-2xl">
                {t("title")}
              </h2>
              <p id={descId} className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {t("desc")}
              </p>
            </div>

            {/* Sleek Trust Bar & Optional Guidelines Toggle */}
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-3 sm:p-3.5 space-y-2">
              <div className="flex flex-col gap-2 min-[440px]:flex-row min-[440px]:items-center min-[440px]:justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                  <span>{t("trustGuarantee")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTips((prev) => !prev)}
                  className="inline-flex cursor-pointer items-center gap-1 font-semibold text-foreground hover:underline text-xs"
                >
                  <span>{showTips ? t("tipsToggleHide") : t("tipsToggleShow")}</span>
                  {showTips ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {showTips && (
                <div className="pt-2 border-t border-border/60 animate-in fade-in duration-150">
                  <h3 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t("guidanceTitle")}
                  </h3>
                  <ul className="grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
                    {checklist.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2
                          size={13}
                          className="mt-0.5 shrink-0 text-brand-dark dark:text-white"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Direct In-App Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Anti-Bot Honeypot (invisible to humans, traps automated scrapers/bots) */}
              <div
                className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0 pointer-events-none"
                aria-hidden="true"
                tabIndex={-1}
              >
                <label htmlFor="careers-website-hp">Company Website</label>
                <input
                  type="text"
                  id="careers-website-hp"
                  name="website_url"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {formError && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                  {formError}
                </div>
              )}

              {/* Row 1: Name and Email (Always Required) */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>
                      {t("fullName")}{" "}
                      <span className="text-destructive font-semibold" title="Required">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("fullNamePlaceholder")}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>
                      {t("email")}{" "}
                      <span className="text-destructive font-semibold" title="Required">*</span>
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Phone and LinkedIn (Clean 2-Column Responsive Grid) */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>
                      {t("phone")}{" "}
                      {reqPhone ? (
                        <span className="text-destructive font-semibold" title="Required">*</span>
                      ) : (
                        <span className="text-muted-foreground font-normal text-[11px]">
                          ({t("optionalBadge")})
                        </span>
                      )}
                    </span>
                  </label>
                  <input
                    type="tel"
                    required={reqPhone}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("phonePlaceholder")}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center justify-between">
                    <span>
                      {t("linkedin")}{" "}
                      {reqLinkedIn ? (
                        <span className="text-destructive font-semibold" title="Required">*</span>
                      ) : (
                        <span className="text-muted-foreground font-normal text-[11px]">
                          ({t("optionalBadge")})
                        </span>
                      )}
                    </span>
                  </label>
                  <input
                    type="url"
                    required={reqLinkedIn}
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder={t("linkedinPlaceholder")}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                  />
                </div>
              </div>

              {/* Row 3: Portfolio / GitHub URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>
                    {t("portfolio")}{" "}
                    {reqPortfolio ? (
                      <span className="text-destructive font-semibold" title="Required">*</span>
                    ) : (
                      <span className="text-muted-foreground font-normal text-[11px]">
                        ({t("optionalBadge")})
                      </span>
                    )}
                  </span>
                </label>
                <input
                  type="url"
                  required={reqPortfolio}
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder={t("portfolioPlaceholder")}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                />
              </div>

              {/* Row 4: Dual-Mode Resume / CV Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    {t("resumeLabel")}{" "}
                    {reqResume ? (
                      <span className="text-destructive font-semibold" title="Required">*</span>
                    ) : (
                      <span className="text-muted-foreground font-normal text-[11px]">
                        ({t("optionalBadge")})
                      </span>
                    )}
                  </label>
                  <div className="inline-flex rounded-lg bg-muted p-0.5 text-[11px] font-medium">
                    <button
                      type="button"
                      onClick={() => setResumeTab("upload")}
                      className={`rounded-md px-2.5 py-1 transition ${
                        resumeTab === "upload"
                          ? "bg-background font-bold text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t("resumeMethodUpload")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResumeTab("link")}
                      className={`rounded-md px-2.5 py-1 transition ${
                        resumeTab === "link"
                          ? "bg-background font-bold text-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t("resumeMethodLink")}
                    </button>
                  </div>
                </div>

                {resumeTab === "upload" ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileChange}
                      className="sr-only"
                      id="resume-file-input"
                    />
                    {!resumeFile ? (
                      <label
                        htmlFor="resume-file-input"
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleSelectedFile(file);
                        }}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition ${
                          isDragging
                            ? "border-brand-dark bg-brand-dark/5 dark:border-white dark:bg-white/5"
                            : "border-border bg-background hover:bg-muted/40"
                        }`}
                      >
                        <UploadCloud className="mb-1.5 h-6 w-6 text-muted-foreground" />
                        <span className="text-xs font-semibold text-foreground">
                          {t("resumeUploadPrompt")}
                        </span>
                        <span className="mt-0.5 text-[11px] text-muted-foreground">
                          {t("resumeUploadHint")}
                        </span>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                            <FileCheck2 size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-foreground">
                              {resumeFile.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {(resumeFile.size / (1024 * 1024)).toFixed(2)} MB &bull;{" "}
                              {t("resumeFileSelected")}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setResumeFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-destructive"
                          title={t("resumeRemoveFile")}
                          aria-label={t("resumeRemoveFile")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      required={reqResume}
                      value={resumeLink}
                      onChange={(e) => setResumeLink(e.target.value)}
                      placeholder={t("resumeLinkPlaceholder")}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {t("resumeLinkHelp")}
                    </p>
                  </div>
                )}
              </div>

              {/* Row 5: Cover Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>
                    {t("coverNote")}{" "}
                    {reqCoverNote ? (
                      <span className="text-destructive font-semibold" title="Required">*</span>
                    ) : (
                      <span className="text-muted-foreground font-normal text-[11px]">
                        ({t("optionalBadge")})
                      </span>
                    )}
                  </span>
                </label>
                <textarea
                  required={reqCoverNote}
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder={t("coverNotePlaceholder")}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                />
              </div>

              {/* Row 6: Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-3 text-xs font-bold text-on-brand shadow-sm transition hover:bg-brand-dark/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90 sm:text-sm"
              >
                {isSubmitting ? (
                  <span>{t("submitting")}</span>
                ) : (
                  <>
                    <Send size={15} />
                    <span>{t("submit")}</span>
                  </>
                )}
              </button>
            </form>

            {/* Direct Email Fallback (Industrial, sleek, non-competing) */}
            <div className="space-y-2 border-t border-border/70 pt-4">
              <div className="flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{t("orEmailDirect")}</span>
                  <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                    {careersEmail}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Mail size={13} className="text-muted-foreground" />
                        <span>{t("openEmailClient")}</span>
                        <ChevronDown size={11} className="text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-1.5 shadow-xl border border-border bg-card rounded-2xl">
                      <div className="px-2.5 py-1.5 border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t("chooseEmailService")}
                      </div>
                      <div className="p-1 space-y-0.5">
                        <a
                          href={gmailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 font-bold text-[11px]">
                            G
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs leading-none">{t("emailWebGmail")}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{t("emailInBrowser")}</p>
                          </div>
                          <ExternalLink size={12} className="text-muted-foreground" />
                        </a>

                        <a
                          href={outlookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-bold text-[11px]">
                            O
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs leading-none">{t("emailWebOutlook")}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{t("emailInBrowser")}</p>
                          </div>
                          <ExternalLink size={12} className="text-muted-foreground" />
                        </a>

                        <a
                          href={mailtoUrl}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent transition"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-500/10 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-300">
                            <Laptop size={12} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs leading-none">{t("emailDefaultApp")}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{t("emailDesktopApp")}</p>
                          </div>
                        </a>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <button
                    type="button"
                    onClick={copyEmail}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent"
                  >
                    {copyState === "copied" ? (
                      <Check size={13} className="text-emerald-500" aria-hidden="true" />
                    ) : (
                      <Copy size={13} aria-hidden="true" />
                    )}
                    <span>{copyState === "copied" ? t("copied") : t("copyEmail")}</span>
                  </button>
                </div>
              </div>
              <p role="status" aria-live="polite" className="text-[11px] text-muted-foreground">
                {copyState === "failed" ? t("copyFailed") : ""}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
