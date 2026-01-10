-- Ensure status column exists and has correct default
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Add comment to clarify allowed values
COMMENT ON COLUMN properties.status IS 'Status of the property: pending, approved, rejected, inactive';

-- Update any null statuses to pending
UPDATE properties SET status = 'pending' WHERE status IS NULL;
