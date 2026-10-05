import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getExpertsIdProfile } from "@/api/generated";
import { getGlobalSeoDefaults } from "@/features/public-content/page-metadata";
import BookClient from "./book-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "lawyerProfile.meta" });
  const localeOg =
    locale === "fr" ? "fr_FR" : locale === "rw" ? "rw_RW" : "en_US";

  // Fetch expert profile and global OG image in parallel
  const [expertRes, { ogImageUrl }] = await Promise.all([
    getExpertsIdProfile(id).catch(() => null),
    getGlobalSeoDefaults(),
  ]);

  try {
    if (expertRes && expertRes.status === 200 && "data" in expertRes.data && expertRes.data.success) {
      const expert = expertRes.data.data;
      const name = expert.displayName ?? "";
      const specialty =
        expert.primarySpecialty
          ?.replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "";
      const title = t("bookTitle", { name });
      const description = t("bookDescription", { name, specialty });

      return {
        title,
        description,
        robots: { index: false, follow: true },
        alternates: {
          canonical: `https://myjudicial.com/${locale}/lawyers/${id}/book`,
          languages: {
            en: `https://myjudicial.com/en/lawyers/${id}/book`,
            fr: `https://myjudicial.com/fr/lawyers/${id}/book`,
            rw: `https://myjudicial.com/rw/lawyers/${id}/book`,
            "x-default": `https://myjudicial.com/en/lawyers/${id}/book`,
          },
        },
        openGraph: {
          title,
          description,
          url: `https://myjudicial.com/${locale}/lawyers/${id}/book`,
          siteName: "MyJudicial",
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
          locale: localeOg,
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [ogImageUrl],
        },
      };
    }
  } catch {
    // Fall through to generic
  }

  const fallbackTitle = t("bookFallbackTitle");
  return {
    title: fallbackTitle,
    robots: { index: false, follow: true },
  };
}

export default function BookingPage(props: {
  params: Promise<{ locale: string; id: string }>;
}) {
  return <BookClient params={props.params} />;
}
