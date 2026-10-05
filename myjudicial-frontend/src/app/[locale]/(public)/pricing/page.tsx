import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getGlobalSeoDefaults } from "@/features/public-content/page-metadata";
import PricingClient from "./pricing-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricingPage.meta" });
  const { ogImageUrl } = await getGlobalSeoDefaults();

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://myjudicial.com/${locale}/pricing`,
      languages: {
        en: "https://myjudicial.com/en/pricing",
        fr: "https://myjudicial.com/fr/pricing",
        rw: "https://myjudicial.com/rw/pricing",
        "x-default": "https://myjudicial.com/en/pricing",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `https://myjudicial.com/${locale}/pricing`,
      siteName: "MyJudicial",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: "MyJudicial Pricing" }],
      locale: locale === "fr" ? "fr_FR" : locale === "rw" ? "rw_RW" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [ogImageUrl],
    },
  };
}

export default function PricingPage() {
  return <PricingClient />;
}
