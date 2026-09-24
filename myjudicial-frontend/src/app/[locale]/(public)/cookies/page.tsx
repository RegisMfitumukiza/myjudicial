import type { Metadata } from 'next';
import CookiesClient from './cookies-client';

export const metadata: Metadata = {
  title: 'Cookie Policy | MyJudicial',
  description: 'Understand how MyJudicial uses cookies to improve your browsing experience.',
  alternates: {
    canonical: 'https://myjudicial.rw/en/cookies',
    languages: {
      en: 'https://myjudicial.rw/en/cookies',
      fr: 'https://myjudicial.rw/fr/cookies',
      rw: 'https://myjudicial.rw/rw/cookies',
      'x-default': 'https://myjudicial.rw/en/cookies',
    },
  },
  openGraph: {
    title: 'Cookie Policy | MyJudicial',
    description: 'Cookie policy for MyJudicial.',
    url: 'https://myjudicial.rw/en/cookies',
    siteName: 'MyJudicial',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function CookiesPage() {
  return <CookiesClient />;
}
