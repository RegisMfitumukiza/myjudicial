import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/*/expert/',
          '/*/client/',
          '/*/admin/',
          '/*/onboarding',
          '/*/sign-in',
          '/*/sign-up',
          '/*/forgot-password',
          '/*/reset-password',
          '/*/post-auth',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://myjudicial.com/sitemap.xml',
  };
}
