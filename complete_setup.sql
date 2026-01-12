-- COMPLETE SETUP SCRIPT FOR NBF HOMES
-- Run this in the Supabase SQL Editor to fix all issues and setup the database correctly.

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables (If they don't exist)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name text,
  email text,
  contact_number text,
  avatar_url text,
  status text DEFAULT 'active',
  role text DEFAULT 'user',
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.properties (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  handle text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  description_html text,
  price_range jsonb DEFAULT '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb,
  featured_image jsonb,
  images jsonb[],
  tags text[],
  options jsonb[],
  variants jsonb[],
  seo jsonb,
  available_for_sale boolean DEFAULT false,
  category_id text,
  user_id uuid REFERENCES public.users(id),
  status text DEFAULT 'pending',
  is_verified boolean DEFAULT false,
  view_count numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add Missing Columns (Idempotent fixes for existing tables)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'INR';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "price" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "contactNumber" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "latitude" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "longitude" numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "googleMapsLink" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "bathroomType" text DEFAULT 'Common';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "securityDeposit" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "electricityStatus" text DEFAULT 'Separate';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "tenantPreference" text DEFAULT 'Any';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities jsonb;

-- 4. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drop first to avoid errors)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Properties are viewable by everyone." ON public.properties;
CREATE POLICY "Properties are viewable by everyone." ON public.properties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own properties." ON public.properties;
CREATE POLICY "Users can insert their own properties." ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own properties." ON public.properties;
CREATE POLICY "Users can update their own properties." ON public.properties FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own properties." ON public.properties;
CREATE POLICY "Users can delete their own properties." ON public.properties FOR DELETE USING (auth.uid() = user_id);

-- 6. Setup Triggers (Fix missing handles, sync users)
CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(value, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

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

-- 7. Sync missing users from Auth
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

-- 8. Final Cleanup (Defaults)
UPDATE properties
SET price_range = '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}, "maxVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb
WHERE price_range IS NULL;
