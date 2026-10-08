"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Scale,
  ShieldCheck,
  Lock,
  Coins,
  Bot,
  ArrowRight,
  ExternalLink,
  Mail,
  Building2,
  FileText,
  AlertTriangle,
  Info,
} from "lucide-react";
import { usePlatformSettings } from "@/lib/api/settings";
import { cn } from "@/lib/utils";

interface TermsFinalizationNoticeProps {
  className?: string;
}

export function TermsFinalizationNotice({ className }: TermsFinalizationNoticeProps) {
  const t = useTranslations("legalPages.terms");
  const locale = useLocale();
  const { settings } = usePlatformSettings();

  const legalEmail = settings.dpoContactEmail || settings.supportEmail || "legal@myjudicial.com";
  const address = [settings.officeBuilding, settings.officeStreet, settings.officeDistrict]
    .filter(Boolean)
    .join(", ") || "Centenary House, 4th Floor, Nyarugenge CBD, Kigali, Rwanda";

  const pillars = [
    {
      id: "marketplace-scope",
      icon: Scale,
      title: t("finalization.pillars.scopeTitle", {
        defaultValue: "Technology Marketplace Infrastructure (Non-Law Firm)",
      }),
      description: t("finalization.pillars.scopeDesc", {
        defaultValue:
          "MyJudicial is an independent technology infrastructure platform connecting clients with licensed advocates. MyJudicial is not a law firm, does not employ practicing lawyers, and does not provide legal representation. Legal services are delivered exclusively by independent practitioners admitted to the Rwanda Bar Association.",
      }),
    },
    {
      id: "professional-privilege",
      icon: Lock,
      title: t("finalization.pillars.privilegeTitle", {
        defaultValue: "Client-Advocate Confidentiality & Professional Secrecy",
      }),
      description: t("finalization.pillars.privilegeDesc", {
        defaultValue:
          "All direct communications and shared case materials remain strictly protected under statutory legal professional secrecy (secret professionnel) pursuant to Rwandan law and Rwanda Bar Association regulations. Video rooms (LiveKit WebRTC) and document vaults feature client-side encryption.",
      }),
    },
    {
      id: "non-advisory-ai",
      icon: Bot,
      title: t("finalization.pillars.aiTitle", {
        defaultValue: "Informational AI Legal Triage (Non-Advisory)",
      }),
      description: t("finalization.pillars.aiDesc", {
        defaultValue:
          "AI-assisted case intake tools—including Whisper speech-to-text and semantic practice area matching—operate strictly as discovery aids. Automated triage outputs do not constitute legal advice and never substitute for formal consultation with a licensed advocate.",
      }),
    },
    {
      id: "escrow-custody",
      icon: Coins,
      title: t("finalization.pillars.escrowTitle", {
        defaultValue: "Neutral Escrow Custody & Fee Security",
      }),
      description: t("finalization.pillars.escrowDesc", {
        defaultValue:
          "Consultation fee deposits initiated via Mobile Money (AzamPay / MTN MoMo / Airtel Money) are held in neutral escrow custody. Funds are disbursed to the legal practitioner solely upon verified consultation completion, safeguarding both client and advocate.",
      }),
    },
    {
      id: "statutory-privacy",
      icon: ShieldCheck,
      title: t("finalization.pillars.privacyTitle", {
        defaultValue: "Comprehensive Statutory Data Protection",
      }),
      description: t("finalization.pillars.privacyDesc", {
        defaultValue:
          "All personal data processing, transmission, and retention across the platform are governed by our published, active Privacy Policy, strictly compliant with Rwanda Law Nº 058/2021 on Personal Data Protection.",
      }),
    },
  ];

  const policyCards = [
    {
      href: "/privacy",
      icon: ShieldCheck,
      title: t("finalization.policies.privacyTitle", { defaultValue: "Privacy Policy" }),
      desc: t("finalization.policies.privacyDesc", {
        defaultValue: "Statutory data processing and rights under Law Nº 058/2021",
      }),
    },
    {
      href: "/cookies",
      icon: FileText,
      title: t("finalization.policies.cookiesTitle", { defaultValue: "Cookie Policy" }),
      desc: t("finalization.policies.cookiesDesc", {
        defaultValue: "Zero third-party trackers, transparent local storage inspection",
      }),
    },
    {
      href: "/help",
      icon: Info,
      title: t("finalization.policies.helpTitle", { defaultValue: "Help & FAQ Center" }),
      desc: t("finalization.policies.helpDesc", {
        defaultValue: "Guides on consultation booking, verification, and escrow",
      }),
    },
    {
      href: "/contact",
      icon: Mail,
      title: t("finalization.policies.contactTitle", { defaultValue: "Legal & Regulatory Desk" }),
      desc: t("finalization.policies.contactDesc", {
        defaultValue: `Direct inquiries to ${legalEmail}`,
      }),
    },
  ];

  return (
    <div className={cn("space-y-10 sm:space-y-12", className)}>
      {/* Primary Regulatory Notice Banner */}
      <section aria-labelledby="terms-status-heading" className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              {t("finalization.badge", { defaultValue: "Statutory & Regulatory Status" })}
            </div>
            <h2 id="terms-status-heading" className="text-lg font-bold text-foreground sm:text-xl">
              {t("finalization.title", {
                defaultValue: "Terms of Service Under Formal Legal Finalization",
              })}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("finalization.intro", {
                defaultValue:
                  "The official contractual Terms of Service governing the MyJudicial marketplace are currently undergoing formal statutory drafting, regulatory review, and governance finalization in collaboration with licensed legal counsel and in accordance with the commercial and legal frameworks of the Republic of Rwanda.",
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Interim Operational Governance Framework */}
      <section aria-labelledby="interim-framework-heading" className="space-y-6">
        <div>
          <h2 id="interim-framework-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t("finalization.interimHeading", {
              defaultValue: "Interim Operational Governance Framework",
            })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {t("finalization.interimSubtitle", {
              defaultValue:
                "During this formal finalization period, all platform interactions, client bookings, and expert services operate strictly under the following foundational principles:",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:p-6 transition-colors hover:border-foreground/20 hover:bg-accent/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground sm:text-lg">
                    {pillar.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Active Statutory Policies & Cross-Links */}
      <section aria-labelledby="related-policies-heading" className="space-y-6">
        <div>
          <h2 id="related-policies-heading" className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {t("finalization.relatedHeading", {
              defaultValue: "Published Statutory Policies & Governance Channels",
            })}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("finalization.relatedSubtitle", {
              defaultValue: "Review our active published policies and direct compliance contacts:",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {policyCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/30 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {card.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Corporate Entity & DPO Contact */}
      <section aria-labelledby="corporate-entity-heading" className="rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="space-y-1 text-xs text-muted-foreground sm:text-sm">
            <h3 id="corporate-entity-heading" className="font-semibold text-foreground">
              MyJudicial Ltd
            </h3>
            <p>{address}</p>
            <p>
              Direct Legal Inquiries:{" "}
              <a
                href={`mailto:${legalEmail}`}
                className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
              >
                {legalEmail}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
