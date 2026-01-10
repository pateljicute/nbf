-- Master SQL Script for NBF Homes
-- This script consolidates all requirements and fixes inconsistencies.
-- RUN THIS IN THE SUPABASE SQL EDITOR.

-- ==========================================
-- 1. Extensions & Core Setup
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. Users Table (Public Profiles)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name text,
  email text,
  contact_number text, -- Standard snake_case for users
  phone_number text,   -- Alias/Duplicate often requested, ensuring it exists
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

-- ==========================================
-- 3. Admin Users Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid REFERENCES public.users(id) PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins are viewable by everyone." ON public.admin_users;
CREATE POLICY "Admins are viewable by everyone." ON public.admin_users FOR SELECT USING (true);

-- ==========================================
-- 4. Properties Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  handle text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  description_html text,
  price_range jsonb DEFAULT '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb,
  "price" text, -- camelCase/Text as used in some frontend parts
  currency_code text DEFAULT 'INR',
  featured_image jsonb,
  images jsonb[],
  tags text[],
  options jsonb[],
  variants jsonb[],
  seo jsonb,
  available_for_sale boolean DEFAULT false,
  category_id text,
  user_id uuid REFERENCES public.users(id),
  "userId" text, -- Redundant but requested by frontend code (lib/api.ts) mapping
  
  -- Core Status
  status text DEFAULT 'pending', -- pending, approved, rejected, inactive
  is_verified boolean DEFAULT false,
  view_count numeric DEFAULT 0,

  -- Contact & Location (Mixed Casing based on frontend usage)
  "contactNumber" text,
  contact_number text, -- Keeping snake_case as fallback/legacy
  "location" text,
  "address" text,
  "type" text,
  latitude numeric,
  longitude numeric,
  "googleMapsLink" text, -- CamelCase as used in frontend

  -- Property Features (CamelCase as used in frontend)
  amenities jsonb,
  "bathroomType" text DEFAULT 'Common',
  "securityDeposit" text,
  "electricityStatus" text DEFAULT 'Separate',
  "tenantPreference" text DEFAULT 'Any',
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- ==========================================
-- 5. Collections Table (Categories)
-- ==========================================
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

-- Insert Default Collections
INSERT INTO public.collections (id, handle, title, description, path) VALUES
('joyco-root', 'all', 'All Properties', 'Browse all properties', '/shop'),
('apartments', 'apartments', 'Apartments', 'Find the best apartments', '/search/apartments'),
('pg', 'pg', 'PG / Hostels', 'Affordable PGs and Hostels', '/search/pg'),
('rooms', 'rooms', 'Private Rooms', 'Cozy private rooms', '/search/rooms'),
('1bhk', '1bhk', '1 BHK', '1 BHK Flats', '/search/1bhk'),
('2bhk', '2bhk', '2 BHK', '2 BHK Flats', '/search/2bhk'),
('3bhk', '3bhk', '3 BHK', '3 BHK Flats', '/search/3bhk')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 6. Leads & Settings
-- ==========================================

-- Properties Leads
CREATE TABLE IF NOT EXISTS public.properties_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  type text CHECK (type IN ('contact', 'whatsapp')),
  count numeric DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.properties_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert leads" ON public.properties_leads;
CREATE POLICY "Users can insert leads" ON public.properties_leads FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Anons can insert leads" ON public.properties_leads;
CREATE POLICY "Anons can insert leads" ON public.properties_leads FOR INSERT WITH CHECK (true); -- Allow public leads

DROP POLICY IF EXISTS "Admins can view all leads" ON public.properties_leads;
CREATE POLICY "Admins can view all leads" ON public.properties_leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    key text PRIMARY KEY,
    value text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings are viewable by everyone." ON public.site_settings;
CREATE POLICY "Settings are viewable by everyone." ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings are updatable by admins." ON public.site_settings;
CREATE POLICY "Settings are updatable by admins." ON public.site_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

INSERT INTO public.site_settings (key, value) VALUES 
('homepage_title', 'Find Your Perfect Home – Zero Brokerage, Zero Stress'),
('homepage_description', 'Discover verified rooms, PGs, and shared flats in Mandsaur and nearby cities.'),
('whatsapp_number', '7470724553')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 7. Triggers & Functions
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 8. Data Cleanups
-- ==========================================
UPDATE properties
SET price_range = '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}, "maxVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb
WHERE price_range IS NULL OR (price_range->'minVariantPrice') IS NULL;

-- End of Master Script
