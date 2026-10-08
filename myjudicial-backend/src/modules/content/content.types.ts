/**
 * Admin-authored public content pages.
 *
 * Body copy is an ordered array of typed blocks. The block set is deliberately
 * closed: an admin chooses content and wording, but not layout, so a policy page
 * can never be published in a shape the public renderer cannot render.
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

/** Narrow an untrusted string (query param, path segment) to a known locale. */
export function toContentLocale(value: unknown, fallback: ContentLocale = "en"): ContentLocale {
  const candidate = String(value ?? "").toLowerCase();
  return (CONTENT_LOCALES as readonly string[]).includes(candidate)
    ? (candidate as ContentLocale)
    : fallback;
}

export type ContentPageStatus = "draft" | "published";

/** Which block types each page is allowed to use. */
/** Which block types each page is allowed to use. */
export const ALLOWED_BLOCKS: Record<ContentPageSlug, readonly ContentBlockType[]> = {
  ABOUT: ["hero", "prose", "bullets", "steps", "callout", "table", "coreValues", "milestones", "statsBand", "ctaBand", "image"],
  CAREERS: ["hero", "prose", "bullets", "callout", "jobs", "statsBand", "ctaBand", "image"],
  HELP: ["prose", "bullets", "steps", "callout", "faq"],
  CONTACT: ["hero", "prose", "callout", "contactCard", "image"],
  PRIVACY: ["prose", "bullets", "steps", "callout", "table"],
  TERMS: ["prose", "bullets", "steps", "callout", "table"],
  COOKIES: ["prose", "bullets", "table", "callout"],
};

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

export type CalloutTone = "info" | "warning";

/**
 * `jobs` and `faq` are dynamic renderers: they carry no body of their own and
 * instead render live platform data (open roles, supplemental FAQs) so a page
 * can never contradict the settings it is displayed alongside.
 */
export type ContentBlock =
  | { id: string; type: "prose"; heading?: string; body: string }
  | { id: string; type: "bullets"; heading?: string; items: string[] }
  | { id: string; type: "steps"; heading?: string; items: string[] }
  | { id: string; type: "callout"; heading?: string; body: string; tone: CalloutTone }
  | {
      id: string;
      type: "table";
      heading?: string;
      columns: string[];
      rows: string[][];
    }
  | {
      id: string;
      type: "coreValues";
      heading?: string;
      values: Array<{ id: string; title: string; description: string; icon: string }>;
    }
  | {
      id: string;
      type: "milestones";
      heading?: string;
      items: Array<{ id: string; year: string; title: string; description: string }>;
    }
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
  | {
      id: string;
      type: "statsBand";
      heading?: string;
      stats: Array<{ id: string; value: string; label: string }>;
    }
  | {
      id: string;
      type: "ctaBand";
      heading?: string;
      body?: string;
      ctaLabel: string;
      ctaHref: string;
    }
  | { id: string; type: "image"; src: string; alt: string; caption?: string };

export interface ContentPageRecord {
  id: string;
  slug: ContentPageSlug;
  locale: ContentLocale;
  title: string;
  blocks: ContentBlock[];
  status: "draft" | "published";
  version: string;
  effectiveDate: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  openGraphImage: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Why a revision snapshot was written: normal save, live publish, copy, restore. */
export type ContentPageChangeType = "SAVE" | "PUBLISH" | "RESTORE" | "COPY";

export interface ContentPageRevisionRecord {
  id: string;
  pageId: string;
  title: string;
  blocks: ContentBlock[];
  status: "draft" | "published";
  version: string;
  effectiveDate: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  openGraphImage: string | null;
  changeType: ContentPageChangeType;
  authorEmail: string | null;
  createdAt: string;
}
