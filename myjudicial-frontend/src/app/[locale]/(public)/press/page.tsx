import type { Metadata } from 'next';
import PressClient from './press-client';

export const metadata: Metadata = {
  title: 'Press & Media | MyJudicial',
  description: 'MyJudicial press resources, media kit, and news coverage. Contact our communications team for media inquiries.',
  alternates: {
    canonical: 'https://myjudicial.com/en/press',
    languages: {
      en: 'https://myjudicial.com/en/press',
      fr: 'https://myjudicial.com/fr/press',
      rw: 'https://myjudicial.com/rw/press',
      'x-default': 'https://myjudicial.com/en/press',
    },
  },
  openGraph: {
    title: 'Press & Media | MyJudicial',
    description: 'MyJudicial press and media resources.',
    url: 'https://myjudicial.com/en/press',
    siteName: 'MyJudicial',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function PressPage() {
  return <PressClient />;
}
