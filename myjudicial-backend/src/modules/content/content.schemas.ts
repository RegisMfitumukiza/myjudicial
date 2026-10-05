import { z } from "zod";
import {
  ALLOWED_BLOCKS,
  CONTENT_LOCALES,
  CONTENT_PAGE_SLUGS,
  type ContentBlock,
  type ContentPageSlug,
} from "./content.types.js";

const localeSchema = z.enum(CONTENT_LOCALES);
const slugSchema = z.enum(CONTENT_PAGE_SLUGS);
const blockIdSchema = z.string().trim().min(1).max(64);
const headingSchema = z.string().trim().max(200).optional();

const proseBlock = z.object({
  id: blockIdSchema,
  type: z.literal("prose"),
  heading: headingSchema,
  body: z.string().trim().min(1).max(20000),
});

const bulletsBlock = z.object({
  id: blockIdSchema,
  type: z.literal("bullets"),
  heading: headingSchema,
  items: z.array(z.string().trim().min(1).max(1000)).min(1).max(60),
});

const stepsBlock = z.object({
  id: blockIdSchema,
  type: z.literal("steps"),
  heading: headingSchema,
  items: z.array(z.string().trim().min(1).max(1000)).min(1).max(60),
});

const calloutBlock = z.object({
  id: blockIdSchema,
  type: z.literal("callout"),
  heading: headingSchema,
  body: z.string().trim().min(1).max(4000),
  tone: z.enum(["info", "warning"]),
});

const tableBlock = z.object({
  id: blockIdSchema,
  type: z.literal("table"),
  heading: headingSchema,
  columns: z.array(z.string().trim().min(1).max(120)).min(1).max(12),
  // Cell count per row is checked against `columns` in upsertContentPageSchema,
  // where both are available.
  rows: z.array(z.array(z.string().trim().max(2000)).max(12)).min(1).max(200),
});

const coreValuesBlock = z.object({
  id: blockIdSchema,
  type: z.literal("coreValues"),
  heading: headingSchema,
  values: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(64),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(4000),
        icon: z.string().trim().min(1).max(40),
      })
    )
    .min(1)
    .max(20),
});

const milestonesBlock = z.object({
  id: blockIdSchema,
  type: z.literal("milestones"),
  heading: headingSchema,
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(64),
        year: z.string().trim().min(1).max(30),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(4000),
      })
    )
    .min(1)
    .max(40),
});

const contactCardBlock = z.object({ id: blockIdSchema, type: z.literal("contactCard") });
const jobsBlock = z.object({ id: blockIdSchema, type: z.literal("jobs") });
const faqBlock = z.object({ id: blockIdSchema, type: z.literal("faq") });

const heroBlock = z.object({
  id: blockIdSchema,
  type: z.literal("hero"),
  badge: headingSchema,
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().max(2000).optional(),
  ctaLabel: z.string().trim().max(120).optional(),
  ctaHref: z.string().trim().max(500).optional(),
});

const statsBandBlock = z.object({
  id: blockIdSchema,
  type: z.literal("statsBand"),
  heading: headingSchema,
  stats: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(64),
        value: z.string().trim().min(1).max(60),
        label: z.string().trim().min(1).max(200),
      })
    )
    .min(1)
    .max(12),
});

const ctaBandBlock = z.object({
  id: blockIdSchema,
  type: z.literal("ctaBand"),
  heading: headingSchema,
  body: z.string().trim().max(2000).optional(),
  ctaLabel: z.string().trim().min(1).max(120),
  ctaHref: z.string().trim().min(1).max(500),
});

const imageBlock = z.object({
  id: blockIdSchema,
  type: z.literal("image"),
  src: z.string().trim().min(1).max(500),
  alt: z.string().trim().min(1).max(200),
  caption: z.string().trim().max(300).optional(),
});

export const contentBlockSchema = z.discriminatedUnion("type", [
  proseBlock,
  bulletsBlock,
  stepsBlock,
  calloutBlock,
  tableBlock,
  coreValuesBlock,
  milestonesBlock,
  contactCardBlock,
  jobsBlock,
  faqBlock,
  heroBlock,
  statsBandBlock,
  ctaBandBlock,
  imageBlock,
]);

export const upsertContentPageSchema = z
  .object({
    slug: slugSchema,
    locale: localeSchema,
    title: z.string().trim().min(1).max(200),
    blocks: z.array(contentBlockSchema).max(200),
    status: z.enum(["draft", "published"]),
    effectiveDate: z.string().trim().max(60).optional().nullable(),
    metaTitle: z.string().trim().max(200).optional().nullable(),
    metaDescription: z.string().trim().max(320).optional().nullable(),
    openGraphImage: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // 1. Row width must match the declared column count.
    data.blocks.forEach((block, index) => {
      if (block.type !== "table") return;
      const width = block.columns.length;
      block.rows.forEach((row, rowIndex) => {
        if (row.length !== width) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["blocks", index, "rows", rowIndex],
            message: `row has ${row.length} cells but the table has ${width} columns`,
          });
        }
      });
    });

    // 2. Only block types the page is allowed to use.
    const allowed = ALLOWED_BLOCKS[data.slug] as readonly string[];
    data.blocks.forEach((block, index) => {
      if (!allowed.includes(block.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["blocks", index, "type"],
          message: `block type "${block.type}" is not allowed on ${data.slug} pages`,
        });
      }
    });

    // 3. Block ids must be unique, or the editor cannot target a block.
    const ids = new Set<string>();
    data.blocks.forEach((block, index) => {
      if (ids.has(block.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["blocks", index, "id"],
          message: `duplicate block id "${block.id}"`,
        });
      }
      ids.add(block.id);
    });
  });

export const listContentPagesQuerySchema = z.object({
  slug: slugSchema.optional(),
  locale: localeSchema.optional(),
});

export const copyContentPageSchema = z.object({
  fromLocale: localeSchema,
  toLocale: localeSchema,
});

export type UpsertContentPageInput = z.infer<typeof upsertContentPageSchema>;
export type { ContentBlock, ContentPageSlug };
