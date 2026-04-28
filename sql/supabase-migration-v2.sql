-- Migration Script for NBF Homes: Rent & Buy Dual-Mode System
-- Run this in your Supabase SQL Editor

-- 1. Add Listing Type to distinguish between Rent and Sell properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS listing_type varchar(50) DEFAULT 'rent';

-- 2. Add Legal Status fields (Used in Sell Mode)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS registry boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS diversion boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mutation boolean DEFAULT false;

-- 3. Add Financial Details for Sell Mode
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS original_price numeric,
ADD COLUMN IF NOT EXISTS negotiable boolean DEFAULT false;

-- 4. Add Property Specifics (Areas, Dimensions, and Details)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS built_up_area text,
ADD COLUMN IF NOT EXISTS total_area text,
ADD COLUMN IF NOT EXISTS dimensions text,
ADD COLUMN IF NOT EXISTS shutter_width text,
ADD COLUMN IF NOT EXISTS main_road_distance text,
ADD COLUMN IF NOT EXISTS facing text,
ADD COLUMN IF NOT EXISTS bhk text,
ADD COLUMN IF NOT EXISTS property_age text;

-- 5. Backfill existing properties to explicitly be 'rent' (Optional but recommended)
UPDATE properties SET listing_type = 'rent' WHERE listing_type IS NULL;

-- 6. Ensure security policies (RLS) aren't broken by new columns
-- No changes to existing RLS policies required for adding new columns.
