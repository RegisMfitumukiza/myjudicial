import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { getGlobalSeoDefaults } from "@/features/public-content/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "helpPage.meta" });
  const { ogImageUrl } = await getGlobalSeoDefaults();

  const languageUrls = {
    en: "https://myjudicial.com/en/help",
    fr: "https://myjudicial.com/fr/help",
    rw: "https://myjudicial.com/rw/help",
    "x-default": "https://myjudicial.com/en/help",
  } as const;
  const pageUrl = `https://myjudicial.com/${locale}/help`;

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: false,
      follow: true,
    },
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
      title: t("title"),
      description: t("description"),
      url: pageUrl,
      siteName: "MyJudicial",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: "MyJudicial" }],
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

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/faqs", locale });
}