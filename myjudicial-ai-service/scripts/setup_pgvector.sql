-- =============================================================================
-- SIMPLE pgvector Setup for MyJudicial (Matches YOUR actual database schema)
-- =============================================================================
-- Run this script in Supabase SQL Editor
-- =============================================================================

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Add vector column to experts table (384 dimensions)
ALTER TABLE experts 
ADD COLUMN IF NOT EXISTS profile_embedding vector(384);

ALTER TABLE experts
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2';

ALTER TABLE experts
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMP;

-- Step 3: Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS experts_embedding_hnsw_idx 
ON experts 
USING hnsw (profile_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Step 4: Create helper indexes (using YOUR actual column names)
CREATE INDEX IF NOT EXISTS experts_specialties_idx 
ON experts USING GIN (specialties);

CREATE INDEX IF NOT EXISTS experts_base_consultation_fee_idx 
ON experts ("baseConsultationFee")
WHERE "baseConsultationFee" IS NOT NULL;

CREATE INDEX IF NOT EXISTS experts_average_rating_idx 
ON experts ("averageRating" DESC NULLS LAST);

-- Step 5: Create statistics view
CREATE OR REPLACE VIEW expert_embedding_stats AS
SELECT 
    COUNT(*) as total_experts,
    COUNT(profile_embedding) as experts_with_embeddings,
    COUNT(*) - COUNT(profile_embedding) as experts_without_embeddings,
    COUNT(profile_embedding)::float / NULLIF(COUNT(*), 0) * 100 as embedding_coverage_percentage,
    MIN(embedding_generated_at) as first_embedding_generated,
    MAX(embedding_generated_at) as last_embedding_generated,
    COUNT(DISTINCT embedding_model) as embedding_models_used
FROM experts;

-- Step 6: Verify setup
SELECT 
    'pgvector extension' as check_item, 
    CASE WHEN COUNT(*) > 0 THEN '✓ Enabled' ELSE '✗ Not enabled' END as status
FROM pg_extension WHERE extname = 'vector'

UNION ALL

SELECT 'profile_embedding column' as check_item,
    CASE WHEN COUNT(*) > 0 THEN '✓ Exists' ELSE '✗ Missing' END as status
FROM information_schema.columns 
WHERE table_name = 'experts' AND column_name = 'profile_embedding'

UNION ALL

SELECT 'HNSW index' as check_item,
    CASE WHEN COUNT(*) > 0 THEN '✓ Created' ELSE '✗ Missing' END as status
FROM pg_indexes 
WHERE tablename = 'experts' AND indexname = 'experts_embedding_hnsw_idx';

-- =============================================================================
-- Setup Complete!
-- =============================================================================

SELECT 
    '🎉 pgvector setup complete!' as message,
    'Next: Install Python dependencies and generate embeddings' as next_step;

