-- Fix bookings table schema
-- Run this once in the Supabase SQL Editor
-- Migrates from old schema (tableNumber + startTime + endTime)
-- to active entity schema (tableId + bookingDate + timeSlots)

-- New columns required by apps/api/src/bookings/booking.entity.ts
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "tableId"    text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "tableBrand" text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "tableType"  text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "bookingDate" date;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "timeSlots"  text;   -- stored as comma-separated e.g. "10,11,12"
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "totalHours" integer DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "totalPrice" bigint  DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "paymentId"  text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "gateway"    text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "notes"      text;

-- Ensure status column exists with a default
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending';

-- Ensure timestamps exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz DEFAULT now();

-- If the table does not exist at all, create it from scratch:
-- (Run only if the ALTER statements above fail with "relation does not exist")
/*
CREATE TABLE IF NOT EXISTS bookings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    text NOT NULL,
  "clubId"    text NOT NULL,
  "tableId"   text,
  "tableBrand" text,
  "tableType" text,
  "bookingDate" date,
  "timeSlots" text,
  "totalHours" integer DEFAULT 0,
  "totalPrice" bigint  DEFAULT 0,
  status      text DEFAULT 'pending',
  "paymentId" text,
  gateway     text,
  notes       text,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);
*/
