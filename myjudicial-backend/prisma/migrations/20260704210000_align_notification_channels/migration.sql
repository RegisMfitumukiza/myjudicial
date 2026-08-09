-- Align notification_preferences channels with Master Build Reference
-- Replace SMS with WhatsApp and Push
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "whatsapp" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "push" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "sms";
