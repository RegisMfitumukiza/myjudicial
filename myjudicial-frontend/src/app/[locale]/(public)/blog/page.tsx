import type { Metadata } from 'next';
import BlogClient from './blog-client';

export const metadata: Metadata = {
  title: 'Blog | MyJudicial',
  description: "Read the latest legal news, insights, and updates from the MyJudicial team and Rwanda's top legal experts.",
  alternates: {
    canonical: 'https://myjudicial.rw/en/blog',
    languages: {
      en: 'https://myjudicial.rw/en/blog',
      fr: 'https://myjudicial.rw/fr/blog',
      rw: 'https://myjudicial.rw/rw/blog',
      'x-default': 'https://myjudicial.rw/en/blog',
    },
  },
  openGraph: {
    title: 'Blog | MyJudicial',
    description: 'Latest legal news from MyJudicial.',
    url: 'https://myjudicial.rw/en/blog',
    siteName: 'MyJudicial',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function BlogPage() {
  return <BlogClient />;
}
