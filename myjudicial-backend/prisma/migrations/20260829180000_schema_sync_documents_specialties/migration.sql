-- Sync production database to the current schema.prisma.
--
-- Computed by diffing the migration history (baseline-era schema snapshot at
-- befd698 + applied migrations 20260825000000_remove_whatsapp and
-- 20260825010000_add_email_logs) against the current schema datamodel.
--
-- Applies in production:
--   1. "NotificationChannel" recreated without the removed WHATSAPP value
--      (WhatsApp rows were already deleted by 20260825000000_remove_whatsapp).
--   2. "specialties" table + "specialties_slug_key" unique index.
--   3. "documents"."bookingId" index.
--   4. "documents"."uploadedById" index.
--   5. "documents_uploadedById_fkey" foreign key.
--
-- NOTE: "users"."onboarding" also appears in the schema delta but already
-- exists in production (applied directly to the live DB, never migrated),
-- so its ALTER is intentionally omitted here.

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationChannel_new" AS ENUM ('EMAIL', 'SMS', 'PUSH');
ALTER TABLE "notification_logs" ALTER COLUMN "channel" DROP DEFAULT;
ALTER TABLE "notification_logs" ALTER COLUMN "channel" TYPE "NotificationChannel_new" USING ("channel"::text::"NotificationChannel_new");
ALTER TYPE "NotificationChannel" RENAME TO "NotificationChannel_old";
ALTER TYPE "NotificationChannel_new" RENAME TO "NotificationChannel";
DROP TYPE "NotificationChannel_old";
ALTER TABLE "notification_logs" ALTER COLUMN "channel" SET DEFAULT 'EMAIL';
COMMIT;

-- CreateTable
CREATE TABLE "specialties" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "group" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "specialties_slug_key" ON "specialties"("slug");

-- CreateIndex
CREATE INDEX "documents_bookingId_idx" ON "documents"("bookingId");

-- CreateIndex
CREATE INDEX "documents_uploadedById_idx" ON "documents"("uploadedById");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;