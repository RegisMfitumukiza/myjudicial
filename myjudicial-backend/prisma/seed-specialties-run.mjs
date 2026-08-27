/**
 * Seed specialties into the database.
 * Run: node prisma/seed-specialties-run.mjs
 *
 * Uses DIRECT_URL for direct connection (required for DDL operations).
 * Upserts by slug so it's safe to run multiple times.
 */
import { PrismaClient } from "../src/generated/prisma/index.js";
import { SPECIALTY_SEED_DATA } from "./seed-specialties.mjs";

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!directUrl) {
  console.error("DATABASE_URL or DIRECT_URL must be set");
  process.exit(1);
}

const prisma = new PrismaClient({ datasourceUrl: directUrl });

async function main() {
  console.log(`Seeding ${SPECIALTY_SEED_DATA.length} specialties...`);

  let created = 0;
  let updated = 0;

  for (const specialty of SPECIALTY_SEED_DATA) {
    const result = await prisma.specialty.upsert({
      where: { slug: specialty.slug },
      create: specialty,
      update: {
        label: specialty.label,
        description: specialty.description,
        icon: specialty.icon,
        group: specialty.group,
        sortOrder: specialty.sortOrder,
      },
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
    } else {
      updated++;
    }
  }

  console.log(`Done: ${created} created, ${updated} updated, ${SPECIALTY_SEED_DATA.length} total`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
