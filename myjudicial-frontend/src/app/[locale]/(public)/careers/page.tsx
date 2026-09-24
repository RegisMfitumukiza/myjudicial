import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import CareersClient from './careers-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'careersPage.meta' });
  const localeOg = locale === 'fr' ? 'fr_FR' : locale === 'rw' ? 'rw_RW' : 'en_US';

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `https://myjudicial.rw/${locale}/careers`,
      languages: {
        en: 'https://myjudicial.rw/en/careers',
        fr: 'https://myjudicial.rw/fr/careers',
        rw: 'https://myjudicial.rw/rw/careers',
        'x-default': 'https://myjudicial.rw/en/careers',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `https://myjudicial.rw/${locale}/careers`,
      siteName: 'MyJudicial',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'MyJudicial' }],
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

export default function CareersPage() {
  return <CareersClient />;
}
