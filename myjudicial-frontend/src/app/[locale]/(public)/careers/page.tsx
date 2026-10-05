import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getContentPageSeo } from '@/features/public-content/page-metadata';
import CareersClient from './careers-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'careersPage.meta' });
  const localeOg = locale === 'fr' ? 'fr_FR' : locale === 'rw' ? 'rw_RW' : 'en_US';
  const seo = await getContentPageSeo('CAREERS', locale);
  const title = seo?.title ?? t('title');
  const description = seo?.description ?? t('description');
  const ogImage = seo?.openGraphImage ?? '/og-image.png';

  return {
    title,
    description,
    alternates: {
      canonical: `https://myjudicial.com/${locale}/careers`,
      languages: {
        en: 'https://myjudicial.com/en/careers',
        fr: 'https://myjudicial.com/fr/careers',
        rw: 'https://myjudicial.com/rw/careers',
        'x-default': 'https://myjudicial.com/en/careers',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://myjudicial.com/${locale}/careers`,
      siteName: 'MyJudicial',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'MyJudicial' }],
      locale: localeOg,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function CareersPage() {
  return <CareersClient />;
}
