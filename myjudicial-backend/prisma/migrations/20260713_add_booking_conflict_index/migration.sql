-- Migration: Add partial unique index to prevent double-booking
-- Run this in your Supabase SQL editor or via psql

-- Ensure the partialIndexes preview feature is enabled in your Prisma generator
-- (already done in schema.prisma)

CREATE UNIQUE INDEX IF NOT EXISTS "bookings_expertId_scheduledStart_key"
  ON "bookings"("expertId", "scheduledStart")
  WHERE (status NOT IN ('CANCELLED', 'REFUNDED'));
