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
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://myjudicial.rw/how-it-works",
      siteName: "MyJudicial",
      images: [{ url: "/og-image.png" }],
      locale: locale === "fr" ? "fr_FR" : locale === "rw" ? "rw_RW" : "en_US",
      type: "website",
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
