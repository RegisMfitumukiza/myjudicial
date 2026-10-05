"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Scale,
  ShieldCheck,
  Video,
  VideoOff,
  Phone,
  Building,
  UserCheck,
  Award,
  Lock,
  CheckCircle2,
  FileCheck,
  FileText,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Clock,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  Gavel,
  SlidersHorizontal,
  Banknote,
  FileSignature,
  NotebookPen,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface HowItWorksClientProps {
  initialTab?: "clients" | "advocates";
}

export default function HowItWorksClient({ initialTab = "clients" }: HowItWorksClientProps) {
  const t = useTranslations("howItWorksPage");
  const [activeTab, setActiveTab] = useState<"clients" | "advocates">(initialTab);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});

  // Interactive LiveKit consultation room demo controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(true);
  const [callEndedNotice, setCallEndedNotice] = useState(false);

  // Sync tab on browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "advocates" || tab === "lawyers") {
        setActiveTab("advocates");
      } else {
        setActiveTab("clients");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleTabChange = (tab: "clients" | "advocates") => {
    setActiveTab(tab);
    setOpenFaqs({});
    const newQuery = tab === "advocates" ? "?tab=advocates" : "";
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `${window.location.pathname}${newQuery}`);
    }

    // If the user has scrolled down into the page, smoothly align to the panel top
    const panel = document.getElementById("how-it-works-panel");
    if (panel) {
      if (typeof panel.getBoundingClientRect === "function") {
        const rect = panel.getBoundingClientRect();
        if (rect.top < 80 && typeof panel.scrollIntoView === "function") {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else if (typeof panel.scrollIntoView === "function") {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Keyboard navigation for tablist (WAI-ARIA APG compliance)
  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: "clients" | "advocates") => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const nextTab = currentTab === "clients" ? "advocates" : "clients";
      handleTabChange(nextTab);
      const nextBtn = document.getElementById(`tab-${nextTab}`);
      nextBtn?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      handleTabChange("clients");
      document.getElementById("tab-clients")?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      handleTabChange("advocates");
      document.getElementById("tab-advocates")?.focus();
    }
  };

  const toggleFaq = (num: number) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [num]: !prev[num],
    }));
  };

  const isAllExpanded = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].every((num) => !!openFaqs[num]);
  }, [openFaqs]);

  const toggleAllFaqs = () => {
    if (isAllExpanded) {
      setOpenFaqs({});
    } else {
      const all: Record<number, boolean> = {};
      [1, 2, 3, 4, 5, 6].forEach((n) => {
        all[n] = true;
      });
      setOpenFaqs(all);
    }
  };

  const handleEndCallDemo = () => {
    setCallEndedNotice(true);
    setTimeout(() => {
      setIsMuted(false);
      setIsVideoOff(false);
      setIsScreenSharing(true);
      setCallEndedNotice(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── 1. Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[0.04] via-background to-background py-8 min-[360px]:py-10 sm:py-20">
        {/* Subtle Ambient Glow matching Careers & About */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 -translate-x-1/2 transform-gpu overflow-hidden blur-3xl"
        >
          <div className="aspect-[1155/678] w-[40rem] sm:w-[50rem] bg-gradient-to-tr from-brand-dark/15 via-brand-dark/10 to-transparent dark:from-white/10 dark:via-white/5 opacity-70" />
        </div>

        <div className="mx-auto max-w-3xl px-3 sm:px-6 lg:px-8 text-center min-w-0">
          {/* Unified Platform Hero Badge */}
          <div className="mb-3.5 sm:mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <Award size={14} className="text-brand-dark dark:text-white shrink-0" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.16] sm:leading-[1.12] text-balance break-words">
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-3.5 sm:mt-4 max-w-2xl text-xs min-[360px]:text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-balance break-words">
            {t("hero.subtitle")}
          </p>
        </div>
      </section>

      {/* ── Sticky Perspective Tab Switcher Bar (Desktop & Mobile) ───── */}
      <nav
        aria-label={t("tabs.aria")}
        className="sticky top-[var(--header-offset,4rem)] z-30 transition-[top] duration-300 bg-background/95 backdrop-blur-md border-b border-border/80 py-2 sm:py-2.5 shadow-2xs"
      >
        <div className="mx-auto max-w-5xl px-2 sm:px-6 lg:px-8 flex justify-center min-w-0">
          <div
            role="tablist"
            aria-label={t("tabs.aria")}
            className="inline-flex items-center rounded-2xl border border-border/90 bg-muted/60 dark:bg-card/90 p-1 shadow-inner max-w-full"
          >
            <button
              role="tab"
              aria-selected={activeTab === "clients"}
              aria-controls="how-it-works-panel"
              id="tab-clients"
              onClick={() => handleTabChange("clients")}
              onKeyDown={(e) => handleTabKeyDown(e, "clients")}
              className={`rounded-xl px-2.5 min-[380px]:px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 min-h-[36px] sm:min-h-[40px] flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                activeTab === "clients"
                  ? "bg-brand-dark text-white dark:bg-white dark:text-black font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}
            >
              <span className="min-[380px]:hidden">{t("tabs.clientsShort")}</span>
              <span className="hidden min-[380px]:inline">{t("tabs.clients")}</span>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "advocates"}
              aria-controls="how-it-works-panel"
              id="tab-advocates"
              onClick={() => handleTabChange("advocates")}
              onKeyDown={(e) => handleTabKeyDown(e, "advocates")}
              className={`rounded-xl px-2.5 min-[380px]:px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 min-h-[36px] sm:min-h-[40px] flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                activeTab === "advocates"
                  ? "bg-brand-dark text-white dark:bg-white dark:text-black font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}
            >
              <span className="min-[380px]:hidden">{t("tabs.advocatesShort")}</span>
              <span className="hidden min-[380px]:inline">{t("tabs.advocates")}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── 2. Four-Stage Operational Journey ────────────────────────── */}
      <section
        id="how-it-works-panel"
        role="tabpanel"
        aria-labelledby={activeTab === "clients" ? "tab-clients" : "tab-advocates"}
        className="py-12 sm:py-18 border-b border-border bg-card scroll-mt-28 lg:scroll-mt-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <FileCheck size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span>
                {activeTab === "clients"
                  ? t("clientJourney.badge")
                  : t("advocateJourney.badge")}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {activeTab === "clients"
                ? t("clientJourney.title")
                : t("advocateJourney.title")}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground">
              {activeTab === "clients"
                ? t("clientJourney.subtitle")
                : t("advocateJourney.subtitle")}
            </p>
          </div>

          {/* 4 Step Progressive Grid with Desktop Connector Line */}
          <div className="relative">
            <div className="hidden lg:block absolute top-12 left-10 right-10 h-0.5 bg-border/80 -z-0" />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
              {[1, 2, 3, 4].map((stepNum) => {
                const stepKey = `step${stepNum}` as "step1" | "step2" | "step3" | "step4";
                const prefix = activeTab === "clients" ? "clientJourney" : "advocateJourney";

                // Icon mapping based on tab and step
                const Icon =
                  activeTab === "clients"
                    ? stepNum === 1
                      ? FileText
                      : stepNum === 2
                      ? Scale
                      : stepNum === 3
                      ? ShieldCheck
                      : Video
                    : stepNum === 1
                    ? UserCheck
                    : stepNum === 2
                    ? SlidersHorizontal
                    : stepNum === 3
                    ? FileCheck
                    : Banknote;

                return (
                  <div
                    key={stepNum}
                    className="group relative flex flex-col rounded-2xl border border-border bg-background p-6 shadow-xs transition-all hover:border-foreground/30 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                        <Icon size={20} />
                      </span>
                      <span className="flex h-7 px-2.5 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground font-mono">
                        {t(`${prefix}.${stepKey}.tag`)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground">
                      {t(`${prefix}.${stepKey}.title`)}
                    </h3>

                    <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {t(`${prefix}.${stepKey}.desc`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Consultation Modalities + Dual-Cockpit Room Mockup ──── */}
      <section className="py-12 sm:py-18 border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <Video size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span>{t("modalities.badge")}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {activeTab === "clients"
                ? t("modalities.clientTitle")
                : t("modalities.advocateTitle")}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground">
              {activeTab === "clients"
                ? t("modalities.clientSubtitle")
                : t("modalities.advocateSubtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Video */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                <Video size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {activeTab === "clients"
                  ? t("modalities.video.clientTitle")
                  : t("modalities.video.advocateTitle")}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                {activeTab === "clients"
                  ? t("modalities.video.clientDesc")
                  : t("modalities.video.advocateDesc")}
              </p>
              <div className="mt-auto border-t border-border pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.video.clientFeature1")
                      : t("modalities.video.advocateFeature1")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.video.clientFeature2")
                      : t("modalities.video.advocateFeature2")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.video.clientFeature3")
                      : t("modalities.video.advocateFeature3")}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Phone */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                <Phone size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {activeTab === "clients"
                  ? t("modalities.phone.clientTitle")
                  : t("modalities.phone.advocateTitle")}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                {activeTab === "clients"
                  ? t("modalities.phone.clientDesc")
                  : t("modalities.phone.advocateDesc")}
              </p>
              <div className="mt-auto border-t border-border pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.phone.clientFeature1")
                      : t("modalities.phone.advocateFeature1")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.phone.clientFeature2")
                      : t("modalities.phone.advocateFeature2")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.phone.clientFeature3")
                      : t("modalities.phone.advocateFeature3")}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. In-Person */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs sm:col-span-2 lg:col-span-1">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                <Building size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {activeTab === "clients"
                  ? t("modalities.inPerson.clientTitle")
                  : t("modalities.inPerson.advocateTitle")}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                {activeTab === "clients"
                  ? t("modalities.inPerson.clientDesc")
                  : t("modalities.inPerson.advocateDesc")}
              </p>
              <div className="mt-auto border-t border-border pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.inPerson.clientFeature1")
                      : t("modalities.inPerson.advocateFeature1")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.inPerson.clientFeature2")
                      : t("modalities.inPerson.advocateFeature2")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.inPerson.clientFeature3")
                      : t("modalities.inPerson.advocateFeature3")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Real-Life LiveKit Consultation Room Console (Interactive Cockpit) ── */}
          <div className="mt-10 sm:mt-12 rounded-2xl sm:rounded-3xl border border-neutral-800 bg-neutral-950 text-white shadow-2xl overflow-hidden w-full max-w-full">
            {/* 1. In-Room Header Bar */}
            <div className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-neutral-900/90 border-b border-neutral-800">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[11px] sm:text-xs font-mono font-bold text-white tracking-wider shrink-0">
                  {activeTab === "clients" ? t("modalities.clientRoom.badge") : t("modalities.advocateRoom.badge")}
                </span>
                <span className="hidden min-[380px]:inline text-[10px] text-neutral-400 font-mono truncate">
                  · {activeTab === "clients" ? t("modalities.clientRoom.subBadge") : t("modalities.advocateRoom.subBadge")}
                </span>
                <span className="hidden min-[480px]:inline-flex items-center gap-1 text-[11px] text-neutral-400 font-mono border-l border-neutral-800 pl-2.5 shrink-0">
                  <Lock size={11} className="text-emerald-400 shrink-0" />
                  <span>{t("modalities.dock.tls")}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 sm:px-3 py-1 text-white border border-white/10 text-[10px] sm:text-xs font-mono shrink-0">
                <Clock size={12} className="text-emerald-400 shrink-0" />
                <span>{activeTab === "clients" ? t("modalities.clientRoom.sessionTime") : t("modalities.advocateRoom.sessionTime")}</span>
              </div>
            </div>

            {/* 2. Video & Presentation Stage (Matches LiveKit dual grid) */}
            <div className="p-2.5 sm:p-4 bg-neutral-950">
              {activeTab === "clients" ? (
                /* ── A. Client Perspective: Remote Advocate Stream + Shared Evidence ── */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-4 w-full min-w-0">
                  {/* Left Tile: Advocate Live Stream */}
                  <div className="relative rounded-xl sm:rounded-2xl bg-neutral-900 border border-neutral-800 p-3.5 sm:p-5 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-radial from-neutral-800/60 to-neutral-950 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] sm:text-[11px] font-mono text-emerald-400 border border-white/10 backdrop-blur-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                        <span>{t("modalities.clientRoom.activeStream")}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                        {isMuted ? (
                          <>
                            <MicOff size={10} className="text-rose-400" />
                            <span className="text-rose-400">{t("micMuted")}</span>
                          </>
                        ) : (
                          <>
                            <Mic size={10} className="text-emerald-400" />
                            <span>{t("modalities.clientRoom.audioCodec")}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="relative z-10 my-auto py-3 text-center">
                      {isVideoOff ? (
                        <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 text-sm font-mono border-2 border-neutral-700 shadow-inner">
                          <VideoOff size={24} />
                        </div>
                      ) : (
                        <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-tr from-brand-dark to-slate-700 text-white text-xl sm:text-2xl font-bold border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
                          JH
                        </div>
                      )}
                    </div>

                    {/* Participant Badge: Stacked layout prevents truncation on small screens */}
                    <div className="relative z-10 rounded-xl bg-black/80 p-2 sm:p-2.5 backdrop-blur-md border border-white/10 w-full min-w-0">
                      <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {t("modalities.clientRoom.advocateName")}
                          </span>
                          <BadgeCheck size={14} className="text-sky-400 shrink-0" />
                        </div>
                        <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono text-neutral-300 shrink-0">
                          {t("modalities.clientRoom.barRoll")}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                        {t("modalities.clientRoom.advocateRole")}
                      </p>
                    </div>
                  </div>

                  {/* Right Tile: Real-Time Shared Screen (Evidence Review) */}
                  <div className="rounded-xl sm:rounded-2xl border border-neutral-800 bg-neutral-900/90 p-3 sm:p-4 flex flex-col justify-between shadow-inner w-full min-w-0">
                    <div>
                      {/* Document Header */}
                      <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1.5 border-b border-neutral-800 pb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-neutral-800 text-white shrink-0">
                            <FileText size={15} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                              {t("modalities.clientRoom.documentTitle")}
                            </h4>
                            <span className="text-[10px] text-neutral-400 font-mono block">
                              {t("modalities.clientRoom.documentType")}
                            </span>
                          </div>
                        </div>
                        <span className="self-start min-[380px]:self-center rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono shrink-0">
                          {t("modalities.clientRoom.documentUpi")}
                        </span>
                      </div>

                      {isScreenSharing ? (
                        <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 space-y-2.5 font-mono text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold pb-2 border-b border-neutral-800">
                            <ShieldCheck size={13} className="shrink-0" />
                            <span className="truncate">{t("modalities.clientRoom.verifiedDoc")}</span>
                          </div>

                          {/* Metadata Grid */}
                          <div className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-2 text-neutral-400 text-[11px] pt-0.5">
                            <div className="min-w-0">
                              <span className="block text-[9px] uppercase text-neutral-500">{t("modalities.clientRoom.metaProvince")}</span>
                              <span className="font-semibold text-neutral-200 block">{t("modalities.clientRoom.metaProvinceValue")}</span>
                            </div>
                            <div className="min-w-0">
                              <span className="block text-[9px] uppercase text-neutral-500">{t("modalities.clientRoom.metaZoning")}</span>
                              <span className="font-semibold text-neutral-200 block">{t("modalities.clientRoom.metaZoningValue")}</span>
                            </div>
                            <div className="min-w-0">
                              <span className="block text-[9px] uppercase text-neutral-500">{t("modalities.clientRoom.metaStatus")}</span>
                              <span className="font-semibold text-emerald-400 block">{t("modalities.clientRoom.metaStatusValue")}</span>
                            </div>
                            <div className="min-w-0">
                              <span className="block text-[9px] uppercase text-neutral-500">{t("modalities.clientRoom.metaShared")}</span>
                              <span className="font-semibold text-neutral-200 block">{t("modalities.clientRoom.metaSharedValue")}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 p-8 text-center text-xs font-mono text-neutral-500 rounded-lg border border-dashed border-neutral-800">
                          <Monitor size={20} className="mx-auto mb-2 text-neutral-600" />
                          <span>{t("screenOff")}</span>
                        </div>
                      )}
                    </div>

                    {/* Local Participant Inset ("You") */}
                    <div className="mt-3 pt-2.5 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-neutral-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${isMuted ? "bg-rose-400" : "bg-emerald-400"}`} />
                        <span className="text-neutral-200 truncate">
                          {isMuted ? `${t("modalities.clientRoom.youStatus")} (${t("micMuted")})` : t("modalities.clientRoom.youStatus")}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 shrink-0">{t("modalities.clientRoom.engine")}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── B. Advocate Perspective: Client Stream + Case Dossier ── */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-4 w-full min-w-0">
                  {/* Left Tile: Client Video Stream */}
                  <div className="relative rounded-xl sm:rounded-2xl bg-neutral-900 border border-neutral-800 p-3.5 sm:p-5 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-radial from-neutral-800/60 to-neutral-950 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] sm:text-[11px] font-mono text-blue-400 border border-white/10 backdrop-blur-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping shrink-0" />
                        <span>{t("modalities.advocateRoom.activeStream")}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                        {isMuted ? (
                          <>
                            <MicOff size={10} className="text-rose-400" />
                            <span className="text-rose-400">{t("micMuted")}</span>
                          </>
                        ) : (
                          <>
                            <Mic size={10} className="text-blue-400" />
                            <span>{t("modalities.advocateRoom.audioCodec")}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="relative z-10 my-auto py-3 text-center">
                      {isVideoOff ? (
                        <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 text-sm font-mono border-2 border-neutral-700 shadow-inner">
                          <VideoOff size={24} />
                        </div>
                      ) : (
                        <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white text-xl sm:text-2xl font-bold border-2 border-blue-500 shadow-lg shadow-blue-500/20">
                          KE
                        </div>
                      )}
                    </div>

                    {/* Participant Badge */}
                    <div className="relative z-10 rounded-xl bg-black/80 p-2 sm:p-2.5 backdrop-blur-md border border-white/10 w-full min-w-0">
                      <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {t("modalities.advocateRoom.clientName")}
                        </span>
                        <span className="rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono shrink-0">
                          {t("modalities.advocateRoom.clientMatter")}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 truncate">
                        {t("modalities.advocateRoom.clientRole")}
                      </p>
                    </div>
                  </div>

                  {/* Right Tile: Intake Dossier & Private Notes */}
                  <div className="rounded-xl sm:rounded-2xl border border-neutral-800 bg-neutral-900/90 p-3 sm:p-4 flex flex-col justify-between shadow-inner w-full min-w-0">
                    <div>
                      <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-1.5 border-b border-neutral-800 pb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-neutral-800 text-white shrink-0">
                            <NotebookPen size={15} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                              {t("modalities.advocateRoom.dossierTitle")}
                            </h4>
                            <span className="text-[10px] text-neutral-400 font-mono block">
                              {t("modalities.advocateRoom.dossierType")}
                            </span>
                          </div>
                        </div>
                        <span className="self-start min-[380px]:self-center rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 text-[10px] font-mono shrink-0">
                          {t("modalities.advocateRoom.dossierUpi")}
                        </span>
                      </div>

                      <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950/70 p-3 space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between text-[11px] border-b border-neutral-800 pb-1.5">
                          <span className="text-neutral-400 font-semibold">{t("modalities.advocateRoom.notesTitle")}</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                            <ShieldCheck size={12} />
                            <span>{t("modalities.advocateRoom.verifiedBadge")}</span>
                          </span>
                        </div>

                        <p className="text-neutral-300 text-[11px] leading-relaxed break-words bg-neutral-900/80 p-2 rounded-md border border-neutral-800">
                          {t("modalities.advocateRoom.clientSummary")}
                        </p>

                        <div className="p-2 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] sm:text-[11px] text-blue-200 break-words">
                          <span className="font-bold text-blue-400 block mb-0.5">{t("modalities.advocateRoom.diagnosisLabel")}</span>
                          {t("modalities.advocateRoom.diagnosisText")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-neutral-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${isMuted ? "bg-rose-400" : "bg-blue-400"}`} />
                        <span className="text-neutral-200 truncate">
                          {isMuted ? `${t("modalities.advocateRoom.counselStatus")} (${t("micMuted")})` : t("modalities.advocateRoom.counselStatus")}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 shrink-0">{t("modalities.advocateRoom.engine")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Authentic Call Control Dock (Interactive Cockpit) */}
            <div className="border-t border-neutral-800 bg-neutral-900/95 px-3 sm:px-6 py-2.5 sm:py-3.5">
              <div className="flex items-center justify-between gap-2 max-w-full">
                {/* Left Info: Hidden on small mobile, visible on >=520px */}
                <div className="hidden min-[520px]:block text-left min-w-0">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
                    {callEndedNotice ? t("resetCall") : t("modalities.dock.liveLabel")}
                  </p>
                  <p className="text-xs font-semibold text-white truncate">
                    {activeTab === "clients" ? t("modalities.clientRoom.callTitle") : t("modalities.advocateRoom.callTitle")}
                  </p>
                </div>

                {/* Center Call Control Buttons with live toggle feedback */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 mx-auto min-[520px]:mx-0">
                  {/* Mic Button */}
                  <button
                    type="button"
                    onClick={() => setIsMuted((prev) => !prev)}
                    aria-label={isMuted ? t("micMuted") : t("controls.micLabel")}
                    className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full transition shadow-sm border border-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isMuted
                        ? "bg-rose-600 hover:bg-rose-500 text-white"
                        : "bg-neutral-800 hover:bg-neutral-700 text-white"
                    }`}
                    title={isMuted ? t("micMuted") : t("controls.micTitle")}
                  >
                    {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
                  </button>

                  {/* Video Button */}
                  <button
                    type="button"
                    onClick={() => setIsVideoOff((prev) => !prev)}
                    aria-label={isVideoOff ? t("camOff") : t("controls.camLabel")}
                    className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full transition shadow-sm border border-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isVideoOff
                        ? "bg-neutral-700 hover:bg-neutral-600 text-neutral-400"
                        : "bg-neutral-800 hover:bg-neutral-700 text-white"
                    }`}
                    title={isVideoOff ? t("camOff") : t("controls.camTitle")}
                  >
                    {isVideoOff ? <VideoOff size={17} /> : <Video size={17} />}
                  </button>

                  {/* Screen Share Button */}
                  <button
                    type="button"
                    onClick={() => setIsScreenSharing((prev) => !prev)}
                    aria-label={t("controls.screenLabel")}
                    className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full transition shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isScreenSharing
                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                        : "bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-white/10"
                    }`}
                    title={isScreenSharing ? t("controls.screenTitle") : t("screenOff")}
                  >
                    <Monitor size={17} />
                  </button>

                  {/* End Consultation Button */}
                  <button
                    type="button"
                    onClick={handleEndCallDemo}
                    aria-label={t("controls.endLabel")}
                    className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white transition shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    title={t("controls.endTitle")}
                  >
                    <PhoneOff size={17} />
                  </button>
                </div>

                {/* Right Escrow & Protection Badge */}
                <div className="hidden min-[520px]:flex items-center gap-1.5 text-xs text-emerald-400 font-mono shrink-0">
                  <ShieldCheck size={15} />
                  <span className="font-semibold">{t("modalities.dock.escrow")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Case Continuum & Courtroom Representation Bridge ──────── */}
      <section className="py-12 sm:py-18 border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <Scale size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span>{t("continuity.badge")}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("continuity.title")}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t("continuity.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((stageNum) => {
              const stageKey = `step${stageNum}` as "step1" | "step2" | "step3";
              const StageIcon = stageNum === 1 ? Scale : stageNum === 2 ? FileSignature : Gavel;

              return (
                <div
                  key={stageNum}
                  className="rounded-2xl border border-border bg-background p-6 shadow-xs relative flex flex-col justify-between hover:border-foreground/30 transition-all hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                        <StageIcon size={22} />
                      </div>
                      <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-bold font-mono text-muted-foreground">
                        {t(`continuity.${stageKey}.tag`)}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground">
                      {t(`continuity.${stageKey}.title`)}
                    </h3>

                    <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {t(`continuity.${stageKey}.desc`)}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{t(`continuity.check${stageNum}`)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Persona-Specific Operational FAQs (Accordion) ─────────── */}
      <section className="py-12 sm:py-18 bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <HelpCircle size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span>{t("faqs.badge")}</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {activeTab === "clients"
                ? t("faqs.clientTitle")
                : t("faqs.advocateTitle")}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground">
              {activeTab === "clients"
                ? t("faqs.clientSubtitle")
                : t("faqs.advocateSubtitle")}
            </p>
          </div>

          {/* Header Action: Expand All / Collapse All */}
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <span className="text-xs font-semibold text-muted-foreground">
              {activeTab === "clients" ? t("tabs.clients") : t("tabs.advocates")}
            </span>
            <button
              type="button"
              onClick={toggleAllFaqs}
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
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((faqNum) => {
              const prefix = activeTab === "clients" ? "client" : "advocate";
              const qKey = `${prefix}Q${faqNum}` as
                | "clientQ1"
                | "clientQ2"
                | "clientQ3"
                | "clientQ4"
                | "clientQ5"
                | "clientQ6"
                | "advocateQ1"
                | "advocateQ2"
                | "advocateQ3"
                | "advocateQ4"
                | "advocateQ5"
                | "advocateQ6";
              const aKey = `${prefix}A${faqNum}` as
                | "clientA1"
                | "clientA2"
                | "clientA3"
                | "clientA4"
                | "clientA5"
                | "clientA6"
                | "advocateA1"
                | "advocateA2"
                | "advocateA3"
                | "advocateA4"
                | "advocateA5"
                | "advocateA6";

              const isOpen = !!openFaqs[faqNum];

              return (
                <div
                  key={`${activeTab}-${faqNum}`}
                  className={`rounded-2xl border transition-all ${
                    isOpen
                      ? "border-border bg-card shadow-xs ring-1 ring-border"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <button
                    id={`faq-trigger-${activeTab}-${faqNum}`}
                    type="button"
                    onClick={() => toggleFaq(faqNum)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${activeTab}-${faqNum}`}
                  >
                    <span className="pr-4">{t(`faqs.${qKey}`)}</span>
                    <ChevronDown
                      size={18}
                      className={`text-muted-foreground transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-foreground" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div
                      id={`faq-answer-${activeTab}-${faqNum}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${activeTab}-${faqNum}`}
                      className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3"
                    >
                      {t(`faqs.${aKey}`)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
