-- Manual Migration: Add WhatsApp Queue Table
-- Run this SQL script manually when you have database access
-- After running, enable the WhatsApp cron jobs in src/interfaces/http/server.ts

-- Create whatsapp_queue table
CREATE TABLE IF NOT EXISTS "whatsapp_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "recipient" TEXT NOT NULL,
    "message_type" TEXT NOT NULL,
    "template_name" TEXT,
    "template_params" JSONB,
    "text_message" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "scheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "whatsapp_id" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "whatsapp_queue" 
ADD CONSTRAINT "whatsapp_queue_user_id_fkey" 
FOREIGN KEY ("user_id") 
REFERENCES "User"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "whatsapp_queue_status_idx" ON "whatsapp_queue"("status");
CREATE INDEX IF NOT EXISTS "whatsapp_queue_scheduled_at_idx" ON "whatsapp_queue"("scheduled_at");
CREATE INDEX IF NOT EXISTS "whatsapp_queue_priority_idx" ON "whatsapp_queue"("priority");
CREATE INDEX IF NOT EXISTS "whatsapp_queue_recipient_idx" ON "whatsapp_queue"("recipient");

-- Verify table creation
SELECT 
    tablename, 
    schemaname 
FROM pg_tables 
WHERE tablename = 'whatsapp_queue';
