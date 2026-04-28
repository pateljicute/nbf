-- Add new columns for enhanced Sell functionality and discount pricing
ALTER TABLE properties ADD COLUMN IF NOT EXISTS original_price NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS shutter_width TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS main_road_distance TEXT;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name IN ('original_price', 'shutter_width', 'main_road_distance');
