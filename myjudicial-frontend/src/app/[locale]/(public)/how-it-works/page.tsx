import type { Metadata } from "next";
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
      canonical: `https://myjudicial.com/${locale}/how-it-works`,
      languages: {
        en: "https://myjudicial.com/en/how-it-works",
        fr: "https://myjudicial.com/fr/how-it-works",
        rw: "https://myjudicial.com/rw/how-it-works",
        "x-default": "https://myjudicial.com/en/how-it-works",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `https://myjudicial.com/${locale}/how-it-works`,
      siteName: "MyJudicial",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: t("ogAlt") }],
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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale } = await params;
  const { tab } = await searchParams;
  const initialTab = tab === "advocates" || tab === "lawyers" ? "advocates" : "clients";
  const t = await getTranslations({ locale, namespace: "howItWorksPage" });

  const clientSteps = [1, 2, 3, 4].map((stepNum) => ({
    "@type": "HowToStep",
    position: stepNum,
    name: t(`clientJourney.step${stepNum}.title` as any),
    text: t(`clientJourney.step${stepNum}.desc` as any),
  }));

  const advocateSteps = [1, 2, 3, 4].map((stepNum) => ({
    "@type": "HowToStep",
    position: stepNum,
    name: t(`advocateJourney.step${stepNum}.title` as any),
    text: t(`advocateJourney.step${stepNum}.desc` as any),
  }));

  const clientFaqs = [1, 2, 3, 4, 5, 6].map((num) => ({
    "@type": "Question",
    name: t(`faqs.clientQ${num}` as any),
    acceptedAnswer: {
      "@type": "Answer",
      text: t(`faqs.clientA${num}` as any),
    },
  }));

  const advocateFaqs = [1, 2, 3, 4, 5, 6].map((num) => ({
    "@type": "Question",
    name: t(`faqs.advocateQ${num}` as any),
    acceptedAnswer: {
      "@type": "Answer",
      text: t(`faqs.advocateA${num}` as any),
    },
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HowTo",
        name: t("clientJourney.title"),
        description: t("clientJourney.subtitle"),
        step: clientSteps,
      },
      {
        "@type": "HowTo",
        name: t("advocateJourney.title"),
        description: t("advocateJourney.subtitle"),
        step: advocateSteps,
      },
      {
        "@type": "FAQPage",
        mainEntity: [...clientFaqs, ...advocateFaqs],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HowItWorksClient initialTab={initialTab} />
    </>
  );
}
