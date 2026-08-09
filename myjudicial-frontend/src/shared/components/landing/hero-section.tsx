"use client";

import { motion } from "framer-motion";
import { MapPin, ShieldCheck, Scale, Users, Award, Briefcase, Bot, ArrowRight, Star, CheckCircle2, Search } from "lucide-react";
import { Link } from "@/i18n/routing";
import { usePublicStats } from "@/lib/api/landing";
import { useTranslations } from "next-intl";

export default function HeroSection() {
  const t = useTranslations("public");
  const { data: stats, isLoading } = usePublicStats();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-dark/5 to-background pt-12 pb-16 sm:pt-16 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Left: Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-dark/10 bg-brand-dark/5 px-3 py-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-dark animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-dark/70">{t("hero.badge")}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl"
            >
              {t.rich("hero.title", {
                br: () => <br />,
                span: (chunks) => <span className="text-brand-dark">{chunks}</span>
              })}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 max-w-lg text-base leading-7 text-muted-foreground"
            >
              {t("hero.description")}
            </motion.p>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
                <ShieldCheck size={12} className="text-brand-dark" /> {t("hero.trust1")}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
                <CheckCircle2 size={12} className="text-brand-dark" /> {t("hero.trust2")}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
                <Scale size={12} className="text-brand-dark" /> {t("hero.trust3")}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
                <MapPin size={12} className="text-brand-dark" /> {t("hero.location")}
              </span>
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <button
                onClick={() => document.getElementById("expert-list")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-sm font-bold text-on-brand shadow-lg shadow-brand-dark/20 transition hover:bg-brand-dark/90"
              >
                {t("hero.browseLawyers")} <ArrowRight size={16} />
              </button>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-accent"
              >
                {t("hero.listPractice")}
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {isLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
                  ))}
                </>
              ) : stats ? (
                <>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <p className="text-lg font-bold text-foreground">{stats.verifiedExperts.toLocaleString()}+</p>
                    <p className="text-[11px] text-muted-foreground">{t("hero.stats.verifiedExperts")}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <p className="text-lg font-bold text-foreground">{stats.completedConsultations.toLocaleString()}+</p>
                    <p className="text-[11px] text-muted-foreground">{t("hero.stats.consultations")}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <p className="text-lg font-bold text-foreground">{stats.totalClients.toLocaleString()}+</p>
                    <p className="text-[11px] text-muted-foreground">{t("hero.stats.clientsServed")}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
                    <p className="text-lg font-bold text-foreground">{stats.totalPracticeAreas}</p>
                    <p className="text-[11px] text-muted-foreground">{t("hero.stats.practiceAreas")}</p>
                  </div>
                </>
              ) : null}
            </motion.div>
          </div>

          {/* Right: Visual — AI Assistant preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative hidden lg:block"
          >
            <div className="overflow-hidden rounded-3xl bg-brand-dark p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot size={16} className="text-on-brand" />
                </div>
                <p className="text-sm font-semibold text-on-brand">{t("hero.ai.title")}</p>
                <span className="ml-auto flex items-center gap-1 text-xs text-on-brand/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> {t("hero.ai.online")}
                </span>
              </div>
              <div className="space-y-3">
                <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-white/10 px-4 py-3 text-sm text-on-brand/80">
                  {t("hero.ai.msg1")}
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-none bg-black/20 px-4 py-3 text-sm text-on-brand">
                  {t("hero.ai.msg2")}
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-white/10 px-4 py-3 text-sm text-on-brand/80">
                  {t("hero.ai.msg3")}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-on-brand">
                  <Star size={16} className="fill-on-brand text-on-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-on-brand">{t("hero.ai.matchTitle")}</p>
                  <p className="text-xs text-on-brand/60">{t("hero.ai.matchFee")}</p>
                </div>
                <Link href="/experts?specialty=LAND_LAW" className="rounded-lg bg-white/20 px-3 py-1.5 text-[11px] font-bold text-on-brand transition hover:bg-white/30">
                  {t("hero.ai.view")}
                </Link>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
              <ShieldCheck size={18} className="text-brand-dark" />
              <div>
                <p className="text-[11px] font-bold text-foreground">{t("hero.floating.verified")}</p>
                <p className="text-[10px] text-muted-foreground">{t("hero.floating.verifiedDesc")}</p>
              </div>
            </div>
            <div className="absolute -right-3 top-8 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
              <Award size={18} className="text-amber-500" />
              <div>
                <p className="text-[11px] font-bold text-foreground">{t("hero.floating.trusted")}</p>
                <p className="text-[10px] text-muted-foreground">{t("hero.floating.trustedDesc", { count: stats?.verifiedExperts ?? 0 })}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
