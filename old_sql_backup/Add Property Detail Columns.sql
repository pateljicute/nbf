-- Add new columns for improved property details
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS locality text,
ADD COLUMN IF NOT EXISTS built_up_area numeric,
ADD COLUMN IF NOT EXISTS furnishing_status text,
ADD COLUMN IF NOT EXISTS floor_number integer,
ADD COLUMN IF NOT EXISTS total_floors integer;