"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Logo } from "@/shared/components/logo";
import { MapPin, Mail, ShieldAlert } from "lucide-react";
import { useSocialLinks } from "@/features/settings/hooks/useSocialLinks";

/* ── Inline SVG icons (zero external deps) ─────────────────────────── */
function XIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L2.002 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function LinkedInIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function FacebookIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
function InstagramIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
function YouTubeIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
function WhatsAppIcon(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

const SOCIAL_ICON_MAP = {
  x: { Icon: XIcon, label: "X (Twitter)" },
  linkedin: { Icon: LinkedInIcon, label: "LinkedIn" },
  facebook: { Icon: FacebookIcon, label: "Facebook" },
  instagram: { Icon: InstagramIcon, label: "Instagram" },
  youtube: { Icon: YouTubeIcon, label: "YouTube" },
  whatsapp: { Icon: WhatsAppIcon, label: "WhatsApp" },
} as const;

export default function LandingFooter() {
  const t = useTranslations("landing.footer");
  const { socialLinks } = useSocialLinks();

  /* ── 4 Industrial Deep-Sitemap Columns ────────────────────────── */
  const FOOTER_COLS = [
    {
      heading: t("columns.practiceAreas"),
      links: [
        { label: t("links.landLaw"), href: "/search?specialty=LAND_LAW" },
        { label: t("links.commercialLaw"), href: "/search?specialty=COMMERCIAL_LAW" },
        { label: t("links.familyLaw"), href: "/search?specialty=FAMILY_LAW" },
        { label: t("links.employmentLaw"), href: "/search?specialty=EMPLOYMENT_LAW" },
        { label: t("links.criminalLaw"), href: "/search?specialty=CRIMINAL_LAW" },
        { label: t("links.allPracticeAreas"), href: "/practice-areas" },
      ],
    },
    {
      heading: t("columns.platform"),
      links: [
        { label: t("links.pricing"), href: "/pricing" },
        { label: t("links.howItWorks"), href: "/how-it-works" },
        { label: t("links.aiAssistant"), href: "/ai" },
        { label: t("links.findLawyer"), href: "/search" },
      ],
    },
    {
      heading: t("columns.forLawyers"),
      links: [
        { label: t("links.becomeExpert"), href: "/sign-up?role=EXPERT" },
        { label: t("links.advocateSignIn"), href: "/sign-in" },
        { label: t("links.practiceGuide"), href: "/how-it-works?tab=advocates" },
        { label: t("links.verification"), href: "/about#ecosystem" },
      ],
    },
    {
      heading: t("columns.company"),
      links: [
        { label: t("links.aboutUs"), href: "/about" },
        { label: t("links.careers"), href: "/careers" },
        { label: t("links.faqs"), href: "/faqs" },
        { label: t("links.contact"), href: "/contact" },
        { label: t("links.privacyPolicy"), href: "/privacy" },
        { label: t("links.termsOfService"), href: "/terms" },
        { label: t("links.cookies"), href: "/cookies" },
      ],
    },
  ];

  /* Only render social icons when a real non-empty URL has been configured */
  const activeSocials = (
    Object.entries(SOCIAL_ICON_MAP) as [
      keyof typeof SOCIAL_ICON_MAP,
      { Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string }
    ][]
  ).filter(([key]) => {
    const url = socialLinks[key];
    return typeof url === "string" && url.trim().length > 0;
  });

  return (
    <footer className="border-t border-border bg-card text-foreground" role="contentinfo">
      {/* ── Brand Identity & Platform Summary ─────────────────────────── */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-10 pb-8 border-b border-border">
        <div className="flex flex-col gap-3 max-w-2xl">
          <Logo iconSize={20} fontSize="text-[17px]" className="text-brand-dark dark:text-white" />
          
          <p className="text-sm font-semibold text-foreground leading-snug">
            {t("tagline")}
          </p>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("subtagline")}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-0.5">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="shrink-0 text-brand-dark dark:text-brand-gold" />
              <span>{t("kigaliRwanda")}</span>
            </div>
            <span className="text-border hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <Mail size={12} className="shrink-0 text-brand-dark dark:text-brand-gold" />
              <a href={`mailto:${t("supportEmail")}`} className="hover:text-foreground hover:underline">
                {t("supportEmail")}
              </a>
            </div>
          </div>

          {/* Legal Ethics / Regulatory Notice */}
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
            <ShieldAlert size={14} className="shrink-0 text-muted-foreground mt-0.5" />
            <span>{t("disclaimer")}</span>
          </div>
        </div>
      </div>

      {/* ── 4 Deep-Sitemap Columns ────────────────────────────────────── */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10 border-b border-border">
        {/*
          Mobile:  2 cols  (grid-cols-2)
          Tablet:  4 cols  (sm:grid-cols-4)
          Desktop: 4 cols with generous spacing
        */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-x-8">
          {FOOTER_COLS.map((col) => (
            <div key={col.heading} className="min-w-0">
              <h4 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-foreground/75">
                {col.heading}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4 leading-snug block py-0.5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Bar: Copyright & Dynamic Social Icons ──────────────── */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          
          {/* Dynamic Copyright */}
          <p className="text-xs text-muted-foreground order-2 md:order-1">
            © {new Date().getFullYear()} {t("copyright")}
          </p>

          {/* Social Icons Container with clearance for floating bot button */}
          <div className="flex flex-wrap items-center justify-center gap-3 order-1 md:order-2 md:pr-16 lg:pr-20">
            {activeSocials.length > 0 && (
              <div
                className="flex flex-wrap items-center gap-2"
                aria-label="Social media channels"
              >
                {activeSocials.map(([key, { Icon, label }]) => {
                  const href = socialLinks[key] as string;
                  return (
                    <a
                      key={key}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:border-foreground/30 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Icon className="h-[14px] w-[14px]" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
