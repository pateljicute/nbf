-- 15_add_missing_location_columns.sql
-- PURPOSE: Fix critical "locality does not exist" errors in backend.
-- ORDER: 15 (Run this to fix 500 Errors)

-- 1. Add Location Columns
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "locality" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "state" text;
-- Note: 'city' was added in 03, but ensure it exists just in case
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "city" text;

-- 2. Add Property Spec Columns (Found missing during usage analysis)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "built_up_area" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "furnishing_status" text; -- 'Furnished', 'Semi-Furnished'
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "floor_number" text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "total_floors" text;

-- 3. Add Index for these new columns to speed up text search
CREATE INDEX IF NOT EXISTS idx_properties_locality 
ON public.properties (locality);

CREATE INDEX IF NOT EXISTS idx_properties_state 
ON public.properties (state);
