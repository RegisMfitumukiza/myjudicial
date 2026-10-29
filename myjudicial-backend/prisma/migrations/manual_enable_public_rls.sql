-- Manual Migration: Enable Row-Level Security (RLS) on all public tables
-- Run this via the Supabase SQL Editor for both staging and dev projects.
--
-- Background:
-- Supabase automatically exposes the 'public' schema via PostgREST (https://<project-ref>.supabase.co/rest/v1/).
-- Tables without RLS enabled can be queried directly by anyone holding the public anon key.
--
-- Enabling RLS default-denies all PostgREST access for public/anon roles.
-- Prisma connects as the 'postgres' superuser/table owner, which BYPASSES RLS,
-- so your NestJS/Express backend continues to function identically with zero disruption.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')
    ) LOOP
        BEGIN
            EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
        EXCEPTION WHEN insufficient_privilege THEN
            -- Skip system/extension tables where the current user is not the owner
            RAISE NOTICE 'Skipping % (system/extension table)', r.tablename;
        END;
    END LOOP;
END $$;

-- Verify that all your application tables have RLS enabled (rowsecurity = true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns')
ORDER BY tablename;
