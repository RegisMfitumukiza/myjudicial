import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { JsonLd } from '@/shared/components/seo/JsonLd';
import { contactPageJsonLd } from '@/features/public-content/json-ld';
import { fetchPublicPlatformSettings } from '@/features/public-content/server';
import { getContentPageSeo } from '@/features/public-content/page-metadata';
import ContactClient from './contact-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contactPage.meta' });
  const localeOg = locale === 'fr' ? 'fr_FR' : locale === 'rw' ? 'rw_RW' : 'en_US';
  const seo = await getContentPageSeo('CONTACT', locale);
  const title = seo?.title ?? t('title');
  const description = seo?.description ?? t('description');
  const ogImage = seo?.openGraphImage ?? '/og-image.png';

  return {
    title,
    description,
    alternates: {
      canonical: `https://myjudicial.com/${locale}/contact`,
      languages: {
        en: 'https://myjudicial.com/en/contact',
        fr: 'https://myjudicial.com/fr/contact',
        rw: 'https://myjudicial.com/rw/contact',
        'x-default': 'https://myjudicial.com/en/contact',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://myjudicial.com/${locale}/contact`,
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

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contactPage.meta' });
  const seo = await getContentPageSeo('CONTACT', locale);
  const title = seo?.title ?? t('title');
  const description = seo?.description ?? t('description');
  const settings = await fetchPublicPlatformSettings();

  return (
    <>
      {settings ? (
        <JsonLd
          data={contactPageJsonLd({
            title,
            description,
            url: `https://myjudicial.com/${locale}/contact`,
            locale,
            settings,
          })}
        />
      ) : null}
      <ContactClient />
    </>
  );
}

