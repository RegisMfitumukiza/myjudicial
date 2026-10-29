-- CreateEnum
CREATE TYPE "AdminDivisionLevel" AS ENUM ('PROVINCE', 'DISTRICT', 'SECTOR', 'CELL', 'VILLAGE');

-- CreateTable
CREATE TABLE "administrative_divisions" (
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "administrative_divisions_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "experts" ADD COLUMN "sector_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "client_district_id" TEXT;
ALTER TABLE "users" ADD COLUMN "client_sector_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "administrative_divisions_code_key" ON "administrative_divisions"("code");

-- CreateIndex
CREATE INDEX "administrative_divisions_parent_id_idx" ON "administrative_divisions"("parent_id");

-- CreateIndex
CREATE INDEX "administrative_divisions_level_idx" ON "administrative_divisions"("level");

-- CreateIndex
CREATE INDEX "administrative_divisions_normalized_name_idx" ON "administrative_divisions"("normalized_name");

-- AddForeignKey
ALTER TABLE "administrative_divisions" ADD CONSTRAINT "administrative_divisions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "administrative_divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experts" ADD CONSTRAINT "experts_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "administrative_divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_client_district_id_fkey" FOREIGN KEY ("client_district_id") REFERENCES "administrative_divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_client_sector_id_fkey" FOREIGN KEY ("client_sector_id") REFERENCES "administrative_divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Composite Performance Indexes
CREATE INDEX IF NOT EXISTS "bookings_expertId_scheduledStart_scheduledEnd_status_idx" ON "bookings"("expertId", "scheduledStart", "scheduledEnd", "status");
CREATE INDEX IF NOT EXISTS "payments_status_createdAt_idx" ON "payments"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt" DESC);

