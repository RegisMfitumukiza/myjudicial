-- Admin-authored public content pages, one row per (page, locale).
--
-- Body copy is an ordered array of typed blocks rather than hardcoded message
-- strings. A page that has never been written stays in `draft`, so the public
-- site renders a neutral "not published" state instead of invented policy text.
--
-- slug/status use real Postgres enum types (not TEXT) so a bad value can't be
-- written at the database level, matching how the rest of this schema models
-- closed value sets (AuditAction, AuditResource, EmailLogStatus, ...).

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentPageSlug') THEN
        CREATE TYPE "ContentPageSlug" AS ENUM (
            'ABOUT',
            'CAREERS',
            'HELP',
            'CONTACT',
            'PRIVACY',
            'TERMS',
            'COOKIES'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ContentPageStatus') THEN
        CREATE TYPE "ContentPageStatus" AS ENUM ('draft', 'published');
    END IF;

    -- Audit trail for content edits gets its own resource type rather than
    -- being filed under DOCUMENT.
    IF NOT EXISTS (
        SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
         WHERE t.typname = 'AuditResource'
           AND e.enumlabel = 'CONTENT_PAGE'
    ) THEN
        ALTER TYPE "AuditResource" ADD VALUE 'CONTENT_PAGE';
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "content_pages" (
    "id"             UUID               NOT NULL,
    "slug"           "ContentPageSlug"  NOT NULL,
    "locale"         TEXT               NOT NULL,
    "title"          TEXT               NOT NULL,
    "blocks"         JSONB              NOT NULL DEFAULT '[]'::jsonb,
    "status"         "ContentPageStatus" NOT NULL DEFAULT 'draft',
    "effective_date" TEXT,
    "updated_by"     TEXT,
    "created_at"     TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "content_pages_slug_locale_key"
    ON "content_pages"("slug", "locale");

CREATE INDEX IF NOT EXISTS "content_pages_slug_status_idx"
    ON "content_pages"("slug", "status");

CREATE INDEX IF NOT EXISTS "content_pages_locale_idx"
    ON "content_pages"("locale");
