-- Add view_count column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;

-- Create a function to increment view count safely
CREATE OR REPLACE FUNCTION increment_view_count(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE properties
  SET view_count = view_count + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
