import type { ReactNode } from "react";
import { FileQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ContentBlock, ContentPageSlug } from "@/lib/api/content-pages";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import { ContentBlocks } from "./block-renderers";
import { LegalDocumentLayout, type LegalPageIconName } from "./legal-document";
import { slugifyLegalHeading } from "./legal-utils";
import { organizationJsonLd, legalWebPageJsonLd } from "./json-ld";
import { LiveStorageInspector } from "./live-storage-inspector";
import { PrivacyRightsHelper } from "./privacy-rights-helper";
import { fetchPublicContentPage, fetchPublicPlatformSettings } from "./server";

const LEGAL_PAGES: Partial<Record<ContentPageSlug, { namespace: string; icon: LegalPageIconName }>> = {
  TERMS: { namespace: "terms", icon: "scale" },
  PRIVACY: { namespace: "privacy", icon: "shield" },
  COOKIES: { namespace: "cookies", icon: "cookie" },
};

function PreviewBanner({ label }: { label: string }) {
  return (
    <div className="border-b border-border bg-accent/80 px-3 py-2.5 text-center">
      <p className="mx-auto max-w-4xl px-3 text-xs font-semibold text-foreground sm:text-sm">
        {label}
      </p>
    </div>
  );
}

function getBlockHeading(block: ContentBlock): string | null {
  const heading = "heading" in block ? block.heading : undefined;
  return heading && heading.trim() ? heading : null;
}

/**
 * Fetches the published page and renders it.
 *
 * Behavior:
 * - Published page           → hero (title + effective date) + ordered blocks.
 * - Published, EN fallback   → English content plus a "translation pending"
 *                              notice, so the page is useful while fr/rw is
 *                              still in draft.
 * - Unpublished / not found / backend unreachable → `fallback` (legacy static
 *   content) when provided, otherwise a neutral "not published" state. Public
 *   routes never hard-fail: the CMS must not be able to take a page offline.
 */
export async function PublicContentPage({
  slug,
  locale,
  fallback,
}: {
  slug: ContentPageSlug;
  locale: string;
  fallback?: ReactNode;
}) {
  const [content, settings] = await Promise.all([
    fetchPublicContentPage(slug, locale),
    fetchPublicPlatformSettings(),
  ]);
  return (
    <PublicContentPageView
      slug={slug}
      locale={locale}
      content={content}
      settings={settings}
      fallback={fallback}
    />
  );
}

/**
 * Shared renderer used by the public route (published page) and the admin
 * preview route (same markup for the current saved draft). In preview mode a
 * banner is added so a draft is never mistaken for the live page.
 */
export async function PublicContentPageView({
  slug,
  locale,
  content,
  settings,
  fallback,
  isPreview = false,
}: {
  slug: ContentPageSlug;
  locale: string;
  content: Awaited<ReturnType<typeof fetchPublicContentPage>> | null;
  settings: Awaited<ReturnType<typeof fetchPublicPlatformSettings>> | null;
  fallback?: ReactNode;
  isPreview?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "publicContent" });

  if (!content?.page) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-4 py-16 text-center">
        <FileQuestion size={28} className="text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {t("unavailableTitle")}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {t("unavailableBody")}
        </p>
      </div>
    );
  }

  const { page, isFallback } = content;

  if (LEGAL_PAGES[slug]) {
    const legal = LEGAL_PAGES[slug];
    const legalT = await getTranslations({ locale, namespace: `legalPages.${legal.namespace}` });
    const seenSlugs = new Map<string, number>();
    const headingBlocks = page.blocks
      .map((block) => ({ block, heading: getBlockHeading(block) }))
      .filter((entry): entry is { block: ContentBlock; heading: string } => entry.heading !== null)
      .map((entry) => {
        const baseSlug = slugifyLegalHeading(entry.heading);
        const count = seenSlugs.get(baseSlug) ?? 0;
        seenSlugs.set(baseSlug, count + 1);
        const id = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
        return {
          block: entry.block,
          heading: entry.heading,
          id,
        };
      });
    const tocItems = headingBlocks.map((item) => ({ id: item.id, label: item.heading }));
    const contactEmail =
      settings?.dpoContactEmail ||
      settings?.supportEmail ||
      "support@myjudicial.com";
    const officeAddress = [settings?.officeBuilding, settings?.officeStreet, settings?.officeDistrict]
      .filter(Boolean)
      .join(", ");

    return (
      <>
        {isPreview ? <PreviewBanner label={t("previewBanner")} /> : null}
        {settings ? (
          <JsonLd
            data={legalWebPageJsonLd({
              title: `${page.title} | ${settings.platformName || "MyJudicial"}`,
              description: page.metaDescription || "Information about how MyJudicial operates under Rwandan law.",
              url: `https://myjudicial.com/${locale}/${legal.namespace}`,
              locale,
              dateModified: page.effectiveDate,
              settings,
            })}
          />
        ) : null}
        {isFallback ? (
          <div className="mx-auto mt-6 w-full max-w-3xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8 print:hidden">
            <div className="rounded-lg border border-border bg-accent/60 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:text-sm">
              {t("translationNotice")}
            </div>
          </div>
        ) : null}
        <LegalDocumentLayout
          iconName={legal.icon}
          badge={legalT("hero.badge")}
          title={page.title}
          updatedLabel={page.effectiveDate ? t("lastUpdated", { date: page.effectiveDate }) : undefined}
          tocLabel={legalT("hero.toc.title")}
          printLabel={legalT("hero.toc.print")}
          tocItems={tocItems}
          contact={{
            title: legalT("content.cardTitle"),
            desc: legalT("content.cardDesc"),
            email: contactEmail,
            phone: settings?.hotlinePhone,
            address: officeAddress,
            poBox: settings?.officePoBox,
            hours: settings?.supportWorkingHours,
          }}
        >
          {slug === "COOKIES" ? (
            <div className="mb-8">
              <LiveStorageInspector />
            </div>
          ) : null}
          {slug === "PRIVACY" ? (
            <div className="mb-8">
              <PrivacyRightsHelper />
            </div>
          ) : null}
          <ContentBlocks
            blocks={page.blocks}
            settings={settings}
            locale={locale}
            anchorIdsByBlockId={Object.fromEntries(headingBlocks.map((item) => [item.block.id, item.id]))}
          />
        </LegalDocumentLayout>
      </>
    );
  }

  const firstBlockIsHero = page.blocks[0]?.type === "hero";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {isPreview ? <PreviewBanner label={t("previewBanner")} /> : null}
      {/* Hero */}
      {firstBlockIsHero ? (
        <section className="bg-background py-10 min-[360px]:py-14 sm:py-16">
          <div className="mx-auto max-w-4xl px-3 text-left min-[360px]:px-4 sm:px-6 lg:px-8">
            <ContentBlocks
              blocks={[page.blocks[0]]}
              settings={settings}
              locale={locale}
            />
          </div>
        </section>
      ) : (
        <section className="border-b border-border bg-gradient-to-b from-brand-dark/[.04] via-background to-background py-12 min-[360px]:py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-3 text-center min-[360px]:px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-extrabold tracking-tight leading-[1.15] text-balance text-foreground min-[360px]:text-3xl sm:text-4xl lg:text-5xl">
              {page.title}
            </h1>
            {page.effectiveDate ? (
              <p className="mx-auto mt-3.5 max-w-2xl text-xs font-medium text-muted-foreground min-[360px]:text-sm sm:mt-4">
                {t("lastUpdated", { date: page.effectiveDate })}
              </p>
            ) : null}
          </div>
        </section>
      )}

      {/* Translation-pending notice for English fallback */}
      {isFallback ? (
        <div className="mx-auto mt-6 w-full max-w-3xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-border bg-accent/60 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:text-sm">
            {t("translationNotice")}
          </div>
        </div>
      ) : null}

      {/* Content */}
      <section className="bg-background pb-16 pt-8 sm:pb-24 sm:pt-12">
        <div className="mx-auto max-w-3xl px-3 min-[360px]:px-4 sm:px-6 lg:px-8">
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <ContentBlocks
              blocks={firstBlockIsHero ? page.blocks.slice(1) : page.blocks}
              settings={settings}
              locale={locale}
            />
          </div>
        </div>
      </section>
    </div>
  );
}