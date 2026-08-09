/**
 * Backfill: Default Consultation Service
 * =======================================
 * One-time (idempotent) backfill for the "no services available" bug: any
 * ExpertProfile created before the default-service auto-creation was added
 * to ProfileService.createProfile has zero LegalService rows, so citizens
 * can never book them even after verification.
 *
 * This creates a default "Consultation" service (isDefault: true) for every
 * ExpertProfile that has no services yet, priced from their existing
 * baseConsultationFee. Profiles that never set a rate are skipped and
 * reported — there's no real price to create a service from.
 *
 * Usage:
 *   npx tsx prisma/backfill-default-services.ts
 *
 * Safe to run multiple times — only touches profiles with zero services.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function backfill(): Promise<void> {
  console.log("Scanning for expert profiles with zero services...\n");

  const profilesWithoutServices = await prisma.expertProfile.findMany({
    where: { services: { none: {} } },
    select: { id: true, displayName: true, baseConsultationFee: true, currency: true, status: true },
  });

  if (profilesWithoutServices.length === 0) {
    console.log("None found — every expert profile already has at least one service.");
    return;
  }

  console.log(`Found ${profilesWithoutServices.length} profile(s) with no services.\n`);

  let created = 0;
  let skipped = 0;

  for (const profile of profilesWithoutServices) {
    if (!profile.baseConsultationFee) {
      console.log(`Skipping ${profile.displayName} (${profile.id}) — no consultation rate set, nothing to price a service from.`);
      skipped++;
      continue;
    }

    await prisma.legalService.create({
      data: {
        expertId: profile.id,
        name: "Consultation",
        description: "Standard legal consultation session.",
        durationMin: 60,
        flatFee: profile.baseConsultationFee,
        currency: profile.currency ?? "RWF",
        isActive: true,
        isDefault: true,
      },
    });

    console.log(`Created default Consultation service for ${profile.displayName} (${profile.id}) — ${profile.baseConsultationFee} ${profile.currency ?? "RWF"}`);
    created++;
  }

  console.log("\n────────────────────────────────────");
  console.log(`Done. Created: ${created}, Skipped (no rate set): ${skipped}`);
  console.log("────────────────────────────────────\n");
}

backfill()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
