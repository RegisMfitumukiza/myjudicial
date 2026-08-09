"use client";

import { Link } from "@/i18n/routing";
import { ShieldCheck, TrendingUp, Smartphone, Clock, ArrowRight, Bot, MapPin } from "lucide-react";
import { usePublicStats } from "@/lib/api/landing";
import { useTranslations } from "next-intl";

export default function WhyMyJudicial() {
  const t = useTranslations("public");
  const { data: stats } = usePublicStats();
  
  const ITEMS = [
    { icon: ShieldCheck, title: t("whyMyJudicial.item1.title"), desc: t("whyMyJudicial.item1.desc") },
    { icon: TrendingUp, title: t("whyMyJudicial.item2.title"), desc: t("whyMyJudicial.item2.desc") },
    { icon: Smartphone, title: t("whyMyJudicial.item3.title"), desc: t("whyMyJudicial.item3.desc") },
    { icon: Clock, title: t("whyMyJudicial.item4.title"), desc: t("whyMyJudicial.item4.desc") },
    { icon: Bot, title: t("whyMyJudicial.item5.title"), desc: t("whyMyJudicial.item5.desc") },
    { icon: MapPin, title: t("whyMyJudicial.item6.title"), desc: t("whyMyJudicial.item6.desc") },
  ];

  return (
    <section id="about" className="bg-background py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("whyMyJudicial.badge")}</p>
            <h2 className="text-3xl font-bold leading-snug text-foreground sm:text-4xl">
              {t.rich("whyMyJudicial.title", {
                br: () => <br />
              })}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {t("whyMyJudicial.desc")}
            </p>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {ITEMS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                    <Icon size={17} className="text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/sign-up"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-dark px-7 py-3.5 text-sm font-bold text-on-brand transition hover:bg-brand-dark/90"
            >
              {t("whyMyJudicial.getStarted")} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl bg-brand-dark p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot size={16} className="text-on-brand" />
                </div>
                <p className="text-sm font-semibold text-on-brand">{t("hero.ai.title")}</p>
                <span className="ml-auto text-xs text-on-brand/50">{t("hero.ai.online")}</span>
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
                  L
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-on-brand">{t("hero.ai.matchTitle")}</p>
                  <p className="text-xs text-on-brand/60">{t("hero.ai.matchFee")}</p>
                </div>
                <span className="rounded-lg bg-white/20 px-3 py-1.5 text-[11px] font-bold text-on-brand">{t("hero.ai.view")}</span>
              </div>
            </div>
            {stats && (
              <div className="relative mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg sm:absolute sm:-bottom-4 sm:left-0 sm:mt-0">
                <ShieldCheck size={18} className="text-brand-dark" />
                <div>
                  <p className="text-[11px] font-bold text-foreground">{stats.verifiedExperts}+ {t("hero.stats.verifiedExperts")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("hero.floating.verifiedDesc")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
