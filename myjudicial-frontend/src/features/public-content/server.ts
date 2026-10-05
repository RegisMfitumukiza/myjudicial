import "server-only";
import type {
  ContentPageResponse,
  ContentPageSlug,
} from "@/lib/api/content-pages";
import type { PlatformPublicSettings } from "@/features/settings/hooks/useSocialLinks";

/**
 * Server-only access to the public content + settings endpoints.
 *
 * Deliberately avoids `@/lib/api/client`: that module imports `next-auth/react`
 * and talks to the token refresh/auth flow, which a server component must not
 * touch. Public read endpoints never require credentials.
 */

function publicApiBase(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
  const prefix = (process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/v1").replace(/\/+$/, "");
  return `${base}${prefix}`;
}

/**
 * Published content for `slug` at `locale`. Returns `null` on unpublished
 * pages and on backend failures so the caller can degrade to a fallback UI
 * instead of hard-failing a public route.
 */
export async function fetchPublicContentPage(
  slug: ContentPageSlug,
  locale: string
): Promise<ContentPageResponse | null> {
  try {
    const res = await fetch(
      `${publicApiBase()}/content/pages/${slug}?locale=${encodeURIComponent(locale)}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || !text.trim()) return null;
    const payload = JSON.parse(text) as { success: boolean; data: ContentPageResponse };
    return payload?.data ?? null;
  } catch {
    return null;
  }
}

/** Public platform settings, used by the contact/jobs/faq dynamic blocks. */
export async function fetchPublicPlatformSettings(): Promise<PlatformPublicSettings | null> {
  try {
    const res = await fetch(`${publicApiBase()}/settings`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || !text.trim()) return null;
    const payload = JSON.parse(text) as { success: boolean; data: PlatformPublicSettings };
    return payload?.data ?? null;
  } catch {
    return null;
  }
}