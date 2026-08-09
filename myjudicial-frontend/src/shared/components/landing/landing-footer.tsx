"use client";

import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/shared/components/language-switcher";
import { Logo } from "@/shared/components/logo";

export default function LandingFooter() {
  const t = useTranslations("landing.footer");

  const FOOTER_COLS = [
    {
      heading: t("columns.browse"),
      links: [
        { label: t("links.findLawyer"), href: "/" },
        { label: t("links.practiceAreas"), href: "/practice-areas" },
        { label: t("links.legalServices"), href: "/practice-areas" },
        { label: t("links.howItWorks"), href: "/how-it-works" },
        { label: t("links.aiAssistant"), href: "/ai" },
      ],
    },
    {
      heading: t("columns.forClients"),
      links: [
        { label: t("links.myBookings"), href: "/client/dashboard/consultations" },
        { label: t("links.payments"), href: "/client/dashboard/payments" },
        { label: t("links.messages"), href: "/client/dashboard/messages" },
        { label: t("links.leaveReview"), href: "/client/dashboard" },
        { label: t("links.faqs"), href: "/faqs" },
      ],
    },
    {
      heading: t("columns.forLawyers"),
      links: [
        { label: t("links.becomeExpert"), href: "/expert/onboarding" },
        { label: t("links.verification"), href: "/expert/verification" },
        { label: t("links.pricing"), href: "/pricing" },
        { label: t("links.dashboard"), href: "/expert/dashboard" },
        { label: t("links.helpCenter"), href: "/help" },
      ],
    },
    {
      heading: t("columns.resources"),
      links: [
        { label: t("links.helpCenter"), href: "/help" },
        { label: t("links.blog"), href: "/blog" },
        { label: t("links.legalGuides"), href: "/resources" },
        { label: t("links.aiAssistant"), href: "/ai" },
        { label: t("links.community"), href: "/help" },
      ],
    },
    {
      heading: t("columns.company"),
      links: [
        { label: t("links.aboutUs"), href: "/about" },
        { label: t("links.careers"), href: "/careers" },
        { label: t("links.partners"), href: "/partners" },
        { label: t("links.contact"), href: "/contact" },
        { label: t("links.newsroom"), href: "/press" },
      ],
    },
    {
      heading: t("columns.legal"),
      links: [
        { label: t("links.privacyPolicy"), href: "/privacy" },
        { label: t("links.termsOfService"), href: "/terms" },
        { label: t("links.cookies"), href: "/cookies" },
        { label: t("links.accessibility"), href: "/help" },
      ],
    },
  ];

  const SOCIAL_LINKS = [
    {
      label: "Facebook",
      href: "https://facebook.com/myjudicial",
      Icon: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    {
      label: "Twitter / X",
      href: "https://twitter.com/myjudicial",
      Icon: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
          <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      href: "https://linkedin.com/company/myjudicial",
      Icon: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
    {
      label: "Instagram",
      href: "https://instagram.com/myjudicial",
      Icon: (p: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-background border-t border-border">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12 border-b border-border">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-foreground">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground hover:underline"
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

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
            <Logo iconSize={18} fontSize="text-[15px]" className="text-brand-dark dark:text-white" />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {t("copyright")}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <LanguageSwitcher variant="compact" />

            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
