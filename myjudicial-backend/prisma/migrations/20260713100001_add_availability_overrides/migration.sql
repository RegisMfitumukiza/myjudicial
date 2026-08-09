-- CreateEnum: Override Type
CREATE TYPE "override_type" AS ENUM ('CLOSED', 'CUSTOM_HOURS', 'REDUCED_CAPACITY');

-- CreateTable: Availability Overrides
-- Allows experts to set date-specific exceptions to their weekly schedule
CREATE TABLE "availability_overrides" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "expert_id" TEXT NOT NULL,
    
    -- Date this override applies to (stored in expert's timezone)
    "date" DATE NOT NULL,
    
    -- Type of override
    "override_type" "override_type" NOT NULL,
    
    -- For CUSTOM_HOURS type
    "start_time" VARCHAR(5),  -- HH:MM format e.g. "14:00"
    "end_time" VARCHAR(5),    -- HH:MM format e.g. "18:00"
    
    -- For REDUCED_CAPACITY type
    "max_bookings" INTEGER,
    
    -- Optional reason/note
    "reason" TEXT,
    
    -- Timestamps
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on expert_id + date (one override per day)
CREATE UNIQUE INDEX "availability_overrides_expert_id_date_key" 
ON "availability_overrides"("expert_id", "date");

-- CreateIndex: Query optimization for expert lookups
CREATE INDEX "availability_overrides_expert_id_idx" 
ON "availability_overrides"("expert_id");

-- CreateIndex: Query optimization for date range queries
CREATE INDEX "availability_overrides_date_idx" 
ON "availability_overrides"("date");

-- CreateIndex: Compound index for expert + date range queries
CREATE INDEX "availability_overrides_expert_id_date_idx" 
ON "availability_overrides"("expert_id", "date");

-- AddForeignKey: Cascade delete when expert is deleted
ALTER TABLE "availability_overrides" 
ADD CONSTRAINT "availability_overrides_expert_id_fkey" 
FOREIGN KEY ("expert_id") 
REFERENCES "experts"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Add check constraints for data integrity
ALTER TABLE "availability_overrides"
ADD CONSTRAINT "check_custom_hours_times" 
CHECK (
    (override_type != 'CUSTOM_HOURS') OR 
    (start_time IS NOT NULL AND end_time IS NOT NULL)
);

ALTER TABLE "availability_overrides"
ADD CONSTRAINT "check_reduced_capacity_max" 
CHECK (
    (override_type != 'REDUCED_CAPACITY') OR 
    (max_bookings IS NOT NULL AND max_bookings > 0)
);

-- Comment for documentation
COMMENT ON TABLE "availability_overrides" IS 
'Date-specific overrides to expert weekly schedules. Allows blocking dates, custom hours, or capacity limits.';

COMMENT ON COLUMN "availability_overrides"."override_type" IS 
'CLOSED: Full day off, CUSTOM_HOURS: Different hours than usual, REDUCED_CAPACITY: Lower booking limit';

COMMENT ON COLUMN "availability_overrides"."date" IS 
'Date in expert timezone. Stored as DATE type for timezone-safe queries.';
