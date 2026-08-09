-- Phase 4: Add support for multiple time blocks per day
-- This allows experts to set complex schedules like "9-12, 2-5" (lunch break)

-- Add time_blocks JSON field to expert_availability
-- Structure: [{"start": "09:00", "end": "12:00"}, {"start": "14:00", "end": "17:00"}]
ALTER TABLE expert_availability 
ADD COLUMN time_blocks JSONB;

-- Create index for better query performance on time_blocks
CREATE INDEX idx_expert_availability_time_blocks 
ON expert_availability USING GIN (time_blocks);

-- Add migration flag to track which records use the new format
ALTER TABLE expert_availability 
ADD COLUMN uses_time_blocks BOOLEAN DEFAULT FALSE;

-- Migration strategy:
-- 1. Existing records keep startTime/endTime (uses_time_blocks = FALSE)
-- 2. New/updated records use time_blocks (uses_time_blocks = TRUE)
-- 3. Application reads both formats for backward compatibility
-- 4. Eventually all records will be migrated to time_blocks

-- Add comment for documentation
COMMENT ON COLUMN expert_availability.time_blocks IS 'Array of time blocks: [{"start":"09:00","end":"12:00"},{"start":"14:00","end":"17:00"}]. Allows multiple periods per day (e.g., lunch breaks).';
COMMENT ON COLUMN expert_availability.uses_time_blocks IS 'TRUE if this record uses time_blocks format instead of legacy startTime/endTime.';
