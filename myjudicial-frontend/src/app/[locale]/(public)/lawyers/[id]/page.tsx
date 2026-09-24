import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getExpertsIdProfile } from "@/api/generated";
import { JsonLd } from "@/shared/components/seo/JsonLd";
import LawyerClient from "./lawyer-client";

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
      const specialty =
        expert.primarySpecialty
          ?.replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "";
      const name = expert.displayName ?? "";
      const bio = expert.bio ?? "";
      const city = expert.city ?? "Rwanda";

      const title = t("title", { name, specialty });
      const description = t("description", { name, specialty });

      return {
        title,
        description,
        alternates: {
          canonical: `https://myjudicial.com/${locale}/lawyers/${id}`,
          languages: {
            en: `https://myjudicial.com/en/lawyers/${id}`,
            fr: `https://myjudicial.com/fr/lawyers/${id}`,
            rw: `https://myjudicial.com/rw/lawyers/${id}`,
            "x-default": `https://myjudicial.com/en/lawyers/${id}`,
          },
        },
        openGraph: {
          title,
          description,
          url: `https://myjudicial.com/${locale}/lawyers/${id}`,
          siteName: "MyJudicial",
          images: [
            {
              url: "/og-image.png",
              width: 1200,
              height: 630,
              alt: `${name} — ${specialty} | MyJudicial`,
            },
          ],
          locale: localeOg,
          type: "profile",
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
    // API unavailable — fall back to generic metadata
  }

  // Generic fallback
  const fallbackTitle = t("fallbackTitle");
  const fallbackDesc = t("fallbackDescription");
  return {
    title: fallbackTitle,
    description: fallbackDesc,
    alternates: {
      canonical: `https://myjudicial.com/${locale}/lawyers/${id}`,
      languages: {
        en: `https://myjudicial.com/en/lawyers/${id}`,
        fr: `https://myjudicial.com/fr/lawyers/${id}`,
        rw: `https://myjudicial.com/rw/lawyers/${id}`,
        "x-default": `https://myjudicial.com/en/lawyers/${id}`,
      },
    },
    openGraph: {
      title: fallbackTitle,
      description: fallbackDesc,
      url: `https://myjudicial.com/${locale}/lawyers/${id}`,
      siteName: "MyJudicial",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
      locale: localeOg,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: fallbackTitle,
      description: fallbackDesc,
      images: ["/og-image.png"],
    },
  };
}

export default async function LawyerProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  // Attempt to build Person JSON-LD for the page
  let personJsonLd: Record<string, unknown> | null = null;
  try {
    const res = await getExpertsIdProfile(id);
    if (res.status === 200 && "data" in res.data && res.data.success) {
      const expert = res.data.data;
      const specialty =
        expert.primarySpecialty
          ?.replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (c: string) => c.toUpperCase()) ?? "";
      personJsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: expert.displayName,
        jobTitle: specialty,
        description: expert.bio ?? "",
        url: `https://myjudicial.com/en/lawyers/${id}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: expert.city ?? "Kigali",
          addressCountry: "RW",
        },
        worksFor: {
          "@type": "LegalService",
          name: expert.firmName ?? "MyJudicial",
          url: "https://myjudicial.com",
        },
      };
    }
  } catch {
    // No JSON-LD if API unavailable
  }

  return (
    <>
      {personJsonLd && <JsonLd data={personJsonLd} />}
      <LawyerClient params={params} />
    </>
  );
}