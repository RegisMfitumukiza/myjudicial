import type { PlatformPublicSettings } from "@/features/settings/hooks/useSocialLinks";

export function organizationJsonLd(settings: PlatformPublicSettings): Record<string, unknown> {
  const socialLinks = settings.socialLinks ?? {};
  const sameAs = Object.values(socialLinks).filter((url): url is string => typeof url === "string" && url.length > 0);
  const streetAddress = [settings.officeBuilding, settings.officeStreet].filter(Boolean).join(", ");

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.platformName || "MyJudicial",
    url: "https://myjudicial.com",
    email: settings.supportEmail,
    telephone: settings.hotlinePhone,
    ...(settings.ogImageUrl ? { logo: settings.ogImageUrl } : {}),
    ...(settings.seoDescription ? { description: settings.seoDescription } : {}),
    address: {
      "@type": "PostalAddress",
      ...(streetAddress ? { streetAddress } : {}),
      ...(settings.officeDistrict ? { addressLocality: settings.officeDistrict } : {}),
      ...(settings.officePoBox ? { postOfficeBoxNumber: settings.officePoBox } : {}),
      addressCountry: "RW",
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function legalWebPageJsonLd({
  title,
  description,
  url,
  locale,
  dateModified,
  settings,
}: {
  title: string;
  description: string;
  url: string;
  locale: string;
  dateModified?: string | null;
  settings: PlatformPublicSettings;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: title,
        description,
        inLanguage: locale === "fr" ? "fr" : locale === "rw" ? "rw" : "en",
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://myjudicial.com/#website",
          url: "https://myjudicial.com",
          name: settings.platformName || "MyJudicial",
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `https://myjudicial.com/${locale}`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: title,
              item: url,
            },
          ],
        },
        ...(dateModified ? { dateModified } : {}),
      },
      organizationJsonLd(settings),
    ],
  };
}

export function contactPageJsonLd({
  title,
  description,
  url,
  locale,
  settings,
}: {
  title: string;
  description: string;
  url: string;
  locale: string;
  settings: PlatformPublicSettings;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": url,
        url,
        name: title,
        description,
        inLanguage: locale === "fr" ? "fr" : locale === "rw" ? "rw" : "en",
        isPartOf: {
          "@type": "WebSite",
          "@id": "https://myjudicial.com/#website",
          url: "https://myjudicial.com",
          name: settings.platformName || "MyJudicial",
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `https://myjudicial.com/${locale}`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: title,
              item: url,
            },
          ],
        },
        mainEntity: {
          "@type": "ContactPoint",
          contactType: "customer support",
          ...(settings.hotlinePhone ? { telephone: settings.hotlinePhone } : {}),
          ...(settings.supportEmail ? { email: settings.supportEmail } : {}),
          availableLanguage: ["English", "French", "Kinyarwanda"],
          ...(settings.supportWorkingHours ? { hoursAvailable: settings.supportWorkingHours } : {}),
          areaServed: "RW",
        },
      },
      organizationJsonLd(settings),
    ],
  };
}