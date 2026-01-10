-- UNIVERSAL DATABASE FIXER FOR NBF HOMES
-- This script fixes the most common errors: 
-- 1. "Violates foreign key constraint properties_user_id_fkey"
-- 2. "Null value in column handle"
-- 3. "Missing defaults"

-- =========================================================
-- FIX 1: SYNC MISSING USERS (Fixes "Violates foreign key constraint")
-- =========================================================
-- This copies any user from Supabase Auth who is missing in your public table
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name',
    created_at,
    updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- FIX 2: AUTO-GENERATE HANDLES (Fixes "Null value in column handle")
-- =========================================================
-- Function to create safe URL slugs
CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(value, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-fill handle if it's missing
CREATE OR REPLACE FUNCTION public.set_handle_if_null()
RETURNS TRIGGER AS $$
DECLARE
  base_handle TEXT;
  new_handle TEXT;
  counter INT := 0;
BEGIN
  IF NEW.handle IS NULL OR NEW.handle = '' THEN
    base_handle := public.slugify(NEW.title);
    IF base_handle IS NULL OR base_handle = '' THEN base_handle := 'property-' || floor(random() * 10000)::text; END IF;
    new_handle := base_handle;
    WHILE EXISTS (SELECT 1 FROM public.properties WHERE handle = new_handle) LOOP
      counter := counter + 1;
      new_handle := base_handle || '-' || counter;
    END LOOP;
    NEW.handle := new_handle;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_property_handle ON public.properties;
CREATE TRIGGER ensure_property_handle
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.set_handle_if_null();

-- =========================================================
-- FIX 3: ADD ROBUST DEFAULTS (Prevents "Null value" errors)
-- =========================================================
ALTER TABLE public.properties 
    ALTER COLUMN available_for_sale SET DEFAULT false,
    ALTER COLUMN status SET DEFAULT 'pending',
    ALTER COLUMN currency_code SET DEFAULT 'INR',
    ALTER COLUMN price_range SET DEFAULT '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb,
    ALTER COLUMN "electricityStatus" SET DEFAULT 'Separate',
    ALTER COLUMN "bathroomType" SET DEFAULT 'Common',
    ALTER COLUMN "tenantPreference" SET DEFAULT 'Any';

-- =========================================================
-- FIX 4: ENSURE ADMINS EXIST
-- =========================================================
-- Ensures admin users are always present in the public table too
INSERT INTO public.admin_users (user_id)
SELECT id FROM public.users WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Verification Message
SELECT 'Universal Fixer Ran Successfully. All users synced and triggers set.' as message;
