import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getContentPageSeo } from "@/features/public-content/page-metadata";
import { PublicContentPage } from "@/features/public-content/public-content-renderer";
import FaqsClient from "./faqs-client";
import { fetchPublicPlatformSettings } from "@/features/public-content/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faqsPage.meta" });
  const localeOg = locale === "fr" ? "fr_FR" : locale === "rw" ? "rw_RW" : "en_US";
  const seo = await getContentPageSeo("HELP", locale);
  const title = seo?.title ?? t("title");
  const description = seo?.description ?? t("description");
  const ogImage = seo?.openGraphImage ?? "/og-image.png";

  return {
    title,
    description,
    alternates: {
      canonical: `https://myjudicial.com/${locale}/faqs`,
      languages: {
        en: "https://myjudicial.com/en/faqs",
        fr: "https://myjudicial.com/fr/faqs",
        rw: "https://myjudicial.com/rw/faqs",
        "x-default": "https://myjudicial.com/en/faqs",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://myjudicial.com/${locale}/faqs`,
      siteName: "MyJudicial",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "MyJudicial FAQs" }],
      locale: localeOg,
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

export default async function FaqsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faqsPage" });
  const settings = await fetchPublicPlatformSettings();

  const coreFaqs = Array.from({ length: 16 }, (_, i) => {
    const itemKey = `item${i + 1}` as const;
    return {
      "@type": "Question",
      name: t(`items.${itemKey}.q` as any),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`items.${itemKey}.a` as any),
      },
    };
  });
  const supplementalFaqs = (settings?.supplementalFaqs ?? []).map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  }));

  const hasPopulatedCore = (settings?.supplementalFaqs ?? []).some(
    (f) => f.id.startsWith("item") || f.id.startsWith("faq-")
  );
  const mainEntity = hasPopulatedCore
    ? supplementalFaqs
    : [...coreFaqs, ...supplementalFaqs];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicContentPage
        slug="HELP"
        locale={locale}
        fallback={<FaqsClient />}
      />
    </>
  );
}
