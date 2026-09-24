"use client";

import { Cookie } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CookiesClient() {
  const t = useTranslations("legalPages.cookies");

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <Cookie size={14} className="text-brand-dark dark:text-white shrink-0" />
            <span>{t("hero.badge")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium text-muted-foreground">
            {t("hero.updated")}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="bg-background pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-muted-foreground">
              {t("content.intro")}
            </p>
            
            <div className="mt-12 space-y-12">
              {t.raw("content.sections").map((section: { title: string; text: string }, idx: number) => (
                <div key={idx}>
                  <h2 className="text-xl font-bold text-foreground sm:text-2xl">{section.title}</h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {section.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
