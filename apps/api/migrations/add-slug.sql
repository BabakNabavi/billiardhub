-- Add slug column to clubs table
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS clubs_slug_unique ON clubs(slug) WHERE slug IS NOT NULL;
