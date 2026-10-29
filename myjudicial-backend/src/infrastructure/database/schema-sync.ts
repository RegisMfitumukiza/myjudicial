import { prisma } from "./prisma.js";
import { logger } from "../../shared/utils/logger.js";
import {
  RWANDA_PROVINCES,
  RWANDA_DISTRICTS,
  RWANDA_SECTORS,
  normalizeAdminName,
} from "../data/rwanda-administrative-data.js";

/**
 * Idempotent startup schema synchronization.
 *
 * Ensures that incremental DDL migrations (new columns, tables, and indexes)
 * are present in the active PostgreSQL database before the HTTP server and
 * background cron jobs begin serving queries.
 *
 * Executes directly through the active Prisma connection pool so it is
 * guaranteed to target the exact database serving runtime queries.
 */
const IDEMPOTENT_DDL_STATEMENTS: string[] = [
  // 1. Booking delivery lifecycle & escrow handshake columns (20261015060000)
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3)`,
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deliverySummary" TEXT`,
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "autoReleaseAt" TIMESTAMP(3)`,
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "issueReportedAt" TIMESTAMP(3)`,
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "issueReason" TEXT`,
  `CREATE INDEX IF NOT EXISTS "bookings_autoReleaseAt_idx" ON "bookings"("autoReleaseAt")`,
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "hasRecording" BOOLEAN DEFAULT false`,
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "recordingObjectKey" TEXT`,
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "recordingDurationSec" INTEGER`,
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "recordingStartedAt" TIMESTAMP(3)`,
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "recordingEndedAt" TIMESTAMP(3)`,

  // 2. Document category column (20261013140000)
  `ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "category" TEXT`,
  `CREATE INDEX IF NOT EXISTS "documents_category_idx" ON "documents"("category")`,

  // 3. User onboarding JSONB column (20260925000000)
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding" JSONB`,

  // 4. Content pages & revisions (20260928120000, 20260929120000, 20260929150000)
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentPageSlug') THEN
      CREATE TYPE "ContentPageSlug" AS ENUM ('ABOUT', 'CAREERS', 'HELP', 'CONTACT', 'PRIVACY', 'TERMS', 'COOKIES');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentPageStatus') THEN
      CREATE TYPE "ContentPageStatus" AS ENUM ('draft', 'published');
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "content_pages" (
    "id" UUID NOT NULL,
    "slug" "ContentPageSlug" NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blocks" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "status" "ContentPageStatus" NOT NULL DEFAULT 'draft',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "effective_date" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "og_image" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id")
  )`,
  `ALTER TABLE "content_pages" ADD COLUMN IF NOT EXISTS "version" TEXT NOT NULL DEFAULT '1.0'`,
  `ALTER TABLE "content_pages" ADD COLUMN IF NOT EXISTS "meta_title" TEXT`,
  `ALTER TABLE "content_pages" ADD COLUMN IF NOT EXISTS "meta_description" TEXT`,
  `ALTER TABLE "content_pages" ADD COLUMN IF NOT EXISTS "og_image" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "content_pages_slug_locale_key" ON "content_pages"("slug", "locale")`,
  `CREATE INDEX IF NOT EXISTS "content_pages_slug_status_idx" ON "content_pages"("slug", "status")`,
  `CREATE INDEX IF NOT EXISTS "content_pages_locale_idx" ON "content_pages"("locale")`,

  `CREATE TABLE IF NOT EXISTS "content_page_revisions" (
    "id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "status" "ContentPageStatus" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "effective_date" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "og_image" TEXT,
    "author_id" TEXT,
    "change_type" TEXT NOT NULL DEFAULT 'SAVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_page_revisions_pkey" PRIMARY KEY ("id")
  )`,
  `ALTER TABLE "content_page_revisions" ADD COLUMN IF NOT EXISTS "version" TEXT NOT NULL DEFAULT '1.0'`,
  `CREATE INDEX IF NOT EXISTS "content_page_revisions_page_id_created_at_idx" ON "content_page_revisions"("page_id", "created_at" DESC)`,

  // 5. User legal consents
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LegalDocumentType') THEN
      CREATE TYPE "LegalDocumentType" AS ENUM ('TERMS', 'PRIVACY', 'COOKIES', 'ADVOCATE_AGREEMENT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsentContext') THEN
      CREATE TYPE "ConsentContext" AS ENUM ('REGISTRATION', 'BOOKING_CHECKOUT', 'PORTAL_REACCEPTANCE', 'VOLUNTARY_UPDATE');
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "user_legal_consents" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" "LegalDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "context" "ConsentContext" NOT NULL DEFAULT 'REGISTRATION',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_legal_consents_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "user_legal_consents_user_id_document_type_idx" ON "user_legal_consents"("user_id", "document_type")`,
  `CREATE INDEX IF NOT EXISTS "user_legal_consents_document_type_version_idx" ON "user_legal_consents"("document_type", "version")`,

  // 6. Rwanda Administrative Divisions & Location Foreign Keys (20261029000000)
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AdminDivisionLevel') THEN
      CREATE TYPE "AdminDivisionLevel" AS ENUM ('PROVINCE', 'DISTRICT', 'SECTOR', 'CELL', 'VILLAGE');
    END IF;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "administrative_divisions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "level" "AdminDivisionLevel" NOT NULL,
    "parent_id" TEXT,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "administrative_divisions_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "administrative_divisions_code_key" ON "administrative_divisions"("code")`,
  `CREATE INDEX IF NOT EXISTS "administrative_divisions_parent_id_idx" ON "administrative_divisions"("parent_id")`,
  `CREATE INDEX IF NOT EXISTS "administrative_divisions_level_idx" ON "administrative_divisions"("level")`,
  `CREATE INDEX IF NOT EXISTS "administrative_divisions_normalized_name_idx" ON "administrative_divisions"("normalized_name")`,
  `ALTER TABLE "experts" ADD COLUMN IF NOT EXISTS "sector_id" TEXT`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "client_district_id" TEXT`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "client_sector_id" TEXT`,

  // 7. High-Volume Composite Indexes for Production Performance
  `CREATE INDEX IF NOT EXISTS "bookings_expertId_scheduledStart_scheduledEnd_status_idx" ON "bookings"("expertId", "scheduledStart", "scheduledEnd", "status")`,
  `CREATE INDEX IF NOT EXISTS "payments_status_createdAt_idx" ON "payments"("status", "createdAt" DESC)`,
  `CREATE INDEX IF NOT EXISTS "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt" DESC)`,
];

export async function ensureDatabaseSchema(): Promise<void> {
  for (const statement of IDEMPOTENT_DDL_STATEMENTS) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (error) {
      logger.warn("Non-fatal warning during startup DDL statement", {
        statement: statement.slice(0, 80),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  // Auto-seed Rwanda administrative divisions if table is empty or incomplete
  try {
    const existingCount = await prisma.administrativeDivision.count();
    if (existingCount < 451) {
      logger.info("Seeding Rwanda administrative divisions on startup...", { existingCount });
      const provinceMap = new Map<string, string>();
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

      const districtMap = new Map<string, string>();
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
      }
      logger.info("Rwanda administrative divisions seeded (451 records)");
    }
  } catch (error) {
    logger.warn("Non-fatal warning during administrative divisions auto-seed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  logger.info("Database schema sync verified");
}
