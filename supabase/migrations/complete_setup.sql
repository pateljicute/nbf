-- ==============================================================================
-- NBF HOMES COMPLETE DATABASE SETUP & REPAIR SCRIPT
-- ==============================================================================
-- This script is IDEMPOTENT. It can be run multiple times safely.
-- It ensures all tables, columns, constraints, and triggers exist.
-- Run this in the Supabase SQL Editor to fix "Table not found" errors.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE (Syncs with Auth)
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

-- RLS for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- 3. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid REFERENCES public.users(id) PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins are viewable by everyone." ON public.admin_users;
CREATE POLICY "Admins are viewable by everyone." ON public.admin_users FOR SELECT USING (true);

-- 4. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist (Idempotent alterations)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS handle text UNIQUE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS description_html text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS price_range jsonb DEFAULT '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "price" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'INR';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS featured_image jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images jsonb[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS options jsonb[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS variants jsonb[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS seo jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS available_for_sale boolean DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS category_id text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "userId" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS view_count numeric DEFAULT 0;

-- CamelCase Columns for Frontend Compatibility
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "contactNumber" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS contact_number text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "googleMapsLink" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities jsonb;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "bathroomType" text DEFAULT 'Common';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "securityDeposit" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "electricityStatus" text DEFAULT 'Separate';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "tenantPreference" text DEFAULT 'Any';

-- RLS for Properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Properties are viewable by everyone." ON public.properties;
CREATE POLICY "Properties are viewable by everyone." ON public.properties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own properties." ON public.properties;
CREATE POLICY "Users can insert their own properties." ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own properties." ON public.properties;
CREATE POLICY "Users can update their own properties." ON public.properties FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own properties." ON public.properties;
CREATE POLICY "Users can delete their own properties." ON public.properties FOR DELETE USING (auth.uid() = user_id);

-- Admin Update/Delete Policies
DROP POLICY IF EXISTS "Admins can update any property" ON public.properties;
CREATE POLICY "Admins can update any property" ON public.properties FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Admins can delete any property" ON public.properties;
CREATE POLICY "Admins can delete any property" ON public.properties FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 5. COLLECTIONS TABLE
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
DROP POLICY IF EXISTS "Collections are viewable by everyone." ON public.collections;
CREATE POLICY "Collections are viewable by everyone." ON public.collections FOR SELECT USING (true);

INSERT INTO public.collections (id, handle, title, description, path) VALUES
('joyco-root', 'all', 'All Properties', 'Browse all properties', '/shop'),
('apartments', 'apartments', 'Apartments', 'Find the best apartments', '/search/apartments'),
('pg', 'pg', 'PG / Hostels', 'Affordable PGs and Hostels', '/search/pg'),
('rooms', 'rooms', 'Private Rooms', 'Cozy private rooms', '/search/rooms'),
('1bhk', '1bhk', '1 BHK', '1 BHK Flats', '/search/1bhk'),
('2bhk', '2bhk', '2 BHK', '2 BHK Flats', '/search/2bhk'),
('3bhk', '3bhk', '3 BHK', '3 BHK Flats', '/search/3bhk')
ON CONFLICT (id) DO NOTHING;

-- 6. LEADS & SETTINGS
CREATE TABLE IF NOT EXISTS public.properties_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  type text CHECK (type IN ('contact', 'whatsapp')),
  count numeric DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.properties_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Leads Insert" ON public.properties_leads;
CREATE POLICY "Public Leads Insert" ON public.properties_leads FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.site_settings (
    key text PRIMARY KEY,
    value text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Settings View" ON public.site_settings;
CREATE POLICY "Public Settings View" ON public.site_settings FOR SELECT USING (true);
INSERT INTO public.site_settings (key, value) VALUES 
('homepage_title', 'Find Your Perfect Home – Zero Brokerage, Zero Stress'),
('homepage_description', 'Discover verified rooms, PGs, and shared flats in Mandsaur and nearby cities.'),
('whatsapp_number', '7470724553')
ON CONFLICT (key) DO NOTHING;

-- 7. FUNCTIONS & TRIGGERS

-- Slugify Function
CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(value, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Set Handle Trigger
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

-- Auth Sync Trigger
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

-- 8. DATA REPAIR & SEEDING

-- Sync missing users from auth.users to public.users
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

-- Seed Admin User (Sushil)
-- Attempt to insert if not exists (This user might come from auth.users usually, but we ensure the public record exists)
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

-- Ensure he is in admin_users
INSERT INTO public.admin_users (user_id) 
VALUES ('32e9c839-f67c-40f6-9291-723fb5da15cd')
ON CONFLICT (user_id) DO NOTHING;

-- Force Approve Pending Properties (As requested)
UPDATE public.properties
SET 
  status = 'approved',
  available_for_sale = true,
  is_verified = true
WHERE status IN ('pending', 'inactive', 'rejected');

-- Refresh Schema Cache
NOTIFY pgrst, 'reload schema';

SELECT 'Database Setup Complete: All tables, columns, and triggers are ready.' as status;
