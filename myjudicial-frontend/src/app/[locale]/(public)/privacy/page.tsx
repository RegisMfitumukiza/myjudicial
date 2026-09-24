import type { Metadata } from 'next';
import PrivacyClient from './privacy-client';

export const metadata: Metadata = {
  title: 'Privacy Policy | MyJudicial',
  description: 'Learn how MyJudicial collects, uses, and protects your personal information in Rwanda.',
  alternates: {
    canonical: 'https://myjudicial.com/en/privacy',
    languages: {
      en: 'https://myjudicial.com/en/privacy',
      fr: 'https://myjudicial.com/fr/privacy',
      rw: 'https://myjudicial.com/rw/privacy',
      'x-default': 'https://myjudicial.com/en/privacy',
    },
  },
  openGraph: {
    title: 'Privacy Policy | MyJudicial',
    description: 'MyJudicial privacy policy and data protection practices.',
    url: 'https://myjudicial.com/en/privacy',
    siteName: 'MyJudicial',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
