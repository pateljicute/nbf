-- 03_properties_schema.sql
-- PURPOSE: valid schema for real estate properties compatible with geospatial queries.
-- ORDER: 3/12

-- 1. Create Properties Table
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Identity & Content
  handle text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  description_html text,
  category_id text, -- Links to collections
  type text, -- 'Apartment', 'Villa', etc.
  
  -- Media
  featured_image jsonb,
  images jsonb[],
  
  -- Pricing & Status
  price text, -- Stored as text for flexibility or big ints
  price_range jsonb DEFAULT '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb,
  currency_code text DEFAULT 'INR',
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  available_for_sale boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  
  -- Specs
  amenities jsonb,
  bathroomType text DEFAULT 'Common',
  securityDeposit text,
  electricityStatus text DEFAULT 'Separate',
  tenantPreference text DEFAULT 'Any',
  
  -- Location (Basic)
  location text,
  address text,
  city text,
  googleMapsLink text,
  latitude numeric,
  longitude numeric,
  
  -- Location (Geospatial)
  -- Note: PostGIS 'geography' type for accurate meters distance
  location_geo geography(POINT),
  
  -- Analytics & Relations
  user_id uuid REFERENCES public.users(id), -- Owner
  view_count numeric DEFAULT 0,
  leads_count numeric DEFAULT 0, -- Denormalized counter for performance
  
  -- Metadata
  options jsonb[], -- Legacy or Shopify compat
  variants jsonb[], -- Legacy or Shopify compat
  tags text[],
  seo jsonb,
  
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Geospatial Auto-Update Trigger
-- Automatically updates the 'location_geo' column when lat/long are modified.
CREATE OR REPLACE FUNCTION public.update_location_geo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location_geo := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_location_geo ON public.properties;
CREATE TRIGGER trigger_update_location_geo
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_location_geo();
