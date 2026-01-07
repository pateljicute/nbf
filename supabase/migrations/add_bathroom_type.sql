-- 1. Remove the incorrect quoted "bathroomType" column if it exists (created by mistake)
ALTER TABLE properties DROP COLUMN IF EXISTS "bathroomType";

-- 2. Add the correct snake_case column "bathroom_type" that matches the API code
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS bathroom_type text DEFAULT 'Common';

-- 3. Add comment for Schema Cache
COMMENT ON COLUMN properties.bathroom_type IS 'Type of bathroom: Attached or Common';
