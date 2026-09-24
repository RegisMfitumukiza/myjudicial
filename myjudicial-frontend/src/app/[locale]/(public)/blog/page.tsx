import type { Metadata } from 'next';
import BlogClient from './blog-client';

export const metadata: Metadata = {
  title: 'Blog | MyJudicial',
  description: "Read the latest legal news, insights, and updates from the MyJudicial team and Rwanda's top legal experts.",
  alternates: {
    canonical: 'https://myjudicial.com/en/blog',
    languages: {
      en: 'https://myjudicial.com/en/blog',
      fr: 'https://myjudicial.com/fr/blog',
      rw: 'https://myjudicial.com/rw/blog',
      'x-default': 'https://myjudicial.com/en/blog',
    },
  },
  openGraph: {
    title: 'Blog | MyJudicial',
    description: 'Latest legal news from MyJudicial.',
    url: 'https://myjudicial.com/en/blog',
    siteName: 'MyJudicial',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
};

export default function BlogPage() {
  return <BlogClient />;
}
