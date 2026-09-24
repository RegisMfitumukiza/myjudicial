import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import HowItWorksClient from "./how-it-works-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "howItWorksPage.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://myjudicial.rw/${locale}/how-it-works`,
      languages: {
        en: "https://myjudicial.rw/en/how-it-works",
        fr: "https://myjudicial.rw/fr/how-it-works",
        rw: "https://myjudicial.rw/rw/how-it-works",
        "x-default": "https://myjudicial.rw/en/how-it-works",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `https://myjudicial.rw/${locale}/how-it-works`,
      siteName: "MyJudicial",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "How MyJudicial Works" }],
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

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "howItWorksPage" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        name: t("clientJourney.title"),
        description: t("clientJourney.subtitle"),
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: t("clientJourney.step1.title"),
            text: t("clientJourney.step1.desc"),
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: t("clientJourney.step2.title"),
            text: t("clientJourney.step2.desc"),
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: t("clientJourney.step3.title"),
            text: t("clientJourney.step3.desc"),
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: t("clientJourney.step4.title"),
            text: t("clientJourney.step4.desc"),
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [1, 2, 3, 4, 5, 6].map((num) => ({
          "@type": "Question",
          name: t(`faqs.clientQ${num}` as any),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(`faqs.clientA${num}` as any),
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <HowItWorksClient />
      </Suspense>
    </>
  );
}
