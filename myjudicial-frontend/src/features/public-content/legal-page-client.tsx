"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Info, Link2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { usePlatformSettings } from "@/lib/api/settings";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { Alert } from "@/shared/components/ui/alert";
import { LegalDocumentLayout } from "./legal-document";
import { slugifyLegalHeading } from "./legal-utils";
import { legalWebPageJsonLd } from "./json-ld";
import { FormattedProse, renderTextWithLead } from "./formatted-prose";
import { LegalTable } from "./legal-table";
import { LiveStorageInspector } from "./live-storage-inspector";
import { PrivacyRightsHelper } from "./privacy-rights-helper";
import { TermsFinalizationNotice } from "./terms-finalization-notice";
import { cn } from "@/lib/utils";

export type LegalPageKey = "terms" | "privacy" | "cookies";

const PAGE_ICONS: Record<LegalPageKey, "scale" | "shield" | "cookie"> = {
  terms: "scale",
  privacy: "shield",
  cookies: "cookie",
};

export interface LegalSectionItem {
  title: string;
  text?: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: {
    tone?: "info" | "warning";
    heading?: string;
    body: string;
  };
  table?: {
    columns: string[];
    rows: string[][];
  };
}

export default function LegalPageClient({ pageKey }: { pageKey: LegalPageKey }) {
  const locale = useLocale();
  const t = useTranslations(`legalPages.${pageKey}`);
  const { settings } = usePlatformSettings();
  const [copiedHeadingId, setCopiedHeadingId] = useState<string | null>(null);

  const sections = (t.raw("content.sections") as LegalSectionItem[]) ?? [];
  const isTermsNotice = pageKey === "terms" && sections.length <= 4;

  // Generate stable semantic anchor slugs with deduplication
  const seenSlugs = new Map<string, number>();
  const tocItems = isTermsNotice
    ? [
        { id: "terms-status-heading", label: t("finalization.badge", { defaultValue: "Statutory Status" }) },
        { id: "interim-framework-heading", label: t("finalization.interimHeading", { defaultValue: "Interim Governance Framework" }) },
        { id: "related-policies-heading", label: t("finalization.relatedHeading", { defaultValue: "Published Statutory Policies" }) },
        { id: "corporate-entity-heading", label: t("finalization.corporateHeading", { defaultValue: "Corporate Desk" }) },
      ]
    : sections.map((section) => {
        const baseSlug = slugifyLegalHeading(section.title);
        const count = seenSlugs.get(baseSlug) ?? 0;
        seenSlugs.set(baseSlug, count + 1);
        const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
        return { id, label: section.title };
      });

  const contactEmail =
    settings.dpoContactEmail ||
    settings.supportEmail ||
    "support@myjudicial.com";

  // Only show the date line when Admin Settings has an actual configured date.
  // If nothing is set we omit it entirely rather than showing a stale hardcoded month.
  const updatedLabel = settings.legalEffectiveDate
    ? `${t("hero.updatedPrefix")} ${settings.legalEffectiveDate}`
    : undefined;

  const officeAddress = [settings.officeBuilding, settings.officeStreet, settings.officeDistrict]
    .filter(Boolean)
    .join(", ");

  const handleCopyLink = (id: string, title: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedHeadingId(id);
      toast.success(
        locale === "fr"
          ? `Lien copié : ${title}`
          : locale === "rw"
          ? `Ihuza ryakopewe: ${title}`
          : `Link copied: ${title}`
      );
      setTimeout(() => setCopiedHeadingId(null), 2000);
    });
  };

  return (
    <>
      <JsonLd
        data={legalWebPageJsonLd({
          title: `${t("hero.title")} | ${settings.platformName || "MyJudicial"}`,
          description: t("content.intro"),
          url: `https://myjudicial.com/${locale}/${pageKey}`,
          locale,
          dateModified: settings.legalEffectiveDate,
          settings,
        })}
      />
      <LegalDocumentLayout
        iconName={PAGE_ICONS[pageKey]}
        badge={t("hero.badge")}
        title={t("hero.title")}
        updatedLabel={updatedLabel}
        tocLabel={t("hero.toc.title")}
        printLabel={t("hero.toc.print")}
        tocItems={tocItems}
        contact={{
          title: t("content.cardTitle"),
          desc: t("content.cardDesc"),
          email: contactEmail,
          phone: settings.hotlinePhone,
          address: officeAddress,
          poBox: settings.officePoBox,
          hours: settings.supportWorkingHours,
        }}
      >
        {!isTermsNotice ? (
          <p className="text-base leading-relaxed break-words text-muted-foreground min-[360px]:text-lg">
            {t("content.intro")}
          </p>
        ) : null}

        {/* Live Client Storage & Zero-Tracker Inspector (Cookies Policy) */}
        {pageKey === "cookies" ? (
          <div className="mt-8">
            <LiveStorageInspector />
          </div>
        ) : null}

        {/* Interactive Statutory Rights & DPO Action Center (Privacy Policy) */}
        {pageKey === "privacy" ? (
          <div className="mt-8">
            <PrivacyRightsHelper />
          </div>
        ) : null}

        {isTermsNotice ? (
          <div className="mt-8">
            <TermsFinalizationNotice />
          </div>
        ) : (
          <div className="mt-8 space-y-8 sm:mt-12 sm:space-y-12">
            {sections.map((section, index) => {
              const { id } = tocItems[index];
              const fullText =
                section.paragraphs && section.paragraphs.length > 0
                  ? section.paragraphs.join("\n\n")
                  : section.text ?? "";

              return (
                <section key={id} id={id} className="scroll-mt-[calc(var(--header-offset,4rem)+1rem)]">
                  <div className="group flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-foreground min-[360px]:text-xl sm:text-2xl">
                      {section.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(id, section.title)}
                      title="Copy section link"
                      aria-label={`Copy link to ${section.title}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg border border-transparent hover:border-border hover:bg-accent/50"
                    >
                      {copiedHeadingId === id ? (
                        <Check size={15} className="text-emerald-500" />
                      ) : (
                        <Link2 size={15} />
                      )}
                    </button>
                  </div>

                  {fullText ? (
                    <div className="mt-2.5 sm:mt-4">
                      <FormattedProse body={fullText} settings={settings} />
                    </div>
                  ) : null}

                  {section.bullets && section.bullets.length > 0 ? (
                    <ul className="my-3 space-y-2.5 ps-1 sm:ps-2">
                      {section.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70 dark:bg-primary" />
                          <div className="flex-1 min-w-0 text-xs min-[360px]:text-sm sm:text-base leading-relaxed text-muted-foreground break-words">
                            {renderTextWithLead(bullet, settings)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {section.callout ? (
                    <div className="mt-4">
                      <Alert variant={section.callout.tone === "warning" ? "warning" : "info"}>
                        {section.callout.tone === "warning" ? (
                          <TriangleAlert className="text-current" />
                        ) : (
                          <Info className="text-current" />
                        )}
                        <div className="col-start-2 min-w-0 space-y-1">
                          {section.callout.heading ? (
                            <p className="font-medium leading-tight tracking-tight text-foreground">
                              {section.callout.heading}
                            </p>
                          ) : null}
                          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                            {section.callout.body}
                          </p>
                        </div>
                      </Alert>
                    </div>
                  ) : null}

                  {section.table ? (
                    <LegalTable
                      columns={section.table.columns}
                      rows={section.table.rows}
                    />
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
      </LegalDocumentLayout>
    </>
  );
}