-- 04_collections_and_ads.sql
-- PURPOSE: Define content tables for categories, ads, and settings.
-- ORDER: 4/12

-- 1. Create Collections Table (Categories)
CREATE TABLE IF NOT EXISTS public.collections (
  id text PRIMARY KEY, -- e.g., 'apartments'
  handle text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  path text, -- Internal router path
  seo jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Ads Table
CREATE TABLE IF NOT EXISTS public.ads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    media_url text, -- Image or Video URL
    media_type text CHECK (media_type IN ('image', 'video')) DEFAULT 'image',
    cta_text text, -- "Shop Now", "View Property"
    cta_link text,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Site Settings Table
-- Used for dynamic homepage content without code changes
CREATE TABLE IF NOT EXISTS public.site_settings (
    key text PRIMARY KEY, -- e.g., 'homepage_hero_title'
    value text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
