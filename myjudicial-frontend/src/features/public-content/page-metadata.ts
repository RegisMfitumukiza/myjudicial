import "server-only";
import type { ContentPageSlug } from "@/lib/api/content-pages";
import { fetchPublicContentPage } from "./server";

export interface PageSeoOverrides {
  title?: string;
  description?: string;
  openGraphImage?: string;
}

/**
 * SEO overrides for a CMS page, when one is published.
 *
 * Only published content is returned (with the documented EN fallback for
 * fr/rw), so a page that is still a draft — or a page where the admin never
 * wrote SEO fields — falls back to the i18n defaults the page already ships.
 */
export async function getContentPageSeo(
  slug: ContentPageSlug,
  locale: string
): Promise<PageSeoOverrides | null> {
  const content = await fetchPublicContentPage(slug, locale);
  const page = content?.page;
  if (!page) return null;

  return {
    ...(page.metaTitle?.trim() ? { title: page.metaTitle.trim() } : {}),
    ...(page.metaDescription?.trim() ? { description: page.metaDescription.trim() } : {}),
    ...(page.openGraphImage?.trim() ? { openGraphImage: page.openGraphImage.trim() } : {}),
  };
}