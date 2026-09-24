"use client";

import { Mail, MapPin, Clock, Send } from "lucide-react";
import { useTranslations } from "next-intl";

export default function ContactClient() {
  const t = useTranslations("contactPage");

  return (
    <div className="flex flex-col bg-background text-foreground min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-16 sm:py-24 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/60 px-3.5 py-1 text-xs font-semibold text-foreground shadow-2xs">
            <Mail size={14} className="text-brand-dark dark:text-white shrink-0" />
            <span>{t("hero.badge")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15] text-balance">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("hero.subtitle")}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            
            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t("info.title")}</h2>
              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                    <Mail size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t("labels.email")}</p>
                    <a href={`mailto:${t("info.email")}`} className="mt-1 text-muted-foreground hover:text-foreground transition-colors">
                      {t("info.email")}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t("labels.location")}</p>
                    <p className="mt-1 text-muted-foreground">{t("info.location")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground shadow-2xs">
                    <Clock size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t("labels.hours")}</p>
                    <p className="mt-1 text-muted-foreground">{t("info.hours")}</p>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="mt-10 h-64 w-full overflow-hidden rounded-2xl border border-border bg-muted">
                <iframe
                  title={t("officeMapTitle")}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=Kigali,Rwanda"
                  allowFullScreen
                  className="opacity-50 grayscale transition-opacity hover:opacity-100 hover:grayscale-0"
                />
              </div>
            </div>

            {/* Contact Form */}
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground">{t("form.title")}</h2>
              {/* Note: This form is UI only for now. Backend integration is planned. */}
              <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-foreground">
                    {t("form.name")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    placeholder={t("formPlaceholders.name")}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
                    {t("form.email")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    placeholder={t("formPlaceholders.email")}
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="mb-1 block text-sm font-medium text-foreground">
                    {t("form.subject")}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    placeholder={t("formPlaceholders.subject")}
                  />
                </div>
                <div>
                  <label htmlFor="message" className="mb-1 block text-sm font-medium text-foreground">
                    {t("form.message")}
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    placeholder={t("formPlaceholders.message")}
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90 dark:bg-white dark:text-black dark:hover:bg-white/90 px-8 py-3.5 text-sm font-bold transition shadow-xs"
                >
                  {t("form.submit")} <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
