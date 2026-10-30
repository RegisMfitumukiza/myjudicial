import type { MetadataRoute } from 'next';

const BASE_URL = 'https://myjudicial.com';
const LOCALES = ['en', 'fr', 'rw'] as const;

const STATIC_ROUTES = [
  '',
  '/about',
  '/how-it-works',
  '/practice-areas',
  '/search',
  '/faqs',
  '/pricing',
  '/contact',
  '/partners',
  '/careers',
  '/ai',
  '/terms',
  '/privacy',
  '/cookies',
];

function buildAlternates(path: string) {
  return Object.fromEntries(
    LOCALES.map((locale) => [locale, `${BASE_URL}/${locale}${path}`])
  ) as Record<string, string>;
}

function getApiUrl(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
  const prefix = (process.env.NEXT_PUBLIC_API_PREFIX ?? '/api/v1').replace(/\/+$/, '');
  return `${base}${prefix}`;
}

async function getExpertIds(): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    const res = await fetch(
      `${getApiUrl()}/experts?status=ACTIVE&limit=500&fields=id`,
      { next: { revalidate: 86400 }, signal: controller.signal } // cache 24h
    );
    clearTimeout(timeout);
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || !text.trim()) return [];
    const json = JSON.parse(text);
    const experts: Array<{ id: string }> = json?.data?.experts ?? (Array.isArray(json?.data) ? json.data : []);
    return experts.map((e) => e.id).filter(Boolean);
  } catch {
    return []; // Gracefully degrade — static routes still included
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency: path === '' ? ('daily' as const) : ('weekly' as const),
      priority: path === '' ? 1.0 : path === '/search' || path === '/practice-areas' ? 0.9 : 0.7,
      alternates: {
        languages: buildAlternates(path),
      },
    }))
  );

  // Dynamic lawyer profile routes
  const expertIds = await getExpertIds();
  const dynamicEntries: MetadataRoute.Sitemap = expertIds.flatMap((id) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}/lawyers/${id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.85,
      alternates: {
        languages: buildAlternates(`/lawyers/${id}`),
      },
    }))
  );

  return [...staticEntries, ...dynamicEntries];
}
