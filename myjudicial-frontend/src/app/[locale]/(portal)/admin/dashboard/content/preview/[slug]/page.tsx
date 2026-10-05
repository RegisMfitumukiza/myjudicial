import "server-only";

import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getCurrentSession } from "@/server/auth/session";
import { PublicContentPageView } from "@/features/public-content/public-content-renderer";
import { fetchPublicPlatformSettings } from "@/features/public-content/server";
import type {
  ContentLocale,
  ContentPage,
  ContentPageSlug,
} from "@/lib/api/content-pages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function adminApiBase(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
  const prefix = (process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1").replace(/\/+$/, "");
  return `${base}${prefix}`;
}

/**
 * Admin preview: renders the exact public markup for the currently saved
 * (draft or published) page. The route is only reachable while logged in as an
 * admin, and the draft content is only ever shown inside the dashboard, never
 * on a public path.
 */
export default async function ContentPreviewPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const session = await getCurrentSession();
  if (!session || session.user.role !== "ADMIN") return notFound();

  const apiSlug = slug.toUpperCase() as ContentPageSlug;
  const apiLocale = locale as ContentLocale;

  let page: ContentPage | null = null;
  try {
    const res = await fetch(
      `${adminApiBase()}/admin/content/${apiSlug}?locale=${encodeURIComponent(apiLocale)}`,
      {
        headers: session.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : undefined,
        cache: "no-store",
      }
    );
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const payload = JSON.parse(text) as {
          success: boolean;
          data: { page: ContentPage | null };
        };
        page = payload?.data?.page ?? null;
      }
    }
  } catch {
    page = null;
  }

  const settings = await fetchPublicPlatformSettings();

  return (
    <PublicContentPageView
      slug={apiSlug}
      locale={locale}
      content={
        page
          ? { page, servedLocale: apiLocale, isFallback: false }
          : null
      }
      settings={settings}
      isPreview
    />
  );
}