import { Suspense } from 'react';
import { SearchPageClient } from '@/features/search/components/search-page-client';
import { SearchPageSkeleton } from './loading';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Legal Experts | MyJudicial',
  description: 'Find verified lawyers and legal experts by specialty, location, rating, and availability. Book consultations instantly.',
  alternates: {
    canonical: 'https://myjudicial.com/en/search',
    languages: {
      en: 'https://myjudicial.com/en/search',
      fr: 'https://myjudicial.com/fr/search',
      rw: 'https://myjudicial.com/rw/search',
      'x-default': 'https://myjudicial.com/en/search',
    },
  },
  openGraph: {
    title: 'Search Legal Experts | MyJudicial',
    description: 'Find verified lawyers and legal experts by specialty, location, and availability.',
    url: 'https://myjudicial.com/en/search',
    siteName: 'MyJudicial',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Search Lawyers — MyJudicial' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Legal Experts | MyJudicial',
    description: 'Search verified lawyers by specialty, location, and availability.',
    images: ['/og-image.png'],
  },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageClient />
    </Suspense>
  );
}
