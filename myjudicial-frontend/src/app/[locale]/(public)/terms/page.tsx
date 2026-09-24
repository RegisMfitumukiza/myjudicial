import type { Metadata } from 'next';
import TermsClient from './terms-client';

export const metadata: Metadata = {
  title: 'Terms of Service | MyJudicial',
  description: "Read the Terms of Service for using MyJudicial, Rwanda's legal services marketplace.",
  alternates: {
    canonical: 'https://myjudicial.com/en/terms',
    languages: {
      en: 'https://myjudicial.com/en/terms',
      fr: 'https://myjudicial.com/fr/terms',
      rw: 'https://myjudicial.com/rw/terms',
      'x-default': 'https://myjudicial.com/en/terms',
    },
  },
  openGraph: {
    title: 'Terms of Service | MyJudicial',
    description: 'Read the Terms of Service for MyJudicial.',
    url: 'https://myjudicial.com/en/terms',
    siteName: 'MyJudicial',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function TermsPage() {
  return <TermsClient />;
}
