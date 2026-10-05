-- Per-page SEO overrides for admin-authored content pages.
--
-- An admin can supply a meta title, meta description, and Open Graph image per
-- (page, locale). When present, the public pages use these instead of the
-- i18n defaults. All three columns are optional: existing rows and pages that
-- were never saved (seeded rows included) keep using the i18n fallbacks.

ALTER TABLE "content_pages"
    ADD COLUMN IF NOT EXISTS "meta_title"       TEXT,
    ADD COLUMN IF NOT EXISTS "meta_description" TEXT,
    ADD COLUMN IF NOT EXISTS "og_image"         TEXT;