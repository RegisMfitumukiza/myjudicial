/**
 * MyJudicial Content Pages Seed
 * =============================
 * Seeds the CMS content pages (About, Careers, and legal pages) into PostgreSQL.
 *
 * Usage:
 *   npx tsx prisma/seed-content-pages.ts
 *
 * Required env vars:
 *   DATABASE_URL (DIRECT_URL is preferred when present)
 *
 * Safe to run multiple times — upserts on the (slug, locale) unique key.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ContentPageSlug,
  ContentPageStatus,
  PrismaClient,
} from "../src/generated/prisma/client.js";
import { Pool } from "pg";
import { CONTENT_PAGES_SEED } from "./content-pages-seed-data.js";

if (!process.env.DATABASE_URL) {
  console.error("❌  Missing required environment variable: DATABASE_URL");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function seedContentPages(): Promise<void> {
  console.log(
    `🌱  Seeding ${CONTENT_PAGES_SEED.length} content pages...\n`
  );

  let created = 0;
  let updated = 0;

  for (const row of CONTENT_PAGES_SEED) {
    const existing = await prisma.contentPage.findUnique({
      where: { slug_locale: { slug: row.slug, locale: row.locale } },
      select: { id: true },
    });

    await prisma.contentPage.upsert({
      where: {
        slug_locale: {
          slug: row.slug as ContentPageSlug,
          locale: row.locale as "en" | "fr" | "rw",
        },
      },
      create: {
        slug: row.slug as ContentPageSlug,
        locale: row.locale,
        title: row.title,
        blocks: row.blocks,
        status: row.status as ContentPageStatus,
      },
      update: {
        title: row.title,
        blocks: row.blocks,
        status: row.status as ContentPageStatus,
      },
    });

    if (existing) updated += 1;
    else created += 1;
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉  Seed complete!\n");
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Total:   ${CONTENT_PAGES_SEED.length}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const summary = await prisma.contentPage.groupBy({
    by: ["slug", "status"],
    _count: { _all: true },
  });
  for (const line of summary.sort((a, b) => a.slug.localeCompare(b.slug))) {
    console.log(
      `  ${line.slug.padEnd(8)} ${line.status.padEnd(9)} ${line._count._all}`
    );
  }
}

seedContentPages()
  .catch((error) => {
    console.error("❌  Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });