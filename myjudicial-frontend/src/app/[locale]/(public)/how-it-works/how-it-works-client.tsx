"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Search,
  Scale,
  CalendarCheck,
  ShieldCheck,
  Video,
  Phone,
  Building,
  UserCheck,
  Award,
  Lock,
  CheckCircle2,
  FileCheck,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function HowItWorksClient() {
  const t = useTranslations("howItWorksPage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const isAdvocateTab = tabParam === "advocates" || tabParam === "lawyers";

  const [activeTab, setActiveTab] = useState<"clients" | "advocates">(
    isAdvocateTab ? "advocates" : "clients"
  );

  useEffect(() => {
    if (tabParam === "advocates" || tabParam === "lawyers") {
      setActiveTab("advocates");
    } else if (tabParam === "clients") {
      setActiveTab("clients");
    }
  }, [tabParam]);

  const handleTabChange = (tab: "clients" | "advocates") => {
    setActiveTab(tab);
    const newQuery = tab === "advocates" ? "?tab=advocates" : "";
    window.history.replaceState(null, "", `${window.location.pathname}${newQuery}`);
  };

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── 1. Hero Section ────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-dark/[0.04] via-background to-background py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-dark/15 bg-brand-dark/5 dark:border-white/15 dark:bg-white/5 px-3.5 py-1 text-xs font-semibold text-brand-dark dark:text-brand-gold">
            <Award size={14} className="text-emerald-600 dark:text-emerald-400" />
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
            className="mt-10 inline-flex rounded-2xl border border-border bg-card p-1.5 shadow-sm"
          >
            <button
              role="tab"
              aria-selected={activeTab === "clients"}
              aria-controls="how-it-works-panel"
              id="tab-clients"
              onClick={() => handleTabChange("clients")}
              className={`rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === "clients"
                  ? "bg-brand-dark text-on-brand dark:bg-white dark:text-brand-dark shadow-sm"
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
                  ? "bg-brand-dark text-on-brand dark:bg-white dark:text-brand-dark shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {t("tabs.advocates")}
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. Journey Stages (Client or Advocate) ──────────────────── */}
      <section
        id="how-it-works-panel"
        role="tabpanel"
        aria-labelledby={activeTab === "clients" ? "tab-clients" : "tab-advocates"}
        className="py-16 sm:py-24 border-b border-border bg-card"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
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

          {/* 4 Step Progressive Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((stepNum) => {
              const stepKey = `step${stepNum}` as "step1" | "step2" | "step3" | "step4";
              const prefix = activeTab === "clients" ? "clientJourney" : "advocateJourney";

              // Icon mapping based on tab and step
              const Icon =
                activeTab === "clients"
                  ? stepNum === 1
                    ? Search
                    : stepNum === 2
                    ? Scale
                    : stepNum === 3
                    ? CalendarCheck
                    : Video
                  : stepNum === 1
                  ? FileCheck
                  : stepNum === 2
                  ? UserCheck
                  : stepNum === 3
                  ? CalendarCheck
                  : Lock;

              return (
                <div
                  key={stepNum}
                  className="group relative flex flex-col rounded-2xl border border-border bg-background p-6 shadow-sm transition-all hover:border-brand-dark/30 hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white transition-colors group-hover:bg-brand-dark group-hover:text-on-brand dark:group-hover:bg-white dark:group-hover:text-brand-dark">
                      <Icon size={20} />
                    </span>
                    <span className="text-xs font-bold text-muted-foreground font-mono">
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
      </section>

      {/* ── 3. The 3 Consultation Modalities ────────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
              {t("modalities.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("modalities.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("modalities.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* 1. Video */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Video size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("modalities.video.title")}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                {t("modalities.video.desc")}
              </p>
              <div className="mt-auto border-t border-border pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t("modalities.video.feature1")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t("modalities.video.feature2")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t("modalities.video.feature3")}</span>
                </div>
              </div>
            </div>

            {/* 2. Phone */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Phone size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("modalities.phone.title")}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                {t("modalities.phone.desc")}
              </p>
              <div className="mt-auto border-t border-border pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t("modalities.phone.feature1")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t("modalities.phone.feature2")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t("modalities.phone.feature3")}</span>
                </div>
              </div>
            </div>

            {/* 3. In-Person */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                <Building size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("modalities.inPerson.title")}
              </h3>
              <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                {t("modalities.inPerson.desc")}
              </p>
              <div className="mt-auto border-t border-border pt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t("modalities.inPerson.feature1")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t("modalities.inPerson.feature2")}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t("modalities.inPerson.feature3")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. The Rwanda Bar Trust Framework ───────────────────────── */}
      <section className="py-16 sm:py-24 border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark dark:text-brand-gold">
              {t("trustFramework.badge")}
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("trustFramework.title")}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              {t("trustFramework.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((num) => {
              const itemKey = `item${num}` as "item1" | "item2" | "item3";
              const ItemIcon = num === 1 ? ShieldCheck : num === 2 ? Lock : Users;

              return (
                <div
                  key={num}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white">
                    <ItemIcon size={22} />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {t(`trustFramework.${itemKey}.title`)}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {t(`trustFramework.${itemKey}.desc`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Bottom Action CTA ────────────────────────────────────── */}
      <section className="bg-brand-dark py-16 sm:py-20 text-on-brand">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-on-brand/80 leading-relaxed">
            {t("cta.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {activeTab === "clients" ? (
              <>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-brand-dark shadow-lg transition hover:bg-white/90"
                >
                  {t("cta.findLawyer")} <ArrowRight size={16} />
                </Link>
                <Link
                  href="/sign-up?role=EXPERT"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-7 py-3 text-sm font-semibold text-on-brand transition hover:bg-white/10"
                >
                  {t("cta.joinAsAdvocate")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/sign-up?role=EXPERT"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-brand-dark shadow-lg transition hover:bg-white/90"
                >
                  {t("cta.joinAsAdvocate")} <ArrowRight size={16} />
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-7 py-3 text-sm font-semibold text-on-brand transition hover:bg-white/10"
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
