-- Add bathroom_type column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS bathroom_type text DEFAULT 'Common';

-- Comment on column
COMMENT ON COLUMN properties.bathroom_type IS 'Type of bathroom: Attached or Common';
