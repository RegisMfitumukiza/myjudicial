import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LandingPage from "./landing-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.meta" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: "https://myjudicial.rw",
      siteName: "MyJudicial",
      images: [{ url: "/og-image.png" }],
      locale: locale === "fr" ? "fr_FR" : locale === "rw" ? "rw_RW" : "en_US",
      type: "website",
    },
  };
}

export default function HomePage() {
  return <LandingPage />;
}
