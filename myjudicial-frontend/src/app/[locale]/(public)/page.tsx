import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import LandingPage from './landing-client';
import { JsonLd } from '@/shared/components/seo/JsonLd';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing.meta' });
  const localeOg = locale === 'fr' ? 'fr_FR' : locale === 'rw' ? 'rw_RW' : 'en_US';

  let ogImage = '/og-image.png';
  let dynamicTitle = t('title');
  let dynamicDescription = t('description');
  let dynamicKeywords: string[] = [];

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    const apiPrefix = process.env.NEXT_PUBLIC_API_PREFIX ?? '/api/v1';
    const res = await fetch(`${apiUrl}${apiPrefix}/settings`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(1500),
    });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const json = JSON.parse(text);
        if (json?.data?.ogImageUrl) ogImage = json.data.ogImageUrl;
        if (json?.data?.seoTitle) dynamicTitle = json.data.seoTitle;
        if (json?.data?.seoDescription) dynamicDescription = json.data.seoDescription;
        if (json?.data?.seoKeywords) {
          dynamicKeywords = json.data.seoKeywords
            .split(',')
            .map((k: string) => k.trim())
            .filter(Boolean);
        }
      }
    }
  } catch {
    // Non-blocking fallback to default static metadata
  }

  return {
    title: dynamicTitle,
    description: dynamicDescription,
    ...(dynamicKeywords.length > 0 ? { keywords: dynamicKeywords } : {}),
    alternates: {
      canonical: `https://myjudicial.com/${locale}`,
      languages: {
        en: 'https://myjudicial.com/en',
        fr: 'https://myjudicial.com/fr',
        rw: 'https://myjudicial.com/rw',
        'x-default': 'https://myjudicial.com/en',
      },
    },
    openGraph: {
      title: dynamicTitle,
      description: dynamicDescription,
      url: `https://myjudicial.com/${locale}`,
      siteName: 'MyJudicial',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'MyJudicial — Legal Services Marketplace' }],
      locale: localeOg,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: dynamicTitle,
      description: dynamicDescription,
      images: [ogImage],
    },
  };
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'MyJudicial',
  url: 'https://myjudicial.com',
  description: "Rwanda's leading legal services marketplace connecting clients with verified lawyers.",
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://myjudicial.com/en/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const legalServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LegalService',
  name: 'MyJudicial',
  url: 'https://myjudicial.com',
  logo: 'https://myjudicial.com/myjudicial-logo.png',
  description: "Rwanda's premier platform for booking verified legal experts. Fixed fees, instant booking, video consultations.",
  areaServed: {
    '@type': 'Country',
    name: 'Rwanda',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Kigali',
    addressCountry: 'RW',
  },
  sameAs: [
    'https://twitter.com/myjudicial',
    'https://linkedin.com/company/myjudicial',
  ],
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={legalServiceJsonLd} />
      <LandingPage />
    </>
  );
}
