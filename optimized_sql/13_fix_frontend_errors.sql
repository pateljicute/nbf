-- 13_fix_frontend_errors.sql
-- PURPOSE: Fix "column does not exist" errors caused by Frontend expecting camelCase.
-- ORDER: 13/13 (Run this LAST)

-- 1. Add Missing Columns
-- The frontend explicitly requests "contactNumber" and "userId"
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "contactNumber" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "userId" uuid;

-- 2. Sync userId from user_id (Backfill)
UPDATE public.properties 
SET "userId" = user_id 
WHERE "userId" IS NULL AND user_id IS NOT NULL;

-- 3. Fix Case Sensitivity (Rename lowercase to camelCase)
-- Postgres creates 'bathroomtype' by default. Frontend asks for "bathroomType".
-- We rename them to quoted identifiers.

DO $$
BEGIN
  -- Rename bathroomtype -> "bathroomType"
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='bathroomtype') THEN
    ALTER TABLE public.properties RENAME COLUMN bathroomtype TO "bathroomType";
  END IF;

  -- Rename securitydeposit -> "securityDeposit"
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='securitydeposit') THEN
    ALTER TABLE public.properties RENAME COLUMN securitydeposit TO "securityDeposit";
  END IF;

  -- Rename electricitystatus -> "electricityStatus"
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='electricitystatus') THEN
    ALTER TABLE public.properties RENAME COLUMN electricitystatus TO "electricityStatus";
  END IF;

  -- Rename tenantpreference -> "tenantPreference"
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='tenantpreference') THEN
    ALTER TABLE public.properties RENAME COLUMN tenantpreference TO "tenantPreference";
  END IF;

  -- Rename googlemapslink -> "googleMapsLink"
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='googlemapslink') THEN
    ALTER TABLE public.properties RENAME COLUMN googlemapslink TO "googleMapsLink";
  END IF;
END $$;
