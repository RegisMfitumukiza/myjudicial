"use client";

import { MessageSquare, Search, Lock, Play } from "lucide-react";
import { useTranslations } from "next-intl";

export default function HowItWorks() {
  const t = useTranslations("public");
  
  const STEPS = [
    {
      step: "01", icon: MessageSquare,
      title: t("howItWorks.step1Title"),
      desc: t("howItWorks.step1Desc"),
    },
    {
      step: "02", icon: Search,
      title: t("howItWorks.step2Title"),
      desc: t("howItWorks.step2Desc"),
    },
    {
      step: "03", icon: Lock,
      title: t("howItWorks.step3Title"),
      desc: t("howItWorks.step3Desc"),
    },
  ];

  return (
    <section id="how-it-works" className="bg-muted/30 py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-14 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-dark">{t("howItWorks.badge")}</p>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{t("howItWorks.title")}</h2>
          <p className="mt-3 text-base text-muted-foreground">{t("howItWorks.subtitle")}</p>
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-16 hidden h-px bg-brand-dark/20 md:block" />

          {STEPS.map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-dark shadow-lg shadow-brand-dark/25">
                <Icon size={26} className="text-on-brand" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-dark text-[10px] font-black text-on-brand">
                  {step}
                </span>
              </div>
              <h3 className="mb-3 text-lg font-bold text-foreground">{title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl bg-brand-dark/10 px-5 py-5 sm:mt-14 sm:flex-row sm:px-8 sm:py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-dark">
              <MessageSquare size={22} className="text-on-brand" />
            </div>
            <div>
              <p className="font-bold text-foreground">{t("howItWorks.aiPromo.title")}</p>
              <p className="text-sm text-muted-foreground">{t("howItWorks.aiPromo.desc")}</p>
            </div>
          </div>
          <button
            onClick={() => {
              const event = new CustomEvent("open-ai-chat");
              window.dispatchEvent(event);
            }}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-sm font-bold text-on-brand transition hover:bg-brand-dark/90"
          >
            <Play size={14} /> {t("howItWorks.aiPromo.launch")}
          </button>
        </div>
      </div>
    </section>
  );
}
