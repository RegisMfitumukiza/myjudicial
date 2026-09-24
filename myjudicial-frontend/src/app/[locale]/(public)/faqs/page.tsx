import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FaqsClient from "./faqs-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faqsPage.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://myjudicial.rw/${locale}/faqs`,
      languages: {
        en: "https://myjudicial.rw/en/faqs",
        fr: "https://myjudicial.rw/fr/faqs",
        rw: "https://myjudicial.rw/rw/faqs",
        "x-default": "https://myjudicial.rw/en/faqs",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `https://myjudicial.rw/${locale}/faqs`,
      siteName: "MyJudicial",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MyJudicial FAQs" }],
      locale: locale === "fr" ? "fr_FR" : locale === "rw" ? "rw_RW" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/og-image.png"],
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: Array.from({ length: 16 }, (_, i) => {
      const itemKey = `item${i + 1}` as const;
      return {
        "@type": "Question",
        name: t(`items.${itemKey}.q` as any),
        acceptedAnswer: {
          "@type": "Answer",
          text: t(`items.${itemKey}.a` as any),
        },
      };
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FaqsClient />
    </>
  );
}
