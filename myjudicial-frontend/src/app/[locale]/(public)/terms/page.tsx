import type { Metadata } from 'next';
import TermsClient from './terms-client';

export const metadata: Metadata = {
  title: 'Terms of Service | MyJudicial',
  description: "Read the Terms of Service for using MyJudicial, Rwanda's legal services marketplace.",
  alternates: {
    canonical: 'https://myjudicial.rw/en/terms',
    languages: {
      en: 'https://myjudicial.rw/en/terms',
      fr: 'https://myjudicial.rw/fr/terms',
      rw: 'https://myjudicial.rw/rw/terms',
      'x-default': 'https://myjudicial.rw/en/terms',
    },
  },
  openGraph: {
    title: 'Terms of Service | MyJudicial',
    description: 'Read the Terms of Service for MyJudicial.',
    url: 'https://myjudicial.rw/en/terms',
    siteName: 'MyJudicial',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function TermsPage() {
  return <TermsClient />;
}
