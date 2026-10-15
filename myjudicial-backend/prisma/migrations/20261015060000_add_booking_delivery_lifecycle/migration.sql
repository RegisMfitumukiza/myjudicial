-- AlterTable
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deliverySummary" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "autoReleaseAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "issueReportedAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "issueReason" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bookings_autoReleaseAt_idx" ON "bookings"("autoReleaseAt");
