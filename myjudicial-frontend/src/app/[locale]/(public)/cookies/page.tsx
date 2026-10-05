import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { LegalPageKey } from "@/features/public-content/legal-page-client";
import LegalPageClient from "@/features/public-content/legal-page-client";
import { PublicContentPage } from "@/features/public-content/public-content-renderer";
import { getContentPageSeo } from "@/features/public-content/page-metadata";

const LEGAL_SLUG = "COOKIES" as const;
const LEGAL_PAGE_KEY: LegalPageKey = "cookies";

function describe(intro: string): string {
  const normalized = intro.replace(/\s+/g, " ").trim();
  return normalized.length > 155 ? `${normalized.slice(0, 152).trimEnd()}…` : normalized;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: `legalPages.${LEGAL_PAGE_KEY}` });

  const seo = await getContentPageSeo(LEGAL_SLUG, locale);
  const title = seo?.title ?? t("meta.title", { defaultValue: `${t("hero.title")} | MyJudicial` });
  const description = seo?.description ?? t("meta.description", { defaultValue: describe(t("content.intro")) });
  const ogImage = seo?.openGraphImage ?? "/og-image.png";
  const languageUrls = {
    en: "https://myjudicial.com/en/cookies",
    fr: "https://myjudicial.com/fr/cookies",
    rw: "https://myjudicial.com/rw/cookies",
    "x-default": "https://myjudicial.com/en/cookies",
  } as const;
  const pageUrl = `https://myjudicial.com/${locale}/cookies`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
      languages: languageUrls,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "MyJudicial",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "MyJudicial" }],
      locale: locale === "fr" ? "fr_FR" : locale === "rw" ? "rw_RW" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <PublicContentPage slug={LEGAL_SLUG} locale={locale} fallback={<LegalPageClient pageKey={LEGAL_PAGE_KEY} />} />;
}