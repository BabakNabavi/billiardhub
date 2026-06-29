-- Run this in Supabase SQL Editor once
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "licenseDocumentUrl" text;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "verificationStatus" text DEFAULT 'pending';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "bankCard" text;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "bankCardOwner" text;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "bankName" text;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS logo text;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "storyMediaUrl" text;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "storyType" text DEFAULT 'image';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "storyExpiresAt" timestamptz;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "hasActiveStory" boolean DEFAULT false;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "discountRules" jsonb DEFAULT '[]';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS "storyText" text;
