-- Add SEO columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS local_area_guide TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT;
