-- Add status column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Comment on column
COMMENT ON COLUMN properties.status IS 'Status of the property: pending, approved, rejected, sold, inactive';

-- Update existing records (optional, but good for consistency)
-- If available_for_sale is true, assume approved. Else pending? 
-- User said "No new properties should be publicly visible". 
-- Let's migrate existing active ones to 'approved' to avoid hiding everything.
UPDATE properties SET status = 'approved' WHERE available_for_sale = true;
UPDATE properties SET status = 'pending' WHERE available_for_sale = false AND status IS NULL;
