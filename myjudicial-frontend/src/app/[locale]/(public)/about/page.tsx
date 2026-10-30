import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getContentPageSeo } from '@/features/public-content/page-metadata';
import { PublicContentPage } from '@/features/public-content/public-content-renderer';
import AboutClient from './about-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about.meta' });
  const localeOg = locale === 'fr' ? 'fr_FR' : locale === 'rw' ? 'rw_RW' : 'en_US';
  const seo = await getContentPageSeo('ABOUT', locale);
  const title = seo?.title ?? t('title');
  const description = seo?.description ?? t('description');
  const ogImage = seo?.openGraphImage ?? '/og-image.png';

  return {
    title,
    description,
    alternates: {
      canonical: `https://myjudicial.com/${locale}/about`,
      languages: {
        en: 'https://myjudicial.com/en/about',
        fr: 'https://myjudicial.com/fr/about',
        rw: 'https://myjudicial.com/rw/about',
        'x-default': 'https://myjudicial.com/en/about',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://myjudicial.com/${locale}/about`,
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

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <PublicContentPage
      slug="ABOUT"
      locale={locale}
      fallback={<AboutClient />}
    />
  );
}
