/**
 * Idempotent Seed for Rwanda Administrative Divisions
 * Populates 5 Provinces, 30 Districts, and 416 Sectors.
 */
import { prisma, closeDatabasePool } from "../src/infrastructure/database/prisma.js";
import { ensureDatabaseSchema } from "../src/infrastructure/database/schema-sync.js";
import {
  RWANDA_PROVINCES,
  RWANDA_DISTRICTS,
  RWANDA_SECTORS,
  normalizeAdminName,
} from "../src/infrastructure/data/rwanda-administrative-data.js";
import { logger } from "../src/shared/utils/logger.js";

export async function seedAdministrativeDivisions() {
  console.log("Seeding Rwanda Administrative Divisions...");

  // 1. Seed Provinces
  const provinceMap = new Map<string, string>(); // code -> id
  for (const prov of RWANDA_PROVINCES) {
    const record = await prisma.administrativeDivision.upsert({
      where: { code: prov.code },
      update: {
        name: prov.name,
        normalizedName: normalizeAdminName(prov.name),
        level: "PROVINCE",
        latitude: prov.latitude,
        longitude: prov.longitude,
        aliases: prov.aliases || [],
      },
      create: {
        code: prov.code,
        name: prov.name,
        normalizedName: normalizeAdminName(prov.name),
        level: "PROVINCE",
        latitude: prov.latitude,
        longitude: prov.longitude,
        aliases: prov.aliases || [],
      },
    });
    provinceMap.set(prov.code, record.id);
  }
  console.log(`✓ Seeded ${provinceMap.size} Provinces`);

  // 2. Seed Districts
  const districtMap = new Map<string, string>(); // code -> id
  for (const dist of RWANDA_DISTRICTS) {
    const parentId = dist.parentCode ? provinceMap.get(dist.parentCode) : null;
    const record = await prisma.administrativeDivision.upsert({
      where: { code: dist.code },
      update: {
        name: dist.name,
        normalizedName: normalizeAdminName(dist.name),
        level: "DISTRICT",
        parentId,
        latitude: dist.latitude,
        longitude: dist.longitude,
        aliases: dist.aliases || [],
      },
      create: {
        code: dist.code,
        name: dist.name,
        normalizedName: normalizeAdminName(dist.name),
        level: "DISTRICT",
        parentId,
        latitude: dist.latitude,
        longitude: dist.longitude,
        aliases: dist.aliases || [],
      },
    });
    districtMap.set(dist.code, record.id);
  }
  console.log(`✓ Seeded ${districtMap.size} Districts`);

  // 3. Seed Sectors
  let sectorCount = 0;
  for (const sec of RWANDA_SECTORS) {
    const parentId = sec.parentCode ? districtMap.get(sec.parentCode) : null;
    await prisma.administrativeDivision.upsert({
      where: { code: sec.code },
      update: {
        name: sec.name,
        normalizedName: normalizeAdminName(sec.name),
        level: "SECTOR",
        parentId,
        latitude: sec.latitude,
        longitude: sec.longitude,
        aliases: sec.aliases || [],
      },
      create: {
        code: sec.code,
        name: sec.name,
        normalizedName: normalizeAdminName(sec.name),
        level: "SECTOR",
        parentId,
        latitude: sec.latitude,
        longitude: sec.longitude,
        aliases: sec.aliases || [],
      },
    });
    sectorCount++;
  }
  console.log(`✓ Seeded ${sectorCount} Sectors`);
  console.log("Successfully seeded all 451 authoritative Rwanda administrative divisions.");
}

// Allow direct CLI invocation: tsx prisma/seed-locations.ts
if (process.argv[1]?.endsWith("seed-locations.ts")) {
  ensureDatabaseSchema()
    .then(() => seedAdministrativeDivisions())
    .catch((err) => {
      logger.error("Failed seeding locations", { err });
      console.error(err);
      process.exit(1);
    })
    .finally(() => closeDatabasePool());
}
