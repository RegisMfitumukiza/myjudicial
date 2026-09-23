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

export default function HowItWorksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HowItWorksClient />
    </Suspense>
  );
}
