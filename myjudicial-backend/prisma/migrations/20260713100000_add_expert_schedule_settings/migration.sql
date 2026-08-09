-- CreateTable: Expert Schedule Settings
-- Allows experts to configure their scheduling preferences
-- Drop if exists (cleanup from previously failed migration attempt)
DROP TABLE IF EXISTS "expert_schedule_settings" CASCADE;
CREATE TABLE "expert_schedule_settings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "expert_id" TEXT NOT NULL,
    
    -- Scheduling preferences
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Africa/Kigali',
    "buffer_time_minutes" INTEGER NOT NULL DEFAULT 15,
    "advance_notice_hours" INTEGER NOT NULL DEFAULT 24,
    "max_days_in_advance" INTEGER NOT NULL DEFAULT 60,
    "max_bookings_per_day" INTEGER,
    
    -- Behavior flags
    "respect_presence_status" BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_schedule_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on expert_id
CREATE UNIQUE INDEX "expert_schedule_settings_expert_id_key" 
ON "expert_schedule_settings"("expert_id");

-- AddForeignKey: Cascade delete when expert is deleted
ALTER TABLE "expert_schedule_settings" 
ADD CONSTRAINT "expert_schedule_settings_expert_id_fkey" 
FOREIGN KEY ("expert_id") 
REFERENCES "experts"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Backfill: Create default settings for existing experts
INSERT INTO "expert_schedule_settings" (
    "id",
    "expert_id", 
    "timezone", 
    "buffer_time_minutes",
    "advance_notice_hours",
    "max_days_in_advance",
    "respect_presence_status"
)
SELECT 
    gen_random_uuid()::text,
    "id",
    'Africa/Kigali',
    15,
    24,
    60,
    true
FROM "experts"
WHERE NOT EXISTS (
    SELECT 1 FROM "expert_schedule_settings" 
    WHERE "expert_id" = "experts"."id"
);
