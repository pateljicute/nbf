-- ==============================================================================
-- FINAL MASTER SETUP SCRIPT FOR NBF HOMES (CLEAN SLATE)
-- ==============================================================================
-- WARNING: This script treats the database as a blank canvas.
-- It works best if you have verified your tables are empty or deleted.
-- However, we use "IF NOT EXISTS" for safety.

-- 1. CLEANUP (Optional - ensures no conflicts if you re-run)
-- Uncomment these if you want to force a full wipe:
-- DROP TABLE IF EXISTS public.properties_leads CASCADE;
-- DROP TABLE IF EXISTS public.properties CASCADE;
-- DROP TABLE IF EXISTS public.admin_users CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;
-- DROP TABLE IF EXISTS public.collections CASCADE;
-- DROP TABLE IF EXISTS public.site_settings CASCADE;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. USERS TABLE (Syncs with Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name text,
  email text,
  contact_number text,
  phone_number text,
  avatar_url text,
  status text DEFAULT 'active',
  role text DEFAULT 'user',
  is_verified boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles" ON public.users;
CREATE POLICY "Public profiles" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "User update own" ON public.users;
CREATE POLICY "User update own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 4. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid REFERENCES public.users(id) PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins viewable" ON public.admin_users;
CREATE POLICY "Admins viewable" ON public.admin_users FOR SELECT USING (true);

-- 5. PROPERTIES TABLE (Strict Schema)
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Core Identification
  title text NOT NULL,
  handle text UNIQUE, -- Auto-generated via trigger
  description text,
  description_html text,
  
  -- Prices & Currency (Strict formatting)
  price_range jsonb DEFAULT '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb,
  "price" text, -- Quoted camelCase
  currency_code text DEFAULT 'INR',
  
  -- Media
  featured_image jsonb,
  images jsonb[],
  
  -- Metadata
  tags text[],
  options jsonb[],
  variants jsonb[],
  seo jsonb,
  
  -- Status & Categories
  available_for_sale boolean DEFAULT false,
  category_id text,
  status text DEFAULT 'pending', -- pending, approved, inactive
  is_verified boolean DEFAULT false,
  view_count numeric DEFAULT 0,
  
  -- Ownership
  user_id uuid REFERENCES public.users(id),
  "userId" text, -- Redundant but matches frontend payload
  
  -- Mixed Case Specific Columns (Double Quoted)
  "contactNumber" text,
  "bathroomType" text DEFAULT 'Common',
  "securityDeposit" text DEFAULT '0',
  "electricityStatus" text DEFAULT 'Separate',
  "tenantPreference" text DEFAULT 'Any',
  "location" text,
  "address" text,
  "type" text,
  "googleMapsLink" text,
  
  -- Location Data
  latitude numeric,
  longitude numeric,
  
  -- Amenities
  amenities jsonb,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Also add standard snake_case aliases if not already covered, just in case
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS contact_number text; 

-- RLS for Properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone can view properties
DROP POLICY IF EXISTS "Public View Properties" ON public.properties;
CREATE POLICY "Public View Properties" ON public.properties FOR SELECT USING (true);

-- Policy 2: Users can insert their own properties
DROP POLICY IF EXISTS "User Insert Own" ON public.properties;
CREATE POLICY "User Insert Own" ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update/delete their own properties
DROP POLICY IF EXISTS "User Update Own" ON public.properties;
CREATE POLICY "User Update Own" ON public.properties FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User Delete Own" ON public.properties;
CREATE POLICY "User Delete Own" ON public.properties FOR DELETE USING (auth.uid() = user_id);

-- Policy 4: Admins can do everything
DROP POLICY IF EXISTS "Admin All Access" ON public.properties;
CREATE POLICY "Admin All Access" ON public.properties FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 6. COLLECTIONS (Categories)
CREATE TABLE IF NOT EXISTS public.collections (
  id text PRIMARY KEY,
  handle text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  path text,
  seo jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public View Collections" ON public.collections FOR SELECT USING (true);

INSERT INTO public.collections (id, handle, title, description, path) VALUES
('joyco-root', 'all', 'All Properties', 'Browse all properties', '/shop'),
('apartments', 'apartments', 'Apartments', 'Find the best apartments', '/search/apartments'),
('pg', 'pg', 'PG / Hostels', 'Affordable PGs and Hostels', '/search/pg'),
('rooms', 'rooms', 'Private Rooms', 'Cozy private rooms', '/search/rooms')
ON CONFLICT (id) DO NOTHING;

-- 7. AUTOMATION: TRIGGERS & FUNCTIONS

-- A. Slugify Function
CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(value, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- B. Auto-Generate Handle Trigger
CREATE OR REPLACE FUNCTION public.set_handle_if_null()
RETURNS TRIGGER AS $$
DECLARE
  base_handle TEXT;
  new_handle TEXT;
  counter INT := 0;
BEGIN
  IF NEW.handle IS NULL OR NEW.handle = '' THEN
    base_handle := public.slugify(NEW.title);
    IF base_handle IS NULL OR base_handle = '' THEN 
        base_handle := 'property-' || floor(random() * 10000)::text; 
    END IF;

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

-- C. Auth User Sync Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. ADMIN ACCESS SETUP
-- Step 1: Ensure the user exists in public.users (Sync from auth usually, but we force it here for your specific ID)
INSERT INTO public.users (id, email, full_name, role, is_verified) 
VALUES (
    '32e9c839-f67c-40f6-9291-723fb5da15cd', 
    'sushilpatel7489@gmail.com',
    'Sushil Patel',
    'admin',
    true
)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_verified = true;

-- Step 2: Add to admin_users
INSERT INTO public.admin_users (user_id) 
VALUES ('32e9c839-f67c-40f6-9291-723fb5da15cd')
ON CONFLICT (user_id) DO NOTHING;

-- 9. FINAL REFRESH
NOTIFY pgrst, 'reload schema';

SELECT 'Final Master Setup Complete. Tables created, Admin (Sushil) granted access, Triggers active.' as status;
