-- Manual Migration: Add in-app read/unread state to notification_logs
-- Run this SQL script manually when you have database access.
-- Written as a manual migration (not via `prisma migrate dev`) because the shared
-- dev database has migration-history drift from untracked changes applied by other
-- contributors directly against Supabase — `prisma migrate dev` refuses to proceed
-- without a destructive `migrate reset`, which would drop shared dev data.
-- See the baseline migration's manual-migration precedent.
--
-- Note: a teammate independently added the same `readAt` field to schema.prisma
-- (on origin/main) without a matching migration file either — this script is the
-- only tracked record of this column existing. No separate `is_read` column is
-- needed: `readAt IS NULL` already means unread.

ALTER TABLE "notification_logs"
ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "notification_logs_userId_readAt_idx" ON "notification_logs"("user_id", "read_at");

-- Verify column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notification_logs' AND column_name = 'read_at';
