"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Scale,
  ShieldCheck,
  Video,
  Phone,
  Building,
  UserCheck,
  Award,
  Lock,
  CheckCircle2,
  FileCheck,
  FileText,
  ChevronDown,
  BadgeCheck,
  Clock,
  Mic,
  Monitor,
  PhoneOff,
  Gavel,
  SlidersHorizontal,
  Banknote,
  FileSignature,
  FileCode,
  NotebookPen,
  Send,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function HowItWorksClient() {
  const t = useTranslations("howItWorksPage");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const isAdvocateTab = tabParam === "advocates" || tabParam === "lawyers";

  const [activeTab, setActiveTab] = useState<"clients" | "advocates">(
    isAdvocateTab ? "advocates" : "clients"
  );

  const [openFaq, setOpenFaq] = useState<number | null>(1);

  useEffect(() => {
    if (tabParam === "advocates" || tabParam === "lawyers") {
      setActiveTab("advocates");
    } else if (tabParam === "clients") {
      setActiveTab("clients");
    }
  }, [tabParam]);

  const handleTabChange = (tab: "clients" | "advocates") => {
    setActiveTab(tab);
    setOpenFaq(1); // Reset to first FAQ for the selected persona
    const newQuery = tab === "advocates" ? "?tab=advocates" : "";
    window.history.replaceState(null, "", `${window.location.pathname}${newQuery}`);
  };

  const toggleFaq = (num: number) => {
    setOpenFaq((prev) => (prev === num ? null : num));
  };

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── 1. Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[0.04] via-background to-background py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          {/* Unified Platform Hero Badge */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <Award size={14} className="text-brand-dark dark:text-white shrink-0" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("hero.title")}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* Perspective Tab Switcher */}
          <div
            role="tablist"
            aria-label="Perspective selection"
            className="mt-10 inline-flex rounded-2xl border border-border bg-card p-1.5 shadow-xs"
          >
            <button
              role="tab"
              aria-selected={activeTab === "clients"}
              aria-controls="how-it-works-panel"
              id="tab-clients"
              onClick={() => handleTabChange("clients")}
              className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === "clients"
                  ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {t("tabs.clients")}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "advocates"}
              aria-controls="how-it-works-panel"
              id="tab-advocates"
              onClick={() => handleTabChange("advocates")}
              className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === "advocates"
                  ? "bg-brand-dark text-white dark:bg-white dark:text-black shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {t("tabs.advocates")}
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. Four-Stage Operational Journey ────────────────────────── */}
      <section
        id="how-it-works-panel"
        role="tabpanel"
        aria-labelledby={activeTab === "clients" ? "tab-clients" : "tab-advocates"}
        className="py-16 sm:py-24 border-b border-border bg-card"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {activeTab === "clients"
                ? t("clientJourney.badge")
                : t("advocateJourney.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {activeTab === "clients"
                ? t("clientJourney.title")
                : t("advocateJourney.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
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
                    className="group relative flex flex-col rounded-2xl border border-border bg-background p-6 shadow-xs transition-all hover:border-border/90"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-foreground transition-colors group-hover:bg-brand-dark group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
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
      <section className="py-16 sm:py-24 border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {t("modalities.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {activeTab === "clients"
                ? t("modalities.clientTitle")
                : t("modalities.advocateTitle")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {activeTab === "clients"
                ? t("modalities.clientSubtitle")
                : t("modalities.advocateSubtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Video */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-foreground">
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
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.video.clientFeature1")
                      : t("modalities.video.advocateFeature1")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.video.clientFeature2")
                      : t("modalities.video.advocateFeature2")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
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
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-foreground">
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
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.phone.clientFeature1")
                      : t("modalities.phone.advocateFeature1")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.phone.clientFeature2")
                      : t("modalities.phone.advocateFeature2")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
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
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-foreground">
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
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.inPerson.clientFeature1")
                      : t("modalities.inPerson.advocateFeature1")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.inPerson.clientFeature2")
                      : t("modalities.inPerson.advocateFeature2")}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>
                    {activeTab === "clients"
                      ? t("modalities.inPerson.clientFeature3")
                      : t("modalities.inPerson.advocateFeature3")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Dynamic Dual-Cockpit LiveKit Consultation Room Mockup ── */}
          <div className="mt-14 rounded-3xl border-2 border-border/80 bg-card p-4 sm:p-7 shadow-xl">
            {activeTab === "clients" ? (
              /* ── A. Citizen / Client View Mockup ────────────────────── */
              <div>
                {/* Mockup Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-wider">
                      {t("modalities.clientRoom.liveBadge")}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground border-l border-border pl-3 font-mono">
                      <Lock size={12} className="text-emerald-500" />
                      {t("modalities.clientRoom.encryptionBadge")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-accent/60 px-3 py-1 rounded-lg border border-border">
                    <Clock size={13} className="text-foreground" />
                    <span>{t("modalities.clientRoom.sessionTime")}</span>
                  </div>
                </div>

                {/* Mockup Split Stage: Advocate Video (Left) + Land Extract (Right) */}
                <div className="mt-5 grid gap-5 lg:grid-cols-12">
                  {/* Left 5 Cols: Advocate Video Tile */}
                  <div className="lg:col-span-5 relative rounded-2xl bg-neutral-900 text-white p-5 aspect-video sm:aspect-4/3 flex flex-col justify-between overflow-hidden shadow-inner border border-neutral-800">
                    <div className="absolute inset-0 bg-radial from-neutral-800/80 to-neutral-950 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-mono text-emerald-400 backdrop-blur-xs border border-white/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Active Audio Stream</span>
                      </div>
                    </div>

                    <div className="relative z-10 my-auto text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-tr from-brand-dark to-slate-700 text-white text-2xl font-bold border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
                        JH
                      </div>
                    </div>

                    <div className="relative z-10 rounded-xl bg-black/70 p-3 backdrop-blur-md border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-white">
                              {t("modalities.clientRoom.advocateName")}
                            </span>
                            <BadgeCheck size={14} className="text-sky-400" />
                          </div>
                          <span className="text-[11px] text-neutral-400 block font-mono">
                            {t("modalities.clientRoom.advocateRole")}
                          </span>
                        </div>
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-mono text-neutral-300">
                          {t("modalities.clientRoom.barRoll")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right 7 Cols: Live Document Viewer (UPI Land Extract) */}
                  <div className="lg:col-span-7 rounded-2xl border border-border bg-background p-4 sm:p-5 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-foreground">
                            <FileText size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-foreground">
                              {t("modalities.clientRoom.documentTitle")}
                            </h4>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {t("modalities.clientRoom.documentType")}
                            </span>
                          </div>
                        </div>
                        <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                          {t("modalities.clientRoom.documentUpi")}
                        </span>
                      </div>

                      <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3 font-mono text-xs">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold pb-2 border-b border-border/40">
                          <ShieldCheck size={14} />
                          <span>{t("modalities.clientRoom.verifiedDoc")}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                          <div>
                            <span className="block text-[10px] uppercase text-muted-foreground/70">Province / District</span>
                            <span className="font-semibold text-foreground">Kigali City / Gasabo</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase text-muted-foreground/70">Zoning Code</span>
                            <span className="font-semibold text-foreground">R1A - Residential</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase text-muted-foreground/70">Title Status</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Clean / No Encumbrances</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase text-muted-foreground/70">Shared By</span>
                            <span className="font-semibold text-foreground">Advocate (Live Screen Review)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs border border-border">
                          <Mic size={16} />
                        </span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs border border-border">
                          <Video size={16} />
                        </span>
                        <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-accent text-foreground text-xs font-semibold shadow-2xs border border-border">
                          <Monitor size={14} className="text-emerald-500" />
                          <span>{t("modalities.clientRoom.screenShareTooltip")}</span>
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
                        <PhoneOff size={14} />
                        <span>{t("modalities.clientRoom.leaveTooltip")}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── B. Advocate Practice Cockpit Mockup ────────────────── */
              <div>
                {/* Mockup Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="rounded-md bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono tracking-wider">
                      {t("modalities.advocateRoom.liveBadge")}
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground border-l border-border pl-3 font-mono">
                      <Lock size={12} className="text-blue-500" />
                      {t("modalities.advocateRoom.encryptionBadge")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-accent/60 px-3 py-1 rounded-lg border border-border">
                    <Clock size={13} className="text-foreground" />
                    <span>{t("modalities.advocateRoom.sessionTime")}</span>
                  </div>
                </div>

                {/* Mockup Split Stage: Client Stream (Left) + Intake Dossier (Right) */}
                <div className="mt-5 grid gap-5 lg:grid-cols-12">
                  {/* Left 5 Cols: Client Video Stream & Active Matter */}
                  <div className="lg:col-span-5 relative rounded-2xl bg-neutral-900 text-white p-5 aspect-video sm:aspect-4/3 flex flex-col justify-between overflow-hidden shadow-inner border border-neutral-800">
                    <div className="absolute inset-0 bg-radial from-neutral-800/80 to-neutral-950 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-mono text-blue-400 backdrop-blur-xs border border-white/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                        <span>Client Connected · Audio Active</span>
                      </div>
                    </div>

                    <div className="relative z-10 my-auto text-center">
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-tr from-slate-700 to-slate-900 text-white text-2xl font-bold border-2 border-blue-500 shadow-lg shadow-blue-500/20">
                        KE
                      </div>
                    </div>

                    <div className="relative z-10 rounded-xl bg-black/70 p-3 backdrop-blur-md border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-white block">
                            {t("modalities.advocateRoom.clientName")}
                          </span>
                          <span className="text-[11px] text-neutral-400 block font-mono">
                            {t("modalities.advocateRoom.clientRole")}
                          </span>
                        </div>
                        <span className="rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 text-[10px] font-mono">
                          {t("modalities.advocateRoom.clientMatter")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right 7 Cols: Advocate Intake Dossier & Private Case Notes */}
                  <div className="lg:col-span-7 rounded-2xl border border-border bg-background p-4 sm:p-5 flex flex-col justify-between shadow-xs">
                    <div>
                      {/* Dossier Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-foreground">
                            <NotebookPen size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-foreground">
                              {t("modalities.advocateRoom.dossierTitle")}
                            </h4>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {t("modalities.advocateRoom.dossierType")}
                            </span>
                          </div>
                        </div>
                        <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                          {t("modalities.advocateRoom.dossierUpi")}
                        </span>
                      </div>

                      {/* Dossier Content + Confidential Notes Snippet */}
                      <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between text-[11px] border-b border-border/40 pb-2">
                          <span className="text-muted-foreground font-semibold">
                            {t("modalities.advocateRoom.privateNotesTab")}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <ShieldCheck size={13} />
                            {t("modalities.advocateRoom.verifiedDoc")}
                          </span>
                        </div>

                        <p className="text-muted-foreground leading-relaxed text-[11px] bg-card p-3 rounded-lg border border-border/50">
                          {t("modalities.advocateRoom.clientSummary")}
                        </p>

                        <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[11px] text-foreground">
                          <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">
                            Advocate Diagnostic Note:
                          </span>
                          Cross-checked UPI cadastral records. Boundary contestation requires surveyor verification before filing formal writ at Gasabo Primary Court.
                        </div>
                      </div>
                    </div>

                    {/* Advocate Action Bar (Controls + Complete Session Escrow Trigger) */}
                    <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs border border-border">
                          <Mic size={16} />
                        </span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs border border-border">
                          <Video size={16} />
                        </span>
                        <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-accent text-foreground text-xs font-semibold shadow-2xs border border-border">
                          <Monitor size={14} className="text-blue-500" />
                          <span>{t("modalities.advocateRoom.screenShareTooltip")}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <ShieldCheck size={14} />
                        <span>{t("modalities.advocateRoom.payoutAction")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. Case Continuum & Courtroom Representation Bridge ──────── */}
      <section className="py-16 sm:py-24 border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {t("continuity.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("continuity.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
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
                  className="rounded-2xl border border-border bg-background p-6 shadow-xs relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-foreground">
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
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>
                      {stageNum === 1
                        ? "Case Merit & Risk Diagnosis"
                        : stageNum === 2
                        ? "Official Mandate & Procuration"
                        : "IECMS Court Filings & Hearings"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Persona-Specific Operational FAQs (Accordion) ─────────── */}
      <section className="py-16 sm:py-24 border-b border-border bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {t("faqs.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {activeTab === "clients"
                ? t("faqs.clientTitle")
                : t("faqs.advocateTitle")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {activeTab === "clients"
                ? t("faqs.clientSubtitle")
                : t("faqs.advocateSubtitle")}
            </p>
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
                | "clientA1"
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

              const isOpen = openFaq === faqNum;

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
                    onClick={() => toggleFaq(faqNum)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-foreground focus:outline-none"
                    aria-expanded={isOpen}
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
                    <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                      {t(`faqs.${aKey}`)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. Bottom Action CTA ────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border bg-gradient-to-b from-card/80 to-background py-16 sm:py-20 text-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            {activeTab === "clients"
              ? t("cta.clientTitle")
              : t("cta.advocateTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            {activeTab === "clients"
              ? t("cta.clientSubtitle")
              : t("cta.advocateSubtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {activeTab === "clients" ? (
              <>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-7 py-3 text-sm font-bold shadow-md transition-all active:scale-[0.98]"
                >
                  {t("cta.findLawyer")} <ArrowRight size={16} />
                </Link>
                <Link
                  href="/sign-up?role=EXPERT"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-accent px-7 py-3 text-sm font-semibold text-foreground transition shadow-2xs"
                >
                  {t("cta.joinAsAdvocate")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-up?role=EXPERT"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-7 py-3 text-sm font-bold shadow-md transition-all active:scale-[0.98]"
                >
                  {t("cta.joinAsAdvocate")} <ArrowRight size={16} />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-accent px-7 py-3 text-sm font-semibold text-foreground transition shadow-2xs"
                >
                  {t("cta.findLawyer")}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
