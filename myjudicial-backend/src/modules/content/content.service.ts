import { prisma } from "../../infrastructure/database/prisma.js";
import { NotFoundError } from "../../shared/errors/AppError.js";
import { writeAuditLog } from "../../shared/utils/audit.js";
import type { UpsertContentPageInput } from "./content.schemas.js";
import {
  CONTENT_LOCALES,
  type ContentLocale,
  type ContentPageChangeType,
  type ContentPageRecord,
  type ContentPageRevisionRecord,
  type ContentPageSlug,
} from "./content.types.js";

const CACHE_TTL_MS = 30_000;
const MAX_REVISIONS_PER_PAGE = 50;

let cache: { published: Map<string, ContentPageRecord>; until: number } | null = null;

function cacheKey(slug: ContentPageSlug, locale: ContentLocale) {
  return `${slug}:${locale}`;
}

function toRecord(row: {
  id: string;
  slug: string;
  locale: string;
  title: string;
  blocks: unknown;
  status: string;
  effectiveDate: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  openGraphImage: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ContentPageRecord {
  return {
    id: row.id,
    slug: row.slug as ContentPageSlug,
    locale: row.locale as ContentLocale,
    title: row.title,
    blocks: (row.blocks ?? []) as ContentPageRecord["blocks"],
    status: row.status as ContentPageRecord["status"],
    effectiveDate: row.effectiveDate,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    openGraphImage: row.openGraphImage,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Published pages only. A page that was never written, or was reverted to draft,
 * simply is not here — the public renderer shows a neutral unpublished state
 * rather than a placeholder policy.
 */
async function getPublishedCached(): Promise<Map<string, ContentPageRecord>> {
  if (cache && Date.now() < cache.until) return cache.published;

  const rows = await prisma.contentPage.findMany({ where: { status: "published" } });
  const published = new Map<string, ContentPageRecord>();
  for (const row of rows) {
    const record = toRecord(row);
    published.set(cacheKey(record.slug, record.locale), record);
  }

  cache = { published, until: Date.now() + CACHE_TTL_MS };
  return published;
}

function toRevisionRecord(row: {
  id: string;
  pageId: string;
  title: string;
  blocks: unknown;
  status: string;
  effectiveDate: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  openGraphImage: string | null;
  changeType: string;
  author: { email: string } | null;
  createdAt: Date;
}): ContentPageRevisionRecord {
  return {
    id: row.id,
    pageId: row.pageId,
    title: row.title,
    blocks: (row.blocks ?? []) as ContentPageRevisionRecord["blocks"],
    status: row.status as ContentPageRevisionRecord["status"],
    effectiveDate: row.effectiveDate,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    openGraphImage: row.openGraphImage,
    changeType: row.changeType as ContentPageChangeType,
    authorEmail: row.author?.email ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function invalidateContentCache(): void {
  cache = null;
}

/**
 * Snapshot one page state into the revisions table and prune the page's oldest
 * snapshots so history never grows without bound.
 */
async function snapRevision(
  pageId: string,
  snapshot: {
    title: string;
    blocks: unknown;
    status: "draft" | "published";
    effectiveDate: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    openGraphImage: string | null;
  },
  authorId: string | null,
  changeType: ContentPageChangeType
): Promise<void> {
  await prisma.contentPageRevision.create({
    data: {
      pageId,
      title: snapshot.title,
      blocks: snapshot.blocks as never,
      status: snapshot.status,
      effectiveDate: snapshot.effectiveDate,
      metaTitle: snapshot.metaTitle,
      metaDescription: snapshot.metaDescription,
      openGraphImage: snapshot.openGraphImage,
      authorId,
      changeType,
    },
  });

  const excess = await prisma.contentPageRevision.count({ where: { pageId } });
  if (excess > MAX_REVISIONS_PER_PAGE) {
    const keep = await prisma.contentPageRevision.findMany({
      where: { pageId },
      orderBy: { createdAt: "desc" },
      take: MAX_REVISIONS_PER_PAGE,
      select: { id: true },
    });
    await prisma.contentPageRevision.deleteMany({
      where: { pageId, id: { notIn: keep.map((row) => row.id) } },
    });
  }
}

export const ContentService = {
  /** Public read. Returns null when the page is missing or still a draft. */
  async getPublished(slug: ContentPageSlug, locale: ContentLocale) {
    const published = await getPublishedCached();
    return published.get(cacheKey(slug, locale)) ?? null;
  },

  /**
   * Public read with a documented fallback chain: the requested locale, then
   * English. A fr/rw visitor is not shown an empty page while that translation
   * is still being written, and the response says which locale was actually
   * served so the frontend can label it.
   */
  async getPublishedWithFallback(slug: ContentPageSlug, locale: ContentLocale) {
    const direct = await this.getPublished(slug, locale);
    if (direct) return { page: direct, servedLocale: locale, isFallback: false };
    if (locale === "en") return { page: null, servedLocale: null, isFallback: false };

    const english = await this.getPublished(slug, "en");
    if (english) return { page: english, servedLocale: "en" as const, isFallback: true };
    return { page: null, servedLocale: null, isFallback: false };
  },

  async listForAdmin(filter: { slug?: ContentPageSlug; locale?: ContentLocale } = {}) {
    const rows = await prisma.contentPage.findMany({
      where: {
        ...(filter.slug ? { slug: filter.slug } : {}),
        ...(filter.locale ? { locale: filter.locale } : {}),
      },
      orderBy: [{ slug: "asc" }, { locale: "asc" }],
    });
    return rows.map(toRecord);
  },

  async getForAdmin(slug: ContentPageSlug, locale: ContentLocale) {
    const row = await prisma.contentPage.findUnique({ where: { slug_locale: { slug, locale } } });
    return row ? toRecord(row) : null;
  },

  async upsert(input: UpsertContentPageInput, adminId: string, ipAddress?: string) {
    const before = await prisma.contentPage.findUnique({
      where: { slug_locale: { slug: input.slug, locale: input.locale } },
    });

    const row = await prisma.contentPage.upsert({
      where: { slug_locale: { slug: input.slug, locale: input.locale } },
      create: {
        slug: input.slug,
        locale: input.locale,
        title: input.title,
        blocks: input.blocks as never,
        status: input.status,
        effectiveDate: input.effectiveDate ?? null,
        metaTitle: input.metaTitle ?? null,
        metaDescription: input.metaDescription ?? null,
        openGraphImage: input.openGraphImage ?? null,
        updatedBy: adminId,
      },
      update: {
        title: input.title,
        blocks: input.blocks as never,
        status: input.status,
        effectiveDate: input.effectiveDate ?? null,
        metaTitle: input.metaTitle ?? null,
        metaDescription: input.metaDescription ?? null,
        openGraphImage: input.openGraphImage ?? null,
        updatedBy: adminId,
      },
    });

    invalidateContentCache();

    await snapRevision(
      row.id,
      {
        title: row.title,
        blocks: row.blocks,
        status: row.status,
        effectiveDate: row.effectiveDate,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        openGraphImage: row.openGraphImage,
      },
      adminId,
      input.status === "published" ? "PUBLISH" : "SAVE"
    );

    await writeAuditLog({
      actorId: adminId,
      action: before ? "UPDATE" : "CREATE",
      resource: "CONTENT_PAGE",
      resourceId: row.id,
      description: `${before ? "Updated" : "Created"} ${input.slug} (${input.locale}) -> ${input.status}`,
      metadata: {
        slug: input.slug,
        locale: input.locale,
        status: input.status,
        previousStatus: before?.status ?? null,
        blockCount: input.blocks.length,
      },
      ipAddress,
    });

    return toRecord(row);
  },

  /**
   * Copy a locale's content onto another locale as a draft. The copy always
   * lands in `draft` so a translated page can never go live unreviewed just
   * because the source was published.
   */
  async copyLocale(
    slug: ContentPageSlug,
    fromLocale: ContentLocale,
    toLocale: ContentLocale,
    adminId: string,
    ipAddress?: string
  ) {
    if (fromLocale === toLocale) {
      throw new Error("Source and target locale must differ");
    }

    const source = await prisma.contentPage.findUnique({
      where: { slug_locale: { slug, locale: fromLocale } },
    });
    if (!source) {
      throw new Error(`No ${fromLocale} content exists for ${slug} to copy`);
    }

    const row = await prisma.contentPage.upsert({
      where: { slug_locale: { slug, locale: toLocale } },
      create: {
        slug,
        locale: toLocale,
        title: source.title,
        blocks: source.blocks as never,
        status: "draft",
        effectiveDate: source.effectiveDate,
        metaTitle: source.metaTitle,
        metaDescription: source.metaDescription,
        openGraphImage: source.openGraphImage,
        updatedBy: adminId,
      },
      update: {
        title: source.title,
        blocks: source.blocks as never,
        status: "draft",
        metaTitle: source.metaTitle,
        metaDescription: source.metaDescription,
        openGraphImage: source.openGraphImage,
        updatedBy: adminId,
      },
    });

    invalidateContentCache();

    await snapRevision(
      row.id,
      {
        title: row.title,
        blocks: row.blocks,
        status: row.status,
        effectiveDate: row.effectiveDate,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        openGraphImage: row.openGraphImage,
      },
      adminId,
      "COPY"
    );

    await writeAuditLog({
      actorId: adminId,
      action: "UPDATE",
      resource: "CONTENT_PAGE",
      resourceId: row.id,
      description: `Copied ${slug} (${fromLocale}) into ${toLocale} as draft`,
      metadata: { slug, fromLocale, toLocale },
      ipAddress,
    });

    return toRecord(row);
  },

  async listRevisions(slug: ContentPageSlug, locale: ContentLocale, limit = 50) {
    const page = await prisma.contentPage.findUnique({
      where: { slug_locale: { slug, locale } },
    });
    if (!page) return { pageId: null as string | null, revisions: [] as ContentPageRevisionRecord[] };

    const rows = await prisma.contentPageRevision.findMany({
      where: { pageId: page.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { author: { select: { email: true } } },
    });
    return { pageId: page.id, revisions: rows.map(toRevisionRecord) };
  },

  /**
   * Bring a page fully back to a previous snapshot. The restore itself is
   * snapshotted, so the rollback is visible in history and can itself be undone.
   */
  async restoreRevision(
    slug: ContentPageSlug,
    locale: ContentLocale,
    revisionId: string,
    adminId: string,
    ipAddress?: string
  ) {
    const page = await prisma.contentPage.findUnique({
      where: { slug_locale: { slug, locale } },
    });
    if (!page) throw new NotFoundError(`Content page ${slug} (${locale})`);

    const revision = await prisma.contentPageRevision.findFirst({
      where: { id: revisionId, pageId: page.id },
    });
    if (!revision) throw new NotFoundError("Content page revision");

    const row = await prisma.contentPage.update({
      where: { id: page.id },
      data: {
        title: revision.title,
        blocks: revision.blocks as never,
        status: revision.status,
        effectiveDate: revision.effectiveDate,
        metaTitle: revision.metaTitle,
        metaDescription: revision.metaDescription,
        openGraphImage: revision.openGraphImage,
        updatedBy: adminId,
      },
    });

    invalidateContentCache();

    await snapRevision(
      row.id,
      {
        title: row.title,
        blocks: row.blocks,
        status: row.status,
        effectiveDate: row.effectiveDate,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        openGraphImage: row.openGraphImage,
      },
      adminId,
      "RESTORE"
    );

    await writeAuditLog({
      actorId: adminId,
      action: "UPDATE",
      resource: "CONTENT_PAGE",
      resourceId: row.id,
      description: `Restored ${slug} (${locale}) to revision ${revisionId}`,
      metadata: { slug, locale, revisionId, toStatus: row.status },
      ipAddress,
    });

    return toRecord(row);
  },

  async remove(slug: ContentPageSlug, locale: ContentLocale, adminId: string, ipAddress?: string) {
    const existing = await prisma.contentPage.findUnique({
      where: { slug_locale: { slug, locale } },
    });
    if (!existing) return false;

    await prisma.contentPage.delete({ where: { slug_locale: { slug, locale } } });
    invalidateContentCache();

    await writeAuditLog({
      actorId: adminId,
      action: "DELETE",
      resource: "CONTENT_PAGE",
      resourceId: existing.id,
      description: `Deleted ${slug} (${locale})`,
      metadata: { slug, locale },
      ipAddress,
    });

    return true;
  },
};

export { CONTENT_LOCALES };
