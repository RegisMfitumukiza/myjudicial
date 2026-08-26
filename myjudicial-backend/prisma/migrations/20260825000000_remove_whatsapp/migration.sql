-- Remove WhatsApp feature
-- Drops WhatsApp tables, columns, indexes, and enum value.

-- Delete logs sent via WhatsApp so the enum value can be dropped
DELETE FROM "notification_logs" WHERE "channel" = 'WHATSAPP';

ALTER TYPE "NotificationChannel" DROP VALUE IF EXISTS 'WHATSAPP';

-- Drop WhatsApp tables (FK whatsapp_queue_user_id_fkey is dropped with the table)
DROP TABLE IF EXISTS "whatsapp_queue";
DROP TABLE IF EXISTS "whatsapp_templates";

-- Remove WhatsApp-specific columns from notification_logs
DROP INDEX IF EXISTS "notification_logs_whatsapp_id_idx";

ALTER TABLE "notification_logs" DROP COLUMN IF EXISTS "whatsapp_id";
ALTER TABLE "notification_logs" DROP COLUMN IF EXISTS "template_id";
ALTER TABLE "notification_logs" DROP COLUMN IF EXISTS "template_params";
ALTER TABLE "notification_logs" DROP COLUMN IF EXISTS "delivery_status";

-- Remove WhatsApp flag from notification_preferences
ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "whatsapp";
