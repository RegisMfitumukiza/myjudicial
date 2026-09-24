import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getExpertsIdProfile } from "@/api/generated";
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

  try {
    const res = await getExpertsIdProfile(id);
    if (res.status === 200 && "data" in res.data && res.data.success) {
      const expert = res.data.data;
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
          images: [{ url: "/og-image.png", width: 1200, height: 630 }],
          locale: localeOg,
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: ["/og-image.png"],
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
