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

  return {
    title: t('title'),
    description: t('description'),
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
      title: t('title'),
      description: t('description'),
      url: `https://myjudicial.com/${locale}`,
      siteName: 'MyJudicial',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'MyJudicial — Legal Services Marketplace' }],
      locale: localeOg,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/og-image.png'],
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
