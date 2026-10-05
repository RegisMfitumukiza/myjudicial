"use client";

import type { ComponentType } from "react";
import { Link } from "@/i18n/routing";
import {
  ArrowRight,
  ShieldCheck,
  Scale,
  Users,
  Landmark,
  Wallet,
  Building2,
  Target,
  Compass,
  Lock,
  MapPin,
  Heart,
  Award,
  Globe,
  Sparkles,
  FileCheck2,
  UserCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePublicStats } from "@/lib/api/landing";
import { usePlatformSettings } from "@/lib/api/settings";

const VALUE_ICON_MAP: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  Users,
  Scale,
  ShieldCheck,
  Lock,
  Heart,
  Target,
  Award,
  Globe,
  Sparkles,
  Clock,
};

/* ── Static data arrays (replaces copy-pasted repeated JSX) ───────────── */

const VERIFICATION_STAGES = [
  { key: "stage1", Icon: FileCheck2 },
  { key: "stage2", Icon: UserCheck },
  { key: "stage3", Icon: Wallet },
  { key: "stage4", Icon: Lock },
] as const;

const GOVERNANCE_RULES = [
  { key: "rule1", Icon: CheckCircle2 },
  { key: "rule2", Icon: Wallet },
  { key: "rule3", Icon: Scale },
] as const;

const ECOSYSTEM_CARDS = [
  { key: "legal", Icon: Landmark },
  { key: "financial", Icon: Wallet },
  { key: "regulatory", Icon: Building2 },
] as const;

/* ── Skeleton shimmer used during API loading ──────────────────────────── */
function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-2xs flex flex-col items-center gap-2 animate-pulse min-w-0">
      <div className="mx-auto h-9 w-9 rounded-xl bg-muted" />
      <div className="h-4 w-24 rounded-md bg-muted" />
      <div className="h-3 w-20 rounded-md bg-muted/70" />
    </div>
  );
}

/* ── Section heading badge pill ────────────────────────────────────────── */
function SectionBadge({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-semibold text-foreground">
      <Icon size={14} className="text-brand-dark dark:text-white shrink-0" />
      <span>{label}</span>
    </div>
  );
}

export default function AboutClient() {
  const t = useTranslations("about");
  const { data: stats, isLoading: statsLoading } = usePublicStats();
  const { settings, isLoading: settingsLoading } = usePlatformSettings();

  const activeHeroBadge = settings?.aboutHeroBadge?.trim() || t("hero.badge");
  const activeHeroTitle = settings?.aboutHeroTitle?.trim() || t("hero.title");
  const activeHeroSubtitle = settings?.aboutHeroSubtitle?.trim() || t("hero.subtitle");
  const activeMission = settings?.aboutMission?.trim() || t("mission.text");
  const activeVision = settings?.aboutVision?.trim() || t("mission.visionText");
  const customStory = settings?.aboutStory?.trim();

  const coreValues =
    settings?.aboutCoreValues && settings.aboutCoreValues.length > 0
      ? settings.aboutCoreValues
      : [
          {
            id: "access",
            title: t("values.access.title"),
            description: t("values.access.text"),
            icon: "Users",
          },
          {
            id: "transparency",
            title: t("values.transparency.title"),
            description: t("values.transparency.text"),
            icon: "Scale",
          },
          {
            id: "trust",
            title: t("values.trust.title"),
            description: t("values.trust.text"),
            icon: "ShieldCheck",
          },
          {
            id: "compliance",
            title: t("values.compliance.title"),
            description: t("values.compliance.text"),
            icon: "Lock",
          },
        ];

  const milestones =
    settings?.aboutMilestones && settings.aboutMilestones.length > 0
      ? settings.aboutMilestones
      : [
          {
            id: "m-2024",
            year: t("milestones.item1Year"),
            title: t("milestones.item1Title"),
            description: t("milestones.item1Desc"),
          },
          {
            id: "m-2025",
            year: t("milestones.item2Year"),
            title: t("milestones.item2Title"),
            description: t("milestones.item2Desc"),
          },
          {
            id: "m-2026",
            year: t("milestones.item3Year"),
            title: t("milestones.item3Title"),
            description: t("milestones.item3Desc"),
          },
        ];

  // Dynamic layout adapter preventing orphan cards across different item counts
  const milestoneGridClass =
    milestones.length === 1
      ? "max-w-xl mx-auto grid grid-cols-1"
      : milestones.length === 2
      ? "max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2"
      : milestones.length === 4
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  const valuesGridClass =
    coreValues.length === 1
      ? "max-w-md mx-auto grid grid-cols-1"
      : coreValues.length === 2
      ? "max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2"
      : coreValues.length === 3
      ? "max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : coreValues.length === 4
      ? "grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4"
      : "grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3";

  return (
    <main className="flex flex-col bg-background text-foreground min-h-screen">
      {/* ── Section 1: Hero & Operational Trust Metrics ─────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-10 sm:py-16 lg:py-20 border-b border-border">
        {/* Decorative glow — consistent with careers hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-brand-dark/10 blur-3xl dark:bg-white/5"
        />

        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3.5 sm:mb-5 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
              <Building2 size={14} className="text-brand-dark dark:text-white shrink-0" />
              <span className="truncate break-words">{activeHeroBadge}</span>
            </div>

            <h1 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.16] sm:leading-[1.12] text-balance break-words">
              {activeHeroTitle}
            </h1>
            <p className="mx-auto mt-3.5 sm:mt-4 max-w-2xl text-xs min-[360px]:text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-balance break-words">
              {activeHeroSubtitle}
            </p>
          </div>

          {/* Operational Trust Pillars — with skeleton loading */}
          <div className="mt-8 sm:mt-12 grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-border">
            {statsLoading || settingsLoading ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : (
              <>
                {/* 1. Verified Advocates */}
                <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-2xs min-w-0 flex flex-col justify-between">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-xs min-[360px]:text-sm font-bold text-foreground sm:text-base break-words">
                      {stats && stats.verifiedExperts > 0
                        ? `${stats.verifiedExperts}+ ${t("hero.stats.verifiedExperts")}`
                        : t("hero.stats.barCertified")}
                    </p>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground break-words leading-tight">
                      {t("hero.stats.barCertifiedDesc")}
                    </p>
                  </div>
                </div>

                {/* 2. Completed Consultations */}
                <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-2xs min-w-0 flex flex-col justify-between">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs shrink-0">
                    <FileCheck2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs min-[360px]:text-sm font-bold text-foreground sm:text-base break-words">
                      {stats && stats.completedConsultations > 0
                        ? `${stats.completedConsultations}+ ${t("hero.stats.completedConsultations")}`
                        : t("hero.stats.verifiedConsultations")}
                    </p>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground break-words leading-tight">
                      {t("hero.stats.completedConsultationsDesc")}
                    </p>
                  </div>
                </div>

                {/* 3. Escrow Protected */}
                <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-2xs min-w-0 flex flex-col justify-between">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs shrink-0">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <p className="text-xs min-[360px]:text-sm font-bold text-foreground sm:text-base break-words">
                      {t("hero.stats.escrowProtected")}
                    </p>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground break-words leading-tight">
                      {t("hero.stats.escrowProtectedDesc")}
                    </p>
                  </div>
                </div>

                {/* 4. 30 Districts */}
                <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-2xs min-w-0 flex flex-col justify-between">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs min-[360px]:text-sm font-bold text-foreground sm:text-base break-words">
                      {t("hero.stats.nationwide")}
                    </p>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground break-words leading-tight">
                      {t("hero.stats.nationwideDesc")}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Section 2: The 4-Stage Advocate Verification Protocol ─── */}
      <section id="verification" className="bg-muted/15 py-12 sm:py-16 lg:py-20 border-b border-border scroll-mt-20">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <SectionBadge icon={ShieldCheck} label={t("verification.badge")} />
            <h2 className="text-xl min-[360px]:text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground break-words">
              {t("verification.title")}
            </h2>
            <p className="mt-2.5 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
              {t("verification.subtitle")}
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VERIFICATION_STAGES.map(({ key, Icon }, idx) => (
              <div
                key={key}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs flex flex-col justify-between min-w-0 transition hover:border-foreground/30"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-accent text-foreground">
                      {t(`verification.${key}Number` as `verification.stage1Number`)}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-border bg-accent/40 text-foreground">
                      {t(`verification.${key}Badge` as `verification.stage1Badge`)}
                    </span>
                  </div>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-sm min-[360px]:text-base font-bold text-foreground break-words">
                    {t(`verification.${key}Title` as `verification.stage1Title`)}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed break-words">
                    {t(`verification.${key}Desc` as `verification.stage1Desc`)}
                  </p>
                </div>
                {/* Step connector dots for visual flow on large screens */}
                {idx < VERIFICATION_STAGES.length - 1 && (
                  <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Mission & Vision ──────────────────────────── */}
      <section id="mission" className="bg-background py-12 sm:py-16 lg:py-20 border-b border-border">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xs relative overflow-hidden flex flex-col justify-between min-w-0 transition hover:border-foreground/20">
              <div>
                <div className="mb-4 sm:mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                  <Target size={22} />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-foreground break-words">
                  {t("mission.title")}
                </h2>
                <div className="mt-3 space-y-3">
                  {activeMission
                    .split(/\n\s*\n/)
                    .filter(Boolean)
                    .map((p, i) => (
                      <p
                        key={`mission-${i}`}
                        className="text-xs min-[360px]:text-sm sm:text-base leading-relaxed text-muted-foreground break-words"
                      >
                        {p.trim()}
                      </p>
                    ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-2xs relative overflow-hidden flex flex-col justify-between min-w-0 transition hover:border-foreground/20">
              <div>
                <div className="mb-4 sm:mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs">
                  <Compass size={22} />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-foreground break-words">
                  {t("mission.visionTitle")}
                </h2>
                <div className="mt-3 space-y-3">
                  {activeVision
                    .split(/\n\s*\n/)
                    .filter(Boolean)
                    .map((p, i) => (
                      <p
                        key={`vision-${i}`}
                        className="text-xs min-[360px]:text-sm sm:text-base leading-relaxed text-muted-foreground break-words"
                      >
                        {p.trim()}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Our Story & The Rwandan Legal Reality ──────── */}
      <section className="bg-muted/15 py-12 sm:py-16 lg:py-20 border-b border-border">
        <div className="mx-auto max-w-5xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <SectionBadge icon={Sparkles} label={t("story.subtitle")} />
            <h2 className="text-xl min-[360px]:text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground break-words">
              {t("story.title")}
            </h2>
          </div>

          {customStory ? (
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 md:p-10 shadow-2xs max-w-3xl mx-auto space-y-4">
              {customStory
                .split(/\n\s*\n/)
                .filter(Boolean)
                .map((paragraph, idx) => (
                  <p
                    key={`story-${idx}`}
                    className="text-xs min-[360px]:text-sm sm:text-base leading-relaxed text-muted-foreground break-words"
                  >
                    {paragraph.trim()}
                  </p>
                ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
              {/* The Legal Challenge */}
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xs min-w-0 transition hover:border-foreground/20 flex flex-col justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-foreground">
                    <span className="break-words">{t("story.challengeTitle")}</span>
                  </div>
                  <p className="text-xs min-[360px]:text-sm sm:text-base leading-relaxed text-muted-foreground break-words">
                    {t("story.text1")}
                  </p>
                </div>
              </div>

              {/* The Digital Infrastructure */}
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-2xs min-w-0 transition hover:border-foreground/20 flex flex-col justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-foreground">
                    <span className="break-words">{t("story.solutionTitle")}</span>
                  </div>
                  <p className="text-xs min-[360px]:text-sm sm:text-base leading-relaxed text-muted-foreground break-words">
                    {t("story.text2")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 5: Platform Evolution Milestones (Timeline) ────── */}
      <section className="bg-background py-12 sm:py-16 lg:py-20 border-b border-border">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <SectionBadge icon={Sparkles} label={t("milestones.badge")} />
            <h2 className="text-xl min-[360px]:text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground break-words">
              {t("milestones.title")}
            </h2>
            <p className="mt-2.5 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
              {t("milestones.subtitle")}
            </p>
          </div>

          <div className={`gap-5 sm:gap-6 ${milestoneGridClass}`}>
            {milestones.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-card p-6 shadow-2xs relative flex flex-col justify-between min-w-0 transition hover:border-foreground/30 h-full"
              >
                <div>
                  <div className="inline-flex items-center px-3 py-1 rounded-lg bg-accent text-foreground font-mono text-xs font-bold mb-4">
                    {item.year}
                  </div>
                  <h3 className="text-base font-bold text-foreground break-words">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Dynamic Core Values (Admin Managed) ────────── */}
      <section className="bg-muted/15 py-12 sm:py-16 lg:py-20 border-b border-border">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <SectionBadge icon={Heart} label={t("values.title")} />
            <h2 className="text-xl min-[360px]:text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground break-words">
              {t("values.title")}
            </h2>
          </div>

          <div className={`gap-5 sm:gap-6 ${valuesGridClass}`}>
            {coreValues.map((val) => {
              const IconComp = VALUE_ICON_MAP[val.icon] || ShieldCheck;
              return (
                <div key={val.id} className="rounded-2xl border border-border bg-card p-6 shadow-2xs flex flex-col justify-between min-w-0 transition hover:border-foreground/30 h-full">
                  <div>
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs shrink-0">
                      <IconComp size={20} />
                    </div>
                    <h3 className="text-sm min-[360px]:text-base font-bold text-foreground break-words">{val.title}</h3>
                    <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{val.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section 7: Institutional Governance & Ethics Framework ── */}
      <section id="governance" className="bg-background py-12 sm:py-16 lg:py-20 border-b border-border scroll-mt-20">
        <div className="mx-auto max-w-6xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <SectionBadge icon={Scale} label={t("governance.badge")} />
            <h2 className="text-xl min-[360px]:text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground break-words">
              {t("governance.title")}
            </h2>
            <p className="mt-2.5 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
              {t("governance.subtitle")}
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {GOVERNANCE_RULES.map(({ key, Icon }) => (
              <div
                key={key}
                className="rounded-2xl border border-border bg-card p-6 shadow-2xs flex flex-col justify-between min-w-0 transition hover:border-foreground/30"
              >
                <div>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs shrink-0">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-foreground break-words">
                    {t(`governance.${key}Title` as `governance.rule1Title`)}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                    {t(`governance.${key}Desc` as `governance.rule1Desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 8: Institutional Ecosystem & Partners ─────────── */}
      <section id="ecosystem" className="bg-muted/15 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-5xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
              {t("ecosystem.badge")}
            </span>
            <h2 className="mt-2 text-xl min-[360px]:text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground break-words">
              {t("ecosystem.title")}
            </h2>
            <p className="mt-2.5 text-xs min-[360px]:text-sm sm:text-base text-muted-foreground leading-relaxed break-words">
              {t("ecosystem.subtitle")}
            </p>
          </div>

          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ECOSYSTEM_CARDS.map(({ key, Icon }, idx) => (
              <div
                key={key}
                className={`rounded-2xl border border-border bg-card p-6 shadow-2xs min-w-0 transition hover:border-foreground/30${idx === 2 ? " sm:col-span-2 lg:col-span-1" : ""}`}
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-dark/10 text-brand-dark dark:bg-white/10 dark:text-white shadow-2xs shrink-0">
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-foreground break-words">
                  {t(`ecosystem.${key}.title` as `ecosystem.legal.title`)}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                  {t(`ecosystem.${key}.desc` as `ecosystem.legal.desc`)}
                </p>
              </div>
            ))}
          </div>

          {/* Institutional Inquiries Link */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-4 min-[360px]:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shadow-2xs">
            <div className="min-w-0">
              <h4 className="text-sm min-[360px]:text-base font-bold text-foreground break-words">
                {t("ecosystem.partnerCta")}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 break-words leading-relaxed">
                {t("ecosystem.partnerCtaDesc")}
              </p>
            </div>
            <Link
              href="/contact?type=institutional"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-5 py-2.5 text-xs font-bold shadow-2xs transition shrink-0 w-full sm:w-auto text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="break-words">{t("ecosystem.partnerAction")}</span>
              <ArrowRight size={14} className="shrink-0" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
