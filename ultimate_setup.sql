-- NBF HOMES UPGRADE SCRIPT (ULTIMATE)
-- Run this script in the Supabase SQL Editor.
-- It fixes EVERYTHING: Tables, Columns, Ads, Collections, and Admin Permissions.

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name text,
  email text,
  contact_number text,
  avatar_url text,
  profession text, -- New Column for User Onboarding
  status text DEFAULT 'active',
  role text DEFAULT 'user',
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Properties Table
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

-- 4. Add Missing Columns (Safe to run multiple times)
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
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profession text; -- Safe update for existing DB

-- 5. Create Collections Table
CREATE TABLE IF NOT EXISTS public.collections (
  id text PRIMARY KEY,
  handle text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  path text,
  seo jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Ads Table
CREATE TABLE IF NOT EXISTS public.ads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    media_url text,
    media_type text CHECK (media_type IN ('image', 'video')) DEFAULT 'image',
    cta_text text,
    cta_link text,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key text PRIMARY KEY,
    value text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Admin Users Table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid REFERENCES public.users(id) PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Properties Leads Table
CREATE TABLE IF NOT EXISTS public.properties_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  type text CHECK (type IN ('contact', 'whatsapp')),
  count numeric DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties_leads ENABLE ROW LEVEL SECURITY;

-- 11. Create Policies (Drop first to avoid errors)

-- Public Access Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Properties are viewable by everyone." ON public.properties;
CREATE POLICY "Properties are viewable by everyone." ON public.properties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Collections are viewable by everyone." ON public.collections;
CREATE POLICY "Collections are viewable by everyone." ON public.collections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Ads are viewable by everyone" ON public.ads;
CREATE POLICY "Ads are viewable by everyone" ON public.ads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings are viewable by everyone." ON public.site_settings;
CREATE POLICY "Settings are viewable by everyone." ON public.site_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins are viewable by everyone." ON public.admin_users;
CREATE POLICY "Admins are viewable by everyone." ON public.admin_users FOR SELECT USING (true);

-- User Insert/Update/Delete Policies
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.users;
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own properties." ON public.properties;
CREATE POLICY "Users can insert their own properties." ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own properties." ON public.properties;
CREATE POLICY "Users can update their own properties." ON public.properties FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own properties." ON public.properties;
CREATE POLICY "Users can delete their own properties." ON public.properties FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert leads" ON public.properties_leads;
CREATE POLICY "Users can insert leads" ON public.properties_leads FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Anons can insert leads" ON public.properties_leads;
CREATE POLICY "Anons can insert leads" ON public.properties_leads FOR INSERT WITH CHECK (true);

-- Admin Policies
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

DROP POLICY IF EXISTS "Admins can update ads" ON public.ads;
CREATE POLICY "Admins can update ads" ON public.ads FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Settings are updatable by admins." ON public.site_settings;
CREATE POLICY "Settings are updatable by admins." ON public.site_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can view all leads" ON public.properties_leads;
CREATE POLICY "Admins can view all leads" ON public.properties_leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 12. Triggers for User Sync & Handle Generation
CREATE OR REPLACE FUNCTION public.slugify(value TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(value, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_handle_if_null() RETURNS TRIGGER AS $$
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
CREATE TRIGGER ensure_property_handle BEFORE INSERT ON public.properties FOR EACH ROW EXECUTE FUNCTION public.set_handle_if_null();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 13. DATA: Insert Default Collections
INSERT INTO public.collections (id, handle, title, description, path) VALUES
('joyco-root', 'all', 'All Properties', 'Browse all properties', '/shop'),
('apartments', 'apartments', 'Apartments', 'Find the best apartments', '/search/apartments'),
('pg', 'pg', 'PG / Hostels', 'Affordable PGs and Hostels', '/search/pg'),
('rooms', 'rooms', 'Private Rooms', 'Cozy private rooms', '/search/rooms'),
('1bhk', '1bhk', '1 BHK', '1 BHK Flats', '/search/1bhk'),
('2bhk', '2bhk', '2 BHK', '2 BHK Flats', '/search/2bhk'),
('3bhk', '3bhk', '3 BHK', '3 BHK Flats', '/search/3bhk')
ON CONFLICT (id) DO NOTHING;

-- 14. DATA: Insert Default Ad
INSERT INTO public.ads (id, is_active) 
VALUES ('00000000-0000-0000-0000-000000000001', false)
ON CONFLICT (id) DO NOTHING;

-- 15. DATA: Insert Default Site Settings
INSERT INTO public.site_settings (key, value) VALUES 
('homepage_title', 'Find Your Perfect Home – Zero Brokerage, Zero Stress'),
('homepage_description', 'Discover verified rooms, PGs, and shared flats in Mandsaur and nearby cities.'),
('whatsapp_number', '7470724553')
ON CONFLICT (key) DO NOTHING;

-- 16. DATA: Sync All Users from Auth to Public
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT id, email, raw_user_meta_data->>'full_name', created_at, updated_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- ========================================================
-- 17. SPECIAL: GRANT ADMIN ACCESS TO sushilpatel7489@gmail.com
-- ========================================================
UPDATE public.users SET role = 'admin' WHERE email = 'sushilpatel7489@gmail.com';

INSERT INTO public.admin_users (user_id)
SELECT id FROM public.users WHERE email = 'sushilpatel7489@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

