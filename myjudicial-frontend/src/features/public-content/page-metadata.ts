import "server-only";
import type { ContentPageSlug } from "@/lib/api/content-pages";
import { fetchPublicContentPage, fetchPublicPlatformSettings } from "./server";

export interface PageSeoOverrides {
  title?: string;
  description?: string;
  openGraphImage?: string;
}

export interface GlobalSeoDefaults {
  ogImageUrl: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

/**
 * Returns global SEO & Open Graph settings configured by admins in
 * Admin Dashboard → Settings → SEO & Open Graph.
 */
export async function getGlobalSeoDefaults(): Promise<GlobalSeoDefaults> {
  const settings = await fetchPublicPlatformSettings();
  return {
    ogImageUrl: settings?.ogImageUrl?.trim() || "/og-image.png",
    seoTitle: settings?.seoTitle?.trim() || undefined,
    seoDescription: settings?.seoDescription?.trim() || undefined,
    seoKeywords: settings?.seoKeywords?.trim() || undefined,
  };
}

/**
 * SEO overrides for a CMS page, when one is published.
 *
 * Checks in order:
 * 1. Per-page SEO overrides in the CMS Content Editor (`metaTitle`, `metaDescription`, `openGraphImage`).
 * 2. Global OG Image configured in Admin Dashboard → Settings → SEO.
 * 3. Default fallback `/og-image.png`.
 */
export async function getContentPageSeo(
  slug: ContentPageSlug,
  locale: string
): Promise<PageSeoOverrides | null> {
  const [content, settings] = await Promise.all([
    fetchPublicContentPage(slug, locale),
    fetchPublicPlatformSettings(),
  ]);

  const page = content?.page;
  const globalOgImage = settings?.ogImageUrl?.trim() || "/og-image.png";

  if (!page) {
    return {
      openGraphImage: globalOgImage,
    };
  }

  return {
    ...(page.metaTitle?.trim() ? { title: page.metaTitle.trim() } : {}),
    ...(page.metaDescription?.trim() ? { description: page.metaDescription.trim() } : {}),
    openGraphImage: page.openGraphImage?.trim() || globalOgImage,
  };
}