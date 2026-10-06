import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AiWorkspace } from '@/features/ai/components/ai-workspace';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'AI Legal Assistant | MyJudicial',
  description: "Use MyJudicial's AI-powered legal assistant to understand your legal situation, find the right specialist, and get instant preliminary guidance — in English, French, or Kinyarwanda.",
  alternates: {
    canonical: 'https://myjudicial.com/en/ai',
    languages: {
      en: 'https://myjudicial.com/en/ai',
      fr: 'https://myjudicial.com/fr/ai',
      rw: 'https://myjudicial.com/rw/ai',
      'x-default': 'https://myjudicial.com/en/ai',
    },
  },
  openGraph: {
    title: 'AI Legal Assistant | MyJudicial',
    description: 'Get AI-powered legal guidance in English, French, or Kinyarwanda.',
    url: 'https://myjudicial.com/en/ai',
    siteName: 'MyJudicial',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'MyJudicial AI Legal Assistant' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Legal Assistant | MyJudicial',
    description: 'AI-powered legal guidance in 3 languages.',
    images: ['/og-image.png'],
  },
};

export default function AiPage() {
  return (
    <Suspense fallback={<AiPageFallback />}>
      <AiWorkspace />
    </Suspense>
  );
}

function AiPageFallback() {
  const t = useTranslations('common');
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      {t('loading')}
    </div>
  );
}
