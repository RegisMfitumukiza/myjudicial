import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PartnersClient from './partners-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'partnersPage.meta' });
  const localeOg = locale === 'fr' ? 'fr_FR' : locale === 'rw' ? 'rw_RW' : 'en_US';

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `https://myjudicial.com/${locale}/partners`,
      languages: {
        en: 'https://myjudicial.com/en/partners',
        fr: 'https://myjudicial.com/fr/partners',
        rw: 'https://myjudicial.com/rw/partners',
        'x-default': 'https://myjudicial.com/en/partners',
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `https://myjudicial.com/${locale}/partners`,
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

export default function PartnersPage() {
  return <PartnersClient />;
}
