-- Add 'Sell' property specific fields to the properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'rent' CHECK (listing_type IN ('rent', 'sell')),
ADD COLUMN IF NOT EXISTS total_area TEXT,
ADD COLUMN IF NOT EXISTS dimensions TEXT,
ADD COLUMN IF NOT EXISTS facing TEXT,
ADD COLUMN IF NOT EXISTS road_width TEXT,
ADD COLUMN IF NOT EXISTS bhk TEXT,
ADD COLUMN IF NOT EXISTS property_age TEXT,
ADD COLUMN IF NOT EXISTS registry BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS diversion BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mutation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS negotiable BOOLEAN DEFAULT false;

-- Add an index for faster queries on listing_type
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
