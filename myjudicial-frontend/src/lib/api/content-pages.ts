import { apiFetch } from "./client";

/**
 * Admin-authored public content pages.
 *
 * Mirrors the backend contract in `myjudicial-backend/src/modules/content`.
 * Page bodies are ordered typed blocks, not free-form markup: an admin chooses
 * what the page says, and the renderer decides how it looks.
 */

export const CONTENT_PAGE_SLUGS = [
  "ABOUT",
  "CAREERS",
  "HELP",
  "CONTACT",
  "PRIVACY",
  "TERMS",
  "COOKIES",
] as const;

export type ContentPageSlug = (typeof CONTENT_PAGE_SLUGS)[number];

export const CONTENT_LOCALES = ["en", "fr", "rw"] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

export type ContentPageStatus = "draft" | "published";

export type CalloutTone = "info" | "warning";

export type ContentBlockType =
  | "prose"
  | "bullets"
  | "steps"
  | "callout"
  | "table"
  | "coreValues"
  | "milestones"
  | "contactCard"
  | "jobs"
  | "faq"
  | "hero"
  | "statsBand"
  | "ctaBand"
  | "image";

export type ContentBlock =
  | { id: string; type: "prose"; heading?: string; body: string }
  | { id: string; type: "bullets"; heading?: string; items: string[] }
  | { id: string; type: "steps"; heading?: string; items: string[] }
  | { id: string; type: "callout"; heading?: string; body: string; tone: CalloutTone }
  | { id: string; type: "table"; heading?: string; columns: string[]; rows: string[][] }
  | { id: string; type: "coreValues"; heading?: string; values: CoreValueItem[] }
  | { id: string; type: "milestones"; heading?: string; items: MilestoneItem[] }
  | { id: string; type: "contactCard" }
  | { id: string; type: "jobs" }
  | { id: string; type: "faq" }
  | {
      id: string;
      type: "hero";
      badge?: string;
      title: string;
      subtitle?: string;
      ctaLabel?: string;
      ctaHref?: string;
    }
  | { id: string; type: "statsBand"; heading?: string; stats: StatBandItem[] }
  | { id: string; type: "ctaBand"; heading?: string; body?: string; ctaLabel: string; ctaHref: string }
  | { id: string; type: "image"; src: string; alt: string; caption?: string };

export interface CoreValueItem {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface MilestoneItem {
  id: string;
  year: string;
  title: string;
  description: string;
}

export interface StatBandItem {
  id: string;
  value: string;
  label: string;
}

export interface ContentPage {
  id: string;
  slug: ContentPageSlug;
  locale: ContentLocale;
  title: string;
  blocks: ContentBlock[];
  status: ContentPageStatus;
  effectiveDate: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  openGraphImage?: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentPageResponse {
  page: ContentPage | null;
  /** Locale actually served, which differs from the request when falling back to English. */
  servedLocale: ContentLocale | null;
  isFallback: boolean;
}

/** Why a revision snapshot was written: normal save, live publish, copy, restore. */
export type ContentPageChangeType = "SAVE" | "PUBLISH" | "RESTORE" | "COPY";

export interface ContentPageRevision {
  id: string;
  pageId: string;
  title: string;
  blocks: ContentBlock[];
  status: ContentPageStatus;
  effectiveDate: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  openGraphImage?: string | null;
  changeType: ContentPageChangeType;
  authorEmail: string | null;
  createdAt: string;
}

export interface ContentSchemaResponse {
  slugs: readonly ContentPageSlug[];
  locales: readonly ContentLocale[];
  allowedBlocks: Record<ContentPageSlug, readonly ContentBlockType[]>;
}

type ApiEnvelope<T> = { success: boolean; data: T };

/** Public read. Unauthenticated; returns `page: null` for unpublished pages. */
export async function fetchContentPage(
  slug: ContentPageSlug,
  locale: string
): Promise<ContentPageResponse> {
  const query = new URLSearchParams({ locale });
  const res = await apiFetch<ApiEnvelope<ContentPageResponse>>(
    `/content/pages/${slug}?${query.toString()}`,
    { skipLogoutOn401: true }
  );
  return res.data;
}

export async function fetchContentSchema(): Promise<ContentSchemaResponse> {
  const res = await apiFetch<ApiEnvelope<ContentSchemaResponse>>("/admin/content/schema");
  return res.data;
}

export async function fetchAdminContentPages(filter: {
  slug?: ContentPageSlug;
  locale?: ContentLocale;
} = {}): Promise<ContentPage[]> {
  const query = new URLSearchParams();
  if (filter.slug) query.set("slug", filter.slug);
  if (filter.locale) query.set("locale", filter.locale);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const res = await apiFetch<ApiEnvelope<{ pages: ContentPage[] }>>(
    `/admin/content${suffix}`
  );
  return res.data.pages;
}

export async function fetchAdminContentPage(
  slug: ContentPageSlug,
  locale: ContentLocale
): Promise<ContentPage | null> {
  const res = await apiFetch<ApiEnvelope<{ page: ContentPage | null }>>(
    `/admin/content/${slug}?locale=${locale}`
  );
  return res.data.page;
}

export async function fetchContentBlueprint(
  slug: ContentPageSlug,
  locale: ContentLocale
): Promise<{ title: string; blocks: ContentBlock[] } | null> {
  const res = await apiFetch<ApiEnvelope<{ blueprint: { title: string; blocks: ContentBlock[] } | null }>>(
    `/admin/content/${slug}/blueprint?locale=${locale}`
  );
  return res.data.blueprint;
}

export interface UpsertContentPageInput {
  slug: ContentPageSlug;
  locale: ContentLocale;
  title: string;
  blocks: ContentBlock[];
  status: ContentPageStatus;
  effectiveDate?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  openGraphImage?: string | null;
}

export async function saveContentPage(input: UpsertContentPageInput): Promise<ContentPage> {
  const res = await apiFetch<ApiEnvelope<{ page: ContentPage }>>("/admin/content", {
    method: "PUT",
    body: input,
  });
  return res.data.page;
}

/** Copies `fromLocale` over `toLocale`; the copy always lands in draft. */
export async function copyContentPage(
  slug: ContentPageSlug,
  fromLocale: ContentLocale,
  toLocale: ContentLocale
): Promise<ContentPage> {
  const res = await apiFetch<ApiEnvelope<{ page: ContentPage }>>(
    `/admin/content/${slug}/copy`,
    { method: "POST", body: { fromLocale, toLocale } }
  );
  return res.data.page;
}

export async function deleteContentPage(
  slug: ContentPageSlug,
  locale: ContentLocale
): Promise<boolean> {
  const res = await apiFetch<ApiEnvelope<{ deleted: boolean }>>(
    `/admin/content/${slug}?locale=${locale}`,
    { method: "DELETE" }
  );
  return res.data.deleted;
}

export async function fetchContentPageRevisions(
  slug: ContentPageSlug,
  locale: ContentLocale
): Promise<ContentPageRevision[]> {
  const res = await apiFetch<ApiEnvelope<{ revisions: ContentPageRevision[] }>>(
    `/admin/content/${slug}/revisions?locale=${locale}`
  );
  return res.data.revisions;
}

/** Restores the page to a prior snapshot; the restore itself gets snapshotted. */
export async function restoreContentPageRevision(
  slug: ContentPageSlug,
  locale: ContentLocale,
  revisionId: string
): Promise<ContentPage> {
  const res = await apiFetch<ApiEnvelope<{ page: ContentPage }>>(
    `/admin/content/${slug}/revisions/${revisionId}/restore?locale=${locale}`,
    { method: "POST" }
  );
  return res.data.page;
}
